import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './api';

// Get auth token
const getAuthToken = async () => {
    // Token generado manualmente para pruebas
        const token = '31|YjuCTmq4hWLIO15SssUabGsg0JFfLdjDcBWksBlkebe1006d'; // Token Bearer válido generado para super_admin
    return token;
};

// Roles API
export const rolesApi = {
    // Get all roles
    getAll: async () => {
        const token = await getAuthToken();
        console.log('[rolesApi.getAll] Token:', token);
        console.log('[rolesApi.getAll] Endpoint:', `${API_URL}/admin/roles`);
        const response = await fetch(`${API_URL}/admin/roles`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json', // Force JSON response
            },
        });

        // Debug response
        console.log('[Roles API] Status:', response.status);
        const contentType = response.headers.get('content-type');
        console.log('[Roles API] Content-Type:', contentType);

        if (contentType && contentType.includes('text/html')) {
            const text = await response.text();
            console.error('[Roles API] HTML Response:', text.substring(0, 500)); // Log first 500 chars
            throw new Error(`Experiencing server error (HTML response). Status: ${response.status}`);
        }

        return response.json();
    },

    // Get single role
    getById: async (id) => {
        const token = await getAuthToken();
        console.log('[rolesApi.getById] Token:', token);
        console.log('[rolesApi.getById] Endpoint:', `${API_URL}/admin/roles/${id}`);
        const response = await fetch(`${API_URL}/admin/roles/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.json();
    },

    // Create role
    create: async (data) => {
        const token = await getAuthToken();
        console.log('[rolesApi.create] Token:', token);
        console.log('[rolesApi.create] Endpoint:', `${API_URL}/admin/roles`);
        const response = await fetch(`${API_URL}/admin/roles`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        return response.json();
    },

    // Update role
    update: async (id, data) => {
        const token = await getAuthToken();
        console.log('[rolesApi.update] Token:', token);
        console.log('[rolesApi.update] Endpoint:', `${API_URL}/admin/roles/${id}`);
        const response = await fetch(`${API_URL}/admin/roles/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        return response.json();
    },

    // Delete/deactivate role
    delete: async (id) => {
        const token = await getAuthToken();
        console.log('[rolesApi.delete] Token:', token);
        console.log('[rolesApi.delete] Endpoint:', `${API_URL}/admin/roles/${id}`);
        const response = await fetch(`${API_URL}/admin/roles/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.json();
    },

    // Assign permissions to role
    assignPermissions: async (roleId, permissionIds) => {
        const token = await getAuthToken();
        const response = await fetch(`${API_URL}/admin/roles/${roleId}/permissions/sync`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ permission_ids: permissionIds }),
        });
        return response.json();
    },

    // Revoke permission from role
    revokePermission: async (roleId, permissionId) => {
        const token = await getAuthToken();
        const response = await fetch(`${API_URL}/admin/roles/${roleId}/permissions/${permissionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.json();
    },
};

// Permissions API
export const permissionsApi = {
    // Get all permissions (already grouped by category from backend)
    getAll: async () => {
        const token = await getAuthToken();
        console.log('[permissionsApi.getAll] Token:', token);
        console.log('[permissionsApi.getAll] Endpoint:', `${API_URL}/admin/roles/permissions`);
        const response = await fetch(`${API_URL}/admin/roles/permissions`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.json();
    },

    // Create permission
    create: async (data) => {
        const token = await getAuthToken();
        const response = await fetch(`${API_URL}/admin/roles/permissions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        return response.json();
    },

    // Update permission
    update: async (id, data) => {
        const token = await getAuthToken();
        const response = await fetch(`${API_URL}/admin/roles/permissions/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        return response.json();
    },

    // Get permissions specifically for Trainer role management
    getTrainerPermissions: async () => {
        const token = await getAuthToken();
        console.log('[permissionsApi.getTrainerPermissions] Token:', token);
        console.log('[permissionsApi.getTrainerPermissions] Endpoint:', `${API_URL}/admin/roles/permissions?role=trainer`);
        // Usar el endpoint de permisos y filtrar por rol trainer
        const response = await fetch(`${API_URL}/admin/roles/permissions?role=trainer`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });

        console.log('[TrainerPerms API] Status:', response.status);
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('text/html')) {
            const text = await response.text();
            console.error('[TrainerPerms API] HTML Response:', text.substring(0, 500));
            throw new Error(`Server returned HTML (likely login page). Status: ${response.status}`);
        }

        return response.json();
    },
};

// User Roles API
export const userRolesApi = {
    // Get all users with roles
    getAllUsersWithRoles: async () => {
        const token = await getAuthToken();
        console.log('[userRolesApi.getAllUsersWithRoles] Token:', token);
        console.log('[userRolesApi.getAllUsersWithRoles] Endpoint:', `${API_URL}/admin/users`);
        const cleanToken = (token || '').toString().trim();
        const response = await fetch(`${API_URL}/admin/users`, {
            headers: {
                'Authorization': `Bearer ${cleanToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        });
        return response.json();
    },

    // Get user roles
    getUserRoles: async (userId) => {
        const token = await getAuthToken();
        const response = await fetch(`${API_URL}/admin/users/${userId}/roles`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.json();
    },

    // Assign roles to user
    assignRoles: async (userId, roleIds) => {
        const token = await getAuthToken();
        const response = await fetch(`${API_URL}/admin/users/${userId}/roles/assign`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ role_ids: roleIds }),
        });
        return response.json();
    },

    // Revoke role from user
    revokeRole: async (userId, roleId) => {
        const token = await getAuthToken();
        const response = await fetch(`${API_URL}/admin/users/${userId}/roles/revoke`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.json();
    },

    // Get user permissions
    getUserPermissions: async (userId) => {
        const token = await getAuthToken();
        const response = await fetch(`${API_URL}/admin/users/${userId}/permissions`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.json();
    },
};
