import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';

const getNotificationIcon = (type) => {
    switch (type) {
        case 'subscription_request':
            return { name: 'card-outline', color: '#FB923C' };
        case 'subscription_approved':
            return { name: 'checkmark-circle-outline', color: '#22C55E' };
        case 'subscription_rejected':
            return { name: 'close-circle-outline', color: '#EF4444' };
        default:
            return { name: 'notifications-outline', color: '#22D3EE' };
    }
};

const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString();
};

export default function NotificationPanel({ visible, onClose, onNotificationPress }) {
    const { theme } = useTheme();
    const {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead
    } = useNotifications();

    React.useEffect(() => {
        if (visible) {
            fetchNotifications();
        }
    }, [visible]);

    const handleNotificationPress = async (notification) => {
        if (!notification.read_at) {
            await markAsRead(notification.id);
        }
        if (onNotificationPress) {
            onNotificationPress(notification);
        }
    };

    const handleMarkAllRead = async () => {
        await markAllAsRead();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Ionicons name="notifications" size={22} color="#FB923C" />
                            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                                Notificaciones
                            </Text>
                            {unreadCount > 0 && (
                                <View style={styles.headerBadge}>
                                    <Text style={styles.headerBadgeText}>{unreadCount}</Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.headerRight}>
                            {unreadCount > 0 && (
                                <TouchableOpacity
                                    style={styles.markAllBtn}
                                    onPress={handleMarkAllRead}
                                >
                                    <Text style={styles.markAllText}>Marcar todo leído</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Content */}
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#FB923C" />
                            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                                Cargando notificaciones...
                            </Text>
                        </View>
                    ) : notifications.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="notifications-off-outline" size={64} color={theme.colors.textSecondary} />
                            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                                Sin notificaciones
                            </Text>
                            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                                Las solicitudes de suscripción aparecerán aquí
                            </Text>
                        </View>
                    ) : (
                        <ScrollView
                            style={styles.list}
                            showsVerticalScrollIndicator={false}
                        >
                            {notifications.map((notification) => {
                                const icon = getNotificationIcon(notification.type);
                                const isUnread = !notification.read_at;
                                const userPhoto = notification.data?.user_photo;

                                return (
                                    <TouchableOpacity
                                        key={notification.id}
                                        style={[
                                            styles.notificationItem,
                                            {
                                                backgroundColor: isUnread
                                                    ? 'rgba(251, 146, 60, 0.08)'
                                                    : 'transparent',
                                                borderBottomColor: theme.colors.border
                                            }
                                        ]}
                                        onPress={() => handleNotificationPress(notification)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.notificationRow}>
                                            {/* User photo or icon */}
                                            {userPhoto ? (
                                                <Image
                                                    source={{ uri: userPhoto }}
                                                    style={[styles.notificationAvatar, { borderColor: icon.color }]}
                                                />
                                            ) : (
                                                <View style={[styles.notificationIconContainer, { backgroundColor: icon.color + '18', borderColor: icon.color }]}>
                                                    <Ionicons name={icon.name} size={22} color={icon.color} />
                                                </View>
                                            )}

                                            <View style={styles.notificationContent}>
                                                <View style={styles.notificationTitleRow}>
                                                    <Text
                                                        style={[
                                                            styles.notificationTitle,
                                                            { color: theme.colors.text },
                                                            isUnread && styles.notificationTitleBold
                                                        ]}
                                                        numberOfLines={1}
                                                    >
                                                        {notification.title}
                                                    </Text>
                                                    {isUnread && <View style={styles.unreadDot} />}
                                                </View>
                                                <Text
                                                    style={[styles.notificationMessage, { color: theme.colors.textSecondary }]}
                                                    numberOfLines={2}
                                                >
                                                    {notification.message}
                                                </Text>

                                                {/* Payment info for subscription requests */}
                                                {notification.data?.price && (
                                                    <View style={styles.notificationMeta}>
                                                        <View style={[styles.metaTag, { backgroundColor: icon.color + '15' }]}>
                                                            <Text style={[styles.metaText, { color: icon.color }]}>
                                                                ${notification.data.price}
                                                            </Text>
                                                        </View>
                                                        {notification.data?.plan_name && (
                                                            <View style={[styles.metaTag, { backgroundColor: 'rgba(34, 211, 238, 0.1)' }]}>
                                                                <Text style={[styles.metaText, { color: '#22D3EE' }]}>
                                                                    {notification.data.plan_name}
                                                                </Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                )}

                                                <Text style={[styles.notificationTime, { color: theme.colors.textSecondary }]}>
                                                    {getTimeAgo(notification.created_at)}
                                                </Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    container: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        minHeight: '50%',
        paddingBottom: 34,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
    },
    headerBadge: {
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
    },
    headerBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '800',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    markAllBtn: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: 'rgba(34, 211, 238, 0.1)',
    },
    markAllText: {
        color: '#22D3EE',
        fontSize: 12,
        fontWeight: '700',
    },
    closeBtn: {
        padding: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 13,
        marginTop: 6,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    list: {
        flex: 1,
    },
    notificationItem: {
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    notificationRow: {
        flexDirection: 'row',
        gap: 12,
    },
    notificationAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
    },
    notificationIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificationContent: {
        flex: 1,
    },
    notificationTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    notificationTitle: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    notificationTitleBold: {
        fontWeight: '800',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FB923C',
        marginLeft: 8,
    },
    notificationMessage: {
        fontSize: 13,
        marginTop: 3,
        lineHeight: 18,
    },
    notificationMeta: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 8,
    },
    metaTag: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    metaText: {
        fontSize: 11,
        fontWeight: '700',
    },
    notificationTime: {
        fontSize: 11,
        marginTop: 6,
        fontWeight: '500',
    },
});
