const STORAGE_KEYS = {
  mesas: "mesas",
  meseros: "meseros",
  ordenes: "ordenes",
  productos: "productos",
};

const ORDER_TYPES = {
  MESA: "MESA",
  PARA_LLEVAR: "PARA_LLEVAR",
};

const ORDER_STATES = ["PENDIENTE", "EN COCINA", "LISTO", "PAGADO"];
const PACKAGING_FEE_CENTS = 40;

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

class ValidationError extends Error {
  constructor(errors) {
    super(errors.join("\n"));
    this.name = "ValidationError";
    this.errors = errors;
  }
}

const mesaForm = document.getElementById("mesa-form");
const mesaErrors = document.getElementById("mesa-errors");
const mesaBody = document.getElementById("mesa-body");
const mesaEmpty = document.getElementById("mesa-empty");
const mesaIdInput = document.getElementById("mesa-id");
const mesaNumeroInput = document.getElementById("mesa-numero");
const mesaCapacidadInput = document.getElementById("mesa-capacidad");
const mesaEstadoInput = document.getElementById("mesa-estado");
const mesaCancelButton = document.getElementById("mesa-cancel");
const mesaResetButton = document.getElementById("mesa-reset");

const meseroForm = document.getElementById("mesero-form");
const meseroErrors = document.getElementById("mesero-errors");
const meseroBody = document.getElementById("mesero-body");
const meseroEmpty = document.getElementById("mesero-empty");
const meseroIdInput = document.getElementById("mesero-id");
const meseroNombreInput = document.getElementById("mesero-nombre");
const meseroDniInput = document.getElementById("mesero-dni");
const meseroCelularInput = document.getElementById("mesero-celular");
const meseroEstadoInput = document.getElementById("mesero-estado");
const meseroCancelButton = document.getElementById("mesero-cancel");
const meseroResetButton = document.getElementById("mesero-reset");

const productoForm = document.getElementById("producto-form");
const productoErrors = document.getElementById("producto-errors");
const productoBody = document.getElementById("producto-body");
const productoEmpty = document.getElementById("producto-empty");
const productoIdInput = document.getElementById("producto-id");
const productoNombreInput = document.getElementById("producto-nombre");
const productoPrecioInput = document.getElementById("producto-precio");
const productoDisponibilidadInput = document.getElementById(
  "producto-disponibilidad"
);
const productoEstadoInput = document.getElementById("producto-estado");
const productoDescripcionInput = document.getElementById("producto-descripcion");
const productoCancelButton = document.getElementById("producto-cancel");
const productoResetButton = document.getElementById("producto-reset");

const ordenForm = document.getElementById("orden-form");
const ordenItemForm = document.getElementById("orden-item-form");
const ordenErrors = document.getElementById("orden-errors");
const ordenItemErrors = document.getElementById("orden-item-errors");
const ordenResetButton = document.getElementById("orden-reset");
const ordenCancelButton = document.getElementById("orden-cancel");
const ordenIdInput = document.getElementById("orden-id");
const ordenTipoInput = document.getElementById("orden-tipo");
const ordenMesaInput = document.getElementById("orden-mesa");
const ordenMeseroInput = document.getElementById("orden-mesero");
const ordenEstadoInput = document.getElementById("orden-estado");
const ordenClienteInput = document.getElementById("orden-cliente");

const itemsModal = document.getElementById("items-modal");
const itemsModalTitle = document.getElementById("items-modal-title");
const itemsModalOrderId = document.getElementById("items-modal-order-id");
const itemsModalClose = document.getElementById("items-modal-close");
const itemsModalCancel = document.getElementById("items-modal-cancel");

const billingModal = document.getElementById("billing-modal");
const billingOrderId = document.getElementById("billing-order-id");
const billingOrderType = document.getElementById("billing-order-type");
const billingItemsList = document.getElementById("billing-items-list");
const billingTotalAmount = document.getElementById("billing-total-amount");
const billingForm = document.getElementById("billing-form");
const billingCustomerId = document.getElementById("billing-customer-id");
const billingCustomerName = document.getElementById("billing-customer-name");
const billingReceivedAmount = document.getElementById("billing-received-amount");
const billingChangeAmount = document.getElementById("billing-change-amount");
const billingModalClose = document.getElementById("billing-modal-close");
const billingModalCancel = document.getElementById("billing-modal-cancel");

const ordenItemsContainer = document.getElementById("orden-items-container");
const addItemRowBtn = document.getElementById("add-item-row-btn");
const ordenBody = document.getElementById("orden-body");
const ordenEmpty = document.getElementById("orden-empty");
const ordenFieldElements = document.querySelectorAll("[data-order-field]");
const dashboardTableGrid = document.getElementById("dashboard-table-grid");
const dashboardMesaLibre = document.getElementById("dashboard-mesa-libre");
const dashboardMesaOcupada = document.getElementById("dashboard-mesa-ocupada");
const dashboardMesaDeshabilitada = document.getElementById(
  "dashboard-mesa-deshabilitada"
);
const dashboardMeseroBody = document.getElementById("dashboard-mesero-body");
const dashboardMeseroEmpty = document.getElementById("dashboard-mesero-empty");

const historyModal = document.getElementById("history-modal");
const historyBody = document.getElementById("history-body");
const historyEmpty = document.getElementById("history-empty");
const btnVerHistorial = document.getElementById("btn-ver-historial");
const historyModalClose = document.getElementById("history-modal-close");

const globalError = document.getElementById("global-error");

function loadList(key) {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error(`Formato invalido para ${key}.`);
    }
    return parsed;
  } catch (error) {
    throw new Error(`Error leyendo ${key}: ${error.message}`);
  }
}

