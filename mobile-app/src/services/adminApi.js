import { Platform } from 'react-native';
import { API_URL, CategoryService as PublicCategoryService } from './api';

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
      data.images.forEach((img, index) => {
        if (img.uri && !img.uri.startsWith('http')) {
          // New image file
          const name = img.name || `product_${index}_${Date.now()}.jpg`;
          const type = img.type || 'image/jpeg';
          formData.append('images[]', {
            uri: img.uri,
            name: name,
            type: type
          });
        } else if (typeof img === 'string') {
          // Existing URL or base64 (fallback)
          formData.append('images[]', img);
        } else if (img.uri) {
          formData.append('images[]', img.uri);
        }
      });
    }

    const res = await withAuth(`${API_URL}/admin/products`, token, {
      method: 'POST',
      body: formData
    });
    PublicCategoryService.clearCache();
    return res;
  },
  updateProduct: async (token, id, data) => {
    // Laravel PUT doesn't always handle FormData well, so we use POST with _method spoofing
    const formData = new FormData();
    formData.append('_method', 'PUT');
    formData.append('name', data.name);
    formData.append('price', data.price);
    formData.append('description', data.description || '');
    formData.append('category_id', data.category_id);
    formData.append('is_featured', data.is_featured ? '1' : '0');

    if (data.images && Array.isArray(data.images)) {
      data.images.forEach((img, index) => {
        if (img.uri && !img.uri.startsWith('http')) {
          formData.append('images[]', {
            uri: img.uri,
            name: img.name || `product_${index}.jpg`,
            type: img.type || 'image/jpeg'
          });
        } else {
          formData.append('images[]', img.uri || img);
        }
      });
    }

    const res = await withAuth(`${API_URL}/admin/products/${id}`, token, {
      method: 'POST', // Use POST with _method spoofing for Multipart reliability
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