import { API_URL } from './api';

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
  createCategory: (token, data) => withAuth(`${API_URL}/admin/categories`, token, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  createProduct: async (token, data) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('price', data.price);
    formData.append('description', data.description || '');
    formData.append('category_id', data.category_id);
    formData.append('is_featured', data.is_featured ? 1 : 0);

    if (data.images && data.images.length > 0) {
      data.images.forEach((img, index) => {
        if (img.uri && img.uri.startsWith('http')) {
          formData.append('images[]', img.uri);
        } else if (img.uri) {
          formData.append('images[]', {
            uri: img.uri,
            type: img.type || 'image/jpeg',
            name: img.name || `photo_${index}.jpg`
          });
        }
      });
    }

    const response = await fetch(`${API_URL}/admin/products`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
        // Content-Type is generated automatically by fetch for FormData
      },
      body: formData
    });

    if (!response.ok) {
      const message = await response.text();
      console.error('[AdminApi] createProduct failed', {
        status: response.status,
        statusText: response.statusText,
        message
      });
      throw new Error(message || `HTTP error! status: ${response.status}`);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  },
  updateProduct: async (token, id, data) => {
    const formData = new FormData();
    formData.append('_method', 'PUT'); // Required by Laravel for multipart/form-data via PUT
    formData.append('name', data.name);
    formData.append('price', data.price);
    formData.append('description', data.description || '');
    formData.append('category_id', data.category_id);
    formData.append('is_featured', data.is_featured ? 1 : 0);

    if (data.images && data.images.length > 0) {
      data.images.forEach((img, index) => {
        if (img.uri && img.uri.startsWith('http')) {
          formData.append('images[]', img.uri);
        } else if (img.uri) {
          formData.append('images[]', {
            uri: img.uri,
            type: img.type || 'image/jpeg',
            name: img.name || `photo_${index}.jpg`
          });
        }
      });
    }

    const response = await fetch(`${API_URL}/admin/products/${id}`, {
      method: 'POST', // We send as POST because Laravel needs _method inside FormData for PUT requests
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
      body: formData
    });

    if (!response.ok) {
      const message = await response.text();
      console.error('[AdminApi] updateProduct failed', {
        status: response.status,
        statusText: response.statusText,
        message
      });
      throw new Error(message || `HTTP error! status: ${response.status}`);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  },
  deleteProduct: (token, id) => withAuth(`${API_URL}/admin/products/${id}`, token, {
    method: 'DELETE'
  })
};

export const CategoryService = {
  getCategories: (token) => withAuth(`${API_URL}/categories`, token),
  getAll: (token) => withAuth(`${API_URL}/admin/categories`, token),
  create: (token, data) => withAuth(`${API_URL}/admin/categories`, token, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (token, id, data) => withAuth(`${API_URL}/admin/categories/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  remove: (token, id) => withAuth(`${API_URL}/admin/categories/${id}`, token, {
    method: 'DELETE'
  })
};

export const ProductService = {
  create: SuperAdminService.createProduct,
  update: SuperAdminService.updateProduct,
  delete: SuperAdminService.deleteProduct
};