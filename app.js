const STORAGE_KEYS = {
  mesas: "mesas",
  meseros: "meseros",
  ordenes: "ordenes",
  productos: "productos",
};

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
    state.ordenes = loadList(STORAGE_KEYS.ordenes);
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

function mesaSubmitText(text) {
  document.getElementById("mesa-submit").textContent = text;
}

function meseroSubmitText(text) {
  document.getElementById("mesero-submit").textContent = text;
}

function productoSubmitText(text) {
  document.getElementById("producto-submit").textContent = text;
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
}

function createCell(value) {
  const cell = document.createElement("td");
  cell.textContent = value;
  return cell;
}

function createActionButton(label, action, id, className) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.dataset.action = action;
  button.dataset.id = id;
  if (className) {
    button.classList.add(className);
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

  initTabs();
}

function renderAll() {
  renderMesas();
  renderMeseros();
  renderProductos();
}

initState();
bindEvents();
renderAll();
if (state.loadError) {
  setFormDisabled(true);
}