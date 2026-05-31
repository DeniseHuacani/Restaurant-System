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

const ORDER_STATES = ["PENDING", "PREPARING", "READY", "CLOSED"];
const PACKAGING_FEE_CENTS = 40;

const state = {
  mesas: [],
  meseros: [],
  ordenes: [],
  productos: [],
  editingMesaId: null,
  editingMeseroId: null,
  editingProductoId: null,
  loadError: null,
};

class ValidationError extends Error {
  constructor(errors) {
    super("ValidationError");
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
const meseroTelefonoInput = document.getElementById("mesero-telefono");
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
const ordenClienteInput = document.getElementById("orden-cliente");
const ordenItemOrdenInput = document.getElementById("orden-item-orden");
const ordenItemProductoInput = document.getElementById("orden-item-producto");
const ordenItemCantidadInput = document.getElementById("orden-item-cantidad");
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

function initState() {
  try {
    state.mesas = loadList(STORAGE_KEYS.mesas).map(ensureMesaDefaults);
    state.meseros = loadList(STORAGE_KEYS.meseros);
    state.ordenes = loadList(STORAGE_KEYS.ordenes).map(ensureOrderDefaults);
    state.productos = loadList(STORAGE_KEYS.productos);
  } catch (error) {
    state.loadError = error.message;
    globalError.textContent =
      `${error.message} Corrige LocalStorage o usa "Limpiar datos" para reiniciar.`;
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

function isAlphanumericText(value) {
  return /^[A-Za-z0-9 _-]+$/.test(value);
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
  const estadoRaw = String(normalized.estado || "PENDING").trim().toUpperCase();
  const estadoMap = {
    PENDIENTE: "PENDING",
    EN_PREPARACION: "PREPARING",
    LISTA: "READY",
    CERRADA: "CLOSED",
  };
  normalized.estado = estadoMap[estadoRaw] || estadoRaw;
  if (!ORDER_STATES.includes(normalized.estado)) {
    normalized.estado = "PENDING";
  }
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
      !["CLOSED", "CERRADA"].includes(String(orden.estado).toUpperCase())
  );
}

function getOrdersByMeseroId(meseroId) {
  return state.ordenes.filter((orden) => orden.meseroId === meseroId);
}

function getOpenOrders() {
  return state.ordenes.filter((orden) =>
    ["PENDING", "PREPARING"].includes(String(orden.estado).toUpperCase())
  );
}

function canModifyOrderItems(orden) {
  return ["PENDING", "PREPARING"].includes(String(orden.estado).toUpperCase());
}

function getNextOrderState(currentState) {
  const index = ORDER_STATES.indexOf(currentState);
  if (index < 0 || index >= ORDER_STATES.length - 1) {
    throw new Error("Estado de orden invalido.");
  }
  return ORDER_STATES[index + 1];
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

  if (!input.numero) {
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

  if (!input.capacidad) {
    errors.push("La capacidad es obligatoria.");
  } else if (!Number.isInteger(input.capacidad)) {
    errors.push("La capacidad debe ser un numero entero.");
  } else if (input.capacidad < 1 || input.capacidad > 99) {
    errors.push("La capacidad debe estar entre 1 y 99.");
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
  } else if (!isAlphanumericText(input.nombre)) {
    errors.push("El nombre solo permite caracteres alfanumericos y espacios.");
  } else if (input.nombre.length > 60) {
    errors.push("El nombre no puede exceder 60 caracteres.");
  }

  if (!input.dni) {
    errors.push("El DNI es obligatorio.");
  } else if (!isDigits(input.dni) || input.dni.length !== 8) {
    errors.push("El DNI debe tener 8 digitos numericos.");
  } else if (
    state.meseros.some(
      (mesero) =>
        mesero.dni === input.dni && mesero.id !== state.editingMeseroId
    )
  ) {
    errors.push("El DNI ya esta registrado.");
  }

  if (!input.telefono) {
    errors.push("El telefono es obligatorio.");
  } else if (!isDigits(input.telefono)) {
    errors.push("El telefono solo permite numeros.");
  } else if (input.telefono.length < 6 || input.telefono.length > 15) {
    errors.push("El telefono debe tener entre 6 y 15 digitos.");
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
  } else if (!isAlphanumericText(input.nombre)) {
    errors.push("El nombre solo permite caracteres alfanumericos y espacios.");
  }

  if (!input.precio) {
    errors.push("El precio es obligatorio.");
  } else if (!isValidPrice(input.precio)) {
    errors.push("El precio debe tener hasta 2 decimales.");
  } else if (Number(input.precio) <= 0) {
    errors.push("El precio debe ser mayor a 0.");
  }

  if (!input.descripcion) {
    errors.push("La descripcion es obligatoria.");
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
      if (!mesa) {
        errors.push("La mesa seleccionada no existe.");
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
      if (!mesero) {
        errors.push("El mesero seleccionado no existe.");
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
    } else if (!isAlphanumericText(input.cliente)) {
      errors.push(
        "El nombre para llevar solo permite caracteres alfanumericos y espacios."
      );
    } else if (input.cliente.length > 60) {
      errors.push("El nombre para llevar no puede exceder 60 caracteres.");
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
        if (priceCents < 1 || priceCents > 999999) {
          errors.push("El precio del item debe estar entre 0.01 y 9999.99.");
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
    telefono: meseroTelefonoInput.value.trim(),
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

function readOrdenItemForm() {
  return {
    ordenId: ordenItemOrdenInput.value
      ? normalizeId(ordenItemOrdenInput.value)
      : "",
    productoId: ordenItemProductoInput.value
      ? normalizeId(ordenItemProductoInput.value)
      : "",
    cantidad: Number(ordenItemCantidadInput.value),
  };
}

function resetMesaForm() {
  mesaForm.reset();
  state.editingMesaId = null;
  mesaIdInput.disabled = false;
  mesaSubmitText("Guardar");
  mesaErrors.innerHTML = "";
}

function resetMeseroForm() {
  meseroForm.reset();
  state.editingMeseroId = null;
  meseroIdInput.disabled = false;
  meseroSubmitText("Guardar");
  meseroErrors.innerHTML = "";
}

function resetProductoForm() {
  productoForm.reset();
  state.editingProductoId = null;
  productoIdInput.disabled = false;
  productoSubmitText("Guardar");
  productoErrors.innerHTML = "";
}

function resetOrdenForm() {
  ordenForm.reset();
  ordenErrors.innerHTML = "";
  ordenIdInput.value = getNextOrderId();
  updateOrderTypeFields(ordenTipoInput.value);
}

function resetOrdenItemForm() {
  ordenItemForm.reset();
  ordenItemErrors.innerHTML = "";
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
  const mesas = [...state.mesas].sort((a, b) => a.numero - b.numero);
  mesaEmpty.style.display = mesas.length ? "none" : "block";
  mesas.forEach((mesa) => {
    const row = document.createElement("tr");
    row.appendChild(createCell(mesa.id));
    row.appendChild(createCell(mesa.numero));
    row.appendChild(createCell(mesa.capacidad));
    row.appendChild(createCell(mesa.estado));

    const actions = document.createElement("td");
    actions.appendChild(createActionButton("Editar", "edit-mesa", mesa.id));
    actions.appendChild(createActionButton("Eliminar", "delete-mesa", mesa.id, "danger"));
    row.appendChild(actions);
    mesaBody.appendChild(row);
  });
  renderOrdenSelects();
  renderDashboardSummary();
  renderDashboardTables();
}

function renderMeseros() {
  meseroBody.innerHTML = "";
  const meseros = [...state.meseros].sort((a, b) =>
    a.nombre.localeCompare(b.nombre)
  );
  meseroEmpty.style.display = meseros.length ? "none" : "block";
  meseros.forEach((mesero) => {
    const row = document.createElement("tr");
    row.appendChild(createCell(mesero.id));
    row.appendChild(createCell(mesero.nombre));
    row.appendChild(createCell(mesero.dni));
    row.appendChild(createCell(mesero.telefono));
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
  const productos = [...state.productos].sort((a, b) =>
    a.nombre.localeCompare(b.nombre)
  );
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
  const ordenSelection = ordenItemOrdenInput.value;
  const productoSelection = ordenItemProductoInput.value;

  ordenMesaInput.innerHTML = '<option value="">Seleccione</option>';
  state.mesas
    .filter((mesa) => mesa.estado === "LIBRE" && mesa.habilitada)
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
    .filter((mesero) => mesero.estado === "ACTIVO")
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

  const openOrders = getOpenOrders();
  ordenItemOrdenInput.innerHTML = '<option value="">Seleccione</option>';
  openOrders.forEach((orden) => {
    const option = document.createElement("option");
    option.value = orden.id;
    option.textContent = `${orden.id} - ${formatOrderType(orden.tipo)} (${orden.estado})`;
    if (orden.id === ordenSelection) {
      option.selected = true;
    }
    ordenItemOrdenInput.appendChild(option);
  });

  const availableProducts = state.productos.filter(
    (producto) => producto.estado && producto.disponibilidad
  );
  ordenItemProductoInput.innerHTML = '<option value="">Seleccione</option>';
  availableProducts
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
    .forEach((producto) => {
      const option = document.createElement("option");
      option.value = producto.id;
      option.textContent = `${producto.id} - ${producto.nombre}`;
      if (producto.id === productoSelection) {
        option.selected = true;
      }
      ordenItemProductoInput.appendChild(option);
    });

  const shouldDisableItems = openOrders.length === 0 || availableProducts.length === 0;
  ordenItemOrdenInput.disabled = openOrders.length === 0;
  ordenItemProductoInput.disabled = availableProducts.length === 0;
  ordenItemCantidadInput.disabled = shouldDisableItems;
}

function renderOrdenes() {
  ordenBody.innerHTML = "";
  ordenEmpty.style.display = state.ordenes.length ? "none" : "block";

  state.ordenes.forEach((orden) => {
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
      itemsCell.textContent = "Sin items";
    } else {
      const list = document.createElement("ul");
      list.className = "list-disc list-inside space-y-base";
      orden.items.forEach((item) => {
        const listItem = document.createElement("li");
        const subtotal = item.precioCents * item.cantidad;
        listItem.textContent = `${item.nombre} x${item.cantidad} (S/ ${formatCents(
          subtotal
        )})`;
        if (canModifyOrderItems(orden)) {
          const removeButton = createActionButton(
            "Quitar",
            "remove-order-item",
            orden.id
          );
          removeButton.dataset.productId = item.productId;
          removeButton.classList.add("ml-xs");
          listItem.appendChild(document.createTextNode(" "));
          listItem.appendChild(removeButton);
        }
        list.appendChild(listItem);
      });
      itemsCell.appendChild(list);
    }
    row.appendChild(itemsCell);

    const totals = calculateOrderTotals(orden);
    const totalLabel =
      orden.tipo === ORDER_TYPES.PARA_LLEVAR
        ? `S/ ${formatCents(totals.totalCents)} (incluye S/ ${formatCents(
            totals.packagingFeeCents
          )} packaging)`
        : `S/ ${formatCents(totals.totalCents)}`;
    row.appendChild(createCell(totalLabel));

    const actions = document.createElement("td");
    actions.className = "p-md";
    if (orden.estado !== "CLOSED") {
      const nextState = getNextOrderState(orden.estado);
      const label = nextState === "CLOSED" ? "Cerrar" : `A ${nextState}`;
      actions.appendChild(
        createActionButton(label, "advance-order", orden.id)
      );
    }
    row.appendChild(actions);
    ordenBody.appendChild(row);
  });

  renderOrdenSelects();
  renderDashboardTables();
}

function renderDashboardSummary() {
  if (!dashboardMesaLibre || !dashboardMesaOcupada || !dashboardMesaDeshabilitada) {
    return;
  }
  const summary = state.mesas.reduce(
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
  const meseros = [...state.meseros].sort((a, b) =>
    a.nombre.localeCompare(b.nombre)
  );
  dashboardMeseroEmpty.style.display = meseros.length ? "none" : "block";

  meseros.forEach((mesero) => {
    const row = document.createElement("tr");
    row.appendChild(createCell(mesero.id));
    row.appendChild(createCell(mesero.nombre));
    row.appendChild(createCell(mesero.estado));
    const ordenesActivas = getOrdersByMeseroId(mesero.id).filter(
      (orden) => orden.estado !== "CLOSED"
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
  const mesas = [...state.mesas].sort((a, b) => a.numero - b.numero);
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
  try {
    const input = readMesaForm();
    validateMesa(input);
    if (state.editingMesaId) {
      state.mesas = state.mesas.map((mesa) =>
        mesa.id === state.editingMesaId ? input : mesa
      );
    } else {
      state.mesas.push(input);
    }
    saveList(STORAGE_KEYS.mesas, state.mesas);
    resetMesaForm();
    renderMesas();
  } catch (error) {
    if (error instanceof ValidationError) {
      renderErrors(mesaErrors, error.errors);
      return;
    }
    globalError.textContent = error.message;
  }
}

function handleMeseroSubmit(event) {
  event.preventDefault();
  clearErrors();
  try {
    const input = readMeseroForm();
    validateMesero(input);
    if (state.editingMeseroId) {
      state.meseros = state.meseros.map((mesero) =>
        mesero.id === state.editingMeseroId ? input : mesero
      );
    } else {
      state.meseros.push(input);
    }
    saveList(STORAGE_KEYS.meseros, state.meseros);
    resetMeseroForm();
    renderMeseros();
  } catch (error) {
    if (error instanceof ValidationError) {
      renderErrors(meseroErrors, error.errors);
      return;
    }
    globalError.textContent = error.message;
  }
}

function handleProductoSubmit(event) {
  event.preventDefault();
  clearErrors();
  try {
    const input = readProductoForm();
    validateProducto(input);
    const producto = {
      ...input,
      precio: formatPrice(input.precio),
    };
    if (state.editingProductoId) {
      state.productos = state.productos.map((item) =>
        item.id === state.editingProductoId ? producto : item
      );
    } else {
      state.productos.push(producto);
    }
    saveList(STORAGE_KEYS.productos, state.productos);
    resetProductoForm();
    renderProductos();
  } catch (error) {
    if (error instanceof ValidationError) {
      renderErrors(productoErrors, error.errors);
      return;
    }
    globalError.textContent = error.message;
  }
}

function handleOrdenSubmit(event) {
  event.preventDefault();
  clearErrors();
  try {
    const input = readOrdenForm();
    validateOrden(input);

    const nuevaOrden = {
      id: input.id,
      tipo: input.tipo,
      mesaId: input.mesaId,
      meseroId: input.meseroId,
      cliente: input.cliente || "",
      estado: "PENDING",
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
      renderErrors(ordenErrors, error.errors);
      return;
    }
    globalError.textContent = error.message;
  }
}

function handleOrdenItemSubmit(event) {
  event.preventDefault();
  clearErrors();
  try {
    const input = readOrdenItemForm();
    validateOrdenItem(input);

    const orden = state.ordenes.find((item) => item.id === input.ordenId);
    const producto = state.productos.find((item) => item.id === input.productoId);
    if (!orden || !producto) {
      throw new ValidationError(["La orden o el producto no existen."]);
    }

    const precioCents = parsePriceToCents(producto.precio);
    const existingItem = orden.items.find(
      (item) => item.productId === producto.id
    );
    let itemsActualizados;
    if (existingItem) {
      itemsActualizados = orden.items.map((item) =>
        item.productId === producto.id
          ? {
              ...item,
              cantidad: item.cantidad + input.cantidad,
            }
          : item
      );
    } else {
      itemsActualizados = [
        ...orden.items,
        {
          productId: producto.id,
          nombre: producto.nombre,
          precioCents,
          cantidad: input.cantidad,
        },
      ];
    }

    state.ordenes = state.ordenes.map((item) =>
      item.id === orden.id ? { ...orden, items: itemsActualizados } : item
    );
    saveList(STORAGE_KEYS.ordenes, state.ordenes);
    resetOrdenItemForm();
    renderOrdenes();
  } catch (error) {
    if (error instanceof ValidationError) {
      renderErrors(ordenItemErrors, error.errors);
      return;
    }
    globalError.textContent = error.message;
  }
}

function handleOrdenActions(event) {
  const action = event.target.dataset.action;
  const id = event.target.dataset.id;
  if (!action || !id) {
    return;
  }

  if (action === "advance-order") {
    clearErrors();
    try {
      const orden = state.ordenes.find((item) => item.id === id);
      if (!orden) {
        throw new ValidationError(["La orden seleccionada no existe."]);
      }
      if (orden.estado === "CLOSED") {
        throw new ValidationError(["La orden ya esta cerrada."]);
      }

      const nextState = getNextOrderState(orden.estado);
      let mesasActualizadas = state.mesas;
      if (nextState === "CLOSED" && orden.mesaId) {
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
      if (nextState === "CLOSED" && orden.mesaId) {
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

function handleMesaActions(event) {
  const action = event.target.dataset.action;
  const id = event.target.dataset.id;
  if (!action || !id) {
    return;
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
    mesaIdInput.disabled = true;
    mesaSubmitText("Actualizar");
    return;
  }

  if (action === "delete-mesa") {
    const ordenes = getActiveOrdersByMesaId(id);
    const historico = state.ordenes.some((orden) => orden.mesaId === id);
    if (ordenes.length || historico) {
      renderErrors(mesaErrors, [
        "No se puede eliminar la mesa porque tiene ordenes asociadas.",
      ]);
      return;
    }
    if (!confirm("Deseas eliminar esta mesa?")) {
      return;
    }
    state.mesas = state.mesas.filter((mesa) => mesa.id !== id);
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
    meseroTelefonoInput.value = mesero.telefono;
    meseroEstadoInput.value = mesero.estado;
    state.editingMeseroId = mesero.id;
    meseroIdInput.disabled = true;
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
    state.meseros = state.meseros.filter((mesero) => mesero.id !== id);
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
    productoIdInput.disabled = true;
    productoSubmitText("Actualizar");
    return;
  }

  if (action === "delete-producto") {
    if (hasProductOrders(id)) {
      state.productos = state.productos.map((producto) =>
        producto.id === id
          ? { ...producto, estado: false, disponibilidad: false }
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
    state.productos = state.productos.filter((producto) => producto.id !== id);
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
  renderMesas();
}

function handleMeseroReset() {
  if (!confirm("Deseas limpiar los datos de meseros?")) {
    return;
  }
  state.meseros = [];
  saveList(STORAGE_KEYS.meseros, state.meseros);
  resetMeseroForm();
  renderMeseros();
}

function handleProductoReset() {
  if (!confirm("Deseas limpiar los datos del catalogo?")) {
    return;
  }
  state.productos = [];
  saveList(STORAGE_KEYS.productos, state.productos);
  resetProductoForm();
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
  ordenTipoInput.addEventListener("change", (event) => {
    updateOrderTypeFields(event.target.value);
  });

  initTabs();
}

function renderAll() {
  renderMesas();
  renderMeseros();
  renderProductos();
  renderOrdenes();
  resetOrdenForm();
  resetOrdenItemForm();
}

initState();
bindEvents();
renderAll();
if (state.loadError) {
  setFormDisabled(true);
}