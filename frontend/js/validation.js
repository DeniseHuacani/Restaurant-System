(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory(require('./utils.js'));
  } else {
    root.App = root.App || {};
    root.App.validation = factory(root.App && root.App.utils ? root.App.utils : {});
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (utils) {
  class ValidationError extends Error {
    constructor(errors) { super(errors.join('\n')); this.name = 'ValidationError'; this.errors = errors; }
  }

  function validateMesa(state, input) {
    const errors = [];
    if (!input.id) errors.push('El ID es obligatorio.');
    else if (!utils.isId(input.id)) errors.push('El ID solo permite letras, numeros, guion y guion bajo.');
    else if ((state.mesas || []).some(m => m.id === input.id && m.id !== state.editingMesaId)) errors.push('El ID de la mesa ya existe.');

    if (input.numero === undefined || input.numero === null || input.numero === '') errors.push('El numero es obligatorio.');
    else if (!Number.isInteger(input.numero) || input.numero < 1) errors.push('El numero debe ser un entero mayor o igual a 1.');
    else if ((state.mesas || []).some(mesa => mesa.numero === input.numero && mesa.id !== state.editingMesaId)) errors.push('El numero de mesa ya esta registrado.');

    if (input.capacidad === undefined || input.capacidad === null || input.capacidad === '') errors.push('La capacidad es obligatoria.');
    else if (!Number.isInteger(input.capacidad)) errors.push('La capacidad debe ser un numero entero.');
    else if (input.capacidad < 1 || input.capacidad > 16) errors.push('La capacidad debe estar entre 1 y 16.');

    if (!['LIBRE', 'OCUPADA', 'DESHABILITADA'].includes(input.estado)) errors.push('El estado debe ser LIBRE, OCUPADA o DESHABILITADA.');

    const activeOrders = (state.ordenes || []).filter(o => o.mesaId === input.id && o.estado !== 'PAGADO');
    const existingMesa = (state.mesas || []).find(mesa => mesa.id === state.editingMesaId);
    if (input.estado === 'OCUPADA' && activeOrders.length > 0 && (!existingMesa || existingMesa.estado !== 'OCUPADA')) errors.push('La mesa ya tiene una orden activa y no puede marcarse OCUPADA.');
    if (input.estado === 'DESHABILITADA' && activeOrders.length > 0 && (!existingMesa || existingMesa.estado !== 'DESHABILITADA')) errors.push('La mesa tiene una orden activa y no puede deshabilitarse.');

    if (errors.length) throw new ValidationError(errors);
  }

  function validateMesero(state, input) {
    const errors = [];
    if (!input.id) errors.push('El ID es obligatorio.');
    else if (!utils.isId(input.id)) errors.push('El ID solo permite letras, numeros, guion y guion bajo.');
    else if ((state.meseros || []).some(mesero => mesero.id === input.id && mesero.id !== state.editingMeseroId)) errors.push('El ID del mesero ya existe.');

    if (!input.nombre) errors.push('El nombre es obligatorio.');
    else if (!utils.isValidNameLength ? !(input.nombre.length >= 2 && input.nombre.length <= 50) : !utils.isValidNameLength(input.nombre)) errors.push('El campo de texto debe contener entre 2 y 50 caracteres.');
    else if (!utils.isStrictAlphaText(input.nombre)) errors.push('Error de Seguridad: El nombre del mesero NO puede contener números ni símbolos.');

    if (!input.dni) errors.push('El DNI es obligatorio.');
    else if (!utils.isDigits(input.dni) || input.dni.length !== 8) errors.push('El DNI debe tener exactamente 8 dígitos numéricos.');
    else if ((state.meseros || []).some(mesero => mesero.dni === input.dni && mesero.id !== state.editingMeseroId)) errors.push('El DNI ya esta registrado.');

    if (!input.celular) errors.push('El numero de celular es obligatorio.');
    else if (!utils.isDigits(input.celular) || input.celular.length !== 9) errors.push('El número de celular debe tener exactamente 9 dígitos numéricos.');

    if (!['ACTIVO', 'INACTIVO'].includes(input.estado)) errors.push('El estado debe ser ACTIVO o INACTIVO.');

    if (errors.length) throw new ValidationError(errors);
  }

  function validateProducto(state, input) {
    const errors = [];
    if (!input.id) errors.push('El ID es obligatorio.');
    else if (!utils.isId(input.id)) errors.push('El ID solo permite letras, numeros, guion y guion bajo.');
    else if ((state.productos || []).some(producto => producto.id === input.id && producto.id !== state.editingProductoId)) errors.push('El ID del producto ya existe.');

    if (!input.nombre) errors.push('El nombre es obligatorio.');
    else if (!utils.isValidNameLength ? !(input.nombre.length >= 2 && input.nombre.length <= 50) : !utils.isValidNameLength(input.nombre)) errors.push('El campo de texto debe contener entre 2 y 50 caracteres.');
    else if (!utils.isStrictAlphaText(input.nombre)) errors.push('Error de Seguridad: El nombre del producto NO puede contener números ni símbolos.');

    if (!input.precio) errors.push('El precio es obligatorio.');
    else if (!utils.isValidPrice(input.precio)) errors.push('El precio debe tener hasta 2 decimales.');
    else if (Number(input.precio) <= 0 || Number(input.precio) > 999999) errors.push('El precio debe ser mayor a 0 y menor que 999999.');

    if (!input.descripcion) errors.push('La descripción es obligatoria.');
    else if (input.descripcion.length < 2 || input.descripcion.length > 500) errors.push('La descripción debe contener entre 2 y 500 caracteres.');
    else if (!utils.isStrictAlphaText(input.descripcion)) errors.push('Error de Seguridad: La descripción NO permite números ni símbolos...');

    if (typeof input.disponibilidad !== 'boolean') errors.push('La disponibilidad es invalida.');
    if (typeof input.estado !== 'boolean') errors.push('El estado es invalido.');

    if (errors.length) throw new ValidationError(errors);
  }

  function validateOrden(state, input) {
    const errors = [];
    if (!input.id) errors.push('El ID de la orden es obligatorio.');
    else if (!utils.isId(input.id)) errors.push('El ID de la orden solo permite letras, numeros, guion y guion bajo.');
    else if ((state.ordenes || []).some(orden => orden.id === input.id)) errors.push('El ID de la orden ya existe.');

    if (!['MESA', 'PARA_LLEVAR'].includes(input.tipo)) errors.push('El tipo debe ser MESA o PARA LLEVAR.');

    if (input.tipo === 'MESA') {
      if (!input.mesaId) errors.push('Debe seleccionar una mesa.');
      else {
        const mesa = (state.mesas || []).find(item => item.id === input.mesaId);
        if (!mesa || mesa.activo === false) errors.push('La mesa seleccionada no existe o no está activa.');
        else if (mesa.estado !== 'LIBRE' || !mesa.habilitada) errors.push('La mesa debe estar LIBRE y habilitada.');
        else if ((state.ordenes || []).some(o => o.mesaId === mesa.id && o.estado !== 'PAGADO')) errors.push('La mesa ya tiene una orden activa.');
      }

      if (!input.meseroId) errors.push('Debe seleccionar un mesero.');
      else {
        const mesero = (state.meseros || []).find(item => item.id === input.meseroId);
        if (!mesero || mesero.activo === false) errors.push('El mesero seleccionado no existe o no está activo.');
        else if (mesero.estado !== 'ACTIVO') errors.push('El mesero debe estar ACTIVO.');
      }

      if (input.cliente) errors.push('El nombre solo aplica para ordenes PARA LLEVAR.');
    }

    if (input.tipo === 'PARA_LLEVAR') {
      if (!input.cliente) errors.push('El nombre para llevar es obligatorio.');
      else if (!utils.isValidNameLength ? !(input.cliente.length >= 2 && input.cliente.length <= 50) : !utils.isValidNameLength(input.cliente)) errors.push('El campo de texto debe contener entre 2 y 50 caracteres.');
      else if (!utils.isStrictAlphaText(input.cliente)) errors.push('Error de Seguridad: El nombre del cliente NO puede contener números.');

      if (input.mesaId) errors.push('No se permite mesa en ordenes PARA LLEVAR.');
      if (input.meseroId) errors.push('No se permite mesero en ordenes PARA LLEVAR.');
    }

    if (errors.length) throw new ValidationError(errors);
  }

  function validateOrdenItem(state, input) {
    const errors = [];
    if (!input.ordenId) errors.push('Debe seleccionar una orden.');
    if (!input.productoId) errors.push('Debe seleccionar un producto.');
    if (!Number.isInteger(input.cantidad)) errors.push('La cantidad debe ser un numero entero.');
    else if (input.cantidad < 1 || input.cantidad > 99) errors.push('La cantidad debe estar entre 1 y 99.');

    const orden = (state.ordenes || []).find(item => item.id === input.ordenId);
    if (!orden) errors.push('La orden seleccionada no existe.');
    else if (!(['PENDIENTE','EN COCINA'].includes(String(orden.estado).toUpperCase()))) errors.push('La orden no permite modificar items en este estado.');

    const producto = (state.productos || []).find(item => item.id === input.productoId);
    if (!producto) errors.push('El producto seleccionado no existe.');
    else {
      if (!producto.estado) errors.push('El producto debe estar ACTIVO.');
      if (!producto.disponibilidad) errors.push('El producto debe estar DISPONIBLE.');
      if (!producto.precio || !utils.isValidPrice(producto.precio)) errors.push('El producto tiene un precio invalido.');
      else {
        try {
          const priceCents = utils.parsePriceToCents(producto.precio);
          if (priceCents < 1 || priceCents > 99999900) errors.push('El precio del item debe estar entre 0.01 y 999999.00.');
        } catch (error) { errors.push('El producto tiene un precio invalido.'); }
      }
    }

    if (orden && producto) {
      const currentItem = (orden.items || []).find(item => item.productId === producto.id);
      if (currentItem && currentItem.cantidad + input.cantidad > 99) errors.push('La cantidad total por item no puede superar 99.');
    }

    if (errors.length) throw new ValidationError(errors);
  }

  return {
    ValidationError,
    validateMesa,
    validateMesero,
    validateProducto,
    validateOrden,
    validateOrdenItem,
  };
});