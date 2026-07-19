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
                <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.colors.text }]}>
                            Pago por Transferencia
                        </Text>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {plan && (
                        <View style={[styles.planInfoCard, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }]}>
                            <View>
                                <Text style={[styles.planInfoLabel, { color: theme.colors.textSecondary }]}>
                                    Suscripción
                                </Text>
                                <Text style={[styles.planInfoName, { color: theme.colors.text }]}>
                                    {plan.name}
                                </Text>
                            </View>
                            <Text style={[styles.planInfoPrice, { color: theme.colors.text }]}>
                                ${plan.price.toFixed(2)}
                            </Text>
                        </View>
                    )}

                    <Text style={[styles.subtitle, { color: theme.colors.text }]}>
                        Realiza tu pago y sube el comprobante
                    </Text>

                    {/* Bank Transfer Option - único método disponible */}
                    <TouchableOpacity
                        style={[
                          styles.methodCard, 
                          { 
                            backgroundColor: theme.colors.card, 
                            borderColor: '#EA580C', 
                            borderWidth: 1.5 
                          }
                        ]}
                        onPress={() => handleSelect('transfer')}
                    >
                        <View style={[styles.methodIconContainer, { backgroundColor: 'rgba(234, 88, 12, 0.15)' }]}>
                            <Ionicons name="business-outline" size={26} color="#EA580C" />
                        </View>
                        <View style={styles.methodInfo}>
                            <Text style={[styles.methodTitle, { color: theme.colors.text }]}>
                                Transferencia Bancaria
                            </Text>
                            <Text style={[styles.methodDescription, { color: theme.colors.textSecondary }]}>
                                Sube tu comprobante de pago
                            </Text>
                            <View style={[styles.badge, { backgroundColor: theme.isDark ? 'rgba(202, 138, 4, 0.15)' : '#FEF9C3' }]}>
                                <Ionicons name="time-outline" size={12} color="#CA8A04" />
                                <Text style={[styles.badgeText, { color: '#CA8A04' }]}>Requiere aprobación</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#EA580C" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.cancelButton, { borderColor: theme.isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB' }]}
                        onPress={onClose}
                    >
                        <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>Cancelar</Text>
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
