export const PASSWORD_REQUIREMENTS = [
  { id: 'length', label: 'At least 8 characters', test: (password) => password.length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter', test: (password) => /[A-Z]/.test(password) },
  { id: 'number', label: 'One number', test: (password) => /[0-9]/.test(password) },
  { id: 'special', label: 'One special character', test: (password) => /[^A-Za-z0-9]/.test(password) },
];

export function getPasswordValidationErrors(password = '') {
  return PASSWORD_REQUIREMENTS.filter((rule) => !rule.test(password)).map((rule) => rule.label);
}

export function getPasswordError(password = '') {
  const errors = getPasswordValidationErrors(password);
  if (!errors.length) return '';
  return `Password must include: ${errors.join(', ')}.`;
}
