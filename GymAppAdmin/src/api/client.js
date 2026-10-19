const DEV_IP = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? '127.0.0.1'
  : window.location.hostname;

const API_BASE = import.meta.env.VITE_API_BASE_URL || `http://${DEV_IP}:8000/api`;

function getToken() {
  return localStorage.getItem('admin_token');
}

// ── Cache config ──────────────────────────────────────────────────────────────
// In-memory layer (fastest): data lives here while the tab is open
const memoryCache   = new Map(); // key -> { data, expiresAt, staleAt }
// Persistence layer: survives page refreshes
const LS_PREFIX     = 'apicache_';
const LS_MAX_KEYS   = 30;
// In-flight deduplication
const pendingRequests = new Map(); // key -> Promise

// TTLs
const FRESH_TTL = 10 * 1000;      // 10 sec → fresh serving with quick revalidation
const STALE_TTL = 10 * 60 * 1000; // 10 min → serve stale + revalidate in bg

// ── LocalStorage helpers ──────────────────────────────────────────────────────
function lsRead(key) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() > parsed.staleAt) { localStorage.removeItem(LS_PREFIX + key); return null; }
    return parsed;
  } catch { return null; }
}

function lsWrite(key, entry) {
  try {
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith(LS_PREFIX));
    if (allKeys.length >= LS_MAX_KEYS) {
      let oldest = null, oldestTime = Infinity;
      for (const k of allKeys) {
        try { const p = JSON.parse(localStorage.getItem(k)); if (p.storedAt < oldestTime) { oldestTime = p.storedAt; oldest = k; } } catch { /* skip */ }
      }
      if (oldest) localStorage.removeItem(oldest);
    }
    localStorage.setItem(LS_PREFIX + key, JSON.stringify({ ...entry, storedAt: Date.now() }));
  } catch { /* localStorage full */ }
}

function lsDeletePrefix(prefix) {
  Object.keys(localStorage).filter(k => k.startsWith(LS_PREFIX + prefix)).forEach(k => localStorage.removeItem(k));
}

// ── Public cache utilities ────────────────────────────────────────────────────
export function clearApiCache(pathPrefix = null) {
  if (!pathPrefix) {
    memoryCache.clear();
    Object.keys(localStorage).filter(k => k.startsWith(LS_PREFIX)).forEach(k => localStorage.removeItem(k));
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.startsWith(pathPrefix)) memoryCache.delete(key);
  }
  lsDeletePrefix(pathPrefix);
}

/**
 * Prefetch a list of endpoints in the background so they are warm in cache
 * before the user navigates to them. Fire-and-forget — never throws.
 */
export function prefetchEndpoints(paths = []) {
  for (const path of paths) {
    apiFetch(path).catch(() => {});
  }
}

// ── Core fetch ────────────────────────────────────────────────────────────────
export async function apiFetch(path, options = {}) {
  const method    = (options.method || 'GET').toUpperCase();
  const isGet     = method === 'GET';
  const skipCache = options.skipCache === true;

  if (isGet && !skipCache) {
    const now = Date.now();

    // 1. Check in-memory cache (fastest, no I/O)
    const mem = memoryCache.get(path);
    if (mem) {
      if (now < mem.expiresAt) return mem.data;                     // FRESH → instant
      if (now < mem.staleAt)  { _revalidate(path, options); return mem.data; } // STALE → instant + bg refresh
    }

    // 2. Fallback to localStorage (survives page refresh)
    const ls = lsRead(path);
    if (ls) {
      memoryCache.set(path, ls); // hydrate memory
      if (now < ls.expiresAt) return ls.data;
      _revalidate(path, options);
      return ls.data;
    }

    // 3. Deduplicate in-flight requests
    if (pendingRequests.has(path)) return pendingRequests.get(path);
  }

  return _doFetch(path, options);
}

// ── Internal: actual network request ─────────────────────────────────────────
async function _doFetch(path, options = {}) {
  const method     = (options.method || 'GET').toUpperCase();
  const isGet      = method === 'GET';
  const skipCache  = options.skipCache === true;
  const token      = getToken();
  const isFormData = options.body instanceof FormData;

  const headers = {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const fetchPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

      if (res.status === 401) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        clearApiCache();
        if (path !== '/login') window.location.href = '/login';
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

      // Cache successful GET responses
      if (isGet && !skipCache) {
        const now   = Date.now();
        const entry = { data, expiresAt: now + FRESH_TTL, staleAt: now + STALE_TTL };
        memoryCache.set(path, entry);
        lsWrite(path, entry);
      }

      // Invalidate related caches on mutations
      if (!isGet) _bustRelated(path);

      return data;
    } finally {
      if (isGet) pendingRequests.delete(path);
    }
  })();

  if (isGet && !skipCache) pendingRequests.set(path, fetchPromise);

  return fetchPromise;
}

// ── Background revalidation ───────────────────────────────────────────────────
function _revalidate(path, options) {
  if (pendingRequests.has(path)) return; // already revalidating
  _doFetch(path, options).catch(() => {});
}

// ── Cache bust on mutations ───────────────────────────────────────────────────
function _bustRelated(path) {
  if (path.includes('subscription')) {
    clearApiCache('/trainer/subscriptions');
    clearApiCache('/admin/reports');
  } else if (path.includes('order'))   clearApiCache('/admin/orders');
  else if (path.includes('product'))   clearApiCache('/admin/products');
  else if (path.includes('categor'))   clearApiCache('/admin/categories');
  else if (path.includes('user'))      clearApiCache('/admin/users');
  else if (path.includes('banner'))    clearApiCache('/admin/banners');
  else if (path.includes('bank'))      clearApiCache('/admin/banks');
  else if (path.includes('plan'))      clearApiCache('/admin/subscription-plans');
  clearApiCache('/admin/metrics'); // always bust metrics
}

export const API_BASE_URL = API_BASE;
