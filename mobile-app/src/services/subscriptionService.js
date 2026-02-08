import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:8000/api';

// Helper para obtener el token
const getToken = async () => {
    try {
        // IMPORTANTE: Usar 'token' para coincidir con AuthContext
        const token = await AsyncStorage.getItem('token');
        return token;
    } catch (error) {
        console.error('Error getting token:', error);
        return null;
    }
};

// Helper para crear headers con autenticación
const getAuthHeaders = async () => {
    const token = await getToken();
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
};

export const SubscriptionAPI = {
    /**
     * Obtener suscripción actual del usuario
     */
    async getMySubscription() {
        try {
            const headers = await getAuthHeaders();
            const response = await axios.get(`${API_URL}/subscription/my`, { headers });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error getting subscription:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Error al obtener suscripción'
            };
        }
    },

    /**
     * Crear nueva suscripción
     */
    async createSubscription(planId, paymentMethod, cardData = {}) {
        try {
            console.log('[SubscriptionAPI] Creating subscription...', {
                planId,
                paymentMethod,
                hasCardData: Object.keys(cardData).length > 0
            });

            const token = await getToken();
            console.log('[SubscriptionAPI] Token retrieved:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');

            const headers = await getAuthHeaders();
            console.log('[SubscriptionAPI] Headers:', headers);

            const payload = {
                subscription_plan_id: planId,
                payment_method: paymentMethod,
                ...cardData
            };

            console.log('[SubscriptionAPI] Payload:', payload);
            console.log('[SubscriptionAPI] Making request to:', `${API_URL}/subscription/subscribe`);

            const response = await axios.post(
                `${API_URL}/subscription/subscribe`,
                payload,
                { headers }
            );

            console.log('[SubscriptionAPI] Response:', response.data);

            return {
                success: true,
                data: response.data.subscription,
                message: response.data.message
            };
        } catch (error) {
            console.error('[SubscriptionAPI] Error creating subscription:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            return {
                success: false,
                error: error.response?.data?.message || 'Error al crear suscripción',
                errors: error.response?.data?.errors
            };
        }
    },

    /**
     * Subir comprobante de pago
     */
    async uploadReceipt(subscriptionId, imageUri) {
        try {
            const token = await getToken();

            if (!token) {
                return {
                    success: false,
                    error: 'No hay token de autenticación'
                };
            }

            console.log('Uploading receipt:', {
                subscriptionId,
                imageUri,
                hasToken: !!token
            });

            // Crear FormData para subir imagen
            const formData = new FormData();

            // Obtener tipo de archivo desde la URI
            const fileExtension = imageUri.split('.').pop().toLowerCase();
            const mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';

            formData.append('receipt', {
                uri: imageUri,
                type: mimeType,
                name: `receipt_${Date.now()}.${fileExtension}`
            });

            console.log('FormData prepared, making request to API...');

            const response = await axios.post(
                `${API_URL}/subscription/${subscriptionId}/upload-receipt`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                        'Accept': 'application/json'
                    },
                    timeout: 30000 // 30 segundos
                }
            );

            console.log('Upload successful:', response.data);

            return {
                success: true,
                data: response.data.subscription,
                message: response.data.message
            };
        } catch (error) {
            console.error('Error uploading receipt:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });

            return {
                success: false,
                error: error.response?.data?.message || error.response?.data?.errors?.receipt?.[0] || error.message || 'Error al subir comprobante'
            };
        }
    }
};

export const TrainerSubscriptionAPI = {
    /**
     * Obtener todas las suscripciones (con filtros)
     */
    async getSubscriptions(filters = {}) {
        try {
            const headers = await getAuthHeaders();
            const params = new URLSearchParams(filters).toString();
            const url = `${API_URL}/trainer/subscriptions${params ? `?${params}` : ''}`;

            const response = await axios.get(url, { headers });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error getting subscriptions:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Error al obtener suscripciones'
            };
        }
    },

    /**
     * Obtener contador de suscripciones pendientes
     */
    async getPendingCount() {
        try {
            const headers = await getAuthHeaders();
            const response = await axios.get(`${API_URL}/trainer/subscriptions/pending-count`, { headers });
            return { success: true, count: response.data.count };
        } catch (error) {
            console.error('Error getting pending count:', error.response?.data || error.message);
            return { success: false, count: 0 };
        }
    },

    /**
     * Aprobar suscripción
     */
    async approveSubscription(subscriptionId) {
        try {
            const headers = await getAuthHeaders();
            const response = await axios.post(
                `${API_URL}/trainer/subscriptions/${subscriptionId}/approve`,
                {},
                { headers }
            );

            return {
                success: true,
                data: response.data.subscription,
                message: response.data.message
            };
        } catch (error) {
            console.error('Error approving subscription:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Error al aprobar suscripción'
            };
        }
    },

    /**
     * Rechazar suscripción
     */
    async rejectSubscription(subscriptionId, reason) {
        try {
            const headers = await getAuthHeaders();
            const response = await axios.post(
                `${API_URL}/trainer/subscriptions/${subscriptionId}/reject`,
                { reason },
                { headers }
            );

            return {
                success: true,
                data: response.data.subscription,
                message: response.data.message
            };
        } catch (error) {
            console.error('Error rejecting subscription:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Error al rechazar suscripción'
            };
        }
    },

    /**
     * Crear suscripción para un usuario (trainer)
     */
    async createSubscriptionForUser(userId, planId) {
        try {
            const headers = await getAuthHeaders();
            const response = await axios.post(
                `${API_URL}/trainer/subscriptions/create`,
                { user_id: userId, subscription_plan_id: planId },
                { headers }
            );

            return {
                success: true,
                data: response.data.subscription,
                message: response.data.message
            };
        } catch (error) {
            console.error('Error creating subscription:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Error al crear suscripción',
                errors: error.response?.data?.errors
            };
        }
    }
};

export const SubscriptionPlanAPI = {
    /**
     * Obtener todos los planes disponibles
     */
    async getPlans() {
        try {
            const headers = await getAuthHeaders();
            const response = await axios.get(`${API_URL}/subscription/plans`, { headers });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error getting plans:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Error al obtener planes'
            };
        }
    }
};
