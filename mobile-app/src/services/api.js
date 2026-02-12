
// API Configuration for Laravel Backend
// Usar la IP del backend desde archivo de configuración
import { DEV_BACKEND_IP } from '../../.env.js';
export const API_URL = `http://${DEV_BACKEND_IP}:8000/api`;

// Endpoints disponibles
export const ENDPOINTS = {
  categories: `${API_URL}/categories`,
  subscriptions: `${API_URL}/subscriptions`,
  activeOffer: `${API_URL}/offers/active`,
};

const fetchWithAuth = async (endpoint, token) => {
  try {
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching auth data:', error);
    throw error;
  }
};

// Helper function para hacer peticiones GET
export const fetchData = async (endpoint) => {
  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

// Helper function para hacer peticiones POST
export const postData = async (endpoint, data) => {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error posting data:', error);
    throw error;
  }
};

export const authLogin = async (email, password) => {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const authRegister = async (name, email, password, passwordConfirmation) => {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      name,
      email,
      password,
      password_confirmation: passwordConfirmation
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Helper function para hacer peticiones PUT
export const updateData = async (endpoint, data) => {
  try {
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error updating data:', error);
    throw error;
  }
};

// Helper function para hacer peticiones DELETE
export const deleteData = async (endpoint) => {
  try {
    const response = await fetch(endpoint, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error deleting data:', error);
    throw error;
  }
};

// Servicios específicos
export const CategoryService = {
  getAll: (token) => (token ? fetchWithAuth(ENDPOINTS.categories, token) : fetchData(ENDPOINTS.categories)),
  getProductsByCategory: (categoryId, token) =>
    token
      ? fetchWithAuth(`${ENDPOINTS.categories}/${categoryId}/products`, token)
      : fetchData(`${ENDPOINTS.categories}/${categoryId}/products`)
};

export const SubscriptionService = {
  getAll: () => fetchData(ENDPOINTS.subscriptions),
  getById: (id) => fetchData(`${ENDPOINTS.subscriptions}/${id}`),
  create: (data) => postData(ENDPOINTS.subscriptions, data),
  update: (id, data) => updateData(`${ENDPOINTS.subscriptions}/${id}`, data),
  delete: (id) => deleteData(`${ENDPOINTS.subscriptions}/${id}`),
};

export const OfferService = {
  getActive: (token) => fetchWithAuth(ENDPOINTS.activeOffer, token)
};

// Banner Service
export const BannerService = {
  // Public: get active banners for carousel
  getActiveBanners: (token) => fetchWithAuth(`${API_URL}/banners/active`, token),

  // Admin: get all banners
  getAll: (token) => fetchWithAuth(`${API_URL}/admin/banners`, token),

  // Admin: create banner (with optional image)
  create: async (formData, token) => {
    const response = await fetch(`${API_URL}/admin/banners`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      body: formData,
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  // Admin: update banner
  update: async (id, data, token) => {
    const response = await fetch(`${API_URL}/admin/banners/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  // Admin: upload banner image
  uploadImage: async (id, formData, token) => {
    const response = await fetch(`${API_URL}/admin/banners/${id}/image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      body: formData,
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  // Admin: delete banner
  delete: async (id, token) => {
    const response = await fetch(`${API_URL}/admin/banners/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },
};
