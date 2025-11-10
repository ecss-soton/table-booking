const BASE_PATH = '/booking';

/**
 * Helper to make API calls with automatic basePath prepending
 * Usage: await api('/api/v1/join', { method: 'POST', body: JSON.stringify({}) })
 */
export async function api(
  path: string,
  options?: RequestInit
): Promise<Response> {
  const url = path.startsWith('/') ? `${BASE_PATH}${path}` : path;
  return fetch(url, options);
}

/**
 * Helper to make API calls and parse JSON response
 */
export async function apiJson<T = any>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await api(path, options);
  return response.json();
}
