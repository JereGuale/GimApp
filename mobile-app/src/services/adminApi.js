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
  createCategory: (token, data) => withAuth(`${API_URL}/admin/categories`, token, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  createProduct: async (token, data) => {
    // Convertir imágenes a base64
    const base64Images = [];
    if (data.images && Array.isArray(data.images) && data.images.length > 0) {
      for (const imageUri of data.images) {
        try {
          const response = await fetch(imageUri);
          const blob = await response.blob();
          const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          base64Images.push(base64);
        } catch (error) {
          console.error('[AdminApi] Error converting image to base64:', error);
        }
      }
    }

    const payload = {
      name: data.name,
      price: data.price,
      description: data.description || '',
      category_id: data.category_id,
      is_featured: data.is_featured ? 1 : 0,
      images: base64Images
    };

    const response = await fetch(`${API_URL}/admin/products`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(payload)
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
    const base64Images = [];
    if (data.images && Array.isArray(data.images) && data.images.length > 0) {
      for (const imageUri of data.images) {
        try {
          const response = await fetch(imageUri);
          const blob = await response.blob();
          const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          base64Images.push(base64);
        } catch (error) {
          console.error('[AdminApi] Error converting image to base64:', error);
        }
      }
    }

    const payload = {
      name: data.name,
      price: data.price,
      description: data.description || '',
      category_id: data.category_id,
      is_featured: data.is_featured ? 1 : 0,
      images: base64Images
    };

    const response = await fetch(`${API_URL}/admin/products/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(payload)
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