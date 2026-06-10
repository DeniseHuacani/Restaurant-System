(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory(require('./config.js'), require('./utils.js'));
  } else {
    root.App = root.App || {};
    root.App.stateManager = factory(root.App.config, root.App.utils);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (config, utils) {
  const API_BASE_URL = "http://localhost:3000/api";

  const state = {
    mesas: [],
    meseros: [],
    ordenes: [],
    productos: [],
    editingMesaId: null,
    editingMeseroId: null,
    editingProductoId: null,
    currentOrderIdForItems: null,
    currentOrderIdForBilling: null,
    currentOrderTotalCents: 0,
    loadError: null,
  };

  async function saveItem(key, item, isUpdate = false) {
    try {
      let url = `${API_BASE_URL}/${key}`;
      let method = isUpdate ? 'PUT' : 'POST';

      if (isUpdate) {
        url += `/${encodeURIComponent(item.id)}`;
      }

      // Mapear campos para el backend si es necesario
      let payload = { ...item };
      if (key === config.STORAGE_KEYS.productos) {
        if (payload.precio !== undefined) {
          payload.precio_cents = utils.parsePriceToCents(payload.precio);
          delete payload.precio;
        }
      } else if (key === config.STORAGE_KEYS.ordenes) {
        payload.mesa_id = item.mesaId || null;
        payload.mesero_id = item.meseroId || null;
        payload.cliente_nombre = item.clienteNombre || null;
        payload.cliente_dni = item.clienteDni || null;
        // Fallback por si el backend usa cliente_id basado en el ID del input
        payload.cliente_id = item.clienteDni || null;
        delete payload.mesaId;
        delete payload.meseroId;
        delete payload.clienteNombre;
        delete payload.clienteDni;
        if (item.items) {
          // Enviar sólo producto_id y cantidad: el backend tomará el precio desde la DB (precisión en céntimos)
          payload.items = item.items.map(it => ({
            producto_id: it.productId || it.producto_id,
            cantidad: Number(it.cantidad)
          }));
        }
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al guardar ${key} (${response.status}): ${errorText || response.statusText}`);
      }

      console.info(`Sincronización exitosa con backend (${method}): ${key}`);
      return await response.json();
    } catch (error) {
      console.error("Fallo de red al sincronizar:", error);
      throw error;
    }
  }

  // Lógica de IDs correlativos
  function getNextMesaId() {
    const maxValue = state.mesas.reduce((max, mesa) => {
      const numeric = parseInt(String(mesa.id).replace(/\D/g, "") || 0, 10);
      return numeric > max ? numeric : max;
    }, 0);
    return `M${String(maxValue + 1).padStart(2, "0")}`;
  }

  function getNextMesaNumero() {
    return state.mesas.reduce((max, m) => m.numero > max ? m.numero : max, 0) + 1;
  }

  function getNextMeseroId() {
    const maxValue = state.meseros.reduce((max, m) => {
      const numeric = parseInt(String(m.id).replace(/\D/g, "") || 0, 10);
      return numeric > max ? numeric : max;
    }, 0);
    return `W${String(maxValue + 1).padStart(2, "0")}`;
  }

  function getNextProductoId() {
    const maxValue = state.productos.reduce((max, p) => {
      const numeric = parseInt(String(p.id).replace(/\D/g, "") || 0, 10);
      return numeric > max ? numeric : max;
    }, 0);
    return `P${String(maxValue + 1).padStart(2, "0")}`;
  }

  function getNextOrderId() {
    const maxValue = state.ordenes.reduce((max, o) => {
      const numeric = parseInt(String(o.id).replace(/\D/g, "") || 0, 10);
      return numeric > max ? numeric : max;
    }, 0);
    return `O-${String(maxValue + 1).padStart(3, "0")}`;
  }

  function calculateOrderTotals(orden) {
    // Preferir total autoritativo del backend si existe (total_cents)
    if (orden && (typeof orden.total_cents === 'number' || typeof orden.totalCents === 'number')) {
      const serverTotal = typeof orden.total_cents === 'number' ? orden.total_cents : orden.totalCents;
      const packagingFee = orden.tipo === config.ORDER_TYPES.PARA_LLEVAR ? config.PACKAGING_FEE_CENTS : 0;
      const subtotal = Math.max(0, serverTotal - packagingFee);
      return { subtotalCents: subtotal, packagingFeeCents: packagingFee, totalCents: serverTotal };
    }
    const itemsTotal = (orden.items || []).reduce((t, i) => t + ((i.precioCents || i.precio_cents || 0) * Number(i.cantidad || 0)), 0);
    const packagingFee = orden.tipo === config.ORDER_TYPES.PARA_LLEVAR ? config.PACKAGING_FEE_CENTS : 0;
    return { subtotalCents: itemsTotal, packagingFeeCents: packagingFee, totalCents: itemsTotal + packagingFee };
  }

  function ensureMesaDefaults(mesa) {
    return {
      activo: true,
      ...mesa,
      estado: mesa.estado || "LIBRE",
      habilitada: typeof mesa.habilitada === 'boolean' ? mesa.habilitada : mesa.estado !== "DESHABILITADA"
    };
  }

  function ensureMeseroDefaults(mesero) {
    return { activo: true, ...mesero };
  }

  function ensureProductoDefaults(producto) {
    return {
      activo: true,
      ...producto,
      // Mapeo de precio_cents a precio decimal para la UI
      precio: producto.precio || (producto.precio_cents ? (producto.precio_cents / 100).toFixed(2) : "0.00"),
      descripcion: producto.descripcion || ""
    };
  }

  function ensureOrderDefaults(orden) {
    const normalized = {
      activo: true,
      ...orden,
      // Mapeo de nombres de base de datos a nombres de UI
      mesaId: orden.mesaId || orden.mesa_id || null,
      meseroId: orden.meseroId || orden.mesero_id || null,
      clienteNombre: orden.clienteNombre || orden.cliente_nombre || null,
      // Buscamos el DNI en todas las posibles variaciones que el backend podría devolver
      clienteDni: orden.clienteDni || orden.cliente_dni || orden.dni || orden.cliente_id || null,
    };
    if (!Array.isArray(normalized.items)) normalized.items = [];
    normalized.items = normalized.items.map(item => {
      const productId = item.productId || item.producto_id || null;
      const product = state.productos.find(p => p.id === productId);
      return {
        ...item,
        productId,
        nombre: item.nombre || (product ? product.nombre : 'Producto'),
        precioCents: item.precioCents || item.precio_cents || (item.precio ? utils.parsePriceToCents(item.precio) : 0),
        cantidad: Number(item.cantidad) || 1
      };
    });
    return normalized;
  }

  async function initState() {
    try {
      console.info("Cargando datos desde el servidor...");
      
      // Realizamos peticiones en paralelo para mayor velocidad
      const [mesasRes, meserosRes, productosRes, ordenesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/mesas`),
        fetch(`${API_BASE_URL}/meseros`),
        fetch(`${API_BASE_URL}/productos`),
        fetch(`${API_BASE_URL}/ordenes`)
      ]);

      // Validamos que todas las respuestas sean exitosas
      if (!mesasRes.ok || !meserosRes.ok || !productosRes.ok || !ordenesRes.ok) {
        throw new Error("Uno o más recursos no pudieron cargarse desde el backend.");
      }

      // Parseamos y normalizamos los datos
      const [mesasJson, meserosJson, productosJson, ordenesJson] = await Promise.all([
        mesasRes.json(), meserosRes.json(), productosRes.json(), ordenesRes.json()
      ]);

      const mesasRaw = Array.isArray(mesasJson) ? mesasJson : (mesasJson.data || mesasJson.mesas || []);
      const meserosRaw = Array.isArray(meserosJson) ? meserosJson : (meserosJson.data || meserosJson.meseros || []);
      const productosRaw = Array.isArray(productosJson) ? productosJson : (productosJson.data || productosJson.productos || []);
      const ordenesList = Array.isArray(ordenesJson) ? ordenesJson : (ordenesJson.data || ordenesJson.ordenes || []);

      // Cargamos el detalle de cada orden para obtener los items (indispensable si el GET /ordenes no los trae)
      const ordenesRaw = await Promise.all(ordenesList.map(async (o) => {
        try {
          const detailRes = await fetch(`${API_BASE_URL}/ordenes/${o.id}`);
          if (detailRes.ok) return await detailRes.json();
        } catch (e) { console.error(`Error cargando detalle de orden ${o.id}`, e); }
        return o;
      }));

      state.mesas = mesasRaw.map(ensureMesaDefaults);
      state.meseros = meserosRaw.map(ensureMeseroDefaults);
      state.productos = productosRaw.map(ensureProductoDefaults);
      state.ordenes = ordenesRaw.map(ensureOrderDefaults);

      console.log("Estado cargado:", { 
        mesas: state.mesas.length, 
        meseros: state.meseros.length, 
        productos: state.productos.length 
      });
      return state;
    } catch (error) {
      state.loadError = error.message;
      throw error;
    }
  }

  return {
    state,
    initState,
    saveItem,
    getNextMesaId,
    getNextMesaNumero,
    getNextMeseroId,
    getNextProductoId,
    getNextOrderId,
    calculateOrderTotals,
    getOrdenesActivas: () => state.ordenes.filter(o => o.estado !== "PAGADO"),
    getHistorialVentas: () => state.ordenes.filter(o => o.estado === "PAGADO"),
    getActiveOrdersByMesaId: (id) => state.ordenes.filter(o => o.mesaId === id && o.estado !== "PAGADO"),
    getOrdersByMeseroId: (id) => state.ordenes.filter(o => o.meseroId === id)
  };
});