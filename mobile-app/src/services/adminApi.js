import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { DEV_BACKEND_IP as HARDCODED_IP } from '../../.env.js';
import { CategoryService as PublicCategoryService } from './api';

// Production URL
const PRODUCTION_URL = 'https://gimapp.onrender.com/api';

// Simple dev backend detection
let DEV_BACKEND_IP = HARDCODED_IP;
const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.hostUri;
if (hostUri) {
  DEV_BACKEND_IP = hostUri.split(':')[0];
}

// Ensure API_URL is correct for local testing and production
const API_URL = !__DEV__
  ? PRODUCTION_URL
  : (process.env.EXPO_PUBLIC_API_URL || `http://${DEV_BACKEND_IP}:8000/api`);

console.log('[adminApi] Using API_URL:', API_URL);

// Helper for Web FormData
const getBlobFromUri = async (uri) => {
  const resp = await fetch(uri);
  return await resp.blob();
};

const withAuth = async (endpoint, token, options = {}) => {
  console.log('[withAuth] Request:', { endpoint, method: options.method || 'GET', hasToken: !!token });

  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    ...(options.headers || {})
  };

  // Only add Content-Type: application/json if not FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  console.log('[withAuth] Response:', { status: response.status, statusText: response.statusText, endpoint });

  if (!response.ok) {
    const message = await response.text();
    console.error('[withAuth] Error response:', { status: response.status, message });
    throw new Error(message || `HTTP error! status: ${response.status}`);
  }

  if (response.status === 204) {
    console.log('[withAuth] 204 No Content response');
    return null;
  }

  return response.json();
};

export const SuperAdminService = {
  getMetrics: (token) => withAuth(`${API_URL}/admin/metrics`, token),
  getUsers: (token) => withAuth(`${API_URL}/admin/users`, token),
  getProducts: (token) => withAuth(`${API_URL}/admin/products`, token),
  updateUser: (token, id, data) => withAuth(`${API_URL}/admin/users/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  cancelSubscription: (token, id) => withAuth(`${API_URL}/admin/users/${id}/cancel-subscription`, token, {
    method: 'POST'
  }),
  getLocations: (token) => withAuth(`${API_URL}/admin/locations`, token),
  createLocation: (token, data) => withAuth(`${API_URL}/admin/locations`, token, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  deleteLocation: (token, id) => withAuth(`${API_URL}/admin/locations/${id}`, token, {
    method: 'DELETE'
  }),
  getOffers: (token) => withAuth(`${API_URL}/admin/offers`, token),
  createOffer: (token, data) => withAuth(`${API_URL}/admin/offers`, token, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  deleteOffer: (token, id) => withAuth(`${API_URL}/admin/offers/${id}`, token, {
    method: 'DELETE'
  }),
  getReportDashboard: (token) => withAuth(`${API_URL}/admin/reports/dashboard`, token),
  getDailyReports: (token, date) => withAuth(`${API_URL}/admin/reports/daily?date=${date}`, token),
  getMonthlyReports: (token, month, year) => withAuth(`${API_URL}/admin/reports/monthly?month=${month}&year=${year}`, token),
  registerDailyIncome: (token, data) => withAuth(`${API_URL}/admin/reports/daily`, token, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  deleteDailyIncome: (token, id) => withAuth(`${API_URL}/admin/reports/daily/${id}`, token, {
    method: 'DELETE'
  }),
  createCategory: async (token, data) => {
    const res = await withAuth(`${API_URL}/admin/categories`, token, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    PublicCategoryService.clearCache();
    return res;
  },
  createProduct: async (token, data) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('price', data.price);
    formData.append('description', data.description || '');
    formData.append('category_id', data.category_id);
    formData.append('is_featured', data.is_featured ? '1' : '0');
    formData.append('condition', data.condition || 'nuevo');

    if (data.images && Array.isArray(data.images)) {
      for (let i = 0; i < data.images.length; i++) {
        const img = data.images[i];
        if (img.uri && !img.uri.startsWith('http')) {
          if (Platform.OS === 'web') {
            try {
              const blob = await getBlobFromUri(img.uri);
              formData.append('images[]', blob, img.name || `product_${i}.jpg`);
            } catch (e) {
              console.error('Error converting URI to blob:', e);
            }
          } else {
            formData.append('images[]', {
              uri: img.uri,
              name: img.name || `product_${i}.jpg`,
              type: img.type || 'image/jpeg'
            });
          }
        } else {
          formData.append('images[]', img.uri || img);
        }
      }
    }

    const res = await withAuth(`${API_URL}/admin/products`, token, {
      method: 'POST',
      body: formData
    });
    PublicCategoryService.clearCache();
    return res;
  },
  updateProduct: async (token, id, data) => {
    const formData = new FormData();
    formData.append('_method', 'PUT');
    formData.append('name', data.name);
    formData.append('price', data.price);
    formData.append('description', data.description || '');
    formData.append('category_id', data.category_id);
    formData.append('is_featured', data.is_featured ? '1' : '0');

    if (data.images && Array.isArray(data.images)) {
      for (let i = 0; i < data.images.length; i++) {
        const img = data.images[i];
        if (img.uri && !img.uri.startsWith('http')) {
          if (Platform.OS === 'web') {
            try {
              const blob = await getBlobFromUri(img.uri);
              formData.append('images[]', blob, img.name || `product_${i}.jpg`);
            } catch (e) {
              console.error('Error converting URI to blob:', e);
            }
          } else {
            formData.append('images[]', {
              uri: img.uri,
              name: img.name || `product_${i}.jpg`,
              type: img.type || 'image/jpeg'
            });
          }
        } else {
          formData.append('images[]', img.uri || img);
        }
      }
    }

    const res = await withAuth(`${API_URL}/admin/products/${id}`, token, {
      method: 'POST',
      body: formData
    });
    PublicCategoryService.clearCache();
    return res;
  },
  deleteProduct: async (token, id) => {
    const res = await withAuth(`${API_URL}/admin/products/${id}`, token, {
      method: 'DELETE'
    });
    PublicCategoryService.clearCache();
    return res;
  }
};

export const CategoryService = {
  getCategories: (token) => withAuth(`${API_URL}/categories`, token),
  getAll: (token) => withAuth(`${API_URL}/admin/categories`, token),
  create: async (token, data) => {
    const res = await withAuth(`${API_URL}/admin/categories`, token, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    PublicCategoryService.clearCache();
    return res;
  },
  update: async (token, id, data) => {
    const res = await withAuth(`${API_URL}/admin/categories/${id}`, token, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    PublicCategoryService.clearCache();
    return res;
  },
  remove: async (token, id) => {
    const res = await withAuth(`${API_URL}/admin/categories/${id}`, token, {
      method: 'DELETE'
    });
    PublicCategoryService.clearCache();
    return res;
  }
};

export const ProductService = {
  create: SuperAdminService.createProduct,
  update: SuperAdminService.updateProduct,
  delete: SuperAdminService.deleteProduct
};