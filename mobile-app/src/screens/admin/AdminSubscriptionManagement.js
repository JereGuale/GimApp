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
import EmptyState from '../../components/EmptyState';

export default function AdminSubscriptionManagement() {
    const { theme } = useTheme();

    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('pending');
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
            setSelectedImage(receiptUrl);
            setImageModalVisible(true);
        } else {
            Alert.alert('Sin Comprobante', 'Esta suscripción no tiene comprobante adjunto');
        }
    };

    const getDaysRemaining = (endsAt) => {
        if (!endsAt) return null;
        const now = new Date();
        const end = new Date(endsAt);
        const diffMs = end - now;
        const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return days;
    };

    const getDaysColor = (days) => {
        if (days === null || days <= 0) return '#EF4444';
        if (days <= 7) return '#FB923C';
        if (days <= 15) return '#FBBF24';
        return '#22C55E';
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    };

    const pendingCount = activeTab === 'pending' ? subscriptions.length : 0;

    // ── Render Pending Card ──
    const renderPendingCard = (subscription) => (
        <View key={subscription.id} style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: 'rgba(251, 146, 60, 0.25)' }]}>
            <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                    {subscription.user?.profile_photo ? (
                        <Image source={{ uri: subscription.user.profile_photo }} style={[styles.avatar, { borderColor: '#FB923C' }]} />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { borderColor: '#FB923C', backgroundColor: 'rgba(251, 146, 60, 0.15)' }]}>
                            <Text style={[styles.avatarInitials, { color: '#FB923C' }]}>{getInitials(subscription.user?.name)}</Text>
                        </View>
                    )}
                    <View style={styles.userDetails}>
                        <Text style={[styles.userName, { color: theme.colors.text }]}>
                            {subscription.user?.name || 'Usuario'}
                        </Text>
                        <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
                            {subscription.user?.email}
                        </Text>
                    </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: 'rgba(251, 146, 60, 0.15)', borderColor: '#FB923C' }]}>
                    <Text style={[styles.statusText, { color: '#FB923C' }]}>PENDIENTE</Text>
                </View>
            </View>

            <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                    <Ionicons name="fitness-outline" size={16} color={theme.colors.textSecondary} />
                    <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Plan</Text>
                    <Text style={[styles.infoValue, { color: theme.colors.text }]}>{subscription.plan?.name || 'Plan'}</Text>
                </View>
                <View style={styles.infoItem}>
                    <Ionicons name="cash-outline" size={16} color={theme.colors.textSecondary} />
                    <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Monto</Text>
                    <Text style={[styles.infoValue, { color: '#FB923C' }]}>${subscription.price}</Text>
                </View>
                <View style={styles.infoItem}>
                    <Ionicons name="card-outline" size={16} color={theme.colors.textSecondary} />
                    <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Método</Text>
                    <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                        {subscription.payment_method === 'card' ? 'Tarjeta' : subscription.payment_method === 'manual' ? 'Manual' : 'Transferencia'}
                    </Text>
                </View>
                <View style={styles.infoItem}>
                    <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
                    <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Fecha</Text>
                    <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                        {new Date(subscription.created_at).toLocaleDateString()}
                    </Text>
                </View>
            </View>

            <View style={styles.actions}>
                {subscription.payment_receipt && (
                    <TouchableOpacity style={[styles.receiptBtn, { borderColor: theme.colors.border }]} onPress={() => handleViewReceipt(subscription)}>
                        <Ionicons name="image-outline" size={18} color="#22D3EE" />
                        <Text style={{ color: '#22D3EE', fontSize: 13, fontWeight: '600' }}>Ver Comprobante</Text>
                    </TouchableOpacity>
                )}
                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(subscription)}>
                        <Ionicons name="close" size={20} color="#EF4444" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(subscription)}>
                        <Ionicons name="checkmark" size={20} color="#fff" />
                        <Text style={styles.approveBtnText}>Aprobar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    // ── Render Approved Card (with days remaining + photo) ──
    const renderApprovedCard = (subscription) => {
        const days = getDaysRemaining(subscription.ends_at);
        const daysColor = getDaysColor(days);
        const isExpired = days !== null && days <= 0;

        return (
            <View key={subscription.id} style={[styles.approvedCard, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.approvedRow}>
                    {/* User photo */}
                    {subscription.user?.profile_photo ? (
                        <Image source={{ uri: subscription.user.profile_photo }} style={[styles.approvedAvatar, { borderColor: daysColor }]} />
                    ) : (
                        <View style={[styles.approvedAvatarPlaceholder, { borderColor: daysColor, backgroundColor: daysColor + '20' }]}>
                            <Text style={[styles.approvedInitials, { color: daysColor }]}>{getInitials(subscription.user?.name)}</Text>
                        </View>
                    )}

                    {/* User info */}
                    <View style={styles.approvedInfo}>
                        <Text style={[styles.approvedName, { color: theme.colors.text }]} numberOfLines={1}>
                            {subscription.user?.name || 'Usuario'}
                        </Text>
                        <Text style={[styles.approvedPlan, { color: theme.colors.textSecondary }]}>
                            {subscription.plan?.name || 'Plan'} · ${subscription.price}
                        </Text>
                        {subscription.starts_at && (
                            <Text style={[styles.approvedDates, { color: theme.colors.textSecondary }]}>
                                {new Date(subscription.starts_at).toLocaleDateString()} → {new Date(subscription.ends_at).toLocaleDateString()}
                            </Text>
                        )}
                    </View>

                    {/* Days remaining badge */}
                    <View style={[styles.daysBadge, { backgroundColor: daysColor + '18', borderColor: daysColor }]}>
                        {isExpired ? (
                            <>
                                <Ionicons name="alert-circle" size={16} color={daysColor} />
                                <Text style={[styles.daysNumber, { color: daysColor }]}>Exp</Text>
                            </>
                        ) : (
                            <>
                                <Text style={[styles.daysNumber, { color: daysColor }]}>{days ?? '—'}</Text>
                                <Text style={[styles.daysLabel, { color: daysColor }]}>días</Text>
                            </>
                        )}
                    </View>
                </View>
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
            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.colors.text }]}>Gestión de Suscripciones</Text>

                <View style={styles.tabs}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'pending' && styles.tabActivePending]}
                        onPress={() => setActiveTab('pending')}
                    >
                        <Text style={[styles.tabText, { color: activeTab === 'pending' ? '#FB923C' : theme.colors.textSecondary }]}>
                            Pendientes
                        </Text>
                        {activeTab === 'pending' && pendingCount > 0 && (
                            <View style={styles.tabBadge}>
                                <Text style={styles.tabBadgeText}>{pendingCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'approved' && styles.tabActiveApproved]}
                        onPress={() => setActiveTab('approved')}
                    >
                        <Text style={[styles.tabText, { color: activeTab === 'approved' ? '#22C55E' : theme.colors.textSecondary }]}>
                            Aprobadas
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content */}
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FB923C" />}
                showsVerticalScrollIndicator={false}
            >
                {subscriptions.length === 0 ? (
                    <EmptyState
                        icon="folder-open-outline"
                        title={`No hay suscripciones ${activeTab === 'pending' ? 'pendientes' : 'aprobadas'}`}
                        subtitle="Las suscripciones aparecerán aquí cuando los usuarios se suscriban"
                    />
                ) : activeTab === 'pending' ? (
                    subscriptions.map(renderPendingCard)
                ) : (
                    <>
                        {/* Summary bar */}
                        <View style={[styles.summaryBar, { backgroundColor: theme.colors.surface }]}>
                            <View style={styles.summaryItem}>
                                <Text style={[styles.summaryValue, { color: '#22C55E' }]}>{subscriptions.length}</Text>
                                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Activas</Text>
                            </View>
                            <View style={[styles.summaryDivider, { backgroundColor: theme.colors.border }]} />
                            <View style={styles.summaryItem}>
                                <Text style={[styles.summaryValue, { color: '#FB923C' }]}>
                                    {subscriptions.filter(s => { const d = getDaysRemaining(s.ends_at); return d !== null && d <= 7 && d > 0; }).length}
                                </Text>
                                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Por vencer</Text>
                            </View>
                            <View style={[styles.summaryDivider, { backgroundColor: theme.colors.border }]} />
                            <View style={styles.summaryItem}>
                                <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
                                    {subscriptions.filter(s => { const d = getDaysRemaining(s.ends_at); return d !== null && d <= 0; }).length}
                                </Text>
                                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Expiradas</Text>
                            </View>
                        </View>

                        {/* Approved list */}
                        {subscriptions.map(renderApprovedCard)}
                    </>
                )}

                {subscriptions.length > 0 && (
                    <Text style={[styles.countText, { color: theme.colors.textSecondary }]}>
                        {subscriptions.length} suscripción{subscriptions.length !== 1 ? 'es' : ''}
                    </Text>
                )}
            </ScrollView>

            {/* Receipt Image Modal */}
            <Modal visible={imageModalVisible} transparent onRequestClose={() => setImageModalVisible(false)}>
                <View style={styles.imageModalContainer}>
                    <TouchableOpacity style={styles.closeButton} onPress={() => setImageModalVisible(false)}>
                        <Ionicons name="close-circle" size={40} color="#FFF" />
                    </TouchableOpacity>
                    {selectedImage && (
                        <Image source={{ uri: selectedImage }} style={styles.fullImage} resizeMode="contain" />
                    )}
                </View>
            </Modal>

            {/* Reject Modal */}
            <Modal visible={rejectModalVisible} transparent animationType="slide" onRequestClose={() => setRejectModalVisible(false)}>
                <View style={styles.rejectModalOverlay}>
                    <View style={[styles.rejectModalContent, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.rejectModalTitle, { color: theme.colors.text }]}>Rechazar Suscripción</Text>
                        <Text style={[styles.rejectModalSub, { color: theme.colors.textSecondary }]}>Selecciona un motivo de rechazo:</Text>

                        <View style={styles.reasonButtons}>
                            {['Comprobante ilegible', 'Comprobante no válido', 'Monto incorrecto'].map((reason) => (
                                <TouchableOpacity
                                    key={reason}
                                    style={[styles.reasonBtn, rejectReason === reason && styles.reasonBtnActive]}
                                    onPress={() => setRejectReason(reason)}
                                >
                                    <Text style={[styles.reasonBtnText, rejectReason === reason && { color: '#fff' }]}>{reason}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.rejectModalBtns}>
                            <TouchableOpacity
                                style={[styles.rejectModalBtn, { borderColor: theme.colors.border, borderWidth: 1.5 }]}
                                onPress={() => { setRejectModalVisible(false); setRejectReason(''); }}
                            >
                                <Text style={[styles.rejectModalBtnText, { color: theme.colors.text }]}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.rejectModalBtn, { backgroundColor: '#EF4444' }]} onPress={confirmReject}>
                                <Text style={[styles.rejectModalBtnText, { color: '#fff' }]}>Rechazar</Text>
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
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 14, fontWeight: '600' },

    /* Header */
    header: { padding: 16, paddingBottom: 12 },
    title: { fontSize: 22, fontWeight: '800', marginBottom: 16, letterSpacing: 0.3 },
    tabs: { flexDirection: 'row', gap: 10 },
    tab: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 11, borderRadius: 12, borderWidth: 1.5,
        borderColor: 'transparent', gap: 6,
    },
    tabActivePending: { backgroundColor: 'rgba(251, 146, 60, 0.12)', borderColor: '#FB923C' },
    tabActiveApproved: { backgroundColor: 'rgba(34, 197, 94, 0.12)', borderColor: '#22C55E' },
    tabText: { fontSize: 14, fontWeight: '700' },
    tabBadge: {
        backgroundColor: '#FB923C', width: 22, height: 22, borderRadius: 11,
        alignItems: 'center', justifyContent: 'center',
    },
    tabBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '800' },

    /* Content */
    content: { padding: 16, paddingTop: 8 },

    /* ── Pending Card ── */
    card: {
        borderRadius: 16, padding: 16, marginBottom: 14,
        borderWidth: 1, shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08,
        shadowRadius: 8, elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 14,
    },
    userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
    avatar: {
        width: 48, height: 48, borderRadius: 24, borderWidth: 2.5,
    },
    avatarPlaceholder: {
        width: 48, height: 48, borderRadius: 24, borderWidth: 2.5,
        alignItems: 'center', justifyContent: 'center',
    },
    avatarInitials: { fontSize: 16, fontWeight: '800' },
    userDetails: { flex: 1 },
    userName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
    userEmail: { fontSize: 12, fontWeight: '500' },
    statusBadge: {
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1,
    },
    statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

    infoGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14,
    },
    infoItem: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.04)', minWidth: '45%',
    },
    infoLabel: { fontSize: 11, fontWeight: '500' },
    infoValue: { fontSize: 12, fontWeight: '700' },

    actions: { gap: 10 },
    receiptBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1,
    },
    actionRow: { flexDirection: 'row', gap: 10 },
    rejectBtn: {
        width: 46, height: 46, borderRadius: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.12)', borderWidth: 1, borderColor: '#EF4444',
        alignItems: 'center', justifyContent: 'center',
    },
    approveBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, backgroundColor: '#22C55E', paddingVertical: 12, borderRadius: 12,
        shadowColor: '#22C55E', shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35, shadowRadius: 8, elevation: 4,
    },
    approveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

    /* ── Approved Card ── */
    approvedCard: {
        borderRadius: 14, padding: 14, marginBottom: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    },
    approvedRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    approvedAvatar: {
        width: 52, height: 52, borderRadius: 26, borderWidth: 2.5,
    },
    approvedAvatarPlaceholder: {
        width: 52, height: 52, borderRadius: 26, borderWidth: 2.5,
        alignItems: 'center', justifyContent: 'center',
    },
    approvedInitials: { fontSize: 18, fontWeight: '800' },
    approvedInfo: { flex: 1 },
    approvedName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
    approvedPlan: { fontSize: 12, fontWeight: '600', marginBottom: 1 },
    approvedDates: { fontSize: 11 },
    daysBadge: {
        alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
        borderWidth: 1.5, minWidth: 56,
    },
    daysNumber: { fontSize: 22, fontWeight: '900' },
    daysLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginTop: -2 },

    /* Summary bar */
    summaryBar: {
        flexDirection: 'row', borderRadius: 14, padding: 14,
        marginBottom: 14, alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryValue: { fontSize: 24, fontWeight: '900' },
    summaryLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
    summaryDivider: { width: 1, height: 36 },

    countText: { fontSize: 12, fontWeight: '500', textAlign: 'right', marginTop: 4 },

    /* Modals */
    imageModalContainer: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center', alignItems: 'center',
    },
    closeButton: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
    fullImage: { width: '100%', height: '80%' },

    rejectModalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end',
    },
    rejectModalContent: {
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 24, paddingBottom: 34,
    },
    rejectModalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
    rejectModalSub: { fontSize: 14, marginBottom: 16 },
    reasonButtons: { gap: 8, marginBottom: 20 },
    reasonBtn: {
        padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#FB923C',
        backgroundColor: 'rgba(251, 146, 60, 0.1)',
    },
    reasonBtnActive: { backgroundColor: '#FB923C' },
    reasonBtnText: { color: '#FB923C', fontSize: 14, fontWeight: '700', textAlign: 'center' },
    rejectModalBtns: { flexDirection: 'row', gap: 12 },
    rejectModalBtn: {
        flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    },
    rejectModalBtnText: { fontSize: 15, fontWeight: '700' },
});
