export async function apiFetch(path, { method = 'GET', body, signal } = {}) {
  const multipart = body instanceof FormData
  let response
  try {
    response = await fetch('/api' + path, {
      method,
      signal,
      credentials: 'same-origin',
      headers: multipart || !body ? undefined : { 'Content-Type': 'application/json' },
      body: multipart ? body : body && JSON.stringify(body),
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error('Không kết nối được máy chủ. Hãy thử lại.', { cause: error })
  }
  if (response.status === 204) return null
  const result = await response.json().catch(() => null)
  if (!response.ok || !result) {
    const error = new Error(result?.error?.message ?? 'Không đọc được phản hồi máy chủ.')
    if (response.status === 401 && !path.startsWith('/auth/') && path !== '/demo/session')
      window.dispatchEvent(new Event('vcraft-session-expired'))
    error.code = result?.error?.code
    error.status = response.status
    error.details = result?.error?.details
    throw error
  }
  return result
}
