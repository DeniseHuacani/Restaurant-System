(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory(require('./config.js'), require('./utils.js'), require('./state.js'));
  } else {
    root.App = root.App || {};
    root.App.ui = factory(root.App.config, root.App.utils, root.App.stateManager);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (config, utils, stateManager) {
  const state = stateManager.state;

  // --- ELEMENTOS DEL DOM ---
  const els = {
    get mesaForm() { return document.getElementById("mesa-form"); },
    get mesaErrors() { return document.getElementById("mesa-errors"); },
    get mesaBody() { return document.getElementById("mesa-body"); },
    get mesaEmpty() { return document.getElementById("mesa-empty"); },
    get mesaIdInput() { return document.getElementById("mesa-id"); },
    get mesaNumeroInput() { return document.getElementById("mesa-numero"); },
    get mesaCapacidadInput() { return document.getElementById("mesa-capacidad"); },
    get mesaEstadoInput() { return document.getElementById("mesa-estado"); },
    get mesaCancelButton() { return document.getElementById("mesa-cancel"); },
    get mesaResetButton() { return document.getElementById("mesa-reset"); },

    get meseroForm() { return document.getElementById("mesero-form"); },
    get meseroErrors() { return document.getElementById("mesero-errors"); },
    get meseroBody() { return document.getElementById("mesero-body"); },
    get meseroEmpty() { return document.getElementById("mesero-empty"); },
    get meseroIdInput() { return document.getElementById("mesero-id"); },
    get meseroNombreInput() { return document.getElementById("mesero-nombre"); },
    get meseroDniInput() { return document.getElementById("mesero-dni"); },
    get meseroCelularInput() { return document.getElementById("mesero-celular"); },
    get meseroEstadoInput() { return document.getElementById("mesero-estado"); },
    get meseroCancelButton() { return document.getElementById("mesero-cancel"); },
    get meseroResetButton() { return document.getElementById("mesero-reset"); },

    get productoForm() { return document.getElementById("producto-form"); },
    get productoErrors() { return document.getElementById("producto-errors"); },
    get productoBody() { return document.getElementById("producto-body"); },
    get productoEmpty() { return document.getElementById("producto-empty"); },
    get productoIdInput() { return document.getElementById("producto-id"); },
    get productoNombreInput() { return document.getElementById("producto-nombre"); },
    get productoPrecioInput() { return document.getElementById("producto-precio"); },
    get productoDisponibilidadInput() { return document.getElementById("producto-disponibilidad"); },
    get productoEstadoInput() { return document.getElementById("producto-estado"); },
    get productoDescripcionInput() { return document.getElementById("producto-descripcion"); },
    get productoCancelButton() { return document.getElementById("producto-cancel"); },
    get productoResetButton() { return document.getElementById("producto-reset"); },

    get ordenForm() { return document.getElementById("orden-form"); },
    get ordenItemForm() { return document.getElementById("orden-item-form"); },
    get ordenErrors() { return document.getElementById("orden-errors"); },
    get ordenItemErrors() { return document.getElementById("orden-item-errors"); },
    get ordenResetButton() { return document.getElementById("orden-reset"); },
    get ordenCancelButton() { return document.getElementById("orden-cancel"); },
    get ordenIdInput() { return document.getElementById("orden-id"); },
    get ordenTipoInput() { return document.getElementById("orden-tipo"); },
    get ordenMesaInput() { return document.getElementById("orden-mesa"); },
    get ordenMeseroInput() { return document.getElementById("orden-mesero"); },
    get ordenEstadoInput() { return document.getElementById("orden-estado"); },
    get ordenClienteInput() { return document.getElementById("orden-cliente"); },

    get itemsModal() { return document.getElementById("items-modal"); },
    get itemsModalTitle() { return document.getElementById("items-modal-title"); },
    get itemsModalOrderId() { return document.getElementById("items-modal-order-id"); },
    get itemsModalClose() { return document.getElementById("items-modal-close"); },
    get itemsModalCancel() { return document.getElementById("items-modal-cancel"); },

    get billingModal() { return document.getElementById("billing-modal"); },
    get billingOrderId() { return document.getElementById("billing-order-id"); },
    get billingOrderType() { return document.getElementById("billing-order-type"); },
    get billingItemsList() { return document.getElementById("billing-items-list"); },
    get billingTotalAmount() { return document.getElementById("billing-total-amount"); },
    get billingForm() { return document.getElementById("billing-form"); },
    get billingCustomerId() { return document.getElementById("billing-customer-id"); },
    get billingCustomerName() { return document.getElementById("billing-customer-name"); },
    get billingReceivedAmount() { return document.getElementById("billing-received-amount"); },
    get billingChangeAmount() { return document.getElementById("billing-change-amount"); },
    get billingModalClose() { return document.getElementById("billing-modal-close"); },
    get billingModalCancel() { return document.getElementById("billing-modal-cancel"); },

    get ordenItemsContainer() { return document.getElementById("orden-items-container"); },
    get addItemRowBtn() { return document.getElementById("add-item-row-btn"); },
    get ordenBody() { return document.getElementById("orden-body"); },
    get ordenEmpty() { return document.getElementById("orden-empty"); },
    get ordenFieldElements() { return document.querySelectorAll("[data-order-field]"); },
    get dashboardTableGrid() { return document.getElementById("dashboard-table-grid"); },
    get dashboardMesaLibre() { return document.getElementById("dashboard-mesa-libre"); },
    get dashboardMesaOcupada() { return document.getElementById("dashboard-mesa-ocupada"); },
    get dashboardMesaDeshabilitada() { return document.getElementById("dashboard-mesa-deshabilitada"); },
    get dashboardMeseroBody() { return document.getElementById("dashboard-mesero-body"); },
    get dashboardMeseroEmpty() { return document.getElementById("dashboard-mesero-empty"); },

    get historyModal() { return document.getElementById("history-modal"); },
    get historyBody() { return document.getElementById("history-body"); },
    get historyEmpty() { return document.getElementById("history-empty"); },
    get btnVerHistorial() { return document.getElementById("btn-ver-historial"); },
    get historyModalClose() { return document.getElementById("history-modal-close"); },
    get globalError() { return document.getElementById("global-error"); },
  };

  // --- FUNCIONES DE RENDERIZADO ---

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
    button.className = "px-sm py-xs border border-outline-variant rounded-lg text-on-surface-variant hover:bg-surface-container-low text-xs " + (className || "");
    return button;
  }

  function renderMesas() {
    if (!els.mesaBody) return;
    els.mesaBody.innerHTML = "";
    const mesas = state.mesas.filter(m => m.activo !== false).sort((a, b) => b.id.localeCompare(a.id));
    if (els.mesaEmpty) els.mesaEmpty.style.display = mesas.length ? "none" : "block";
    
    mesas.forEach((mesa) => {
      const row = document.createElement("tr");
      row.appendChild(createCell(mesa.id));
      row.appendChild(createCell(mesa.numero));
      row.appendChild(createCell(mesa.capacidad));
      row.appendChild(createCell(mesa.estado));
      const actions = document.createElement("td");
      const activeOrders = stateManager.getActiveOrdersByMesaId(mesa.id);
      const isLocked = mesa.estado === "OCUPADA" || activeOrders.length > 0;
      const editBtn = createActionButton("Editar", "edit-mesa", mesa.id);
      const deleteBtn = createActionButton("Eliminar", "delete-mesa", mesa.id, "text-error border-error/20 hover:bg-error/5");
      if (isLocked) { editBtn.disabled = true; deleteBtn.disabled = true; editBtn.classList.add("opacity-50"); deleteBtn.classList.add("opacity-50"); }
      actions.appendChild(editBtn); actions.appendChild(deleteBtn);
      row.appendChild(actions); els.mesaBody.appendChild(row);
    });
    renderOrdenSelects();
    renderDashboardSummary();
    renderDashboardTables();
  }

  function renderMeseros() {
    if (!els.meseroBody) return;
    els.meseroBody.innerHTML = "";
    const meseros = state.meseros.filter(m => m.activo !== false).sort((a, b) => b.id.localeCompare(a.id));
    if (els.meseroEmpty) els.meseroEmpty.style.display = meseros.length ? "none" : "block";

    meseros.forEach((mesero) => {
      const row = document.createElement("tr");
      row.appendChild(createCell(mesero.id));
      row.appendChild(createCell(mesero.nombre));
      row.appendChild(createCell(mesero.dni));
      row.appendChild(createCell(mesero.celular));
      row.appendChild(createCell(mesero.estado));
      const actions = document.createElement("td");
      actions.appendChild(createActionButton("Editar", "edit-mesero", mesero.id));
      actions.appendChild(createActionButton("Eliminar", "delete-mesero", mesero.id, "text-error border-error/20 hover:bg-error/5"));
      row.appendChild(actions); els.meseroBody.appendChild(row);
    });
    renderOrdenSelects();
    renderDashboardMeseros();
  }

  function renderProductos() {
    if (!els.productoBody) return;
    els.productoBody.innerHTML = "";
    const productos = state.productos.filter(p => p.activo !== false).sort((a, b) => b.id.localeCompare(a.id));
    if (els.productoEmpty) els.productoEmpty.style.display = productos.length ? "none" : "block";

    productos.forEach((producto) => {
      const row = document.createElement("tr");
      row.appendChild(createCell(producto.id));
      row.appendChild(createCell(producto.nombre));
      row.appendChild(createCell(utils.formatPrice(producto.precio)));
      row.appendChild(createCell(producto.disponibilidad ? "DISPONIBLE" : "NO DISP."));
      row.appendChild(createCell(producto.estado ? "ACTIVO" : "INACTIVO"));
      row.appendChild(createCell(producto.descripcion || ""));
      const actions = document.createElement("td");
      actions.appendChild(createActionButton("Editar", "edit-producto", producto.id));
      actions.appendChild(createActionButton("Eliminar", "delete-producto", producto.id, "text-error border-error/20 hover:bg-error/5"));
      row.appendChild(actions); els.productoBody.appendChild(row);
    });
  }

  function renderOrdenes() {
    if (!els.ordenBody) return;
    els.ordenBody.innerHTML = "";
    const activeOrders = stateManager.getOrdenesActivas();
    if (els.ordenEmpty) els.ordenEmpty.style.display = activeOrders.length ? "none" : "block";

    activeOrders.forEach((orden) => {
      const row = document.createElement("tr");
      row.appendChild(createCell(orden.id));
      row.appendChild(createCell(utils.formatOrderType(orden.tipo)));
      row.appendChild(createCell(orden.mesaId || "-"));
      row.appendChild(createCell(orden.meseroId || "-"));
      row.appendChild(createCell(orden.cliente || "-"));
      row.appendChild(createCell(orden.estado));

      // Columna de Items
      const itemsCell = document.createElement("td");
      itemsCell.className = "p-md text-body-md text-on-surface";
      if (!orden.items || orden.items.length === 0) {
        itemsCell.innerHTML = '<span class="italic opacity-60">Sin ítems</span>';
      } else {
        const list = document.createElement("ul");
        list.className = "list-disc list-inside space-y-1";
        orden.items.forEach((item) => {
          const listItem = document.createElement("li");
          listItem.textContent = `${item.nombre} x${item.cantidad}`;
          list.appendChild(listItem);
        });
        itemsCell.appendChild(list);
      }
      row.appendChild(itemsCell);

      const totals = stateManager.calculateOrderTotals(orden);
      row.appendChild(createCell(`S/ ${utils.formatCents(totals.totalCents)}`));

      const actions = document.createElement("td");
      if (orden.items.length === 0) {
        actions.appendChild(createActionButton("➕ Items", "open-items-modal", orden.id, "bg-secondary-container"));
      } else {
        actions.appendChild(createActionButton("Modificar", "open-items-modal", orden.id));
        const nextLabels = { "PENDIENTE": "🍳 A Cocina", "EN COCINA": "🔔 Servir", "LISTO": "💳 Cobrar" };
        if (orden.estado !== "PAGADO") {
          actions.appendChild(createActionButton(nextLabels[orden.estado] || "➡️ Avanzar", "advance-order", orden.id, "bg-primary text-on-primary"));
        }
      }
      row.appendChild(actions); els.ordenBody.appendChild(row);
    });
  }

  function renderOrdenSelects() {
    if (!els.ordenMesaInput || !els.ordenMeseroInput) return;
    const mesaSel = els.ordenMesaInput.value;
    els.ordenMesaInput.innerHTML = '<option value="">Seleccione</option>';
    state.mesas.filter(m => m.activo !== false && m.estado === "LIBRE" && m.habilitada)
      .forEach(m => {
        const opt = new Option(`${m.id} - Mesa ${m.numero}`, m.id);
        if (m.id === mesaSel) opt.selected = true;
        els.ordenMesaInput.add(opt);
      });
    const meseroSel = els.ordenMeseroInput.value;
    els.ordenMeseroInput.innerHTML = '<option value="">Seleccione</option>';
    state.meseros.filter(m => m.activo !== false && m.estado === "ACTIVO")
      .forEach(m => {
        const opt = new Option(`${m.id} - ${m.nombre}`, m.id);
        if (m.id === meseroSel) opt.selected = true;
        els.ordenMeseroInput.add(opt);
      });
  }

  function renderDashboardSummary() {
    if (!els.dashboardMesaLibre || !els.dashboardMesaOcupada || !els.dashboardMesaDeshabilitada) return;
    const summary = state.mesas.filter(m => m.activo !== false).reduce((acc, m) => {
      if (m.estado === "DESHABILITADA" || !m.habilitada) acc.d++;
      else if (m.estado === "OCUPADA") acc.o++;
      else acc.l++;
      return acc;
    }, { l: 0, o: 0, d: 0 });
    els.dashboardMesaLibre.textContent = `${summary.l} LIBRE`;
    els.dashboardMesaOcupada.textContent = `${summary.o} OCUPADA`;
    els.dashboardMesaDeshabilitada.textContent = `${summary.d} DESHABILITADA`;
  }

  function renderDashboardMeseros() {
    if (!els.dashboardMeseroBody) return;
    els.dashboardMeseroBody.innerHTML = "";
    const meseros = state.meseros.filter(m => m.activo !== false).sort((a, b) => b.id.localeCompare(a.id));
    if (els.dashboardMeseroEmpty) els.dashboardMeseroEmpty.style.display = meseros.length ? "none" : "block";

    meseros.forEach(m => {
      const row = document.createElement("tr");
      row.appendChild(createCell(m.id));
      row.appendChild(createCell(m.nombre));
      row.appendChild(createCell(m.estado));
      const count = state.ordenes.filter(o => o.meseroId === m.id && o.estado !== "PAGADO").length;
      row.appendChild(createCell(String(count)));
      els.dashboardMeseroBody.appendChild(row);
    });
  }

  function renderDashboardTables() {
    if (!els.dashboardTableGrid) return;
    els.dashboardTableGrid.innerHTML = "";
    
    // Ordenar por ID descendente para mantener consistencia con las otras tablas
    const mesas = state.mesas.filter(m => m.activo !== false).sort((a, b) => b.id.localeCompare(a.id));

    mesas.forEach(m => {
      const card = document.createElement("div");
      card.className = "flex flex-col gap-sm p-md border rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow";

      // Determinar color del círculo indicador
      let colorClass = "bg-surface-variant"; // Plomo (Deshabilitada/Inactiva)
      if (m.estado === "LIBRE") colorClass = "bg-green-500";
      if (m.estado === "OCUPADA") colorClass = "bg-amber-500";

      // Construir encabezado y datos básicos
      let html = `
        <div class="flex items-center justify-between mb-base">
          <div class="flex items-center gap-xs">
            <div class="w-3 h-3 ${colorClass} rounded-full border border-black/10"></div>
            <p class="font-bold text-headline-sm">Mesa #${m.numero}</p>
          </div>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant border border-outline-variant">${m.estado}</span>
        </div>
        <p class="text-body-md text-on-surface-variant">Capacidad: ${m.capacidad} personas</p>
      `;

      // Si la mesa está OCUPADA, buscamos y mostramos el pedido actual
      if (m.estado === "OCUPADA") {
        const activeOrders = stateManager.getActiveOrdersByMesaId(m.id);
        const order = activeOrders[0]; // Tomamos la primera orden activa
        if (order) {
          const totals = stateManager.calculateOrderTotals(order);
          html += `
            <div class="mt-sm pt-sm border-t border-outline-variant">
              <div class="flex justify-between items-center mb-xs">
                <p class="font-bold text-[11px] text-primary">PEDIDO ${order.id}</p>
                <span class="text-[10px] bg-secondary-container text-on-secondary-container px-1.5 rounded">${order.estado}</span>
              </div>
              <ul class="text-[13px] space-y-0.5 text-on-surface mb-sm italic list-none">
                ${order.items.map(item => `<li class="truncate">• ${item.nombre} x${item.cantidad}</li>`).join('')}
              </ul>
              <div class="flex justify-between items-center bg-surface-container-low p-xs rounded">
                 <p class="text-[11px] text-on-surface-variant font-bold uppercase">Total:</p>
                 <p class="font-bold text-primary">S/ ${utils.formatCents(totals.totalCents)}</p>
              </div>
            </div>
          `;
        }
      }

      card.innerHTML = html;
      els.dashboardTableGrid.appendChild(card);
    });
  }

  function resetMesaForm() {
    if (!els.mesaForm) return;
    clearErrors();
    els.mesaForm.reset();
    state.editingMesaId = null;
    els.mesaIdInput.value = stateManager.getNextMesaId();
    els.mesaNumeroInput.value = stateManager.getNextMesaNumero();
    const btn = els.mesaForm.querySelector('button[type="submit"]');
    if (btn) btn.textContent = "Guardar Mesa";
  }

  function resetMeseroForm() {
    if (!els.meseroForm) return;
    clearErrors();
    els.meseroForm.reset();
    state.editingMeseroId = null;
    els.meseroIdInput.value = stateManager.getNextMeseroId();
    const btn = els.meseroForm.querySelector('button[type="submit"]');
    if (btn) btn.textContent = "Guardar Mesero";
  }

  function resetProductoForm() {
    if (!els.productoForm) return;
    clearErrors();
    els.productoForm.reset();
    state.editingProductoId = null;
    els.productoIdInput.value = stateManager.getNextProductoId();
    const btn = els.productoForm.querySelector('button[type="submit"]');
    if (btn) btn.textContent = "Guardar Producto";
  }

  function resetOrdenForm() {
    if (!els.ordenForm) return;
    clearErrors();
    els.ordenForm.reset();
    els.ordenIdInput.value = stateManager.getNextOrderId();
    // Establecer estado por defecto como PENDIENTE
    els.ordenEstadoInput.innerHTML = '<option value="PENDIENTE">PENDIENTE</option>';
    els.ordenEstadoInput.value = "PENDIENTE";
    updateOrderTypeFields(els.ordenTipoInput.value);
  }

  function resetBillingForm() {
    if (!els.billingForm) return;
    clearErrors();
    els.billingForm.reset();
    if (els.billingChangeAmount) {
      els.billingChangeAmount.textContent = "S/ 0.00";
      els.billingChangeAmount.className = "font-display text-on-surface-variant";
    }
    if (els.billingItemsList) els.billingItemsList.innerHTML = "";
  }

  function openBillingModal(id) {
    const orden = state.ordenes.find(o => o.id === id);
    if (!orden) return;

    resetBillingForm();

    els.billingOrderId.textContent = id;
    els.billingOrderType.textContent = utils.formatOrderType(orden.tipo) + (orden.mesaId ? ` - Mesa ${orden.mesaId}` : "");

    // Renderizar lista de productos en el resumen de cobro
    if (els.billingItemsList) {
      orden.items.forEach(item => {
        const li = document.createElement("li");
        li.className = "flex justify-between text-body-md";
        li.innerHTML = `<span>${item.nombre} x${item.cantidad}</span> <span>S/ ${utils.formatCents(item.precioCents * item.cantidad)}</span>`;
        els.billingItemsList.appendChild(li);
      });
    }

    const totals = stateManager.calculateOrderTotals(orden);
    els.billingTotalAmount.textContent = `S/ ${utils.formatCents(totals.totalCents)}`;
    state.currentOrderTotalCents = totals.totalCents;
    state.currentOrderIdForBilling = id;

    if (orden.cliente) {
      els.billingCustomerName.value = orden.cliente;
    }

    els.billingModal.classList.remove("hidden");
  }

  function createItemRow(pid = "", qty = 1) {
    const row = document.createElement("div");
    row.className = "item-row flex gap-sm mb-sm";
    row.innerHTML = `<select class="product-select flex-1 rounded border p-xs">${state.productos.map(p => `<option value="${p.id}" ${p.id === pid ? 'selected' : ''}>${p.nombre}</option>`).join('')}</select>
                     <input type="number" class="qty-input w-20 rounded border p-xs" value="${qty}" min="1">
                     <button type="button" class="remove-row-btn text-error">X</button>`;
    row.querySelector(".remove-row-btn").onclick = () => row.remove();
    els.ordenItemsContainer.appendChild(row);
  }

  function updateOrderTypeFields(tipo) {
    const isMesa = tipo === "MESA";
    els.ordenMesaInput.disabled = !isMesa;
    els.ordenMeseroInput.disabled = !isMesa;
    els.ordenClienteInput.disabled = isMesa;
    els.ordenFieldElements.forEach(el => el.style.display = (el.dataset.orderField === 'cliente' ? !isMesa : isMesa) ? "" : "none");
  }

   function renderHistoryTable() {
    if (!els.historyBody) return;
    els.historyBody.innerHTML = "";
    const history = stateManager.getHistorialVentas().sort((a, b) => b.id.localeCompare(a.id));
    if (els.historyEmpty) els.historyEmpty.style.display = history.length ? "none" : "block";

    history.forEach((orden) => {
      const row = document.createElement("tr");
      row.appendChild(createCell(orden.id));
      row.appendChild(createCell(utils.formatOrderType(orden.tipo)));
      
      const clienteStr = orden.clienteNombre || orden.cliente || "Público General";
      const dniStr = orden.clienteDni || "-";
      row.appendChild(createCell(`${clienteStr} (${dniStr})`));

      const itemsSummary = orden.items.map(i => `${i.nombre} x${i.cantidad}`).join(", ");
      row.appendChild(createCell(itemsSummary || "Sin consumo"));

      const totals = stateManager.calculateOrderTotals(orden);
      row.appendChild(createCell(`S/ ${utils.formatCents(totals.totalCents)}`));

      els.historyBody.appendChild(row);
    });
  }
  
  function renderAll() {
    renderMesas();
    renderMeseros();
    renderProductos();
    renderOrdenes();
    // Pre-llenar formularios con IDs por defecto al cargar la app
    resetMesaForm();
    resetMeseroForm();
    resetProductoForm();
    resetOrdenForm();
  }

  function setFormDisabled(disabled) {
    const fields = document.querySelectorAll("input, select, button");
    fields.forEach((field) => {
      // No deshabilitar botones de reset ni botones de pestañas para permitir navegación
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

  function clearErrors() {
    [els.mesaErrors, els.meseroErrors, els.productoErrors, els.ordenErrors, els.ordenItemErrors].forEach(e => e.innerHTML = "");
    document.querySelectorAll(".error-message").forEach(s => { s.textContent = ""; s.style.display = "none"; });
  }

  function displayFieldErrors(errors, mapping) {
    errors.forEach(msg => {
      for (const [kw, id] of Object.entries(mapping)) {
        if (msg.includes(kw)) {
          const span = document.getElementById(id);
          if (span) { span.textContent = msg; span.style.display = "block"; }
        }
      }
    });
  }

  return {
    els,
    renderAll,
    renderMesas, renderMeseros, renderProductos, renderOrdenes, renderHistoryTable,
    clearErrors, displayFieldErrors,
    setFormDisabled,
    resetMesaForm,
    resetMeseroForm,
    resetProductoForm,
    resetOrdenForm,
    resetBillingForm,
    openBillingModal,
    closeItemsModal: () => { 
      els.itemsModal.classList.add("hidden"); 
      state.currentOrderIdForItems = null;
    },
    closeBillingModal: () => { 
      els.billingModal.classList.add("hidden"); 
      state.currentOrderIdForBilling = null;
    },
    openItemsModal: (id) => { 
      const orden = state.ordenes.find(o => o.id === id);
      if (!orden) return;
      els.itemsModalOrderId.textContent = id;
      els.ordenItemsContainer.innerHTML = "";
      if (orden.items && orden.items.length > 0) {
        orden.items.forEach(item => createItemRow(item.productId, item.cantidad));
      } else {
        createItemRow();
      }
      els.itemsModal.classList.remove("hidden");
    },
    updateOrderTypeFields,
    createItemRow
  };
});