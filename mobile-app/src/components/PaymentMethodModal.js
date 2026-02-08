import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function PaymentMethodModal({ visible, onClose, onSelectMethod, plan }) {
    const { theme } = useTheme();

    const handleSelect = (method) => {
        onSelectMethod(method);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.colors.text }]}>
                            Método de Pago
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close-circle" size={28} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {plan && (
                        <View style={styles.planInfo}>
                            <Text style={[styles.planName, { color: theme.colors.textSecondary }]}>
                                Suscripción: <Text style={{ color: theme.colors.text, fontWeight: '700' }}>
                                    {plan.name}
                                </Text>
                            </Text>
                            <Text style={styles.planPrice}>
                                ${plan.price}
                            </Text>
                        </View>
                    )}

                    <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                        Selecciona cómo deseas pagar
                    </Text>

                    {/* Credit Card Option */}
                    <TouchableOpacity
                        style={styles.methodCard}
                        onPress={() => handleSelect('card')}
                    >
                        <View style={styles.methodIconContainer}>
                            <Ionicons name="card" size={32} color="#22D3EE" />
                        </View>
                        <View style={styles.methodInfo}>
                            <Text style={[styles.methodTitle, { color: theme.colors.text }]}>
                                Tarjeta de Crédito/Débito
                            </Text>
                            <Text style={[styles.methodDescription, { color: theme.colors.textSecondary }]}>
                                Pago instantáneo y automático
                            </Text>
                            <View style={styles.badge}>
                                <Ionicons name="flash" size={14} color="#22C55E" />
                                <Text style={styles.badgeText}>Activación inmediata</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
                    </TouchableOpacity>

                    {/* Bank Transfer Option */}
                    <TouchableOpacity
                        style={styles.methodCard}
                        onPress={() => handleSelect('transfer')}
                    >
                        <View style={[styles.methodIconContainer, { backgroundColor: 'rgba(251, 146, 60, 0.15)' }]}>
                            <Ionicons name="business" size={32} color="#FB923C" />
                        </View>
                        <View style={styles.methodInfo}>
                            <Text style={[styles.methodTitle, { color: theme.colors.text }]}>
                                Transferencia Bancaria
                            </Text>
                            <Text style={[styles.methodDescription, { color: theme.colors.textSecondary }]}>
                                Sube tu comprobante de pago
                            </Text>
                            <View style={[styles.badge, { backgroundColor: 'rgba(251, 146, 60, 0.15)', borderColor: '#FB923C' }]}>
                                <Ionicons name="time" size={14} color="#FB923C" />
                                <Text style={[styles.badgeText, { color: '#FB923C' }]}>Requiere aprobación</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={onClose}
                    >
                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>
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
        paddingBottom: 30
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: 0.5
    },
    planInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 16
    },
    planName: {
        fontSize: 14,
        fontWeight: '600'
    },
    planPrice: {
        fontSize: 20,
        fontWeight: '900',
        color: '#22D3EE'
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 16
    },
    methodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(34, 211, 238, 0.05)',
        borderWidth: 2,
        borderColor: 'rgba(34, 211, 238, 0.3)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        gap: 14
    },
    methodIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: 'rgba(34, 211, 238, 0.15)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    methodInfo: {
        flex: 1
    },
    methodTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
        letterSpacing: 0.3
    },
    methodDescription: {
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 8
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
        borderWidth: 1,
        borderColor: '#22C55E'
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#22C55E',
        letterSpacing: 0.3
    },
    cancelButton: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#EF4444',
        marginTop: 8
    },
    cancelButtonText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.3
    }
});
