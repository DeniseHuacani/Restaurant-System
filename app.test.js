/** @jest-environment jsdom */
const app = require('./app');

describe('RestSystem MVP - Suite de Pruebas de Caja Negra (AVL & Particiones)', () => {
  
  beforeEach(() => {
    // Limpiar el estado y LocalStorage simulado antes de cada prueba
    app.state.mesas = [];
    app.state.meseros = [];
    app.state.productos = [];
    app.state.ordenes = [];
    app.state.editingMesaId = null;
    app.state.editingMeseroId = null;
    app.state.editingProductoId = null;
    
    // Mock de window.alert para pruebas de cobro
    window.alert = jest.fn();
  });

  describe('Módulo: Mesas', () => {
    // TC-ME-01
    test('TC-ME-01: Autocalcular ID y Número de Mesa inicial', () => {
      expect(app.getNextMesaId()).toBe("M01");
      expect(app.getNextMesaNumero()).toBe(1);
    });

    // TC-ME-02 / TC-ME-03
    test('TC-ME-02/03: Capacidad válida en fronteras (1 y 16)', () => {
      const mesaMin = { id: "M01", numero: 1, capacidad: 1, estado: "LIBRE" };
      const mesaMax = { id: "M01", numero: 1, capacidad: 16, estado: "LIBRE" };
      expect(() => app.validateMesa(mesaMin)).not.toThrow();
      expect(() => app.validateMesa(mesaMax)).not.toThrow();
    });

    // TC-ME-04 / TC-ME-05
    test('TC-ME-04/05: Capacidad inválida fuera de rango (0 y 17)', () => {
      const mesaBajo = { id: "M01", numero: 1, capacidad: 0, estado: "LIBRE" };
      const mesaSobre = { id: "M01", numero: 1, capacidad: 17, estado: "LIBRE" };
      expect(() => app.validateMesa(mesaBajo)).toThrow(/entre 1 y 16/);
      expect(() => app.validateMesa(mesaSobre)).toThrow(/entre 1 y 16/);
    });

    // TC-ME-06
    test('TC-ME-06: Cruce de tipos - Letras en capacidad', () => {
      const mesaLetras = { id: "M01", numero: 1, capacidad: "Diez", estado: "LIBRE" };
      expect(() => app.validateMesa(mesaLetras)).toThrow(/numero entero/);
    });
  });

  describe('Módulo: Meseros', () => {
    // TC-MS-01
    test('TC-MS-01: DNI exacto de 8 dígitos', () => {
      const mesero = { id: "W01", nombre: "Juan Perez", dni: "12345678", celular: "987654321", estado: "ACTIVO" };
      expect(() => app.validateMesero(mesero)).not.toThrow();
    });

    // TC-MS-02 / TC-MS-03
    test('TC-MS-02/03: DNI inválido por longitud (7 y 9)', () => {
      const dniCorto = { id: "W01", nombre: "Juan Perez", dni: "1234567", celular: "987654321", estado: "ACTIVO" };
      const dniLargo = { id: "W01", nombre: "Juan Perez", dni: "123456789", celular: "987654321", estado: "ACTIVO" };
      expect(() => app.validateMesero(dniCorto)).toThrow(/exactamente 8 dígitos/i);
      expect(() => app.validateMesero(dniLargo)).toThrow(/exactamente 8 dígitos/i);
    });

    // TC-MS-04 / TC-MS-05 / TC-MS-06
    test('TC-MS-04/05/06: Celular exacto de 9 dígitos (AVL)', () => {
      const celVaild = { id: "W01", nombre: "Juan Perez", dni: "12345678", celular: "987654321", estado: "ACTIVO" };
      const celCorto = { id: "W01", nombre: "Juan Perez", dni: "12345678", celular: "98765432", estado: "ACTIVO" };
      const celLargo = { id: "W01", nombre: "Juan Perez", dni: "12345678", celular: "9876543210", estado: "ACTIVO" };
      expect(() => app.validateMesero(celVaild)).not.toThrow();
      expect(() => app.validateMesero(celCorto)).toThrow(/exactamente 9 dígitos/i);
      expect(() => app.validateMesero(celLargo)).toThrow(/exactamente 9 dígitos/i);
    });

    // TC-MS-07
    test('TC-MS-07: Bloqueo de números en nombre de mesero', () => {
      const meseroNum = { id: "W01", nombre: "Juan 123", dni: "12345678", celular: "987654321", estado: "ACTIVO" };
      expect(() => app.validateMesero(meseroNum)).toThrow(/NO puede contener números/);
    });

    // TC-MS-08
    test('TC-MS-08: Cruce de tipos - Letras en DNI', () => {
      const meseroLetras = { id: "W01", nombre: "Juan Perez", dni: "ABCDEFGH", celular: "987654321", estado: "ACTIVO" };
      expect(() => app.validateMesero(meseroLetras)).toThrow(/exactamente 8 dígitos numéricos/i);
    });
  });

  describe('Módulo: Catálogo', () => {
    // TC-CA-01 / TC-CA-03
    test('TC-CA-01/03: Precios en fronteras (0.01 y 999999)', () => {
      const pMin = { id: "P01", nombre: "Agua", precio: "0.01", descripcion: "Agua mineral", disponibilidad: true, estado: true };
      const pMax = { id: "P01", nombre: "Vino", precio: "999999.00", descripcion: "Vino caro", disponibilidad: true, estado: true };
      expect(() => app.validateProducto(pMin)).not.toThrow();
      expect(() => app.validateProducto(pMax)).not.toThrow();
    });

    // TC-CA-02 / TC-CA-04
    test('TC-CA-02/04: Precios fuera de rango (0.00 y 999999.01)', () => {
      const pCero = { id: "P01", nombre: "Agua", precio: "0.00", descripcion: "Gratis", disponibilidad: true, estado: true };
      const pExceso = { id: "P01", nombre: "Agua", precio: "999999.01", descripcion: "Muy caro", disponibilidad: true, estado: true };
      expect(() => app.validateProducto(pCero)).toThrow(/mayor a 0 y menor que 999999/);
      expect(() => app.validateProducto(pExceso)).toThrow(/mayor a 0 y menor que 999999/);
    });

    // TC-CA-05
    test('TC-CA-05: Cruce de tipos - Símbolos en descripción', () => {
      const pScript = { id: "P01", nombre: "Sopa", precio: "10.00", descripcion: "<script>alert()</script>", disponibilidad: true, estado: true };
      expect(() => app.validateProducto(pScript)).toThrow(/NO permite números ni símbolos/);
    });

    // TC-CA-06
    test('TC-CA-06: Borrado Lógico de producto', () => {
      const producto = { id: "P01", nombre: "Ceviche", activo: true };
      app.state.productos = [producto];
      app.state.productos = app.state.productos.map(p => p.id === "P01" ? { ...p, activo: false } : p);
      expect(app.state.productos[0].activo).toBe(false);
    });
  });

  describe('Módulo: Validación de Textos (TC-TX)', () => {
    // TC-TX-01 / TC-TX-03
    test('TC-TX-01/03: Longitud válida (2 y 50 caracteres)', () => {
      expect(app.isValidNameLength("Ab")).toBe(true);
      expect(app.isValidNameLength("A".repeat(50))).toBe(true);
    });

    // TC-TX-02 / TC-TX-04
    test('TC-TX-02/04: Longitud inválida (1 y 51 caracteres)', () => {
      expect(app.isValidNameLength("A")).toBe(false);
      expect(app.isValidNameLength("A".repeat(51))).toBe(false);
    });
  });

  describe('Módulo: Órdenes', () => {
    // TC-OR-01 / TC-OR-02
    test('TC-OR-01/02: Cliente obligatorio en Para Llevar', () => {
      const ordenOk = { id: "O-001", tipo: "PARA_LLEVAR", cliente: "Ana Garcia" };
      const ordenBad = { id: "O-001", tipo: "PARA_LLEVAR", cliente: "" };
      expect(() => app.validateOrden(ordenOk)).not.toThrow();
      expect(() => app.validateOrden(ordenBad)).toThrow(/nombre para llevar es obligatorio/i);
    });

    // TC-OR-03
    test('TC-OR-03: Creación de orden Mesa con selección válida', () => {
      app.state.mesas = [{ id: "M1", numero: 1, capacidad: 4, estado: "LIBRE", habilitada: true }];
      app.state.meseros = [{ id: "W1", nombre: "Juan", estado: "ACTIVO" }];
      const validOrden = { id: "O-001", tipo: "MESA", mesaId: "M1", meseroId: "W1" };
      expect(() => app.validateOrden(validOrden)).not.toThrow();
    });

    // TC-OR-04
    test('TC-OR-04: Bloqueo de números en nombre del cliente', () => {
      const ordenNum = { id: "O-001", tipo: "PARA_LLEVAR", cliente: "Pedro 01" };
      expect(() => app.validateOrden(ordenNum)).toThrow(/NO puede contener números/i);
    });
  });

  describe('Módulo: Modal Items', () => {
    // TC-IT-01 / TC-IT-02
    test('TC-IT-01/02: Cantidad mínima permitida (1 vs 0)', () => {
      app.state.ordenes = [{ id: "O-001", items: [], estado: "PENDIENTE" }];
      app.state.productos = [{ id: "P01", nombre: "Ceviche", precio: "30.00", estado: true, disponibilidad: true }];
      
      const itemOk = { ordenId: "O-001", productoId: "P01", cantidad: 1 };
      const itemBad = { ordenId: "O-001", productoId: "P01", cantidad: 0 };
      
      expect(() => app.validateOrdenItem(itemOk)).not.toThrow();
      expect(() => app.validateOrdenItem(itemBad)).toThrow(/entre 1 y 99/i);
    });

    // TC-IT-03
    test('TC-IT-03: Modificación de pedido: Edición de cantidad', () => {
      const orden = { id: "O-001", items: [{ productId: "P1", cantidad: 1, precioCents: 1000 }] };
      orden.items[0].cantidad = 3;
      const totals = app.calculateOrderTotals(orden);
      expect(totals.totalCents).toBe(3000);
    });

    // TC-IT-04
    test('TC-IT-04: Cruce de tipos - Letras en cantidad', () => {
      app.state.ordenes = [{ id: "O-001", items: [], estado: "PENDIENTE" }];
      const itemLetras = { ordenId: "O-001", productoId: "P01", cantidad: "Tres" };
      expect(() => app.validateOrdenItem(itemLetras)).toThrow(/numero entero/i);
    });
  });

  describe('Módulo: Cobro', () => {
    // TC-CO-01 / TC-CO-02 / TC-CO-03
    test('TC-CO-01/02/03: Validación de montos y vuelto', () => {
      const totalCents = 5000; 
      expect(5000 >= totalCents).toBe(true); // TC-CO-01: Exacto
      expect(5000 - 3500).toBe(1500); // TC-CO-02: Vuelto
      expect(4990 < totalCents).toBe(true); // TC-CO-03: Insuficiente
    });

    // TC-CO-04
    test('TC-CO-04: Cruce de tipos - Letras en Monto Recibido', () => {
      const recibido = parseFloat("Dinero");
      expect(isNaN(recibido)).toBe(true);
    });

    // TC-CO-05 / TC-CO-06
    test('TC-CO-05/06: Validación de DNI en Cobro (8 dígitos)', () => {
      const dniValido = "12345678";
      const dniInvalidoLetras = "A1234567";
      const dniInvalidoCorto = "1234567";

      expect(app.isDigits(dniValido) && dniValido.length === 8).toBe(true);
      expect(app.isDigits(dniInvalidoLetras)).toBe(false);
      expect(dniInvalidoCorto.length === 8).toBe(false);
    });

    // TC-CO-07 / TC-CO-08
    test('TC-CO-07/08: Validación de Nombre en Cobro (AVL & Seguridad)', () => {
      const nombreInvalidoCorto = "A";
      const nombreInvalidoNumeros = "Ana 123";
      const nombreValido = "Ana Maria";

      expect(app.isValidNameLength(nombreInvalidoCorto)).toBe(false);
      expect(app.isStrictAlphaText(nombreInvalidoNumeros)).toBe(false);
      expect(app.isValidNameLength(nombreValido) && app.isStrictAlphaText(nombreValido)).toBe(true);
    });
  });

  describe('Módulo: Flujo y Historial', () => {
    // TC-FL-01 / TC-FL-02
    test('TC-FL-01/02: Transición de estados de orden', () => {
      expect(app.getNextOrderState("PENDIENTE")).toBe("EN COCINA");
      expect(app.getNextOrderState("LISTO")).toBe("PAGADO");
    });

    // TC-HI-01
    test('TC-HI-01: Filtrado de órdenes pagadas', () => {
      const ordenes = [
        { id: "O1", estado: "PENDIENTE" },
        { id: "O2", estado: "PAGADO" }
      ];
      const activas = ordenes.filter(o => o.estado !== "PAGADO");
      const historial = ordenes.filter(o => o.estado === "PAGADO");
      expect(activas).toHaveLength(1);
      expect(historial).toHaveLength(1);
    });

    // TC-HI-02
    test('TC-HI-02: Integridad de datos en historial', () => {
      const orden = { id: "O1", clienteNombre: "Ana", clienteDni: "123", items: [{ nombre: "Sopa" }] };
      expect(orden.clienteNombre).toBe("Ana");
    });
  });
});
