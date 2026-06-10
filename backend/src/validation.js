class ValidationError extends Error {
  constructor(errors) {
    super(Array.isArray(errors) ? errors.join('; ') : String(errors));
    this.name = 'ValidationError';
    this.errors = Array.isArray(errors) ? errors : [String(errors)];
  }
}

function isValidId(id) {
  return typeof id === 'string' && /^[A-Za-z0-9_-]+$/.test(id);
}

function isValidString(value, min = 2, max = 50) {
  return typeof value === 'string' && value.trim().length >= min && value.trim().length <= max;
}

function isStrictAlphaText(value) {
  // Al igual que en el frontend, bloqueamos números y símbolos sospechosos
  return typeof value === 'string' && /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value);
}

function isValidDescription(value) {
  return typeof value === 'string' && value.trim().length >= 2 && value.trim().length <= 500;
}

function isValidPriceCents(v) {
  return Number.isInteger(v) && v > 0;
}

function isValidQuantity(q) {
  return Number.isInteger(q) && q >= 1 && q <= 99;
}

module.exports = {
  ValidationError,
  isValidId,
  isValidString,
  isStrictAlphaText,
  isValidDescription,
  isValidPriceCents,
  isValidQuantity,
};
