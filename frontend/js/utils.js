(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.App = root.App || {};
    root.App.utils = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // Utilities extracted from app.js

  function normalizeText(value) {
    return String(value || '').trim();
  }

  function normalizeId(value) {
    return String(value || '').trim().toUpperCase();
  }

  function isId(value) {
    return /^[A-Za-z0-9_-]+$/.test(value);
  }

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

  function formatCents(cents) {
    const sign = cents < 0 ? "-" : "";
    const absolute = Math.abs(cents);
    const whole = Math.floor(absolute / 100);
    const fraction = String(absolute % 100).padStart(2, "0");
    return `${sign}${whole}.${fraction}`;
  }

  function parsePriceToCents(value) {
    if (!isValidPrice(value)) {
      throw new Error("Precio invalido.");
    }
    const [wholePart, fractionPart = ""] = String(value).split('.');
    const whole = parseInt(wholePart, 10);
    const fraction = parseInt(String(fractionPart).padEnd(2, "0"), 10);
    return whole * 100 + fraction;
  }

  function isValidNameLength(value) {
    const text = String(value || '').trim();
    return text.length >= 2 && text.length <= 50;
  }

  function formatOrderType(value) {
    return String(value || '').replace(/_/g, ' ');
  }

  function normalizeOrderType(value) {
    const text = String(value || '').trim().toUpperCase();
    const normalized = text.replace(/\s+/g, '_');
    // map common synonyms
    if (['MESA', 'TABLE'].includes(normalized)) return 'MESA';
    if (['PARA_LLEVAR', 'TAKEOUT', 'LLEVAR', 'TAKE_OUT'].includes(normalized)) return 'PARA_LLEVAR';
    return normalized;
  }

  return {
    normalizeText,
    normalizeId,
    isId,
    isStrictAlphaText,
    isDigits,
    isValidPrice,
    formatPrice,
    formatCents,
    parsePriceToCents,
    formatOrderType,
    normalizeOrderType,
    isValidNameLength,
  };
});