const PASSWORD_MIN_LENGTH = 8;
const HAS_UPPERCASE = /[A-Z]/;
const HAS_NUMBER = /[0-9]/;
const HAS_SPECIAL = /[^A-Za-z0-9]/;

function validatePasswordStrength(password = '') {
  const errors = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push('Password must be at least 8 characters');
  }
  if (!HAS_UPPERCASE.test(password)) {
    errors.push('Password must include one uppercase letter');
  }
  if (!HAS_NUMBER.test(password)) {
    errors.push('Password must include one number');
  }
  if (!HAS_SPECIAL.test(password)) {
    errors.push('Password must include one special character');
  }

  return errors;
}

module.exports = { validatePasswordStrength };
