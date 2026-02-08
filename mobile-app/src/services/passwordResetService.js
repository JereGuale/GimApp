import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export const PasswordResetAPI = {
    /**
     * Request password reset code (sent to email)
     */
    async requestResetCode(email) {
        try {
            const response = await axios.post(`${API_URL}/password/request-reset`, {
                email
            });

            return {
                success: true,
                message: response.data.message
            };
        } catch (error) {
            console.error('Error requesting reset code:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Error al enviar el código. Verifica tu email.'
            };
        }
    },

    /**
     * Verify reset code
     */
    async verifyResetCode(email, code) {
        try {
            const response = await axios.post(`${API_URL}/password/verify-code`, {
                email,
                code
            });

            return {
                success: true,
                valid: response.data.valid,
                message: response.data.message
            };
        } catch (error) {
            console.error('Error verifying code:', error.response?.data || error.message);
            return {
                success: false,
                valid: false,
                error: error.response?.data?.message || 'Error al verificar el código.'
            };
        }
    },

    /**
     * Reset password with code
     */
    async resetPassword(email, code, password, passwordConfirmation) {
        try {
            const response = await axios.post(`${API_URL}/password/reset`, {
                email,
                code,
                password,
                password_confirmation: passwordConfirmation
            });

            return {
                success: true,
                message: response.data.message
            };
        } catch (error) {
            console.error('Error resetting password:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Error al restablecer la contraseña.',
                errors: error.response?.data?.errors
            };
        }
    }
};
