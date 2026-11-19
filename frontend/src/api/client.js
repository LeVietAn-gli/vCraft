export class ApiError extends Error {
  constructor(status, error = {}) {
    super(error.message || (status === 0 ? 'Không kết nối được máy chủ' : 'Có lỗi xảy ra; vui lòng thử lại'));
    this.name = 'ApiError';
    this.status = status;
    this.code = error.code || (status === 0 ? 'NETWORK_ERROR' : 'UNKNOWN_ERROR');
    this.details = error.details || [];
  }
}
export function withQuery(path, query = {}) {
  const url = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.set(key, String(value));
  });
  return path + (url.size ? `?${url}` : '');
}
export async function apiFetch(path, { method = 'GET', body, signal, silent401 = false } = {}) {
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method, credentials: 'same-origin', signal,
      headers: body !== undefined && !isForm ? { 'Content-Type': 'application/json' } : undefined,
      body: isForm ? body : body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw new ApiError(0);
  }
  if (response.status === 204) return null;
  const json = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && !silent401) window.dispatchEvent(new Event('vcraft:unauthorized'));
    throw new ApiError(response.status, json?.error);
  }
  return json;
}
