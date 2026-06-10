(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory(require('./config.js'), require('./state.js'), require('./validation.js'), require('./ui.js'), require('./utils.js'));
  } else {
    root.App = root.App || {};
    root.App.controllers = factory(root.App.config, root.App.stateManager, root.App.validation, root.App.ui, root.App.utils);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (config, stateManager, validation, ui, utils) {
  const state = stateManager.state;
  const els = ui.els;

  async function handleMesaSubmit(e) {
    e.preventDefault();
    ui.clearErrors();
    try {
      const input = {
        id: els.mesaIdInput.value,
        numero: parseInt(els.mesaNumeroInput.value),
        capacidad: parseInt(els.mesaCapacidadInput.value),
        estado: els.mesaEstadoInput.value
      };
      validation.validateMesa(state, input);

      if (state.editingMesaId) {
        state.mesas = state.mesas.map(m => m.id === state.editingMesaId ? { ...m, ...input } : m);
      } else {
        state.mesas.push({ ...input, activo: true });
      }

      const mesaToSave = state.mesas.find(m => m.id === input.id);
      // Sincronizar con el backend
      await stateManager.saveItem(config.STORAGE_KEYS.mesas, mesaToSave, !!state.editingMesaId);
      
      ui.resetMesaForm();
      ui.renderMesas();
    } catch (err) {
      if (err instanceof validation.ValidationError) {
        ui.displayFieldErrors(err.errors, { 
          "ID": "error-mesa-id", 
          "numero": "error-mesa-numero",
          "capacidad": "error-mesa-capacidad",
          "estado": "error-mesa-estado"
        });
      } else {
        console.error("Error al guardar mesa:", err);
      }
    }
  }

  async function handleMeseroSubmit(e) {
    e.preventDefault();
    ui.clearErrors();
    try {
      const input = {
        id: els.meseroIdInput.value,
        nombre: els.meseroNombreInput.value,
        dni: els.meseroDniInput.value,
        celular: els.meseroCelularInput.value,
        estado: els.meseroEstadoInput.value
      };
      validation.validateMesero(state, input);
      
      if (state.editingMeseroId) {
        state.meseros = state.meseros.map(m => m.id === state.editingMeseroId ? { ...m, ...input } : m);
      } else {
        state.meseros.push({ ...input, activo: true });
      }

      const meseroToSave = state.meseros.find(m => m.id === input.id);
      await stateManager.saveItem(config.STORAGE_KEYS.meseros, meseroToSave, !!state.editingMeseroId);
      ui.resetMeseroForm();
      ui.renderMeseros();
    } catch (err) {
      if (err instanceof validation.ValidationError) {
        ui.displayFieldErrors(err.errors, { 
          "ID": "error-mesero-id",
          "nombre": "error-mesero-nombre",
          "DNI": "error-mesero-dni",
          "celular": "error-mesero-celular",
          "estado": "error-mesero-estado"
        });
      }
    }
  }

  async function handleProductoSubmit(e) {
    e.preventDefault();
    ui.clearErrors();
    try {
      const input = {
        id: els.productoIdInput.value,
        nombre: els.productoNombreInput.value,
        precio: els.productoPrecioInput.value,
        disponibilidad: els.productoDisponibilidadInput.value === "true",
        estado: els.productoEstadoInput.value === "true",
        descripcion: els.productoDescripcionInput.value
      };
      validation.validateProducto(state, input);

      if (state.editingProductoId) {
        state.productos = state.productos.map(p => p.id === state.editingProductoId ? { ...p, ...input, precio: utils.formatPrice(input.precio) } : p);
      } else {
        state.productos.push({ ...input, activo: true, precio: utils.formatPrice(input.precio) });
      }

      const productoToSave = state.productos.find(p => p.id === input.id);
      await stateManager.saveItem(config.STORAGE_KEYS.productos, productoToSave, !!state.editingProductoId);
      ui.resetProductoForm();
      ui.renderProductos();
    } catch (err) {
      if (err instanceof validation.ValidationError) {
        ui.displayFieldErrors(err.errors, { 
          "ID": "error-producto-id",
          "nombre": "error-producto-nombre", 
          "precio": "error-producto-precio",
          "disponibilidad": "error-producto-disponibilidad",
          "estado": "error-producto-estado",
          "descrip": "error-producto-descripcion"
        });
      }
    }
  }

  async function handleOrdenSubmit(e) {
    e.preventDefault();
    ui.clearErrors();
    try {
      const input = {
        id: els.ordenIdInput.value,
        tipo: els.ordenTipoInput.value,
        mesaId: els.ordenMesaInput.value,
        meseroId: els.ordenMeseroInput.value,
        cliente: els.ordenClienteInput.value
      };
      validation.validateOrden(state, input);
      const nuevaOrden = { ...input, estado: "PENDIENTE", items: [] };
      // Crear orden en backend primero. El backend validará mesa/mesero y marcará la mesa como OCUPADA si aplica.
      await stateManager.saveItem(config.STORAGE_KEYS.ordenes, nuevaOrden, false);
      // Refrescar el estado completo desde el servidor para obtener valores autoritativos (mesas, ordenes, totales)
      await stateManager.initState();
      ui.resetOrdenForm();
      ui.renderAll();
    } catch (err) {
      if (err instanceof validation.ValidationError) ui.displayFieldErrors(err.errors, { 
        "ID": "error-orden-id",
        "tipo": "error-orden-tipo",
        "mesa": "error-orden-mesa",
        "mesero": "error-orden-mesero",
        "cliente": "error-orden-cliente"
      });
    }
  }

  async function handleOrdenItemSubmit(e) {
    e.preventDefault();
    ui.clearErrors();
    try {
      const ordenId = state.currentOrderIdForItems;
      const orden = state.ordenes.find(o => o.id === ordenId);
      if (!orden) return;

      const rows = els.ordenItemsContainer.querySelectorAll(".item-row");
      const newItems = [];
      
      rows.forEach(row => {
        const productId = row.querySelector(".product-select").value;
        const cantidad = parseInt(row.querySelector(".qty-input").value);
        
        if (productId && cantidad > 0) {
          const product = state.productos.find(p => p.id === productId);
          if (product) {
            newItems.push({
              productId: product.id,
              nombre: product.nombre,
              precioCents: utils.parsePriceToCents(product.precio),
              cantidad: cantidad
            });
          }
        }
      });

      if (newItems.length === 0) {
        throw new validation.ValidationError(["Debe agregar al menos un producto."]);
      }

      orden.items = newItems;
      // Si el estado era PENDIENTE y agregamos items, la dejamos en PENDIENTE o avanzamos según flujo
      await stateManager.saveItem(config.STORAGE_KEYS.ordenes, orden, true);
      
      ui.closeItemsModal();
      ui.renderOrdenes();
    } catch (err) {
      if (err instanceof validation.ValidationError) {
        if (ui.els.ordenItemErrors) {
          ui.els.ordenItemErrors.textContent = err.errors.join(", ");
          ui.els.ordenItemErrors.style.display = "block";
        }
      } else {
        console.error("Error al guardar items:", err);
      }
    }
  }

  function updateBillingChange() {
    const received = els.billingReceivedAmount.value.trim();
    if (!utils.isValidPrice(received)) {
      els.billingChangeAmount.textContent = "S/ 0.00";
      els.billingChangeAmount.className = "font-display text-error";
      return;
    }
    const receivedCents = utils.parsePriceToCents(received);
    const totalCents = state.currentOrderTotalCents;
    const changeCents = receivedCents - totalCents;

    if (changeCents >= 0) {
      els.billingChangeAmount.textContent = `S/ ${utils.formatCents(changeCents)}`;
      els.billingChangeAmount.className = "font-display text-green-700";
    } else {
      els.billingChangeAmount.textContent = "S/ 0.00";
      els.billingChangeAmount.className = "font-display text-error";
    }
  }

  async function handleBillingSubmit(e) {
    e.preventDefault();
    ui.clearErrors();
    
    const dni = els.billingCustomerId.value.trim();
    const name = els.billingCustomerName.value.trim();
    const received = els.billingReceivedAmount.value.trim();

    const errors = [];
    if (dni && (!utils.isDigits(dni) || dni.length !== 8)) {
      errors.push("El DNI debe tener exactamente 8 dígitos numéricos.");
    }
    if (name) {
      if (!utils.isValidNameLength(name)) errors.push("El nombre debe tener entre 2 y 50 caracteres.");
      if (!utils.isStrictAlphaText(name)) errors.push("El nombre solo permite letras.");
    }
    
    if (!utils.isValidPrice(received)) {
      errors.push("El monto recibido es inválido.");
    } else {
      const receivedCents = utils.parsePriceToCents(received);
      if (receivedCents < state.currentOrderTotalCents) {
        errors.push("Monto insuficiente.");
      }
    }

    if (errors.length > 0) {
      ui.displayFieldErrors(errors, {
        "DNI": "error-billing-customer-id",
        "nombre": "error-billing-customer-name",
        "monto": "error-billing-received-amount",
        "insuficiente": "error-billing-received-amount"
      });
      return;
    }

    try {
      const ordenId = state.currentOrderIdForBilling;
      const orden = state.ordenes.find(o => o.id === ordenId);
      if (!orden) return;

      // Marcar como PAGADO y delegar la liberación de la mesa al backend
      orden.estado = "PAGADO";
      orden.clienteDni = dni;
      orden.clienteNombre = name;

      await stateManager.saveItem(config.STORAGE_KEYS.ordenes, orden, true);
      // Refrescar estado para que el backend devuelva la mesa liberada y totales actualizados
      await stateManager.initState();

      alert(`¡Pago exitoso! Cambio a entregar: ${els.billingChangeAmount.textContent}`);
      ui.closeBillingModal();
      ui.renderAll();
    } catch (err) {
      console.error("Error al procesar cobro:", err);
    }
  }

  async function handleMesaActions(e) {
    const id = e.target.dataset.id;
    const action = e.target.dataset.action;
    if (!id || !action) return;

    if (action === "delete-mesa") {
      if (confirm("¿Deseas eliminar esta mesa?")) {
        const mesa = state.mesas.find(m => m.id === id);
        if (mesa) {
          mesa.activo = false;
          await stateManager.saveItem(config.STORAGE_KEYS.mesas, mesa, true);
        }
        ui.renderMesas();
      }
    } else if (action === "edit-mesa") {
      const mesa = state.mesas.find(m => m.id === id);
      if (mesa) {
        els.mesaIdInput.value = mesa.id;
        els.mesaNumeroInput.value = mesa.numero;
        els.mesaCapacidadInput.value = mesa.capacidad;
        els.mesaEstadoInput.value = mesa.estado;
        state.editingMesaId = id;
        
        // Cambiar el texto del botón de envío
        const submitBtn = els.mesaForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.textContent = "Actualizar Mesa";
        
        els.mesaNumeroInput.focus();
      }
    }
  }

  async function handleMeseroActions(e) {
    const id = e.target.dataset.id;
    const action = e.target.dataset.action;
    if (!id || !action) return;

    if (action === "delete-mesero") {
      if (confirm("¿Deseas eliminar este mesero?")) {
        const mesero = state.meseros.find(m => m.id === id);
        if (mesero) {
          mesero.activo = false;
          await stateManager.saveItem(config.STORAGE_KEYS.meseros, mesero, true);
        }
        ui.renderMeseros();
      }
    } else if (action === "edit-mesero") {
      const mesero = state.meseros.find(m => m.id === id);
      if (mesero) {
        els.meseroIdInput.value = mesero.id;
        els.meseroNombreInput.value = mesero.nombre;
        els.meseroDniInput.value = mesero.dni;
        els.meseroCelularInput.value = mesero.celular;
        els.meseroEstadoInput.value = mesero.estado;
        state.editingMeseroId = id;
        const submitBtn = els.meseroForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.textContent = "Actualizar Mesero";
        els.meseroNombreInput.focus();
      }
    }
  }

  async function handleProductoActions(e) {
    const id = e.target.dataset.id;
    const action = e.target.dataset.action;
    if (!id || !action) return;

    if (action === "delete-producto") {
      if (confirm("¿Deseas eliminar este producto?")) {
        const producto = state.productos.find(p => p.id === id);
        if (producto) {
          producto.activo = false;
          await stateManager.saveItem(config.STORAGE_KEYS.productos, producto, true);
        }
        ui.renderProductos();
      }
    } else if (action === "edit-producto") {
      const prod = state.productos.find(p => p.id === id);
      if (prod) {
        els.productoIdInput.value = prod.id;
        els.productoNombreInput.value = prod.nombre;
        els.productoPrecioInput.value = prod.precio;
        els.productoDisponibilidadInput.value = prod.disponibilidad ? "true" : "false";
        els.productoEstadoInput.value = prod.estado ? "true" : "false";
        els.productoDescripcionInput.value = prod.descripcion;
        state.editingProductoId = id;
        const submitBtn = els.productoForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.textContent = "Actualizar Producto";
        els.productoNombreInput.focus();
      }
    }
  }

  function bindEvents() {
    // Restricción para campos de DNI (máximo 8 dígitos y solo números)
    [els.meseroDniInput, els.billingCustomerId].forEach(input => {
      if (input) {
        input.addEventListener("input", (e) => {
          e.target.value = e.target.value.replace(/\D/g, "").slice(0, 8);
        });
      }
    });

    // Formularios
    if (els.mesaForm) els.mesaForm.addEventListener("submit", handleMesaSubmit);
    if (els.meseroForm) els.meseroForm.addEventListener("submit", handleMeseroSubmit);
    if (els.productoForm) els.productoForm.addEventListener("submit", handleProductoSubmit);
    if (els.ordenForm) els.ordenForm.addEventListener("submit", handleOrdenSubmit);
    
    // Cambios de tipo de orden y filas dinámicas
    if (els.ordenTipoInput) els.ordenTipoInput.addEventListener("change", (e) => ui.updateOrderTypeFields(e.target.value));
    if (els.addItemRowBtn) els.addItemRowBtn.addEventListener("click", () => ui.createItemRow());

    // Acciones en tablas (Delegación de eventos)
    if (els.mesaBody) els.mesaBody.addEventListener("click", handleMesaActions);
    if (els.meseroBody) els.meseroBody.addEventListener("click", handleMeseroActions);
    if (els.productoBody) els.productoBody.addEventListener("click", handleProductoActions);
    if (els.ordenBody) {
      els.ordenBody.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        const action = e.target.dataset.action;
        if (action === "open-items-modal") {
          state.currentOrderIdForItems = id;
          ui.openItemsModal(id);
        } else if (action === "advance-order") {
          const orden = state.ordenes.find(o => o.id === id);
          if (orden && orden.estado !== "PAGADO") {
            const nextStates = { "PENDIENTE": "EN COCINA", "EN COCINA": "LISTO", "LISTO": "PAGADO" };
            const nextState = nextStates[orden.estado];
            if (nextState) {
              if (nextState === "PAGADO") {
                ui.openBillingModal(id);
              } else {
                orden.estado = nextState;
                await stateManager.saveItem(config.STORAGE_KEYS.ordenes, orden, true);
                ui.renderAll();
              }
            }
          }
        }
      });
    }

    // Modales
    if (els.itemsModalClose) els.itemsModalClose.addEventListener("click", ui.closeItemsModal);
    if (els.itemsModalCancel) els.itemsModalCancel.addEventListener("click", ui.closeItemsModal);
    if (els.ordenItemForm) els.ordenItemForm.addEventListener("submit", handleOrdenItemSubmit);
    if (els.billingForm) els.billingForm.addEventListener("submit", handleBillingSubmit);
    if (els.billingReceivedAmount) els.billingReceivedAmount.addEventListener("input", updateBillingChange);
    if (els.billingModalClose) els.billingModalClose.addEventListener("click", ui.closeBillingModal);
    if (els.billingModalCancel) els.billingModalCancel.addEventListener("click", ui.closeBillingModal);

    // Historial
    if (els.btnVerHistorial) {
      els.btnVerHistorial.addEventListener("click", () => {
        ui.renderHistoryTable();
        els.historyModal.classList.remove("hidden");
      });
    }
    if (els.historyModalClose) els.historyModalClose.addEventListener("click", () => els.historyModal.classList.add("hidden"));
    const historyOverlay = document.getElementById("history-modal-overlay");
    if (historyOverlay) historyOverlay.addEventListener("click", () => els.historyModal.classList.add("hidden"));

    // Resets
    if (els.mesaResetButton) els.mesaResetButton.addEventListener("click", ui.resetMesaForm);
    if (els.meseroResetButton) els.meseroResetButton.addEventListener("click", ui.resetMeseroForm);
    if (els.productoResetButton) els.productoResetButton.addEventListener("click", ui.resetProductoForm);
    if (els.ordenResetButton) els.ordenResetButton.addEventListener("click", ui.resetOrdenForm);

    // Botones de Cancelar en formularios
    if (els.mesaCancelButton) els.mesaCancelButton.addEventListener("click", ui.resetMesaForm);
    if (els.meseroCancelButton) els.meseroCancelButton.addEventListener("click", ui.resetMeseroForm);
    if (els.productoCancelButton) els.productoCancelButton.addEventListener("click", ui.resetProductoForm);
    if (els.ordenCancelButton) els.ordenCancelButton.addEventListener("click", ui.resetOrdenForm);

    // Tabs logic
    document.querySelectorAll(".tab-button").forEach(btn => {
      btn.addEventListener("click", () => {
        const targetTab = btn.dataset.tab;
        const panel = document.querySelector(`.tab-panel[data-tab="${targetTab}"]`);
        
        if (!panel) {
          console.warn(`No se encontró el panel para la pestaña: ${targetTab}`);
          return;
        }

        document.querySelectorAll(".tab-button, .tab-panel").forEach(el => el.classList.remove("active"));
        btn.classList.add("active");
        panel.classList.add("active");
      });
    });
  }

  return { bindEvents };
});