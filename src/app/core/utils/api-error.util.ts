export function getApiErrorMessage(
  err: any,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (!err) return fallback;

  if (err.status === 0) {
    return 'Unable to reach the server. Please check your connection and try again.';
  }

  const payload = err.error;
  if (!payload) return err.message || fallback;

  if (typeof payload === 'string') return payload;
  if (typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message;
  }
  if (typeof payload.detail === 'string' && payload.detail.trim()) {
    if (Array.isArray(payload.errors) && payload.errors.length > 0) {
      return `${payload.detail} ${payload.errors[0]}`;
    }
    return payload.detail;
  }

  if (Array.isArray(payload.detail) && payload.detail.length > 0) {
    const first = payload.detail[0];
    if (typeof first === 'string') return first;
    if (first?.msg) {
      const path = Array.isArray(first.loc) ? first.loc.slice(1).join('.') : '';
      return path ? `${path}: ${first.msg}` : first.msg;
    }
  }

  return err.message || fallback;
}