function saveList(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * Inyecta datos de prueba iniciales (Mock Data).
 * Esta función solo se invoca si el sistema detecta que no hay datos previos.
 */
function seedMockData() {
    
    const mockMesas = [
      { id: "M01", numero: 1, capacidad: 4, estado: "LIBRE", habilitada: true, activo: true },
      { id: "M02", numero: 2, capacidad: 2, estado: "LIBRE", habilitada: true, activo: true },
      { id: "M03", numero: 3, capacidad: 6, estado: "LIBRE", habilitada: true, activo: true },
      { id: "M04", numero: 4, capacidad: 4, estado: "LIBRE", habilitada: true, activo: true },
    ];
    saveList(STORAGE_KEYS.mesas, mockMesas);

    const mockMeseros = [
      { id: "W01", nombre: "Juan Perez", dni: "12345678", celular: "987654321", estado: "ACTIVO", activo: true },
      { id: "W02", nombre: "Maria Garcia", dni: "87654321", celular: "912345678", estado: "ACTIVO", activo: true },
      { id: "W03", nombre: "Pedro Rodriguez", dni: "45678912", celular: "945612378", estado: "ACTIVO", activo: true },
    ];
    saveList(STORAGE_KEYS.meseros, mockMeseros);

    
    const mockProductos = [
      // --- ENTRADAS Y ENTRANTES ---
      { 
        id: "P01", 
        nombre: "Rocoto Relleno con Pastel de Papa", 
        precio: "28.00", 
        disponibilidad: true, 
        estado: true,
        activo: true, 
        descripcion: "Rocoto desvenado relleno de carne picada a cuchillo, pasas y aceituna, cubierto de queso derretido y acompañado de su clásico pastel de papa horneado." 
      },
      { 
        id: "P02", 
        nombre: "Solterito de Queso", 
        precio: "18.00", 
        disponibilidad: true, 
        estado: true,
        activo: true, 
        descripcion: "Ensalada fresca y colorida de habas tiernas, choclo desgranado, queso fresco en cubos, aceitunas negras, tomate y cebolla, aliñada con aceite y vinagre." 
      },
      { 
        id: "P03", 
        nombre: "Ocopa Tradicional", 
        precio: "16.00", 
        disponibilidad: true, 
        estado: true,
        activo: true, 
        descripcion: "Rodajas de papas sancochadas bañadas en una cremosa salsa de huacatay, maní y queso, hecha en batán. Acompañada de huevo duro y aceituna." 
      },
      { 
        id: "P04", 
        nombre: "Escribano", 
        precio: "14.00", 
        disponibilidad: true, 
        estado: true,
        activo: true, 
        descripcion: "Papas machacadas con tomate, rocoto picadito, vinagre y un chorro de aceite." 
      },

      // --- LOS SEGUNDOS Y PICANTES ---
      { 
        id: "P05", 
        nombre: "Cuy Chactado", 
        precio: "55.00", 
        disponibilidad: true, 
        estado: true,
        activo: true, 
        descripcion: "Cuy entero tierno, aderezado y frito bajo el peso de una piedra de batán hasta quedar perfectamente crocante. Servido con papas doradas y ensalada." 
      },
      { 
        id: "P06", 
        nombre: "Costillar Dorado", 
        precio: "42.00", 
        disponibilidad: true, 
        estado: true,
        activo: true, 
        descripcion: "Costilla de cordero de leche, sazonada con ají y ajo, frita hasta quedar doradita por fuera y jugosa por dentro. Viene con papas fritas y ensalada criolla." 
      },
      { 
        id: "P07", 
        nombre: "Malaya Frita", 
        precio: "38.00", 
        disponibilidad: true, 
        estado: true,
        activo: true, 
        descripcion: "Falda de res sancochada con especias y luego dorada a la sartén. Se sirve con papas doradas y una buena porción de sarza de cebolla." 
      },
      { 
        id: "P08", 
        nombre: "El Triple Picantero", 
        precio: "45.00", 
        disponibilidad: true, 
        estado: true,
        activo: true, 
        descripcion: "Combinado de tres clásicos en un solo plato: Rocoto relleno, Pastel de papa y un picante del día (Matasquita o Ají de calabaza)." 
      },

      // --- BEBIDAS ---
      { 
        id: "P09", 
        nombre: "Chicha de Jora (Caporal)", 
        precio: "8.00", 
        disponibilidad: true, 
        estado: true,
        activo: true, 
        descripcion: "Néctar de maíz fermentado artesanalmente. El maridaje obligatorio de toda picantería." 
      },
      { 
        id: "P10", 
        nombre: "Chicha Morada Helada (Jarra)", 
        precio: "15.00", 
        disponibilidad: true, 
        estado: true,
        activo: true, 
        descripcion: "Preparada en casa con maíz morado, piña, membrillo, manzana y un toque de limón." 
      }
    ];

    saveList(STORAGE_KEYS.productos, mockProductos);
    console.log("✅ [SEED] Productos iniciales guardados.");
}

function initState() {
  console.log("🚀 [SISTEMA] Iniciando ciclo de vida de la aplicación...");
  try {
    // 1. CONTROL DE PERSISTENCIA REAL: Verificar si el almacenamiento no existe o tiene arreglos vacíos
    let isAppEmpty = false;
    try {
      isAppEmpty = loadList(STORAGE_KEYS.mesas).length === 0 || 
                   loadList(STORAGE_KEYS.meseros).length === 0 || 
                   loadList(STORAGE_KEYS.productos).length === 0;
    } catch (e) { // Parche: Si el JSON es corrupto, tratamos como vacío para evitar crash
      isAppEmpty = true; // Si hay error de formato, tratamos como vacío para regenerar
    }

    if (isAppEmpty) {
      console.log("ℹ️ [INFO] LocalStorage incompleto o vacío. Cargando Mock Data de fábrica...");
      seedMockData();
    } else {
      console.log("🔄 [INFO] Persistencia detectada. Cargando datos existentes del usuario...");
    }

    // 2. CARGA DINÁMICA CON TRAZABILIDAD
    try {
      state.mesas = loadList(STORAGE_KEYS.mesas).map(ensureMesaDefaults);
      console.log(`✅ [OK] Mesas cargadas. (Total: ${state.mesas.length})`);
    } catch (e) { console.error("❌ [ERROR] Fallo al cargar Mesas:", e); }

    try {
      state.meseros = loadList(STORAGE_KEYS.meseros);
      console.log(`✅ [OK] Meseros cargados. (Total: ${state.meseros.length})`);
    } catch (e) { console.error("❌ [ERROR] Fallo al cargar Meseros:", e); }

    try {
      state.productos = loadList(STORAGE_KEYS.productos);
      console.log(`✅ [OK] Productos cargados. (Total: ${state.productos.length})`);
    } catch (e) { console.error("❌ [ERROR] Fallo al cargar Productos:", e); }

    try {
      state.ordenes = loadList(STORAGE_KEYS.ordenes).map(ensureOrderDefaults);
      console.log(`✅ [OK] Órdenes cargadas. (Total: ${state.ordenes.length})`);
    } catch (e) { console.error("❌ [ERROR] Fallo al cargar Órdenes:", e); }

    // 3. DISPARAR RENDERIZADO INICIAL
    console.log("🎨 [UI] Ejecutando renderizado inicial de componentes...");
    renderAll();
    console.log("✨ [SISTEMA] Aplicación lista para el usuario.");

  } catch (error) {
    state.loadError = error.message;
    console.error("❌ [ERROR CRÍTICO] Fallo general en la inicialización:", error);
    if (globalError) {
      globalError.textContent = `Error crítico: ${error.message}. Revisa la consola (F12).`;
    }
  }
}

function setFormDisabled(disabled) {
  const fields = document.querySelectorAll("input, select, button");
  fields.forEach((field) => {
    if (
      field.id === "mesa-reset" ||
      field.id === "mesero-reset" ||
      field.id === "producto-reset" ||
      field.id === "orden-reset" ||
      field.classList.contains("tab-button")
    ) {
      field.disabled = false;
      return;
    }
    field.disabled = disabled;
  });
}

function ensureMesaDefaults(mesa) {
  const normalized = { ...mesa };
  if (!normalized.estado) {
    normalized.estado = "LIBRE";
  }
  if (typeof normalized.habilitada !== "boolean") {
    normalized.habilitada = normalized.estado !== "DESHABILITADA";
  }
  return normalized;
}

function normalizeText(value) {
  return value.trim();
}

function normalizeId(value) {
  return value.trim().toUpperCase();
}

function isId(value) {
  return /^[A-Za-z0-9_-]+$/.test(value);
}

/**
 * Hacker-Proof: Solo permite letras (incluyendo tildes y ñ) y espacios.
 * Bloquea números y caracteres especiales en campos de texto descriptivos.
 */
function isStrictAlphaText(value) {
  return /^[A-Za-zÁéíóúÁÉÍÓÚñÑ ]+$/.test(value);
}

function isDigits(value) {
  return /^\d+$/.test(value);
}

function isValidPrice(value) {
  return /^\d+(\.\d{1,2})?$/.test(value);
}

function formatPrice(value) {
  return Number(value).toFixed(2);
}

/**
 * Validador genérico para nombres (2 a 50 caracteres)
 */
function isValidNameLength(value) {
  return value.length >= 2 && value.length <= 50;
}

function formatCents(cents) {
  const sign = cents < 0 ? "-" : "";
  const absolute = Math.abs(cents);
  const whole = Math.floor(absolute / 100);
  const fraction = String(absolute % 100).padStart(2, "0");
  return `${sign}${whole}.${fraction}`;
}

function formatOrderType(value) {
  return String(value || "").replace(/_/g, " ");
}

function parsePriceToCents(value) {
  if (!isValidPrice(value)) {
    throw new Error("Precio invalido.");
  }
  const [wholePart, fractionPart = ""] = value.split(".");
  const whole = parseInt(wholePart, 10);
  const fraction = parseInt(fractionPart.padEnd(2, "0"), 10);
  return whole * 100 + fraction;
}

function normalizeOrderType(value) {
  const text = String(value || "").trim().toUpperCase();
  const normalized = text.replace(/\s+/g, "_");
  if (["MESA", "TABLE"].includes(normalized)) {
    return ORDER_TYPES.MESA;
  }
  if (
    ["PARA_LLEVAR", "TAKEOUT", "LLEVAR", "TAKE_OUT"].includes(normalized)
  ) {
    return ORDER_TYPES.PARA_LLEVAR;
  }
  return normalized;
}

function ensureOrderDefaults(orden) {
  const normalized = { ...orden };
  normalized.id = normalized.id ? normalizeId(String(normalized.id)) : "";
  normalized.tipo = normalizeOrderType(normalized.tipo);
  if (![ORDER_TYPES.MESA, ORDER_TYPES.PARA_LLEVAR].includes(normalized.tipo)) {
    normalized.tipo = ORDER_TYPES.MESA;
  }
  const estadoRaw = String(normalized.estado || "PENDIENTE").trim().toUpperCase();
  const estadoMap = {
    PENDING: "PENDIENTE",
    PREPARING: "EN COCINA",
    EN_PREPARACION: "EN COCINA",
    READY: "LISTO",
    CLOSED: "PAGADO",
    CERRADA: "PAGADO"
  };
  const normalizedEstado = estadoMap[estadoRaw] || estadoRaw;
  normalized.estado = ORDER_STATES.includes(normalizedEstado) ? normalizedEstado : "PENDIENTE";
  normalized.mesaId = normalized.mesaId
    ? normalizeId(String(normalized.mesaId))
    : null;
  normalized.meseroId = normalized.meseroId
    ? normalizeId(String(normalized.meseroId))
    : null;
  normalized.cliente = normalizeText(String(normalized.cliente || ""));
  if (!Array.isArray(normalized.items)) {
    normalized.items = [];
  }
  normalized.items = normalized.items
    .map((item) => {
      const productId =
        item.productId ||
        item.productoId ||
        (item.producto ? item.producto.id : null) ||
        item.idProducto ||
        item.id;
      const nombre = item.nombre || item.name || "";
      const cantidad = Number(item.cantidad ?? item.qty ?? item.quantity ?? 1);
      let precioCents = item.precioCents;
      if (typeof precioCents !== "number") {
        const priceValue =
          item.precio ||
          item.price ||
          item.precioUnitario ||
          item.precioUnit ||
          item.unitPrice;
        try {
          precioCents = priceValue
            ? parsePriceToCents(String(priceValue))
            : 0;
        } catch (error) {
          precioCents = 0;
        }
      }
      return {
        productId: productId ? normalizeId(String(productId)) : "",
        nombre: normalizeText(String(nombre || "")),
        cantidad: Number.isInteger(cantidad) && cantidad > 0 ? cantidad : 1,
        precioCents,
      };
    })
    .filter((item) => item.productId);
  if (normalized.tipo === ORDER_TYPES.PARA_LLEVAR) {
    normalized.packagingFeeCents = PACKAGING_FEE_CENTS;
  }
  return normalized;
}

function parseBoolean(value) {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return null;
}

function getActiveOrdersByMesaId(mesaId) {
  return state.ordenes.filter(
    (orden) =>
      orden.mesaId === mesaId &&
      orden.estado !== "PAGADO"
  );
}

function getOrdersByMeseroId(meseroId) {
  return state.ordenes.filter((orden) => orden.meseroId === meseroId);
}

function getOrdenesActivas() {
  return state.ordenes.filter((o) => o.estado !== "PAGADO");
}

function getHistorialVentas() {
  return state.ordenes.filter((o) => o.estado === "PAGADO");
}

function canModifyOrderItems(orden) {
  return ["PENDIENTE", "EN COCINA"].includes(String(orden.estado).toUpperCase());
}

function getNextOrderState(currentState) {
  const index = ORDER_STATES.indexOf(currentState);
  if (index < 0 || index >= ORDER_STATES.length - 1) {
    throw new Error("Estado de orden invalido.");
  }

  return ORDER_STATES[index + 1];
}

/**
 * Genera el siguiente ID correlativo para Mesas (ej: M01, M02)
 */
function getNextMesaId() {
  const maxValue = state.mesas.reduce((max, mesa) => {
    const matches = String(mesa.id || "").match(/\d+/g);
    if (!matches) return max;
    const numeric = parseInt(matches.join(""), 10);
    return Number.isInteger(numeric) && numeric > max ? numeric : max;
  }, 0);
  // Manejo de caso vacío para TC-ME-01
  if (maxValue === 0 && state.mesas.length === 0) {
    return "M01";
  }
  return `M${String(maxValue + 1).padStart(2, "0")}`;
}

/**
 * Genera el siguiente número correlativo para Mesas
 */
function getNextMesaNumero() {
  const maxValue = state.mesas.reduce((max, mesa) => {
    return mesa.numero > max ? mesa.numero : max;
  }, 0);
  return maxValue + 1;
}

/**
 * Genera el siguiente ID correlativo para Meseros (ej: W01, W02)
 */
function getNextMeseroId() {
  const maxValue = state.meseros.reduce((max, mesero) => {
    const matches = String(mesero.id || "").match(/\d+/g);
    if (!matches) return max;
    const numeric = parseInt(matches.join(""), 10);
    return Number.isInteger(numeric) && numeric > max ? numeric : max;
  }, 0);
  return `W${String(maxValue + 1).padStart(2, "0")}`;
}

/**
 * Genera el siguiente ID correlativo para Productos (ej: P01, P02)
 */
function getNextProductoId() {
  const maxValue = state.productos.reduce((max, producto) => {
    const matches = String(producto.id || "").match(/\d+/g);
    if (!matches) return max;
    const numeric = parseInt(matches.join(""), 10);
    return Number.isInteger(numeric) && numeric > max ? numeric : max;
  }, 0);
  return `P${String(maxValue + 1).padStart(2, "0")}`;
}

function calculateOrderTotals(orden) {
  const itemsTotal = orden.items.reduce(
    (total, item) => total + item.precioCents * item.cantidad,

    0
  );
  const packagingFeeCents =
    orden.tipo === ORDER_TYPES.PARA_LLEVAR ? PACKAGING_FEE_CENTS : 0;
  return {
    subtotalCents: itemsTotal,
    packagingFeeCents,
    totalCents: itemsTotal + packagingFeeCents,
  };
}

/**
 * Procesa la lógica de cobro (validación de montos)
 */
function procesarCobro(totalCents, recibido) {
  const recibidoVal = parseFloat(recibido);
  if (isNaN(recibidoVal)) {
    throw new Error("Alerta de validación: El monto debe ser un número decimal válido.");
  }
  
  const recibidoCents = Math.round(recibidoVal * 100);
  if (recibidoCents < totalCents) {
    throw new Error("⚠️ Dinero insuficiente. El monto recibido debe cubrir el total.");
  }

  return {
    vuelto: (recibidoCents - totalCents) / 100,
    recibidoCents,
    estadoNuevo: "PAGADO"
  };
}

function getOrderProductIds(orden) {
  const collections = [];
  if (Array.isArray(orden.items)) {
    collections.push(orden.items);
  }
  if (Array.isArray(orden.productos)) {
    collections.push(orden.productos);
  }
  if (Array.isArray(orden.detalle)) {
    collections.push(orden.detalle);
  }
  return collections
    .flat()
    .map((item) => {
      if (item.productoId) return String(item.productoId);
      if (item.productId) return String(item.productId);
      if (item.idProducto) return String(item.idProducto);
      if (item.id) return String(item.id);
      if (item.producto && item.producto.id) return String(item.producto.id);
      return null;
    })
    .filter(Boolean);
}

function hasProductOrders(productId) {
  return state.ordenes.some((orden) =>
    getOrderProductIds(orden).includes(productId)
  );
}

function renderErrors(container, errors) {
  if (!errors.length) {
    container.innerHTML = "";
    return;
  }
  const list = document.createElement("ul");
  errors.forEach((error) => {
    const item = document.createElement("li");
    item.textContent = error;
    list.appendChild(item);
  });
  container.innerHTML = "";
  container.appendChild(list);
}

function clearErrors() {
  mesaErrors.innerHTML = "";
  meseroErrors.innerHTML = "";
  productoErrors.innerHTML = "";
  ordenErrors.innerHTML = "";
  ordenItemErrors.innerHTML = "";
  globalError.textContent = state.loadError ? globalError.textContent : "";
  clearFieldErrors();
}

/**
 * Mapea errores de validación a contenedores específicos bajo cada input
 */
function displayFieldErrors(errors, mapping) {
  errors.forEach(msg => {
    for (const [keyword, spanId] of Object.entries(mapping)) {
      if (msg.includes(keyword)) {
        const span = document.getElementById(spanId);
        if (span) {
          span.textContent = msg;
          span.style.display = "block";
        }
      }
    }
  });
}

function clearFieldErrors() {
  document.querySelectorAll(".error-message").forEach(span => {
    span.textContent = "";
    span.style.display = "none";
  });
}

function validateMesa(input) {
  const errors = [];
  if (!input.id) {
    errors.push("El ID es obligatorio.");
  } else if (!isId(input.id)) {
    errors.push("El ID solo permite letras, numeros, guion y guion bajo.");
  } else if (
    state.mesas.some(
      (mesa) => mesa.id === input.id && mesa.id !== state.editingMesaId
    )
  ) {
    errors.push("El ID de la mesa ya existe.");
  }

   if (input.numero === undefined || input.numero === null || input.numero === "") {
    errors.push("El numero es obligatorio.");
  } else if (!Number.isInteger(input.numero) || input.numero < 1) {
    errors.push("El numero debe ser un entero mayor o igual a 1.");
  } else if (
    state.mesas.some(
      (mesa) =>
        mesa.numero === input.numero && mesa.id !== state.editingMesaId
    )
  ) {
    errors.push("El numero de mesa ya esta registrado.");
  }

  if (input.capacidad === undefined || input.capacidad === null || input.capacidad === "") {
    errors.push("La capacidad es obligatoria.");
  } else if (!Number.isInteger(input.capacidad)) {
    errors.push("La capacidad debe ser un numero entero.");
  } else if (input.capacidad < 1 || input.capacidad > 16) {
    errors.push("La capacidad debe estar entre 1 y 16.");
  }

  if (!["LIBRE", "OCUPADA", "DESHABILITADA"].includes(input.estado)) {
    errors.push("El estado debe ser LIBRE, OCUPADA o DESHABILITADA.");
  }

  const activeOrders = getActiveOrdersByMesaId(input.id);
  const existingMesa = state.mesas.find((mesa) => mesa.id === state.editingMesaId);
  if (
    input.estado === "OCUPADA" &&
    activeOrders.length > 0 &&
    (!existingMesa || existingMesa.estado !== "OCUPADA")
  ) {
    errors.push("La mesa ya tiene una orden activa y no puede marcarse OCUPADA.");
  }

  if (
    input.estado === "DESHABILITADA" &&
    activeOrders.length > 0 &&
    (!existingMesa || existingMesa.estado !== "DESHABILITADA")
  ) {
    errors.push("La mesa tiene una orden activa y no puede deshabilitarse.");
  }

  if (errors.length) {
    throw new ValidationError(errors);
  }
}

function validateMesero(input) {
  const errors = [];
  if (!input.id) {
    errors.push("El ID es obligatorio.");
  } else if (!isId(input.id)) {
    errors.push("El ID solo permite letras, numeros, guion y guion bajo.");
  } else if (
    state.meseros.some(
      (mesero) => mesero.id === input.id && mesero.id !== state.editingMeseroId
    )
  ) {
    errors.push("El ID del mesero ya existe.");
  }

  if (!input.nombre) {
    errors.push("El nombre es obligatorio.");
  } else if (!isValidNameLength(input.nombre)) {
    errors.push("El campo de texto debe contener entre 2 y 50 caracteres.");
  } else if (!isStrictAlphaText(input.nombre)) {
    errors.push("Error de Seguridad: El nombre del mesero NO puede contener números ni símbolos.");
  }

  if (!input.dni) {
    errors.push("El DNI es obligatorio.");
  } else if (!isDigits(input.dni) || input.dni.length !== 8) {
    errors.push("El DNI debe tener exactamente 8 dígitos numéricos.");
  } else if (
    state.meseros.some(
      (mesero) =>
        mesero.dni === input.dni && mesero.id !== state.editingMeseroId
    )
  ) {
    errors.push("El DNI ya esta registrado.");
  }

  if (!input.celular) {
    errors.push("El numero de celular es obligatorio.");
  } else if (!isDigits(input.celular) || input.celular.length !== 9) {
    errors.push("El número de celular debe tener exactamente 9 dígitos numéricos.");
  }

  if (!["ACTIVO", "INACTIVO"].includes(input.estado)) {
    errors.push("El estado debe ser ACTIVO o INACTIVO.");
  }

  if (errors.length) {
    throw new ValidationError(errors);
  }
}

function validateProducto(input) {
  const errors = [];
  if (!input.id) {
    errors.push("El ID es obligatorio.");
  } else if (!isId(input.id)) {
    errors.push("El ID solo permite letras, numeros, guion y guion bajo.");
  } else if (
    state.productos.some(
      (producto) =>
        producto.id === input.id && producto.id !== state.editingProductoId
    )
  ) {
    errors.push("El ID del producto ya existe.");
  }

  if (!input.nombre) {
    errors.push("El nombre es obligatorio.");
  } else if (!isValidNameLength(input.nombre)) {
    errors.push("El campo de texto debe contener entre 2 y 50 caracteres.");
  } else if (!isStrictAlphaText(input.nombre)) {
    errors.push("Error de Seguridad: El nombre del producto NO puede contener números ni símbolos.");
  }

  if (!input.precio) {
    errors.push("El precio es obligatorio.");
  } else if (!isValidPrice(input.precio)) {
    errors.push("El precio debe tener hasta 2 decimales.");
  } else if (Number(input.precio) <= 0 || Number(input.precio) > 999999) {
    errors.push("El precio debe ser mayor a 0 y menor que 999999.");
  }

  if (!input.descripcion) {
    errors.push("La descripción es obligatoria.");
  } else if (input.descripcion.length < 2 || input.descripcion.length > 500) {
    errors.push("La descripción debe contener entre 2 y 500 caracteres.");
  } else if (!isStrictAlphaText(input.descripcion)) {
    errors.push("Error de Seguridad: La descripción NO permite números ni símbolos...");
  }

  if (typeof input.disponibilidad !== "boolean") {
    errors.push("La disponibilidad es invalida.");
  }

  if (typeof input.estado !== "boolean") {
    errors.push("El estado es invalido.");
  }

  if (errors.length) {
    throw new ValidationError(errors);
  }
}

function validateOrden(input) {
  const errors = [];
  if (!input.id) {
    errors.push("El ID de la orden es obligatorio.");
  } else if (!isId(input.id)) {
    errors.push("El ID de la orden solo permite letras, numeros, guion y guion bajo.");
  } else if (state.ordenes.some((orden) => orden.id === input.id)) {
    errors.push("El ID de la orden ya existe.");
  }

  if (![ORDER_TYPES.MESA, ORDER_TYPES.PARA_LLEVAR].includes(input.tipo)) {
    errors.push("El tipo debe ser MESA o PARA LLEVAR.");
  }

  if (input.tipo === ORDER_TYPES.MESA) {
    if (!input.mesaId) {
      errors.push("Debe seleccionar una mesa.");
    } else {
      const mesa = state.mesas.find((item) => item.id === input.mesaId);
      if (!mesa || mesa.activo === false) { // Seguridad: Bloquea asignación a mesas borradas lógicamente
        errors.push("La mesa seleccionada no existe o no está activa.");
      } else if (mesa.estado !== "LIBRE" || !mesa.habilitada) {
        errors.push("La mesa debe estar LIBRE y habilitada.");
      } else if (getActiveOrdersByMesaId(mesa.id).length > 0) {
        errors.push("La mesa ya tiene una orden activa.");
      }
    }

    if (!input.meseroId) {
      errors.push("Debe seleccionar un mesero.");
    } else {
      const mesero = state.meseros.find((item) => item.id === input.meseroId);
      if (!mesero || mesero.activo === false) { // Seguridad: Bloquea asignación a meseros borrados lógicamente
        errors.push("El mesero seleccionado no existe o no está activo.");
      } else if (mesero.estado !== "ACTIVO") {
        errors.push("El mesero debe estar ACTIVO.");
      }
    }

    if (input.cliente) {
      errors.push("El nombre solo aplica para ordenes PARA LLEVAR.");
    }
  }

  if (input.tipo === ORDER_TYPES.PARA_LLEVAR) {
    if (!input.cliente) {
      errors.push("El nombre para llevar es obligatorio.");
    } else if (!isValidNameLength(input.cliente)) {
      errors.push("El campo de texto debe contener entre 2 y 50 caracteres.");
    } else if (!isStrictAlphaText(input.cliente)) {
      errors.push(
        "Error de Seguridad: El nombre del cliente NO puede contener números."
      );
    }

    if (input.mesaId) {
      errors.push("No se permite mesa en ordenes PARA LLEVAR.");
    }
    if (input.meseroId) {
      errors.push("No se permite mesero en ordenes PARA LLEVAR.");
    }
  }

  if (errors.length) {
    throw new ValidationError(errors);
  }
}

function validateOrdenItem(input) {
  const errors = [];
  if (!input.ordenId) {
    errors.push("Debe seleccionar una orden.");
  }
  if (!input.productoId) {
    errors.push("Debe seleccionar un producto.");
  }
  if (!Number.isInteger(input.cantidad)) {
    errors.push("La cantidad debe ser un numero entero.");
  } else if (input.cantidad < 1 || input.cantidad > 99) {
    errors.push("La cantidad debe estar entre 1 y 99.");
  }

  const orden = state.ordenes.find((item) => item.id === input.ordenId);
  if (!orden) {
    errors.push("La orden seleccionada no existe.");
  } else if (!canModifyOrderItems(orden)) {
    errors.push("La orden no permite modificar items en este estado.");
  }

  const producto = state.productos.find(
    (item) => item.id === input.productoId
  );
  if (!producto) {
    errors.push("El producto seleccionado no existe.");
  } else {
    if (!producto.estado) {
      errors.push("El producto debe estar ACTIVO.");
    }
    if (!producto.disponibilidad) {
      errors.push("El producto debe estar DISPONIBLE.");
    }
    if (!producto.precio || !isValidPrice(producto.precio)) {
      errors.push("El producto tiene un precio invalido.");
    } else {
      try {
        const priceCents = parsePriceToCents(producto.precio);
        if (priceCents < 1 || priceCents > 99999900) {
          errors.push("El precio del item debe estar entre 0.01 y 999999.00.");
        }
      } catch (error) {
        errors.push("El producto tiene un precio invalido.");
      }
    }
  }

  if (orden && producto) {
    const currentItem = orden.items.find(
      (item) => item.productId === producto.id
    );
    if (currentItem && currentItem.cantidad + input.cantidad > 99) {
      errors.push("La cantidad total por item no puede superar 99.");
    }
  }

  if (errors.length) {
    throw new ValidationError(errors);
  }
}

function readMesaForm() {
  const estado = mesaEstadoInput.value;
  return {
    id: normalizeId(mesaIdInput.value),
    numero: Number(mesaNumeroInput.value),
    capacidad: Number(mesaCapacidadInput.value),
    estado,
    habilitada: estado !== "DESHABILITADA",
  };
}

function readMeseroForm() {
  return {
    id: normalizeId(meseroIdInput.value),
    nombre: normalizeText(meseroNombreInput.value),
    dni: meseroDniInput.value.trim(),
    celular: meseroCelularInput.value.trim(),
    estado: meseroEstadoInput.value,
  };
}

function readProductoForm() {
  return {
    id: normalizeId(productoIdInput.value),
    nombre: normalizeText(productoNombreInput.value),
    precio: productoPrecioInput.value.trim(),
    disponibilidad: parseBoolean(productoDisponibilidadInput.value),
    estado: parseBoolean(productoEstadoInput.value),
    descripcion: normalizeText(productoDescripcionInput.value),
  };
}

function readOrdenForm() {
  return {
    id: normalizeId(ordenIdInput.value),
    tipo: normalizeOrderType(ordenTipoInput.value),
    mesaId: ordenMesaInput.value ? normalizeId(ordenMesaInput.value) : null,
    meseroId: ordenMeseroInput.value ? normalizeId(ordenMeseroInput.value) : null,
    cliente: normalizeText(ordenClienteInput.value || ""),
  };
}

function resetMesaForm() {
  mesaForm.reset();
  mesaErrors.innerHTML = "";
  state.editingMesaId = null;
  // Calculamos e inyectamos valores inmediatamente
  mesaIdInput.value = getNextMesaId();
  mesaNumeroInput.value = getNextMesaNumero();
  // Bloqueamos campos para edición manual
  mesaIdInput.readOnly = true;
  mesaNumeroInput.readOnly = true;
  mesaSubmitText("Guardar");
}

function resetMeseroForm() {
  meseroForm.reset();
  meseroErrors.innerHTML = "";
  state.editingMeseroId = null;
  // Calculamos e inyectamos ID inmediatamente
  meseroIdInput.value = getNextMeseroId();
  // Bloqueamos campo
  meseroIdInput.readOnly = true;
  meseroSubmitText("Guardar");
}

function resetProductoForm() {
  productoForm.reset();
  productoErrors.innerHTML = "";
  state.editingProductoId = null;
  // Calculamos e inyectamos ID inmediatamente
  productoIdInput.value = getNextProductoId();
  // Bloqueamos campo
  productoIdInput.readOnly = true;
  productoSubmitText("Guardar");
}

function resetOrdenForm() {
  ordenForm.reset();
  ordenErrors.innerHTML = "";
  ordenIdInput.value = getNextOrderId();
  ordenTipoInput.value = ORDER_TYPES.MESA; // Establecer tipo por defecto a MESA
  updateOrderTypeFields(ordenTipoInput.value);
  // Asegurar que el estado de una nueva orden siempre sea PENDIENTE y no editable
  ordenEstadoInput.value = "PENDIENTE";
  ordenEstadoInput.innerHTML = '<option value="PENDIENTE">PENDIENTE</option>';
}

function resetOrdenItemForm() {
  ordenItemForm.reset();
  ordenItemErrors.innerHTML = "";
  // Limpiar filas dinámicas y dejar solo una inicial
  ordenItemsContainer.innerHTML = "";
}

/**
 * Crea una nueva fila de producto. Permite precargar datos para edición.
 */
function createItemRow(prefillProductId = "", prefillQty = 1) {
  const row = document.createElement("div");
  row.className = "grid grid-cols-12 gap-xs items-center item-row bg-surface-container-low p-xs rounded-lg border border-outline-variant";
  
  row.innerHTML = `
    <div class="col-span-7">
      <select class="product-select w-full rounded-lg border border-outline-variant bg-surface px-sm py-xs text-body-md" required>
        <option value="">Seleccione producto</option>
        ${state.productos.filter(p => p.activo !== false && p.estado && p.disponibilidad).map(p => `<option value="${p.id}">${p.nombre} (S/ ${p.precio})</option>`).join('')}
      </select>
    </div>
    <div class="col-span-3">
      <input type="number" class="qty-input w-full rounded-lg border border-outline-variant bg-surface px-sm py-xs text-center text-body-md" value="${prefillQty}" min="1" max="99" ${prefillProductId ? '' : 'disabled'} />
      <span class="error-message text-error text-[10px] hidden" style="color: red; display: none; font-size: 11px;"></span>
    </div>
    <div class="col-span-2 flex justify-end">
      <button type="button" class="remove-row-btn text-error hover:bg-error-container p-xs rounded-full transition-colors">
        <span class="material-symbols-outlined text-[20px]">delete</span>
      </button>
    </div>
  `;

  const select = row.querySelector(".product-select");
  const qtyInput = row.querySelector(".qty-input");
  const removeBtn = row.querySelector(".remove-row-btn");

  if (prefillProductId) {
    select.value = prefillProductId;
    qtyInput.disabled = false;
  }

  select.addEventListener("change", () => {
    qtyInput.disabled = !select.value;
  });

  removeBtn.addEventListener("click", () => {
    if (ordenItemsContainer.querySelectorAll(".item-row").length > 1) {
      row.remove();
    } else {
      select.value = "";
      qtyInput.value = "1";
      qtyInput.disabled = true;
    }
  });

  ordenItemsContainer.appendChild(row);
}

function mesaSubmitText(text) {
  document.getElementById("mesa-submit").textContent = text;
}

function meseroSubmitText(text) {
  document.getElementById("mesero-submit").textContent = text;
}

function productoSubmitText(text) {
  document.getElementById("producto-submit").textContent = text;
}

function getNextOrderId() {
  const maxValue = state.ordenes.reduce((max, orden) => {
    const matches = String(orden.id || "").match(/\d+/g);
    if (!matches) {
      return max;
    }
    const numeric = parseInt(matches.join(""), 10);
    if (Number.isInteger(numeric) && numeric > max) {
      return numeric;
    }
    return max;
  }, 0);
  return `O-${String(maxValue + 1).padStart(3, "0")}`;
}

function updateOrderTypeFields(tipo) {
  const normalized = normalizeOrderType(tipo);
  const isMesa = normalized === ORDER_TYPES.MESA;
  ordenMesaInput.disabled = !isMesa;
  ordenMeseroInput.disabled = !isMesa;
  ordenMesaInput.required = isMesa;
  ordenMeseroInput.required = isMesa;
  ordenClienteInput.disabled = isMesa;
  ordenClienteInput.required = !isMesa;

  ordenFieldElements.forEach((element) => {
    const fieldType = element.dataset.orderField;
    const shouldShow = fieldType === "cliente" ? !isMesa : isMesa;
    element.style.display = shouldShow ? "" : "none";
  });

  if (isMesa) {
    ordenClienteInput.value = "";
  } else {
    ordenMesaInput.value = "";
    ordenMeseroInput.value = "";
  }
}

function renderMesas() {
  mesaBody.innerHTML = "";
  const mesas = state.mesas.filter(m => m.activo !== false).sort((a, b) => a.numero - b.numero);
  mesaEmpty.style.display = mesas.length ? "none" : "block";
  mesas.forEach((mesa) => {
    const row = document.createElement("tr");
    row.appendChild(createCell(mesa.id));
    row.appendChild(createCell(mesa.numero));
    row.appendChild(createCell(mesa.capacidad));
    row.appendChild(createCell(mesa.estado));

    const actions = document.createElement("td");
    
    // Bloqueo visual: Deshabilitar botones si la mesa está OCUPADA o tiene órdenes activas
    const activeOrders = getActiveOrdersByMesaId(mesa.id);
    const isLocked = mesa.estado === "OCUPADA" || activeOrders.length > 0;
    
    const editBtn = createActionButton("Editar", "edit-mesa", mesa.id);
    const deleteBtn = createActionButton("Eliminar", "delete-mesa", mesa.id, "danger");
    
    if (isLocked) {
      editBtn.disabled = true;
      deleteBtn.disabled = true;
      editBtn.classList.add("opacity-50", "cursor-not-allowed");
      deleteBtn.classList.add("opacity-50", "cursor-not-allowed");
    }

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    row.appendChild(actions);
    mesaBody.appendChild(row);
  });
  renderOrdenSelects();
  renderDashboardSummary();
  renderDashboardTables();
}

function renderMeseros() {
  meseroBody.innerHTML = "";
  const meseros = state.meseros.filter(m => m.activo !== false).sort((a, b) => a.nombre.localeCompare(b.nombre));
  meseroEmpty.style.display = meseros.length ? "none" : "block";
  meseros.forEach((mesero) => {
    const row = document.createElement("tr");
    row.appendChild(createCell(mesero.id));
    row.appendChild(createCell(mesero.nombre));
    row.appendChild(createCell(mesero.dni));
    row.appendChild(createCell(mesero.celular));
    row.appendChild(createCell(mesero.estado));

    const actions = document.createElement("td");
    actions.appendChild(createActionButton("Editar", "edit-mesero", mesero.id));
    actions.appendChild(
      createActionButton("Eliminar", "delete-mesero", mesero.id, "danger")
    );
    row.appendChild(actions);
    meseroBody.appendChild(row);
  });
  renderOrdenSelects();
  renderDashboardMeseros();
}

function renderProductos() {
  productoBody.innerHTML = "";
  const productos = state.productos.filter(p => p.activo !== false).sort((a, b) => a.nombre.localeCompare(b.nombre));
  productoEmpty.style.display = productos.length ? "none" : "block";
  productos.forEach((producto) => {
    const row = document.createElement("tr");
    row.appendChild(createCell(producto.id));
    row.appendChild(createCell(producto.nombre));
    row.appendChild(createCell(formatPrice(producto.precio)));
    row.appendChild(
      createCell(producto.disponibilidad ? "DISPONIBLE" : "NO DISPONIBLE")
    );
    row.appendChild(createCell(producto.estado ? "ACTIVO" : "INACTIVO"));
    row.appendChild(createCell(producto.descripcion));

    const actions = document.createElement("td");
    actions.appendChild(
      createActionButton("Editar", "edit-producto", producto.id)
    );
    actions.appendChild(
      createActionButton("Eliminar", "delete-producto", producto.id, "danger")
    );
    row.appendChild(actions);
    productoBody.appendChild(row);
  });
  renderOrdenSelects();
}

function renderOrdenSelects() {
  const mesaSelection = ordenMesaInput.value;
  const meseroSelection = ordenMeseroInput.value;
  

  ordenMesaInput.innerHTML = '<option value="">Seleccione</option>';
  state.mesas
    .filter((mesa) => mesa.activo !== false && mesa.estado === "LIBRE" && mesa.habilitada)
    .sort((a, b) => a.numero - b.numero)
    .forEach((mesa) => {
      const option = document.createElement("option");
      option.value = mesa.id;
      option.textContent = `${mesa.id} - Mesa ${mesa.numero}`;
      if (mesa.id === mesaSelection) {
        option.selected = true;
      }
      ordenMesaInput.appendChild(option);
    });

  ordenMeseroInput.innerHTML = '<option value="">Seleccione</option>';
  state.meseros
    .filter((mesero) => mesero.activo !== false && mesero.estado === "ACTIVO")
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
    .forEach((mesero) => {
      const option = document.createElement("option");
      option.value = mesero.id;
      option.textContent = `${mesero.id} - ${mesero.nombre}`;
      if (mesero.id === meseroSelection) {
        option.selected = true;
      }
      ordenMeseroInput.appendChild(option);
    });

}

function renderOrdenes() {
  ordenBody.innerHTML = "";
  
  // FILTRADO: Solo mostramos órdenes operativas
  const activeOrders = getOrdenesActivas();
  
  ordenEmpty.style.display = activeOrders.length ? "none" : "block";

  activeOrders.forEach((orden) => {
    const row = document.createElement("tr");
    row.appendChild(createCell(orden.id));
    row.appendChild(createCell(formatOrderType(orden.tipo)));
    row.appendChild(createCell(orden.mesaId || "-"));
    row.appendChild(createCell(orden.meseroId || "-"));
    row.appendChild(createCell(orden.cliente || "-"));
    row.appendChild(createCell(orden.estado));

        const itemsCell = document.createElement("td");
    itemsCell.className = "p-md text-body-md text-on-surface";
    if (orden.items.length === 0) {
      itemsCell.innerHTML = '<span class="italic text-on-surface-variant opacity-60">Sin ítems</span>';
    } else {
      const list = document.createElement("ul");
      list.className = "list-disc list-inside space-y-base";
      orden.items.forEach((item) => {
        const listItem = document.createElement("li");
        const subtotal = item.precioCents * item.cantidad;
        listItem.textContent = `${item.nombre} x${item.cantidad} (S/ ${formatCents(
          subtotal
        )})`;
        list.appendChild(listItem);
      });
      itemsCell.appendChild(list);
    }
    row.appendChild(itemsCell);

    const totals = calculateOrderTotals(orden);
    let totalLabel =
      orden.tipo === ORDER_TYPES.PARA_LLEVAR
        ? `S/ ${formatCents(totals.totalCents)} (incluye S/ ${formatCents(
            totals.packagingFeeCents
          )} packaging)`
        : `S/ ${formatCents(totals.totalCents)}`;

    if (orden.items.length === 0) totalLabel = "S/ 0.00";
    row.appendChild(createCell(totalLabel));

    const actions = document.createElement("td");
    
    // RENDERIZADO CONDICIONAL DE BOTONES
    if (orden.items.length === 0) {
      // ESTADO A: Recién creada / Sin productos
      actions.appendChild(createActionButton("➕ Agregar Platos", "open-items-modal", orden.id, "bg-secondary-container text-on-secondary-container border-none"));
    } else if (orden.estado !== "PAGADO") {
      // ESTADO B: Con productos asignados
      const nextState = getNextOrderState(orden.estado);
      let label = "";
      if (nextState === "EN COCINA") label = "🍳 A Cocina";
      else if (nextState === "LISTO") label = "🔔 Servir";
      else if (nextState === "PAGADO") label = "💳 Cobrar";
      
      actions.appendChild(createActionButton(label, "advance-order", orden.id, "bg-primary !text-on-primary hover:bg-surface-container-high hover:!text-primary border-none transition-colors"));
      actions.appendChild(createActionButton("✏️ Modificar", "open-items-modal", orden.id, "ml-xs"));
    }

    row.appendChild(actions);
    ordenBody.appendChild(row);
  });


  renderOrdenSelects();
  renderDashboardTables();
}

/**
 * Renderiza la tabla dentro del modal de historial de ventas
 */
function renderHistoryTable() {
  historyBody.innerHTML = "";
  // Filtramos solo las órdenes que ya fueron cobradas con éxito
  const salesHistory = getHistorialVentas();
  
  historyEmpty.classList.toggle("hidden", salesHistory.length > 0);
  
  salesHistory.forEach((orden) => {
    const row = document.createElement("tr");
    row.appendChild(createCell(orden.id));
    row.appendChild(createCell(formatOrderType(orden.tipo)));
    
    // Datos del cliente guardados durante el proceso de cobro
    const cliente = orden.clienteNombre || orden.cliente || "Público General";
    const dni = orden.clienteDni || "-";
    row.appendChild(createCell(`${cliente} (ID: ${dni})`));

    // Resumen corto de platillos
    const itemsSummary = orden.items.map(i => `${i.nombre} x${i.cantidad}`).join(", ");
    row.appendChild(createCell(itemsSummary || "Sin consumo"));

    // Monto final cobrado (incluyendo recargos si aplican)
    const totals = calculateOrderTotals(orden);
    row.appendChild(createCell(`S/ ${formatCents(totals.totalCents)}`));

    historyBody.appendChild(row);
  });
}

function renderDashboardSummary() {
  if (!dashboardMesaLibre || !dashboardMesaOcupada || !dashboardMesaDeshabilitada) {
    return;
  }
  const summary = state.mesas.filter(m => m.activo !== false).reduce(
    (acc, mesa) => {
      const disabled = mesa.estado === "DESHABILITADA" || !mesa.habilitada;
      if (disabled) {
        acc.deshabilitada += 1;
      } else if (mesa.estado === "OCUPADA") {
        acc.ocupada += 1;
      } else {
        acc.libre += 1;
      }
      return acc;
    },
    { libre: 0, ocupada: 0, deshabilitada: 0 }
  );

  dashboardMesaLibre.textContent = `${summary.libre} LIBRE`;
  dashboardMesaOcupada.textContent = `${summary.ocupada} OCUPADA`;
  dashboardMesaDeshabilitada.textContent = `${summary.deshabilitada} DESHABILITADA`;
}

function renderDashboardMeseros() {
  if (!dashboardMeseroBody || !dashboardMeseroEmpty) {
    return;
  }
  dashboardMeseroBody.innerHTML = "";
  const meseros = state.meseros.filter(m => m.activo !== false).sort((a, b) => a.nombre.localeCompare(b.nombre));
  dashboardMeseroEmpty.style.display = meseros.length ? "none" : "block";

  meseros.forEach((mesero) => {
    const row = document.createElement("tr");
    row.appendChild(createCell(mesero.id));
    row.appendChild(createCell(mesero.nombre));
    row.appendChild(createCell(mesero.estado));
    const ordenesActivas = getOrdersByMeseroId(mesero.id).filter(
      (orden) => orden.estado !== "PAGADO"
    ).length;
    row.appendChild(createCell(String(ordenesActivas)));
    dashboardMeseroBody.appendChild(row);
  });
}

function renderDashboardTables() {
  if (!dashboardTableGrid) {
    return;
  }
  dashboardTableGrid.innerHTML = "";
  const mesas = state.mesas.filter(m => m.activo !== false).sort((a, b) => a.numero - b.numero);
  if (!mesas.length) {
    const empty = document.createElement("div");
    empty.className =
      "col-span-full bg-surface-container-lowest border border-outline-variant rounded-xl p-lg text-on-surface-variant";
    empty.textContent = "No hay mesas registradas.";
    dashboardTableGrid.appendChild(empty);
    return;
  }

  mesas.forEach((mesa) => {
    const card = document.createElement("div");
    card.className =
      "flex flex-col gap-sm bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm";

    const header = document.createElement("div");
    header.className = "flex items-center justify-between";

    const mesaInfo = document.createElement("div");
    mesaInfo.className = "space-y-base";
    const title = document.createElement("p");
    title.className = "font-headline-sm text-headline-sm";
    title.textContent = `Mesa #${mesa.numero}`;
    const capacity = document.createElement("p");
    capacity.className = "text-on-surface-variant text-body-md";
    capacity.textContent = `Capacidad: ${mesa.capacidad}`;
    mesaInfo.appendChild(title);
    mesaInfo.appendChild(capacity);

    const badge = document.createElement("span");
    const isDisabled = mesa.estado === "DESHABILITADA" || !mesa.habilitada;
    let badgeClasses =
      "px-sm py-xs rounded-full text-xs font-label-md border";
    if (isDisabled) {
      badgeClasses += " bg-surface-container-high text-on-surface-variant border-outline-variant";
    } else if (mesa.estado === "OCUPADA") {
      badgeClasses += " bg-amber-100 text-amber-800 border-amber-200";
    } else {
      badgeClasses += " bg-green-100 text-green-800 border-green-200";
    }
    badge.className = badgeClasses;
    badge.textContent = isDisabled ? "DESHABILITADA" : mesa.estado;

    header.appendChild(mesaInfo);
    header.appendChild(badge);

    const content = document.createElement("div");
    content.className = "text-body-md text-on-surface-variant space-y-base";

    const ordenActiva = getActiveOrdersByMesaId(mesa.id)[0];
    if (!ordenActiva) {
      const message = document.createElement("p");
      message.textContent = isDisabled
        ? "Mesa deshabilitada."
        : "Mesa disponible sin orden activa.";
      content.appendChild(message);
    } else {
      const mesero = state.meseros.find((item) => item.id === ordenActiva.meseroId);
      const meseroName = mesero ? mesero.nombre : "Sin mesero";
      const orderHeader = document.createElement("p");
      orderHeader.className = "font-label-md text-label-md text-on-surface";
      orderHeader.textContent = `Orden ${ordenActiva.id} · ${ordenActiva.estado}`;
      content.appendChild(orderHeader);

      const waiter = document.createElement("p");
      waiter.textContent = `Mesero: ${meseroName}`;
      content.appendChild(waiter);

      if (ordenActiva.items.length === 0) {
        const itemsEmpty = document.createElement("p");
        itemsEmpty.textContent = "Sin items agregados.";
        content.appendChild(itemsEmpty);
      } else {
        const list = document.createElement("ul");
        list.className = "list-disc list-inside space-y-base";
        ordenActiva.items.slice(0, 2).forEach((item) => {
          const li = document.createElement("li");
          li.textContent = `${item.nombre} x${item.cantidad}`;
          list.appendChild(li);
        });
        if (ordenActiva.items.length > 2) {
          const extra = document.createElement("li");
          extra.textContent = `+${ordenActiva.items.length - 2} items mas`;
          list.appendChild(extra);
        }
        content.appendChild(list);
      }

      const totals = calculateOrderTotals(ordenActiva);
      const total = document.createElement("p");
      total.className = "font-label-md text-label-md text-on-surface";
      total.textContent = `Total: S/ ${formatCents(totals.totalCents)}`;
      content.appendChild(total);
    }

    card.appendChild(header);
    card.appendChild(content);
    dashboardTableGrid.appendChild(card);
  });
}

function createCell(value) {
  const cell = document.createElement("td");
  cell.textContent = value;
  cell.className = "p-md text-body-md text-on-surface";
  return cell;
}

function createActionButton(label, action, id, className) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.dataset.action = action;
  button.dataset.id = id;
  button.className =
    "px-sm py-xs border border-outline-variant rounded-lg text-on-surface-variant hover:bg-surface-container-low text-xs";
  if (className) {
    className.split(" ").forEach((token) => {
      if (token) {
        button.classList.add(token);
      }
    });
  }
  return button;
}

