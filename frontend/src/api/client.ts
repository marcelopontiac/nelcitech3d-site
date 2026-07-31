const BASE = '';

function getToken() {
  return localStorage.getItem('token') || '';
}

export function setToken(t: string) {
  localStorage.setItem('token', t);
}

export function clearToken() {
  localStorage.removeItem('token');
}

async function request(method: string, path: string, body?: unknown) {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts: RequestInit = { method, headers };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${path}`, opts);
  if (path === '/api/me') return res.json();
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  login: (email: string, password: string) =>
    request('POST', '/api/login', { email, password }),
  register: (email: string, password: string, name: string, code: string) =>
    request('POST', '/api/register', { email, password, name, code }),
  me: () => request('GET', '/api/me'),
  logout: () => request('POST', '/api/logout'),
  getData: () => request('GET', '/api/data'),
  saveItem: (collection: string, item: Record<string, unknown>) =>
    request('POST', `/api/data/${collection}`, item),
  deleteItem: (collection: string, id: string) =>
    request('DELETE', `/api/data/${collection}/${id}`),
  importData: (data: Record<string, unknown>) =>
    request('POST', '/api/import', data),
  importJson: (data: Record<string, unknown>) =>
    request('POST', '/api/import-json', data),
  getStock: (ticker: string) => request('GET', `/api/stocks/${ticker}`),
  getStockHistory: (ticker: string, period: string = '3mo', category: string = '') =>
    request('GET', `/api/stocks/${encodeURIComponent(ticker)}/history?period=${period}&category=${encodeURIComponent(category)}`),
  getCDI: () => request('GET', '/api/cdi'),
  admin: {
    users: () => request('GET', '/api/admin/users'),
    updateUser: (id: string, data: Record<string, unknown>) =>
      request('POST', `/api/admin/user/${id}`, data),
    deleteUser: (id: string) =>
      request('DELETE', `/api/admin/user/${id}`),
  },
  refreshPrices: () => request('POST', '/api/investments/refresh-prices'),
  getSystemStats: () => request('GET', '/api/system/stats'),
};
