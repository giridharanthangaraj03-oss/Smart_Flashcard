function formatErrorValue(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value
      .map((item) => formatErrorValue(item))
      .filter(Boolean)
      .join(', ');
  }
  if (typeof value === 'object') {
    return value.msg || value.message || value.detail || '';
  }
  return String(value);
}

export function getErrorMessage(error, fallback = 'Something went wrong') {
  const data = error?.response?.data;
  const candidates = [data?.message, data?.detail, data?.error, error?.message];

  for (const candidate of candidates) {
    const message = formatErrorValue(candidate);
    if (message) return message;
  }

  return fallback;
}
