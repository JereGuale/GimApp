import { Platform } from 'react-native';
import { API_URL, CategoryService as PublicCategoryService } from './api';

const withAuth = async (endpoint, token, options = {}) => {
  console.log('[withAuth] Request:', { endpoint, method: options.method || 'GET', hasToken: !!token });

  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
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
    const payload = {
      name: data.name,
      price: data.price,
      description: data.description || '',
      category_id: data.category_id,
      is_featured: data.is_featured ? 1 : 0,
      images: data.images ? data.images.map(img => img.base64 || img.uri) : [],
    };
    const res = await withAuth(`${API_URL}/admin/products`, token, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    PublicCategoryService.clearCache();
    return res;
  },
  updateProduct: async (token, id, data) => {
    const payload = {
      name: data.name,
      price: data.price,
      description: data.description || '',
      category_id: data.category_id,
      is_featured: data.is_featured ? 1 : 0,
      images: data.images ? data.images.map(img => img.base64 || img.uri) : [],
    };
    const res = await withAuth(`${API_URL}/admin/products/${id}`, token, {
      method: 'PUT',
      body: JSON.stringify(payload)
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