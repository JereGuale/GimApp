
import Constants from 'expo-constants';
import { Platform } from 'react-native';
let AsyncStorage;
if (Platform.OS === 'web') {
    AsyncStorage = {
        getItem: async (key) => Promise.resolve(window.localStorage.getItem(key)),
        setItem: async (key, value) => Promise.resolve(window.localStorage.setItem(key, value)),
        removeItem: async (key) => Promise.resolve(window.localStorage.removeItem(key)),
    };
} else {
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
}
const DEV_BACKEND_IP = Constants.manifest?.extra?.DEV_BACKEND_IP || '127.0.0.1';
const DEV_HOST = DEV_BACKEND_IP;
const API_URL = `http://${DEV_HOST}:8000/api`;

const getToken = async () => {
        try {
                const token = await AsyncStorage.getItem('token');
                return token;
        } catch (error) {
                console.error('Error getting token:', error);
                return null;
        }
};

const getAuthHeaders = async () => {
    const token = await getToken();
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
};

export const NotificationAPI = {
    /**
     * Get all notifications for the authenticated user
     */
    async getNotifications() {
        try {
            const headers = await getAuthHeaders();
            const response = await axios.get(`${API_URL}/notifications`, { headers });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error getting notifications:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Error al obtener notificaciones',
                data: []
            };
        }
    },

    /**
     * Get unread notification count
     */
    async getUnreadCount() {
        try {
            const headers = await getAuthHeaders();
            const response = await axios.get(`${API_URL}/notifications/unread-count`, { headers });
            return { success: true, count: response.data.count };
        } catch (error) {
            console.error('Error getting unread count:', error.response?.data || error.message);
            return { success: false, count: 0 };
        }
    },

    /**
     * Mark a notification as read
     */
    async markAsRead(notificationId) {
        try {
            const headers = await getAuthHeaders();
            const response = await axios.post(
                `${API_URL}/notifications/${notificationId}/read`,
                {},
                { headers }
            );
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error marking as read:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Error al marcar como leída'
            };
        }
    },

    /**
     * Mark all notifications as read
     */
    async markAllAsRead() {
        try {
            const headers = await getAuthHeaders();
            const response = await axios.post(
                `${API_URL}/notifications/read-all`,
                {},
                { headers }
            );
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error marking all as read:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Error al marcar como leídas'
            };
        }
    }
};

export const ProfileAPI = {
    /**
     * Get user profile
     */
    async getProfile() {
        try {
            const headers = await getAuthHeaders();
            const response = await axios.get(`${API_URL}/profile`, { headers });
            return { success: true, data: response.data.user };
        } catch (error) {
            console.error('Error getting profile:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Error al obtener perfil'
            };
        }
    },

    /**
     * Update user profile
     */
    async updateProfile(data) {
        try {
            const headers = await getAuthHeaders();
            const response = await axios.put(`${API_URL}/profile`, data, { headers });
            return { success: true, data: response.data.user, message: response.data.message };
        } catch (error) {
            console.error('Error updating profile:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Error al actualizar perfil'
            };
        }
    },

    /**
     * Upload profile photo
     */
    async uploadPhoto(imageUri) {
        try {
            const token = await getToken();
            if (!token) {
                return { success: false, error: 'No hay token de autenticación' };
            }

            const formData = new FormData();
            const cleanUri = imageUri.split('?')[0];
            const fileExtension = cleanUri.split('.').pop().toLowerCase();
            const validExt = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension) ? fileExtension : 'jpg';
            const mimeType = validExt === 'png' ? 'image/png' : 'image/jpeg';

            if (Platform.OS === 'web') {
                // Web: convert data URI or blob URL to File
                const response = await fetch(imageUri);
                const blob = await response.blob();
                const file = new File([blob], `profile_${Date.now()}.${validExt}`, { type: mimeType });
                formData.append('photo', file);
            } else {
                // Native: use RN format
                formData.append('photo', {
                    uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
                    type: mimeType,
                    name: `profile_${Date.now()}.${validExt}`
                });
            }

            const res = await axios.post(
                `${API_URL}/profile/photo`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    },
                    transformRequest: (data) => data,
                    timeout: 30000
                }
            );

            return {
                success: true,
                data: res.data,
                message: res.data.message
            };
        } catch (error) {
            console.error('Error uploading photo:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Error al subir la foto'
            };
        }
    }
};
