(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory(require('./utils.js'));
  } else {
    root.App = root.App || {};
    root.App.stateModule = factory(root.App && root.App.utils ? root.App.utils : {});
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (utils) {
  // state helpers and id generators. Designed to be pure functions where possible.

  // Placeholder for optional API module (loaded dynamically in browser)
  let apiModule = null;

  function tryLoadApiModule() {
    if (typeof window === 'undefined' || !window.fetch) return;
    // dynamic import in browser
    import('./services/api.js').then((m) => {
      apiModule = m;
      console.info('services/api loaded');
    }).catch((e) => {
      console.warn('services/api not available:', e && e.message);
    });
  }

  function ensureMesaDefaults(mesa) {
    const normalized = { ...mesa };
    if (!normalized.estado) normalized.estado = 'LIBRE';
    if (typeof normalized.habilitada !== 'boolean') normalized.habilitada = normalized.estado !== 'DESHABILITADA';
    return normalized;
  }

  function ensureOrderDefaults(orden) {
    const normalized = { ...orden };
    normalized.id = normalized.id ? (utils.normalizeId ? utils.normalizeId(String(normalized.id)) : String(normalized.id)) : '';
    normalized.tipo = (utils.normalizeOrderType ? utils.normalizeOrderType(normalized.tipo) : String(normalized.tipo || 'MESA'));
    if (!['MESA', 'PARA_LLEVAR'].includes(normalized.tipo)) normalized.tipo = 'MESA';

    const estadoRaw = String(normalized.estado || 'PENDIENTE').trim().toUpperCase();
    const estadoMap = { PENDING: 'PENDIENTE', PREPARING: 'EN COCINA', EN_PREPARACION: 'EN COCINA', READY: 'LISTO', CLOSED: 'PAGADO', CERRADA: 'PAGADO' };
    const normalizedEstado = estadoMap[estadoRaw] || estadoRaw;
    const ORDER_STATES = ['PENDIENTE', 'EN COCINA', 'LISTO', 'PAGADO'];
    normalized.estado = ORDER_STATES.includes(normalizedEstado) ? normalizedEstado : 'PENDIENTE';

    normalized.mesaId = normalized.mesaId ? (utils.normalizeId ? utils.normalizeId(String(normalized.mesaId)) : String(normalized.mesaId)) : null;
    normalized.meseroId = normalized.meseroId ? (utils.normalizeId ? utils.normalizeId(String(normalized.meseroId)) : String(normalized.meseroId)) : null;
    normalized.cliente = utils.normalizeText ? utils.normalizeText(String(normalized.cliente || '')) : String(normalized.cliente || '');

    if (!Array.isArray(normalized.items)) normalized.items = [];

    normalized.items = normalized.items.map((item) => {
      const productId = item.productId || item.productoId || (item.producto ? item.producto.id : null) || item.idProducto || item.id;
      const nombre = item.nombre || item.name || '';
      const cantidad = Number(item.cantidad ?? item.qty ?? item.quantity ?? 1);
      let precioCents = item.precioCents;
      if (typeof precioCents !== 'number') {
        const priceValue = item.precio || item.price || item.precioUnitario || item.precioUnit || item.unitPrice;
        try {
          precioCents = priceValue ? (utils.parsePriceToCents ? utils.parsePriceToCents(String(priceValue)) : 0) : 0;
        } catch (e) {
          precioCents = 0;
        }
      }
      return {
        productId: productId ? (utils.normalizeId ? utils.normalizeId(String(productId)) : String(productId)) : '',
        nombre: utils.normalizeText ? utils.normalizeText(String(nombre || '')) : String(nombre || ''),
        cantidad: Number.isInteger(cantidad) && cantidad > 0 ? cantidad : 1,
        precioCents,
      };
    }).filter((item) => item.productId);

    if (normalized.tipo === 'PARA_LLEVAR') normalized.packagingFeeCents = 40;

    return normalized;
  }

  function calculateOrderTotals(orden) {
    const itemsTotal = (orden.items || []).reduce((total, item) => total + (item.precioCents || 0) * (item.cantidad || 0), 0);
    const packagingFeeCents = orden.tipo === 'PARA_LLEVAR' ? 40 : 0;
    return { subtotalCents: itemsTotal, packagingFeeCents, totalCents: itemsTotal + packagingFeeCents };
  }

  function getOrderProductIds(orden) {
    const collections = [];
    if (Array.isArray(orden.items)) collections.push(orden.items);
    if (Array.isArray(orden.productos)) collections.push(orden.productos);
    if (Array.isArray(orden.detalle)) collections.push(orden.detalle);
    return collections.flat().map((item) => item.productoId || item.productId || item.idProducto || item.id || (item.producto && item.producto.id) || null).filter(Boolean);
  }

  function hasProductOrders(productId, state) {
    return (state.ordenes || []).some((orden) => getOrderProductIds(orden).includes(productId));
  }

  function getActiveOrdersByMesaId(mesaId, state) {
    return (state.ordenes || []).filter((orden) => orden.mesaId === mesaId && orden.estado !== 'PAGADO');
  }

  function getOrdersByMeseroId(meseroId, state) {
    return (state.ordenes || []).filter((orden) => orden.meseroId === meseroId);
  }

  function getOrdenesActivas(state) {
    return (state.ordenes || []).filter((o) => o.estado !== 'PAGADO');
  }

  function getHistorialVentas(state) {
    return (state.ordenes || []).filter((o) => o.estado === 'PAGADO');
  }

  function canModifyOrderItems(orden) {
    return ['PENDIENTE', 'EN COCINA'].includes(String(orden.estado).toUpperCase());
  }

  function getNextMesaId(state) {
    const maxValue = (state.mesas || []).reduce((max, mesa) => {
      const matches = String(mesa.id || '').match(/\d+/g);
      if (!matches) return max;
      const numeric = parseInt(matches.join(''), 10);
      return Number.isInteger(numeric) && numeric > max ? numeric : max;
    }, 0);
    if (maxValue === 0 && (!state.mesas || state.mesas.length === 0)) return 'M01';
    return `M${String(maxValue + 1).padStart(2, '0')}`;
  }

  function getNextMesaNumero(state) {
    const maxValue = (state.mesas || []).reduce((max, mesa) => (mesa.numero > max ? mesa.numero : max), 0);
    return maxValue + 1;
  }

  function getNextMeseroId(state) {
    const maxValue = (state.meseros || []).reduce((max, mesero) => {
      const matches = String(mesero.id || '').match(/\d+/g);
      if (!matches) return max;
      const numeric = parseInt(matches.join(''), 10);
      return Number.isInteger(numeric) && numeric > max ? numeric : max;
    }, 0);
    return `W${String(maxValue + 1).padStart(2, '0')}`;
  }

  function getNextProductoId(state) {
    const maxValue = (state.productos || []).reduce((max, producto) => {
      const matches = String(producto.id || '').match(/\d+/g);
      if (!matches) return max;
      const numeric = parseInt(matches.join(''), 10);
      return Number.isInteger(numeric) && numeric > max ? numeric : max;
    }, 0);
    return `P${String(maxValue + 1).padStart(2, '0')}`;
  }

  function getNextOrderId(state) {
    const maxValue = (state.ordenes || []).reduce((max, orden) => {
      const matches = String(orden.id || '').match(/\d+/g);
      if (!matches) return max;
      const numeric = parseInt(matches.join(''), 10);
      if (Number.isInteger(numeric) && numeric > max) return numeric;
      return max;
    }, 0);
    return `O-${String(maxValue + 1).padStart(3, '0')}`;
  }

  function getNextOrderState(currentState) {
    const ORDER_STATES = ['PENDIENTE', 'EN COCINA', 'LISTO', 'PAGADO'];
    const index = ORDER_STATES.indexOf(currentState);
    if (index < 0 || index >= ORDER_STATES.length - 1) throw new Error('Estado de orden invalido.');
    return ORDER_STATES[index + 1];
  }

  function procesarCobro(totalCents, recibido) {
    const recibidoVal = parseFloat(recibido);
    if (isNaN(recibidoVal)) throw new Error('Alerta de validación: El monto debe ser un número decimal válido.');
    const recibidoCents = Math.round(recibidoVal * 100);
    if (recibidoCents < totalCents) throw new Error('⚠️ Dinero insuficiente. El monto recibido debe cubrir el total.');
    return { vuelto: (recibidoCents - totalCents) / 100, recibidoCents, estadoNuevo: 'PAGADO' };
  }

  // Storage helpers (localStorage primary fallback; API used if available in browser)
  function loadList(key) {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error(`Formato invalido para ${key}.`);
      return parsed;
    } catch (error) {
      throw new Error(`Error leyendo ${key}: ${error.message}`);
    }
  }

  function saveList(key, value) {
    if (apiModule) {
      try {
        if (key === 'mesas') return apiModule.upsertMesas(value).catch(e => console.error('Error sync mesas', e));
        if (key === 'meseros') return apiModule.upsertMeseros(value).catch(e => console.error('Error sync meseros', e));
        if (key === 'productos') return apiModule.upsertProductos(value).catch(e => console.error('Error sync productos', e));
        if (key === 'ordenes') return apiModule.upsertOrdenes(value).catch(e => console.error('Error sync ordenes', e));
      } catch (e) {
        console.warn('API sync failed', e);
      }
    }
    if (typeof window !== 'undefined' && window.localStorage) localStorage.setItem(key, JSON.stringify(value));
  }

  async function initState(stateObj) {
    try {
      tryLoadApiModule();
      if (apiModule && apiModule.fetchAll) {
        const d = await apiModule.fetchAll();
        stateObj.mesas = (d.mesas || []).map(ensureMesaDefaults);
        stateObj.meseros = d.meseros || [];
        stateObj.productos = d.productos || [];
        stateObj.ordenes = (d.ordenes || []).map(ensureOrderDefaults);
        return;
      }
    } catch (e) {
      console.warn('initState API load failed, falling back to localStorage', e && e.message);
    }

    // localStorage fallback
    try { stateObj.mesas = (loadList('mesas') || []).map(ensureMesaDefaults); } catch (e) { stateObj.mesas = []; }
    try { stateObj.meseros = loadList('meseros') || []; } catch (e) { stateObj.meseros = []; }
    try { stateObj.productos = loadList('productos') || []; } catch (e) { stateObj.productos = []; }
    try { stateObj.ordenes = (loadList('ordenes') || []).map(ensureOrderDefaults); } catch (e) { stateObj.ordenes = []; }
  }

  return {
    tryLoadApiModule,
    ensureMesaDefaults,
    ensureOrderDefaults,
    calculateOrderTotals,
    getOrderProductIds,
    hasProductOrders,
    getActiveOrdersByMesaId,
    getOrdersByMeseroId,
    getOrdenesActivas,
    getHistorialVentas,
    canModifyOrderItems,
    getNextMesaId,
    getNextMesaNumero,
    getNextMeseroId,
    getNextProductoId,
    getNextOrderId,
    getNextOrderState,
    procesarCobro,
    loadList,
    saveList,
    initState,
  };
});