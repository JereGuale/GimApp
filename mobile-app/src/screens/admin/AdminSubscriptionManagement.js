import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Modal,
    Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { TrainerSubscriptionAPI } from '../../services/subscriptionService';
import SubscriptionStatusBadge from '../../components/SubscriptionStatusBadge';
import EmptyState from '../../components/EmptyState';

export default function AdminSubscriptionManagement() {
    const { theme } = useTheme();

    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'approved', 'rejected'
    const [selectedImage, setSelectedImage] = useState(null);
    const [imageModalVisible, setImageModalVisible] = useState(false);
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [selectedSubscription, setSelectedSubscription] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    useFocusEffect(
        useCallback(() => {
            loadSubscriptions();
        }, [activeTab])
    );

    const loadSubscriptions = async () => {
        setLoading(true);
        const filters = {};

        if (activeTab === 'pending') filters.status = 'pending';
        else if (activeTab === 'approved') filters.status = 'active';
        else if (activeTab === 'rejected') filters.status = 'rejected';

        const result = await TrainerSubscriptionAPI.getSubscriptions(filters);

        if (result.success) {
            setSubscriptions(result.data);
        } else {
            Alert.alert('Error', result.error);
        }

        setLoading(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadSubscriptions();
        setRefreshing(false);
    };

    const handleApprove = async (subscription) => {
        Alert.alert(
            'Aprobar Suscripción',
            `¿Confirmas que deseas aprobar la suscripción de ${subscription.user?.name}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Aprobar',
                    onPress: async () => {
                        const result = await TrainerSubscriptionAPI.approveSubscription(subscription.id);
                        if (result.success) {
                            Alert.alert('¡Éxito!', result.message);
                            loadSubscriptions();
                        } else {
                            Alert.alert('Error', result.error);
                        }
                    }
                }
            ]
        );
    };

    const handleReject = (subscription) => {
        setSelectedSubscription(subscription);
        setRejectModalVisible(true);
    };

    const confirmReject = async () => {
        if (!selectedSubscription) return;

        const result = await TrainerSubscriptionAPI.rejectSubscription(
            selectedSubscription.id,
            rejectReason || 'Comprobante no válido'
        );

        if (result.success) {
            Alert.alert('Suscripción Rechazada', result.message);
            setRejectModalVisible(false);
            setRejectReason('');
            setSelectedSubscription(null);
            loadSubscriptions();
        } else {
            Alert.alert('Error', result.error);
        }
    };

    const handleViewReceipt = (subscription) => {
        if (subscription.payment_receipt) {
            const receiptUrl = `http://localhost:8000/storage/${subscription.payment_receipt}`;
            setSelectedImage(receiptUrl);
            setImageModalVisible(true);
        } else {
            Alert.alert('Sin Comprobante', 'Esta suscripción no tiene comprobante adjunto');
        }
    };

    const getPendingCount = () => {
        return subscriptions.filter(s => s.status === 'pending').length;
    };

    const getTabColor = (tab) => {
        if (tab === 'pending') return '#FB923C';
        if (tab === 'approved') return '#22C55E';
        return '#EF4444';
    };

    const renderSubscriptionCard = (subscription) => {
        const tabColor = getTabColor(activeTab);

        return (
            <View key={subscription.id} style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.cardHeader}>
                    <View style={styles.userInfo}>
                        <View style={[styles.avatar, { borderColor: tabColor }]}>
                            <Ionicons name="person" size={28} color={tabColor} />
                        </View>
                        <View style={styles.userDetails}>
                            <Text style={[styles.userName, { color: theme.colors.text }]}>
                                {subscription.user?.name || 'Usuario'}
                            </Text>
                            <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
                                {subscription.user?.email}
                            </Text>
                        </View>
                    </View>
                    <SubscriptionStatusBadge status={subscription.status} />
                </View>

                <View style={styles.planInfo}>
                    <View style={styles.planRow}>
                        <Ionicons name="fitness-outline" size={20} color="#22D3EE" />
                        <Text style={[styles.planText, { color: theme.colors.textSecondary }]}>
                            Plan: <Text style={{ color: theme.colors.text, fontWeight: '700' }}>
                                {subscription.plan?.name || 'Plan'}
                            </Text>
                        </Text>
                    </View>
                    <View style={styles.planRow}>
                        <Ionicons name="cash-outline" size={20} color="#22D3EE" />
                        <Text style={[styles.planText, { color: theme.colors.textSecondary }]}>
                            Monto: <Text style={{ color: '#22D3EE', fontWeight: '700' }}>
                                ${subscription.price}
                            </Text>
                        </Text>
                    </View>
                    <View style={styles.planRow}>
                        <Ionicons name="card-outline" size={20} color="#22D3EE" />
                        <Text style={[styles.planText, { color: theme.colors.textSecondary }]}>
                            Método: <Text style={{ color: theme.colors.text, fontWeight: '700' }}>
                                {subscription.payment_method === 'card' ? 'Tarjeta' :
                                    subscription.payment_method === 'manual' ? 'Manual' : 'Transferencia'}
                            </Text>
                        </Text>
                    </View>
                    <View style={styles.planRow}>
                        <Ionicons name="calendar-outline" size={20} color="#22D3EE" />
                        <Text style={[styles.planText, { color: theme.colors.textSecondary }]}>
                            Fecha: <Text style={{ color: theme.colors.text, fontWeight: '700' }}>
                                {new Date(subscription.created_at).toLocaleDateString()}
                            </Text>
                        </Text>
                    </View>
                    {activeTab === 'approved' && subscription.starts_at && subscription.ends_at && (
                        <>
                            <View style={styles.planRow}>
                                <Ionicons name="play-circle-outline" size={20} color="#22C55E" />
                                <Text style={[styles.planText, { color: theme.colors.textSecondary }]}>
                                    Inicio: <Text style={{ color: theme.colors.text, fontWeight: '700' }}>
                                        {new Date(subscription.starts_at).toLocaleDateString()}
                                    </Text>
                                </Text>
                            </View>
                            <View style={styles.planRow}>
                                <Ionicons name="stop-circle-outline" size={20} color="#EF4444" />
                                <Text style={[styles.planText, { color: theme.colors.textSecondary }]}>
                                    Vence: <Text style={{ color: theme.colors.text, fontWeight: '700' }}>
                                        {new Date(subscription.ends_at).toLocaleDateString()}
                                    </Text>
                                </Text>
                            </View>
                        </>
                    )}
                </View>

                {/* Actions */}
                {activeTab === 'pending' && (
                    <View style={styles.actions}>
                        {subscription.payment_receipt && (
                            <TouchableOpacity
                                style={styles.viewButton}
                                onPress={() => handleViewReceipt(subscription)}
                            >
                                <Ionicons name="image-outline" size={20} color="#22D3EE" />
                                <Text style={styles.viewButtonText}>Ver Comprobante</Text>
                            </TouchableOpacity>
                        )}

                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={styles.rejectButton}
                                onPress={() => handleReject(subscription)}
                            >
                                <Ionicons name="close-circle" size={24} color="#EF4444" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.approveButton}
                                onPress={() => handleApprove(subscription)}
                            >
                                <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
                                <Text style={styles.approveButtonText}>Aprobar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {activeTab === 'rejected' && subscription.rejection_reason && (
                    <View style={styles.rejectionInfo}>
                        <Ionicons name="information-circle" size={20} color="#EF4444" />
                        <Text style={[styles.rejectionText, { color: theme.colors.textSecondary }]}>
                            {subscription.rejection_reason}
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color="#FB923C" />
                <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                    Cargando suscripciones...
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Header with Tabs */}
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.colors.text }]}>
                    Gestión de Suscripciones
                </Text>

                <View style={styles.tabs}>
                    <TouchableOpacity
                        style={[
                            styles.tab,
                            activeTab === 'pending' && { backgroundColor: 'rgba(251, 146, 60, 0.15)', borderColor: '#FB923C' }
                        ]}
                        onPress={() => setActiveTab('pending')}
                    >
                        <Text style={[
                            styles.tabText,
                            { color: activeTab === 'pending' ? '#FB923C' : theme.colors.textSecondary }
                        ]}>
                            Pendientes
                        </Text>
                        {activeTab === 'pending' && getPendingCount() > 0 && (
                            <View style={styles.tabBadge}>
                                <Text style={styles.tabBadgeText}>{getPendingCount()}</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.tab,
                            activeTab === 'approved' && { backgroundColor: 'rgba(34, 197, 94, 0.15)', borderColor: '#22C55E' }
                        ]}
                        onPress={() => setActiveTab('approved')}
                    >
                        <Text style={[
                            styles.tabText,
                            { color: activeTab === 'approved' ? '#22C55E' : theme.colors.textSecondary }
                        ]}>
                            Aprobadas
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.tab,
                            activeTab === 'rejected' && { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: '#EF4444' }
                        ]}
                        onPress={() => setActiveTab('rejected')}
                    >
                        <Text style={[
                            styles.tabText,
                            { color: activeTab === 'rejected' ? '#EF4444' : theme.colors.textSecondary }
                        ]}>
                            Rechazadas
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Subscriptions List */}
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#FB923C"
                    />
                }
            >
                {subscriptions.length === 0 ? (
                    <EmptyState
                        icon="folder-open-outline"
                        title={`No hay suscripciones ${activeTab === 'pending' ? 'pendientes' : activeTab === 'approved' ? 'aprobadas' : 'rechazadas'}`}
                        subtitle="Las suscripciones aparecerán aquí"
                    />
                ) : (
                    subscriptions.map(renderSubscriptionCard)
                )}
            </ScrollView>

            {/* Receipt Image Modal */}
            <Modal
                visible={imageModalVisible}
                transparent={true}
                onRequestClose={() => setImageModalVisible(false)}
            >
                <View style={styles.imageModalContainer}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setImageModalVisible(false)}
                    >
                        <Ionicons name="close-circle" size={40} color="#FFF" />
                    </TouchableOpacity>
                    {selectedImage && (
                        <Image
                            source={{ uri: selectedImage }}
                            style={styles.fullImage}
                            resizeMode="contain"
                        />
                    )}
                </View>
            </Modal>

            {/* Reject Modal */}
            <Modal
                visible={rejectModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setRejectModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                            Rechazar Suscripción
                        </Text>
                        <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
                            ¿Deseas agregar un motivo de rechazo?
                        </Text>

                        <View style={styles.reasonButtons}>
                            <TouchableOpacity
                                style={styles.reasonButton}
                                onPress={() => setRejectReason('Comprobante ilegible')}
                            >
                                <Text style={styles.reasonButtonText}>Comprobante ilegible</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.reasonButton}
                                onPress={() => setRejectReason('Comprobante no válido')}
                            >
                                <Text style={styles.reasonButtonText}>Comprobante no válido</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.reasonButton}
                                onPress={() => setRejectReason('Monto incorrecto')}
                            >
                                <Text style={styles.reasonButtonText}>Monto incorrecto</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => {
                                    setRejectModalVisible(false);
                                    setRejectReason('');
                                }}
                            >
                                <Text style={styles.modalCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalConfirmButton}
                                onPress={confirmReject}
                            >
                                <Text style={styles.modalConfirmText}>Rechazar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        fontWeight: '600'
    },
    header: {
        padding: 16,
        paddingBottom: 12
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 16,
        letterSpacing: 0.5
    },
    tabs: {
        flexDirection: 'row',
        gap: 10
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
        gap: 6
    },
    tabText: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.3
    },
    tabBadge: {
        backgroundColor: '#FB923C',
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center'
    },
    tabBadgeText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '800'
    },
    content: {
        padding: 16,
        paddingTop: 8
    },
    card: {
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
        borderWidth: 2,
        borderColor: 'rgba(251, 146, 60, 0.3)',
        shadowColor: '#FB923C',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        borderWidth: 3,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(251, 146, 60, 0.15)'
    },
    userDetails: {
        flex: 1
    },
    userName: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 4,
        letterSpacing: 0.3
    },
    userEmail: {
        fontSize: 13,
        fontWeight: '500'
    },
    planInfo: {
        gap: 10,
        marginBottom: 16
    },
    planRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    planText: {
        fontSize: 14,
        fontWeight: '600'
    },
    actions: {
        gap: 12
    },
    viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(34, 211, 238, 0.15)',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#22D3EE'
    },
    viewButtonText: {
        color: '#22D3EE',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.3
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 10
    },
    rejectButton: {
        width: 52,
        height: 52,
        borderRadius: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#EF4444'
    },
    approveButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#22C55E',
        paddingVertical: 14,
        borderRadius: 12,
        shadowColor: '#22C55E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 6
    },
    approveButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5
    },
    rejectionInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EF4444'
    },
    rejectionText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600'
    },
    imageModalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10
    },
    fullImage: {
        width: '100%',
        height: '80%'
    },
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
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 8,
        letterSpacing: 0.5
    },
    modalSubtitle: {
        fontSize: 15,
        marginBottom: 20
    },
    reasonButtons: {
        gap: 10,
        marginBottom: 20
    },
    reasonButton: {
        backgroundColor: 'rgba(251, 146, 60, 0.15)',
        padding: 14,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#FB923C'
    },
    reasonButtonText: {
        color: '#FB923C',
        fontSize: 15,
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: 0.3
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12
    },
    modalCancelButton: {
        flex: 1,
        backgroundColor: 'rgba(107, 114, 128, 0.15)',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#6B7280'
    },
    modalCancelText: {
        color: '#9CA3AF',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.3
    },
    modalConfirmButton: {
        flex: 1,
        backgroundColor: '#EF4444',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 6
    },
    modalConfirmText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5
    }
});
