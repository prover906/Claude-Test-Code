// Tiny form-validation helpers. Each route builds an `errors` object keyed by
// field name and re-renders its form when it isn't empty.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(value, { max = 255 } = {}) {
  return String(value === undefined || value === null ? '' : value).trim().slice(0, max);
}

function checkbox(value) {
  return value === 'on' || value === '1' || value === 'true' || value === true;
}

function isEmail(value) {
  return value.length <= 254 && EMAIL.test(value);
}

// Returns an error message, or null when the password is acceptable.
function passwordProblem(password) {
  if (typeof password !== 'string' || password.length < 8) return 'Password must be at least 8 characters.';
  if (Buffer.byteLength(password) > 72) return 'Password must be at most 72 characters.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Password must contain at least one letter and one number.';
  return null;
}

function id(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

module.exports = { text, checkbox, isEmail, passwordProblem, id };
