import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function CardPaymentForm({ visible, onClose, onSubmit, plan }) {
    const { theme } = useTheme();
    const [cardNumber, setCardNumber] = useState('');
    const [cardName, setCardName] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');
    const [loading, setLoading] = useState(false);

    const formatCardNumber = (text) => {
        const cleaned = text.replace(/\s/g, '');
        const chunks = cleaned.match(/.{1,4}/g);
        return chunks ? chunks.join(' ') : cleaned;
    };

    const formatExpiry = (text) => {
        const cleaned = text.replace(/\//g, '');
        if (cleaned.length >= 2) {
            return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
        }
        return cleaned;
    };

    const handleSubmit = async () => {
        if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
            alert('Por favor completa todos los campos');
            return;
        }

        if (cardNumber.replace(/\s/g, '').length !== 16) {
            alert('Número de tarjeta inválido');
            return;
        }

        setLoading(true);
        await onSubmit({
            card_number: cardNumber.replace(/\s/g, ''),
            card_name: cardName,
            card_expiry: cardExpiry,
            card_cvv: cardCvv
        });
        setLoading(false);
        handleClose();
    };

    const handleClose = () => {
        setCardNumber('');
        setCardName('');
        setCardExpiry('');
        setCardCvv('');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleClose}
        >
            <View style={styles.modalContainer}>
                <View style={[styles.modalContent, { backgroundColor: '#FFFFFF' }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: '#111827' }]}>
                            Pago con Tarjeta
                        </Text>
                        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Plan Summary */}
                    {plan && (
                        <View style={styles.planSummary}>
                            <Text style={[styles.planName, { color: '#111827' }]}>
                                {plan.name}
                            </Text>
                            <Text style={styles.planPrice}>
                                ${plan.price.toFixed(2)}
                            </Text>
                        </View>
                    )}

                    {/* Card Form */}
                    <View style={styles.formContainer}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: '#4B5563' }]}>
                                Número de Tarjeta
                            </Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="card-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: '#111827' }]}
                                    placeholder="1234 5678 9012 3456"
                                    placeholderTextColor="#9CA3AF"
                                    value={cardNumber}
                                    onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                                    keyboardType="numeric"
                                    maxLength={19}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: '#4B5563' }]}>
                                Nombre en la Tarjeta
                            </Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: '#111827' }]}
                                    placeholder="JUAN PEREZ"
                                    placeholderTextColor="#9CA3AF"
                                    value={cardName}
                                    onChangeText={setCardName}
                                    autoCapitalize="characters"
                                />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={[styles.label, { color: '#4B5563' }]}>
                                    Vencimiento
                                </Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="calendar-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, { color: '#111827' }]}
                                        placeholder="MM/YY"
                                        placeholderTextColor="#9CA3AF"
                                        value={cardExpiry}
                                        onChangeText={(text) => setCardExpiry(formatExpiry(text))}
                                        keyboardType="numeric"
                                        maxLength={5}
                                    />
                                </View>
                            </View>

                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={[styles.label, { color: '#4B5563' }]}>
                                    CVV
                                </Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, { color: '#111827' }]}
                                        placeholder="123"
                                        placeholderTextColor="#9CA3AF"
                                        value={cardCvv}
                                        onChangeText={setCardCvv}
                                        keyboardType="numeric"
                                        maxLength={4}
                                        secureTextEntry
                                    />
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Security Note */}
                    <View style={styles.securityNote}>
                        <Ionicons name="shield-checkmark-outline" size={16} color="#10B981" />
                        <Text style={[styles.securityText, { color: '#9CA3AF' }]}>
                            Tus datos están protegidos y encriptados
                        </Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={handleClose}
                            disabled={loading}
                        >
                            <Text style={[styles.cancelButtonText, { color: '#111827' }]}>Cancelar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <Text style={styles.submitButtonText}>Procesando...</Text>
                            ) : (
                                <>
                                    <Ionicons name="lock-closed-outline" size={18} color="#FFFFFF" />
                                    <Text style={styles.submitButtonText}>Pagar ${plan?.price.toFixed(2)}</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: '95%'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    planSummary: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#ECFEFF',
        padding: 16,
        borderRadius: 8,
        marginBottom: 24,
    },
    planName: {
        fontSize: 14,
        fontWeight: '600'
    },
    planPrice: {
        fontSize: 18,
        fontWeight: '800',
        color: '#06B6D4'
    },
    formContainer: {
        marginBottom: 16
    },
    inputGroup: {
        marginBottom: 16
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: 14
    },
    inputIcon: {
        marginRight: 10
    },
    input: {
        flex: 1,
        height: 44,
        fontSize: 14,
        fontWeight: '500'
    },
    row: {
        flexDirection: 'row',
        gap: 12
    },
    securityNote: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 24,
    },
    securityText: {
        fontSize: 12,
        fontWeight: '500'
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12
    },
    cancelButton: {
        flex: 1,
        backgroundColor: 'transparent',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    submitButton: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#06B6D4',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    submitButtonDisabled: {
        opacity: 0.5
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    }
});
