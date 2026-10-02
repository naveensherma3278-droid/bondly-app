const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const getToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('bondly_token') : null;
export const setToken = (t) => localStorage.setItem('bondly_token', t);
export const clearToken = () => localStorage.removeItem('bondly_token');

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}
