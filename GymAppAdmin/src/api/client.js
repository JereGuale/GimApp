const DEV_IP = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? '127.0.0.1'
  : window.location.hostname;

const API_BASE = import.meta.env.VITE_API_BASE_URL || `http://${DEV_IP}:8000/api`;

function getToken() {
  return localStorage.getItem('admin_token');
}

// ── In-Memory Fast Cache & In-Flight Request Deduplication ──
const memoryCache = new Map(); // key -> { data, expiresAt }
const pendingRequests = new Map(); // key -> Promise

const DEFAULT_CACHE_TTL = 30000; // 30 seconds

/**
 * Clear the API in-memory cache (completely or for specific path prefix)
 */
export function clearApiCache(pathPrefix = null) {
  if (!pathPrefix) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.startsWith(pathPrefix)) {
      memoryCache.delete(key);
    }
  }
}

export async function apiFetch(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';
  const skipCache = options.skipCache === true;
  const ttl = options.cacheTtl !== undefined ? options.cacheTtl : DEFAULT_CACHE_TTL;

  // Cache lookup for GET requests
  if (isGet && !skipCache && ttl > 0) {
    const cached = memoryCache.get(path);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    // Return in-flight promise if the same path is already fetching
    if (pendingRequests.has(path)) {
      return pendingRequests.get(path);
    }
  }

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

  const fetchPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

      if (res.status === 401) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        memoryCache.clear();
        if (path !== '/login') {
          window.location.href = '/login';
        }
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

      // If GET was successful, save to cache
      if (isGet && ttl > 0) {
        memoryCache.set(path, {
          data,
          expiresAt: Date.now() + ttl,
        });
      }

      // If mutation (POST, PUT, DELETE, PATCH), invalidate related caches
      if (!isGet) {
        if (path.includes('subscription')) {
          clearApiCache('/trainer/subscriptions');
          clearApiCache('/admin/reports');
        }
        else if (path.includes('order')) clearApiCache('/admin/orders');
        else if (path.includes('product')) clearApiCache('/admin/products');
        else if (path.includes('categor')) clearApiCache('/admin/categories');
        else if (path.includes('user')) clearApiCache('/admin/users');
        else if (path.includes('banner')) clearApiCache('/admin/banners');
        else if (path.includes('bank')) clearApiCache('/admin/banks');
        // Always bust metrics cache on any mutation
        clearApiCache('/admin/metrics');
      }

      return data;
    } finally {
      if (isGet) {
        pendingRequests.delete(path);
      }
    }
  })();

  if (isGet && !skipCache) {
    pendingRequests.set(path, fetchPromise);
  }

  return fetchPromise;
}

export const API_BASE_URL = API_BASE;
