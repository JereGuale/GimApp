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
                <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.colors.text }]}>
                            Pago con Tarjeta
                        </Text>
                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name="close-circle" size={28} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Plan Summary */}
                    {plan && (
                        <View style={styles.planSummary}>
                            <Text style={[styles.planName, { color: theme.colors.text }]}>
                                {plan.name}
                            </Text>
                            <Text style={styles.planPrice}>
                                ${plan.price}
                            </Text>
                        </View>
                    )}

                    {/* Card Form */}
                    <View style={styles.formContainer}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                                Número de Tarjeta
                            </Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="card-outline" size={20} color="#22D3EE" style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: theme.colors.text }]}
                                    placeholder="1234 5678 9012 3456"
                                    placeholderTextColor={theme.colors.textSecondary}
                                    value={cardNumber}
                                    onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                                    keyboardType="numeric"
                                    maxLength={19}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                                Nombre en la Tarjeta
                            </Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="person-outline" size={20} color="#22D3EE" style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: theme.colors.text }]}
                                    placeholder="JUAN PEREZ"
                                    placeholderTextColor={theme.colors.textSecondary}
                                    value={cardName}
                                    onChangeText={setCardName}
                                    autoCapitalize="characters"
                                />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                                    Vencimiento
                                </Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="calendar-outline" size={20} color="#22D3EE" style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, { color: theme.colors.text }]}
                                        placeholder="MM/YY"
                                        placeholderTextColor={theme.colors.textSecondary}
                                        value={cardExpiry}
                                        onChangeText={(text) => setCardExpiry(formatExpiry(text))}
                                        keyboardType="numeric"
                                        maxLength={5}
                                    />
                                </View>
                            </View>

                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                                    CVV
                                </Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="lock-closed-outline" size={20} color="#22D3EE" style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, { color: theme.colors.text }]}
                                        placeholder="123"
                                        placeholderTextColor={theme.colors.textSecondary}
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
                        <Ionicons name="shield-checkmark" size={18} color="#22C55E" />
                        <Text style={[styles.securityText, { color: theme.colors.textSecondary }]}>
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
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
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
                                    <Ionicons name="checkmark-circle" size={20} color="#0B0F14" />
                                    <Text style={styles.submitButtonText}>Pagar ${plan?.price}</Text>
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
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: 0.5
    },
    planSummary: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(34, 211, 238, 0.1)',
        padding: 16,
        borderRadius: 14,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: 'rgba(34, 211, 238, 0.3)'
    },
    planName: {
        fontSize: 16,
        fontWeight: '700'
    },
    planPrice: {
        fontSize: 24,
        fontWeight: '900',
        color: '#22D3EE'
    },
    formContainer: {
        marginBottom: 16
    },
    inputGroup: {
        marginBottom: 16
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: 0.3
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(34, 211, 238, 0.1)',
        borderWidth: 2,
        borderColor: 'rgba(34, 211, 238, 0.3)',
        borderRadius: 12,
        paddingHorizontal: 14
    },
    inputIcon: {
        marginRight: 10
    },
    input: {
        flex: 1,
        height: 48,
        fontSize: 15,
        fontWeight: '600'
    },
    row: {
        flexDirection: 'row',
        gap: 12
    },
    securityNote: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 20,
        paddingVertical: 10
    },
    securityText: {
        fontSize: 13,
        fontWeight: '600'
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12
    },
    cancelButton: {
        flex: 1,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#EF4444'
    },
    cancelButtonText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.3
    },
    submitButton: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#22D3EE',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#22D3EE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8
    },
    submitButtonDisabled: {
        opacity: 0.5
    },
    submitButtonText: {
        color: '#0B0F14',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5
    }
});