function handleMesaSubmit(event) {
  event.preventDefault();
  clearErrors();
  
  const submitBtn = event.target.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true; // Parche: Evita doble registro por clic rápido

  try {
    let input = readMesaForm();
    if (!state.editingMesaId) { // Si es una nueva mesa, generamos ID y número
      input.id = getNextMesaId();
      input.numero = getNextMesaNumero();
    } else { // Si estamos editando, usamos el ID y número existentes
      const existingMesa = state.mesas.find(m => m.id === state.editingMesaId);
      input.id = existingMesa.id;
      input.numero = existingMesa.numero;
    }
    validateMesa(input);
    if (state.editingMesaId) {
      state.mesas = state.mesas.map((mesa) =>
        mesa.id === state.editingMesaId ? { ...input, activo: mesa.activo ?? true } : mesa
      );
    } else {
      state.mesas.push({ ...input, activo: true });
    }
    saveList(STORAGE_KEYS.mesas, state.mesas);
    resetMesaForm();
    renderMesas();
  } catch (error) {
    if (error instanceof ValidationError) {
      displayFieldErrors(error.errors, {
        "ID": "error-mesa-id",
        "numero": "error-mesa-numero",
        "capacidad": "error-mesa-capacidad",
        "estado": "error-mesa-estado"
      });
      return;
    }
    globalError.textContent = error.message;
  } finally {
    if (submitBtn) submitBtn.disabled = false; // Restaurar tras procesar
  }
}

