import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './api';

// Helper para obtener el token
const getToken = async () => {
    try {
        const token = await AsyncStorage.getItem('token');
        return token;
    } catch (error) {
        console.error('Error getting token:', error);
        return null;
    }
};

export const OrderAPI = {
    /**
     * Crear nuevo pedido de productos
     */
    async createOrder(items, paymentMethod = 'transfer', notes = '') {
        try {
            const token = await getToken();
            if (!token) {
                return { success: false, error: 'No hay token de autenticación' };
            }

            console.log('[OrderAPI] Creating order...', {
                itemCount: items.length,
                paymentMethod,
            });

            const response = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    items: items.map(item => ({
                        product_id: item.product.id,
                        quantity: item.quantity,
                    })),
                    payment_method: paymentMethod,
                    notes,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('[OrderAPI] Error creating order:', data);
                return {
                    success: false,
                    error: data.message || data.errors
                        ? Object.values(data.errors).flat().join(', ')
                        : 'Error al crear pedido',
                };
            }

            console.log('[OrderAPI] Order created:', data);
            return {
                success: true,
                data: data.order,
                message: data.message,
            };
        } catch (error) {
            console.error('[OrderAPI] Exception:', error);
            return {
                success: false,
                error: error.message || 'Error de conexión al crear pedido',
            };
        }
    },

    /**
     * Subir comprobante de pago para un pedido
     */
    async uploadReceipt(orderId, imageUri) {
        try {
            const token = await getToken();
            if (!token) {
                return { success: false, error: 'No hay token de autenticación' };
            }

            console.log('[OrderAPI] Uploading receipt for order:', orderId);

            const formData = new FormData();

            // Prepare file for upload
            const cleanUri = imageUri.split('?')[0];
            const fileExtension = cleanUri.split('.').pop().toLowerCase() || 'jpg';
            const mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';

            formData.append('receipt', {
                uri: imageUri,
                type: mimeType,
                name: `order_receipt_${Date.now()}.${fileExtension}`,
            });

            const response = await fetch(
                `${API_URL}/orders/${orderId}/upload-receipt`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                        'Accept': 'application/json',
                    },
                    body: formData,
                }
            );

            const data = await response.json();

            if (!response.ok) {
                console.error('[OrderAPI] Upload error:', data);
                return {
                    success: false,
                    error: data.message || 'Error al subir comprobante',
                };
            }

            console.log('[OrderAPI] Receipt uploaded:', data);
            return {
                success: true,
                data: data.order,
                message: data.message,
            };
        } catch (error) {
            console.error('[OrderAPI] Upload exception:', error);
            return {
                success: false,
                error: error.message || 'Error al subir comprobante',
            };
        }
    },

    /**
     * Obtener mis pedidos
     */
    async getMyOrders() {
        try {
            const token = await getToken();
            if (!token) {
                return { success: false, error: 'No autenticado', data: [] };
            }

            const response = await fetch(`${API_URL}/orders/my`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                return { success: false, error: data.message || 'Error al obtener pedidos', data: [] };
            }

            return { success: true, data };
        } catch (error) {
            console.error('[OrderAPI] getMyOrders error:', error);
            return { success: false, error: error.message, data: [] };
        }
    },
};
