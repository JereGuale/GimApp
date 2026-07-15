const DEV_IP = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? '127.0.0.1'
  : window.location.hostname;

const API_BASE = import.meta.env.VITE_API_BASE_URL || `http://${DEV_IP}:8000/api`;

function getToken() {
  return localStorage.getItem('admin_token');
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const headers = {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/login';
    throw new Error('No autorizado');
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      data?.message ||
      (data?.errors ? Object.values(data.errors).flat().join(' | ') : null) ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

export const API_BASE_URL = API_BASE;