function handleMeseroSubmit(event) {
  event.preventDefault();
  clearErrors();
  clearFieldErrors();

  const submitBtn = event.target.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true; // Parche: Prevención de duplicados

  try {
    let input = readMeseroForm();
    if (!state.editingMeseroId) { // Si es un nuevo mesero, generamos ID
      input.id = getNextMeseroId();
    } else { // Si estamos editando, usamos el ID existente
      input.id = state.editingMeseroId;
    }
    validateMesero(input);
    if (state.editingMeseroId) {
      state.meseros = state.meseros.map((mesero) =>
        mesero.id === state.editingMeseroId ? { ...input, activo: mesero.activo ?? true } : mesero
      );
    } else {
      state.meseros.push({ ...input, activo: true });
    }
    saveList(STORAGE_KEYS.meseros, state.meseros);
    resetMeseroForm();
    renderMeseros();
  } catch (error) {
    if (error instanceof ValidationError) {
      displayFieldErrors(error.errors, {
        "ID": "error-mesero-id",
        "nombre": "error-mesero-nombre",
        "campo": "error-mesero-nombre",
        "DNI": "error-mesero-dni",
        "celular": "error-mesero-celular",
        "estado": "error-mesero-estado"
      });
      return;
    }
    globalError.textContent = error.message;
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

function handleProductoSubmit(event) {
  event.preventDefault();
  clearErrors();
  clearFieldErrors();

  const submitBtn = event.target.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  try {
    let input = readProductoForm();
    if (!state.editingProductoId) { // Si es un nuevo producto, generamos ID
      input.id = getNextProductoId();
    } else { // Si estamos editando, usamos el ID existente
      input.id = state.editingProductoId;
    }
    validateProducto(input);
    const producto = {
      ...input,
      precio: formatPrice(input.precio),
    };
    if (state.editingProductoId) {
      state.productos = state.productos.map((item) =>
        item.id === state.editingProductoId ? { ...producto, activo: item.activo ?? true } : item
      );
    } else {
      state.productos.push({ ...producto, activo: true });
    }
    saveList(STORAGE_KEYS.productos, state.productos);
    resetProductoForm();
    renderProductos();
  } catch (error) {
    if (error instanceof ValidationError) {
      displayFieldErrors(error.errors, {
        "ID": "error-producto-id",
        "nombre": "error-producto-nombre",
        "campo": "error-producto-nombre",
        "precio": "error-producto-precio",
        "disponibilidad": "error-producto-disponibilidad",
        "estado": "error-producto-estado",
        "descrip": "error-producto-descripcion"
      });
      return;
    }
    globalError.textContent = error.message;
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

function handleOrdenSubmit(event) {
  event.preventDefault();
  clearErrors();
  clearFieldErrors();

  const submitBtn = ordenForm.querySelector('#orden-submit');
  if (submitBtn) submitBtn.disabled = true; // Parche: Seguridad en creación de comanda

  try {
    const input = readOrdenForm();
    validateOrden(input);

    const nuevaOrden = {
      id: input.id,
      tipo: input.tipo,
      mesaId: input.mesaId,
      meseroId: input.meseroId,
      cliente: input.cliente || "",
      estado: "PENDIENTE",
      items: [],
      packagingFeeCents:
        input.tipo === ORDER_TYPES.PARA_LLEVAR ? PACKAGING_FEE_CENTS : 0,
    };

    let mesasActualizadas = state.mesas;
    if (input.tipo === ORDER_TYPES.MESA && input.mesaId) {
      const mesa = state.mesas.find((item) => item.id === input.mesaId);
      if (!mesa) {
        throw new ValidationError(["La mesa seleccionada no existe."]);
      }
      mesasActualizadas = state.mesas.map((item) =>
        item.id === mesa.id
          ? {
              ...item,
              estado: "OCUPADA",
              habilitada: true,
            }
          : item
      );
    }

    state.ordenes = [...state.ordenes, nuevaOrden];
    state.mesas = mesasActualizadas;

    saveList(STORAGE_KEYS.ordenes, state.ordenes);
    if (input.tipo === ORDER_TYPES.MESA) {
      saveList(STORAGE_KEYS.mesas, state.mesas);
    }

    resetOrdenForm();
    renderOrdenes();
    renderMesas();
  } catch (error) {
    if (error instanceof ValidationError) {
      displayFieldErrors(error.errors, {
        "ID": "error-orden-id",
        "tipo": "error-orden-tipo",
        "mesa": "error-orden-mesa",
        "mesero": "error-orden-mesero",
        "cliente": "error-orden-cliente",
        "llevar": "error-orden-cliente",
        "campo": "error-orden-cliente"
      });
    globalError.textContent = error.message;
    }
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

/**
 * Abre el modal dinámico de gestión de platillos
 */
function openItemsModal(ordenId) {
  state.currentOrderIdForItems = ordenId;
  const orden = state.ordenes.find(o => o.id === ordenId);
  if (!orden) return;

  resetOrdenItemForm();
  itemsModalOrderId.textContent = ordenId;
  
  if (orden.items.length === 0) {
    itemsModalTitle.textContent = "Añadir Platos";
    createItemRow(); // Iniciar con una fila limpia
  } else {
    itemsModalTitle.textContent = "Modificar Pedido";
    orden.items.forEach(item => {
      createItemRow(item.productId, item.cantidad);
    });
  }

  itemsModal.classList.remove("hidden");
}

function closeItemsModal() {
  itemsModal.classList.add("hidden");
  state.currentOrderIdForItems = null;
  resetOrdenItemForm();
}

/**
 * Abre el modal de facturación y cobro
 */
function openBillingModal(ordenId) {
  state.currentOrderIdForBilling = ordenId;
  const orden = state.ordenes.find((o) => o.id === ordenId);
  if (!orden) return;

  billingOrderId.textContent = orden.id;
  billingOrderType.textContent = orden.mesaId ? `MESA ${orden.mesaId}` : "PARA LLEVAR";

  // Renderizar detalle para verificación del cajero
  billingItemsList.innerHTML = "";
  orden.items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "flex justify-between";
    li.innerHTML = `<span>${item.nombre} x${item.cantidad}</span> <span>S/ ${formatCents(item.precioCents * item.cantidad)}</span>`;
    billingItemsList.appendChild(li);
  });

  if (orden.tipo === ORDER_TYPES.PARA_LLEVAR) {
    const li = document.createElement("li");
    li.className = "flex justify-between italic text-on-surface-variant";
    li.innerHTML = `<span>Recargo Packaging</span> <span>S/ ${formatCents(PACKAGING_FEE_CENTS)}</span>`;
    billingItemsList.appendChild(li);
  }

  const totals = calculateOrderTotals(orden);
  state.currentOrderTotalCents = totals.totalCents;
  billingTotalAmount.textContent = `S/ ${formatCents(totals.totalCents)}`;

  // Limpiar campos
  billingCustomerId.value = "";
  billingCustomerName.value = orden.cliente || "";
  billingReceivedAmount.value = "";
  billingChangeAmount.textContent = "S/ 0.00";
  billingChangeAmount.className = "font-display text-on-surface-variant";

  billingModal.classList.remove("hidden");
}

function closeBillingModal() {
  billingModal.classList.add("hidden");
  state.currentOrderIdForBilling = null;
  state.currentOrderTotalCents = 0;
}

/**
 * Calcula el vuelto en tiempo real
 */
function updateBillingChange() {
  const received = parseFloat(billingReceivedAmount.value) || 0;
  const receivedCents = Math.round(received * 100);
  const totalCents = state.currentOrderTotalCents;
  const changeCents = receivedCents - totalCents;

  if (receivedCents >= totalCents) {
    billingChangeAmount.textContent = `S/ ${formatCents(changeCents)}`;
    billingChangeAmount.className = "font-display text-green-700";
  } else {
    billingChangeAmount.textContent = "S/ 0.00";
    billingChangeAmount.className = "font-display text-error";
  }
}

function handleBillingSubmit(event) {
  event.preventDefault();
  clearFieldErrors();
  const submitBtn = document.getElementById("billing-modal-confirm");
  if (submitBtn) submitBtn.disabled = true; // Hacker-Proof: Bloquea cobro doble

  const receivedVal = billingReceivedAmount.value.trim();
  
  try {
    // TC-CO-04: Validación de tipo decimal
    if (receivedVal === "" || isNaN(parseFloat(receivedVal)) || !isValidPrice(receivedVal)) {
      const errSpan = document.getElementById("error-billing-received-amount");
      errSpan.textContent = "Alerta de validación: El monto debe ser un número decimal válido.";
      errSpan.style.display = "block";
      return;
    }

    const received = parseFloat(receivedVal);
  const receivedCents = Math.round(received * 100);
    
    if (receivedCents < state.currentOrderTotalCents) {
      const errSpan = document.getElementById("error-billing-received-amount");
      errSpan.textContent = "⚠️ Dinero insuficiente. El monto recibido debe cubrir el total.";
      errSpan.style.display = "block";
      if (submitBtn) submitBtn.disabled = false;
      return;
    }
    
    const dni = billingCustomerId.value.trim();
    if (dni && (!isDigits(dni) || dni.length !== 8)) {
      const errSpan = document.getElementById("error-billing-customer-id");
      errSpan.textContent = "⚠️ El DNI debe tener exactamente 8 dígitos numéricos.";
      errSpan.style.display = "block";
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    const customerName = billingCustomerName.value.trim();
    if (customerName) {
      if (!isValidNameLength(customerName)) {
        const errSpan = document.getElementById("error-billing-customer-name");
        errSpan.textContent = "El campo de texto debe contener entre 2 y 50 caracteres.";
        errSpan.style.display = "block";
        if (submitBtn) submitBtn.disabled = false;
        return;
      }
      if (!isStrictAlphaText(customerName)) {
        const errSpan = document.getElementById("error-billing-customer-name");
        errSpan.textContent = "⚠️ Bloqueo de Seguridad: El nombre del cliente solo debe contener letras.";
        errSpan.style.display = "block";
        if (submitBtn) submitBtn.disabled = false;
        return;
      }
    }

    const ordenId = state.currentOrderIdForBilling;
    const orden = state.ordenes.find((o) => o.id === ordenId);
    if (!orden) return;

    // Actualizar datos de la orden y estado
    orden.estado = "PAGADO";
    orden.clienteDni = billingCustomerId.value.trim();
    orden.clienteNombre = billingCustomerName.value.trim();

    // Liberar la mesa automáticamente
    if (orden.mesaId) {
      const mesa = state.mesas.find((m) => m.id === orden.mesaId);
      if (mesa) {
        mesa.estado = mesa.habilitada ? "LIBRE" : "DESHABILITADA"; // Atomicidad: Mesa libre síncrona al pago
      }
    }

    saveList(STORAGE_KEYS.ordenes, state.ordenes);
    saveList(STORAGE_KEYS.mesas, state.mesas);
    
    closeBillingModal();
    renderOrdenes();
    renderMesas();
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

function handleOrdenItemSubmit(event) {
  event.preventDefault();
  clearErrors();
  clearFieldErrors();
  const submitBtn = document.getElementById("items-modal-save");
  if (submitBtn) submitBtn.disabled = true;

  try {
    const ordenId = state.currentOrderIdForItems;
    if (!ordenId) throw new Error("Referencia de orden perdida.");

    const orden = state.ordenes.find(o => o.id === ordenId);
    if (!canModifyOrderItems(orden)) throw new ValidationError(["Esta orden no permite cambios en este estado."]);

    const rows = ordenItemsContainer.querySelectorAll(".item-row");
    const itemsToAdd = [];
    let hasRowErrors = false;

    rows.forEach((row, index) => {
      const productIdSelect = row.querySelector(".product-select");
      const qtyInput = row.querySelector(".qty-input");
      const qtyErrSpan = qtyInput.nextElementSibling;
      const productId = productIdSelect.value;
      const cantidadRaw = qtyInput.value.trim();

      if (productId) {
        // TC-IT-04
        if (cantidadRaw === "" || !/^\d+$/.test(cantidadRaw)) {
          qtyErrSpan.textContent = "La cantidad debe ser un numero entero.";
          qtyErrSpan.style.display = "block";
          hasRowErrors = true;
          return;
        }

        const cantidad = parseInt(cantidadRaw, 10);
        // TC-IT-02
        if (cantidad < 1 || cantidad > 99) {
          qtyErrSpan.textContent = "La cantidad debe estar entre 1 y 99.";
          qtyErrSpan.style.display = "block";
          hasRowErrors = true;
          return;
        }

        const producto = state.productos.find(p => p.id === productId);
        itemsToAdd.push({
          productId: producto.id,
          nombre: producto.nombre,
          precioCents: parsePriceToCents(producto.precio),
          cantidad: cantidad
        });
      }
    });

    if (hasRowErrors) return;

    if (itemsToAdd.length === 0) throw new ValidationError(["Debe seleccionar al menos un producto."]);

    // Sobrescribir items (Permite añadir y quitar en edición)
    orden.items = itemsToAdd;

    saveList(STORAGE_KEYS.ordenes, state.ordenes); // Parche: Persistencia inmediata tras edición TC-IT-03
    closeItemsModal();
    renderOrdenes();
  } catch (error) {
    if (error instanceof ValidationError) {
      renderErrors(ordenItemErrors, error.errors);
    } else {
      globalError.textContent = error.message;
    }
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

function handleOrdenActions(event) {
  const action = event.target.dataset.action;
  const id = event.target.dataset.id;
  if (!action || !id) {
    return;
  }

  if (action === "open-items-modal") {
    openItemsModal(id);
    return;
  }

  if (action === "advance-order") {
    clearErrors();
    const actionBtn = event.target;
    actionBtn.disabled = true; // Parche: Bloquea clics múltiples en acciones de tabla

    try {
      const orden = state.ordenes.find((item) => item.id === id);
      if (!orden) {
        throw new ValidationError(["La orden seleccionada no existe."]);
      }
      if (orden.estado === "PAGADO") {
        throw new ValidationError(["La orden ya esta cerrada."]);
      }

      const nextState = getNextOrderState(orden.estado);
      
      // Si el siguiente estado es PAGADO, abrimos el modal de cobro en lugar de avanzar directo
      // Esto garantiza que no se salte el proceso de facturación
      if (nextState === "PAGADO") {
        openBillingModal(id);
        return;
      }

      let mesasActualizadas = state.mesas;
      if (nextState === "PAGADO" && orden.mesaId) {
        const mesa = state.mesas.find((item) => item.id === orden.mesaId);
        if (!mesa) {
          throw new ValidationError(["La mesa asociada ya no existe."]);
        }
        const nextMesaState = mesa.habilitada === false ? "DESHABILITADA" : "LIBRE";
        mesasActualizadas = state.mesas.map((item) =>
          item.id === mesa.id ? { ...item, estado: nextMesaState } : item
        );
      }

      state.ordenes = state.ordenes.map((item) =>
        item.id === orden.id ? { ...orden, estado: nextState } : item
      );
      state.mesas = mesasActualizadas;
      saveList(STORAGE_KEYS.ordenes, state.ordenes);
      if (nextState === "PAGADO" && orden.mesaId) {
        saveList(STORAGE_KEYS.mesas, state.mesas);
      }
      renderOrdenes();
      renderMesas();
    } catch (error) {
      if (error instanceof ValidationError) {
        renderErrors(ordenErrors, error.errors);
        return;
      }
      globalError.textContent = error.message;
    } finally {
      actionBtn.disabled = false;
    }
  }

  if (action === "remove-order-item") {
    clearErrors();
    try {
      const productId = event.target.dataset.productId;
      if (!productId) {
        return;
      }
      const orden = state.ordenes.find((item) => item.id === id);
      if (!orden) {
        throw new ValidationError(["La orden seleccionada no existe."]);
      }
      if (!canModifyOrderItems(orden)) {
        throw new ValidationError([
          "La orden no permite eliminar items en este estado.",
        ]);
      }
      if (!orden.items.some((item) => item.productId === productId)) {
        throw new ValidationError(["El item ya no existe en la orden."]);
      }
      const itemsActualizados = orden.items.filter(
        (item) => item.productId !== productId
      );
      state.ordenes = state.ordenes.map((item) =>
        item.id === orden.id ? { ...orden, items: itemsActualizados } : item
      );
      saveList(STORAGE_KEYS.ordenes, state.ordenes);
      renderOrdenes();
    } catch (error) {
      if (error instanceof ValidationError) {
        renderErrors(ordenItemErrors, error.errors);
        return;
      }
      globalError.textContent = error.message;
    }
  }
}

/**
 * Valida si una mesa puede ser editada o eliminada según su estado y órdenes activas
 */
function checkMesaActionLocks(id) {
  const mesa = state.mesas.find(m => m.id === id);
  if (!mesa) return;
  const activeOrders = getActiveOrdersByMesaId(id);
  if (mesa.estado === "OCUPADA" || activeOrders.length > 0) {
    throw new Error("No se puede modificar ni eliminar la mesa porque tiene órdenes asociadas.");
  }
}

function handleMesaActions(event) {
  const action = event.target.dataset.action;
  const id = event.target.dataset.id;
  if (!action || !id) {
    return;
  }

  // Blindaje de negocio: Bloqueo de acciones si hay órdenes activas o estado OCUPADA
  if (action === "edit-mesa" || action === "delete-mesa") {
    try {
      checkMesaActionLocks(id);
    } catch (error) {
      renderErrors(mesaErrors, [error.message]);
      return;
    }
  }

  if (action === "edit-mesa") {
    const mesa = state.mesas.find((item) => item.id === id);
    if (!mesa) {
      return;
    }
    mesaIdInput.value = mesa.id;
    mesaNumeroInput.value = mesa.numero;
    mesaCapacidadInput.value = mesa.capacidad;
    mesaEstadoInput.value = mesa.estado;
    state.editingMesaId = mesa.id;
    mesaIdInput.readOnly = true;
    mesaNumeroInput.readOnly = true;
    mesaSubmitText("Actualizar");
    return;
  }

  if (action === "delete-mesa") {
    // Mantener la validación de integridad referencial histórica para eliminación
    const historico = state.ordenes.some((orden) => orden.mesaId === id);
    if (historico) {
      renderErrors(mesaErrors, [
        "No se puede modificar ni eliminar la mesa porque tiene órdenes asociadas.",
      ]);
      return;
    }
    if (!confirm("Deseas eliminar esta mesa?")) {
      return;
    }
    state.mesas = state.mesas.map((mesa) => mesa.id === id ? { ...mesa, activo: false } : mesa);
    saveList(STORAGE_KEYS.mesas, state.mesas);
    renderMesas();
  }
}

function handleMeseroActions(event) {
  const action = event.target.dataset.action;
  const id = event.target.dataset.id;
  if (!action || !id) {
    return;
  }

  if (action === "edit-mesero") {
    const mesero = state.meseros.find((item) => item.id === id);
    if (!mesero) {
      return;
    }
    meseroIdInput.value = mesero.id;
    meseroNombreInput.value = mesero.nombre;
    meseroDniInput.value = mesero.dni;
    meseroCelularInput.value = mesero.celular;
    meseroEstadoInput.value = mesero.estado;
    state.editingMeseroId = mesero.id;
    meseroIdInput.readOnly = true;
    meseroSubmitText("Actualizar");
    return;
  }

  if (action === "delete-mesero") {
    const ordenes = getOrdersByMeseroId(id);
    if (ordenes.length) {
      renderErrors(meseroErrors, [
        "No se puede eliminar el mesero porque tiene ordenes asociadas. Marca INACTIVO.",
      ]);
      return;
    }
    if (!confirm("Deseas eliminar este mesero?")) {
      return;
    }
    state.meseros = state.meseros.map((mesero) => mesero.id === id ? { ...mesero, activo: false } : mesero);
    saveList(STORAGE_KEYS.meseros, state.meseros);
    renderMeseros();
  }
}

function handleProductoActions(event) {
  const action = event.target.dataset.action;
  const id = event.target.dataset.id;
  if (!action || !id) {
    return;
  }

  if (action === "edit-producto") {
    const producto = state.productos.find((item) => item.id === id);
    if (!producto) {
      return;
    }
    productoIdInput.value = producto.id;
    productoNombreInput.value = producto.nombre;
    productoPrecioInput.value = producto.precio;
    productoDisponibilidadInput.value = producto.disponibilidad ? "true" : "false";
    productoEstadoInput.value = producto.estado ? "true" : "false";
    productoDescripcionInput.value = producto.descripcion;
    state.editingProductoId = producto.id;
    productoIdInput.readOnly = true;
    productoSubmitText("Actualizar");
    return;
  }

  if (action === "delete-producto") {
    if (hasProductOrders(id)) {
      state.productos = state.productos.map((producto) =>
        producto.id === id
          ? { ...producto, activo: false, estado: false, disponibilidad: false }
          : producto
      );
      saveList(STORAGE_KEYS.productos, state.productos);
      renderProductos();
      renderErrors(productoErrors, [
        "El producto tiene ordenes historicas y fue marcado como INACTIVO.",
      ]);
      return;
    }
    if (!confirm("Deseas eliminar este producto?")) {
      return;
    }
    state.productos = state.productos.map((producto) => producto.id === id ? { ...producto, activo: false } : producto);
    saveList(STORAGE_KEYS.productos, state.productos);
    renderProductos();
  }
}

function handleOrdenReset() {
  if (!confirm("Deseas limpiar los datos de ordenes?")) {
    return;
  }
  state.ordenes = [];
  saveList(STORAGE_KEYS.ordenes, state.ordenes);

  if (state.mesas.length) {
    state.mesas = state.mesas.map((mesa) => {
      if (mesa.estado !== "OCUPADA") {
        return mesa;
      }
      const nextMesaState = mesa.habilitada === false ? "DESHABILITADA" : "LIBRE";
      return { ...mesa, estado: nextMesaState };
    });
    saveList(STORAGE_KEYS.mesas, state.mesas);
  }

  resetOrdenForm();
  resetOrdenItemForm();
  renderOrdenes();
  renderMesas();
}

function handleMesaReset() {
  if (!confirm("Deseas limpiar los datos de mesas?")) {
    return;
  }
  state.mesas = [];
  saveList(STORAGE_KEYS.mesas, state.mesas);
  resetMesaForm();
  // Asegurarse de que los campos de ID/Número estén en solo lectura después del reset
  mesaIdInput.readOnly = true;
  mesaNumeroInput.readOnly = true;
  renderMesas();
}

function handleMeseroReset() {
  if (!confirm("Deseas limpiar los datos de meseros?")) {
    return;
  }
  state.meseros = [];
  saveList(STORAGE_KEYS.meseros, state.meseros);
  resetMeseroForm();
  // Asegurarse de que el campo ID esté en solo lectura después del reset
  meseroIdInput.readOnly = true;
  renderMeseros();
}

function handleProductoReset() {
  if (!confirm("Deseas limpiar los datos del catalogo?")) {
    return;
  }
  state.productos = [];
  saveList(STORAGE_KEYS.productos, state.productos);
  resetProductoForm();
  // Asegurarse de que el campo ID esté en solo lectura después del reset
  productoIdInput.readOnly = true;
  renderProductos();
}

function initTabs() {
  const buttons = document.querySelectorAll(".tab-button");
  const panels = document.querySelectorAll(".tab-panel");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const tab = button.dataset.tab;
      buttons.forEach((item) => item.classList.remove("active"));
      panels.forEach((panel) => panel.classList.remove("active"));
      button.classList.add("active");
      const activePanel = document.querySelector(`.tab-panel[data-tab="${tab}"]`);
      if (activePanel) {
        activePanel.classList.add("active");
      }
    });
  });
}

function bindEvents() {
  mesaForm.addEventListener("submit", handleMesaSubmit);
  mesaCancelButton.addEventListener("click", resetMesaForm);
  mesaBody.addEventListener("click", handleMesaActions);
  mesaResetButton.addEventListener("click", handleMesaReset);

  meseroForm.addEventListener("submit", handleMeseroSubmit);
  meseroCancelButton.addEventListener("click", resetMeseroForm);
  meseroBody.addEventListener("click", handleMeseroActions);
  meseroResetButton.addEventListener("click", handleMeseroReset);

  productoForm.addEventListener("submit", handleProductoSubmit);
  productoCancelButton.addEventListener("click", resetProductoForm);
  productoBody.addEventListener("click", handleProductoActions);
  productoResetButton.addEventListener("click", handleProductoReset);

  ordenForm.addEventListener("submit", handleOrdenSubmit);
  ordenItemForm.addEventListener("submit", handleOrdenItemSubmit);
  ordenBody.addEventListener("click", handleOrdenActions);
  ordenResetButton.addEventListener("click", handleOrdenReset);
  ordenCancelButton.addEventListener("click", resetOrdenForm);
  addItemRowBtn.addEventListener("click", createItemRow);
  itemsModalClose.addEventListener("click", closeItemsModal);
  itemsModalCancel.addEventListener("click", closeItemsModal);
  
  btnVerHistorial.addEventListener("click", () => {
    renderHistoryTable();
    historyModal.classList.remove("hidden");
  });
  historyModalClose.addEventListener("click", () => historyModal.classList.add("hidden"));
  document.getElementById("history-modal-overlay").addEventListener("click", () => historyModal.classList.add("hidden"));

  billingForm.addEventListener("submit", handleBillingSubmit);
  billingReceivedAmount.addEventListener("input", updateBillingChange);
  billingModalClose.addEventListener("click", closeBillingModal);
  billingModalCancel.addEventListener("click", closeBillingModal);
  
  ordenTipoInput.addEventListener("change", (event) => {
    updateOrderTypeFields(event.target.value);
  });

  initTabs();
}

function renderAll() {
  try {
    renderMesas();
    console.log("📊 [RENDER] Grid de mesas actualizado.");
  } catch (e) { console.error("❌ [ERROR] Fallo en renderMesas:", e); }

  try {
    renderMeseros();
    console.log("📊 [RENDER] Lista de meseros actualizada.");
  } catch (e) { console.error("❌ [ERROR] Fallo en renderMeseros:", e); }

  try {
    renderProductos();
    console.log("📊 [RENDER] Catálogo de productos actualizado.");
  } catch (e) { console.error("❌ [ERROR] Fallo en renderProductos:", e); }

  try {
    renderOrdenes();
    console.log("📊 [RENDER] Tabla de órdenes actualizada.");
  } catch (e) { console.error("❌ [ERROR] Fallo en renderOrdenes:", e); }

  // Inicializar formularios para mostrar los IDs automáticos al inicio
  resetMesaForm();
  resetMeseroForm();
  resetProductoForm();

  try {
    resetOrdenForm();
    resetOrdenItemForm();
    console.log("🧹 [UI] Formularios de órdenes reseteados.");
  } catch (e) { console.error("❌ [ERROR] Fallo al resetear formularios:", e); }
}

// 1. EVENTO DE CARGA (DOMContentLoaded):
// Garantiza que el HTML esté listo antes de ejecutar la lógica de inicialización.
document.addEventListener("DOMContentLoaded", () => {
  // Inicializa los datos (y dispara el renderizado interno)
  initState();
  // Vincula los eventos de los formularios y botones
  bindEvents();

  if (state.loadError) {
    setFormDisabled(true);
  }
});

// EXPORTACIÓN PARA JEST (Mantiene compatibilidad con navegador)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    state,
    STORAGE_KEYS,
    ORDER_STATES,
    ORDER_TYPES,
    ValidationError,
    validateMesa,
    validateMesero,
    validateProducto,
    validateOrden,
    validateOrdenItem,
    checkMesaActionLocks,
    isValidNameLength,
    isStrictAlphaText,
    isDigits,
    getNextMesaId,
    getNextMesaNumero,
    getNextOrderState,
    calculateOrderTotals,
    formatCents,
    getOrdenesActivas,
    getHistorialVentas,
    procesarCobro,
    getNextMeseroId,
    getNextProductoId
  };
}