(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.App = root.App || {};
    root.App.config = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  return {
    STORAGE_KEYS: {
      mesas: "mesas",
      meseros: "meseros",
      ordenes: "ordenes",
      productos: "productos",
    },
    ORDER_TYPES: {
      MESA: "MESA",
      PARA_LLEVAR: "PARA_LLEVAR",
    },
    ORDER_STATES: ["PENDIENTE", "EN COCINA", "LISTO", "PAGADO"],
    PACKAGING_FEE_CENTS: 40
  };
});