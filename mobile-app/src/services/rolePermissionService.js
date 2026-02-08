import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './api';

// Get auth token
const getAuthToken = async () => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) console.warn('No auth token found in storage');
        return token;
    } catch (error) {
        console.error('Error getting auth token:', error);
        return null;
    }
};

// Roles API
export const rolesApi = {
    // Get all roles
    getAll: async () => {
        const token = await getAuthToken();
        const response = await fetch(`${API_URL}/admin/rbac/roles`, {
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
        const response = await fetch(`${API_URL}/admin/rbac/roles/${id}`, {
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
        const response = await fetch(`${API_URL}/admin/rbac/roles`, {
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
        const response = await fetch(`${API_URL}/admin/rbac/roles/${id}`, {
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
        const response = await fetch(`${API_URL}/admin/rbac/roles/${id}`, {
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
        const response = await fetch(`${API_URL}/admin/rbac/roles/${roleId}/permissions/sync`, {
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
        const response = await fetch(`${API_URL}/admin/rbac/roles/${roleId}/permissions/${permissionId}`, {
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
        const response = await fetch(`${API_URL}/admin/rbac/permissions`, {
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
        const response = await fetch(`${API_URL}/admin/rbac/permissions`, {
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
        const response = await fetch(`${API_URL}/admin/rbac/permissions/${id}`, {
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
        console.log('[TrainerPerms API] Requesting:', `${API_URL}/admin/rbac/trainer-permissions`);

        const response = await fetch(`${API_URL}/admin/rbac/trainer-permissions`, {
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
        const response = await fetch(`${API_URL}/admin/users`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.json();
    },

    // Get user roles
    getUserRoles: async (userId) => {
        const token = await getAuthToken();
        const response = await fetch(`${API_URL}/admin/rbac/users/${userId}/roles`, {
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
        const response = await fetch(`${API_URL}/admin/rbac/users/${userId}/roles/assign`, {
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
        const response = await fetch(`${API_URL}/admin/rbac/users/${userId}/roles/revoke`, {
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
        const response = await fetch(`${API_URL}/admin/rbac/users/${userId}/permissions`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.json();
    },
};
