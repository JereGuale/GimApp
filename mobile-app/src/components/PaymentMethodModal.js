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
                <View style={[styles.modalContent, { backgroundColor: '#FFFFFF' }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: '#111827' }]}>
                            Método de pago
                        </Text>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    {plan && (
                        <View style={styles.planInfoCard}>
                            <View>
                                <Text style={[styles.planInfoLabel, { color: '#6B7280' }]}>
                                    Suscripción
                                </Text>
                                <Text style={[styles.planInfoName, { color: '#111827' }]}>
                                    {plan.name}
                                </Text>
                            </View>
                            <Text style={[styles.planInfoPrice, { color: '#111827' }]}>
                                ${plan.price.toFixed(2)}
                            </Text>
                        </View>
                    )}

                    <Text style={[styles.subtitle, { color: '#111827' }]}>
                        Selecciona cómo deseas pagar
                    </Text>

                    {/* Credit Card Option */}
                    <TouchableOpacity
                        style={[styles.methodCard, { backgroundColor: '#FFFFFF' }]}
                        onPress={() => handleSelect('card')}
                    >
                        <View style={[styles.methodIconContainer, { backgroundColor: '#E0F2FE' }]}>
                            <Ionicons name="card-outline" size={26} color="#0284C7" />
                        </View>
                        <View style={styles.methodInfo}>
                            <Text style={[styles.methodTitle, { color: '#111827' }]}>
                                Tarjeta de Crédito / Débito
                            </Text>
                            <Text style={[styles.methodDescription, { color: '#9CA3AF' }]}>
                                Pago instantáneo y automático
                            </Text>
                            <View style={[styles.badge, { backgroundColor: '#DCFCE7' }]}>
                                <Ionicons name="flash-outline" size={12} color="#16A34A" />
                                <Text style={[styles.badgeText, { color: '#16A34A' }]}>Activación inmediata</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>

                    {/* Bank Transfer Option */}
                    <TouchableOpacity
                        style={[styles.methodCard, { backgroundColor: '#FFFFFF' }]}
                        onPress={() => handleSelect('transfer')}
                    >
                        <View style={[styles.methodIconContainer, { backgroundColor: '#FFEDD5' }]}>
                            <Ionicons name="business-outline" size={26} color="#EA580C" />
                        </View>
                        <View style={styles.methodInfo}>
                            <Text style={[styles.methodTitle, { color: '#111827' }]}>
                                Transferencia Bancaria
                            </Text>
                            <Text style={[styles.methodDescription, { color: '#9CA3AF' }]}>
                                Sube tu comprobante de pago
                            </Text>
                            <View style={[styles.badge, { backgroundColor: '#FEF9C3' }]}>
                                <Ionicons name="time-outline" size={12} color="#CA8A04" />
                                <Text style={[styles.badgeText, { color: '#CA8A04' }]}>Requiere aprobación</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={onClose}
                    >
                        <Text style={[styles.cancelButtonText, { color: '#111827' }]}>Cancelar</Text>
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
        marginBottom: 24
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
    planInfoCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F3F4F6', // Light gray background
        borderRadius: 12,
        padding: 16,
        marginBottom: 24
    },
    planInfoLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 4
    },
    planInfoName: {
        fontSize: 14,
        fontWeight: '700'
    },
    planInfoPrice: {
        fontSize: 22,
        fontWeight: '800',
    },
    subtitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 16
    },
    methodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        gap: 16
    },
    methodIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    methodInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    methodTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    methodDescription: {
        fontSize: 12,
        marginBottom: 8
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    cancelButton: {
        backgroundColor: 'transparent',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginTop: 16
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
    }
});
