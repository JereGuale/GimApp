import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { NotificationAPI } from '../services/notificationService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const intervalRef = useRef(null);

    const fetchUnreadCount = useCallback(async () => {
        if (!user) return;
        const result = await NotificationAPI.getUnreadCount();
        if (result.success) {
            setUnreadCount(result.count);
        }
    }, [user]);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const result = await NotificationAPI.getNotifications();
        if (result.success) {
            setNotifications(result.data);
            // Update unread count from data
            const unread = result.data.filter(n => !n.read_at).length;
            setUnreadCount(unread);
        }
        setLoading(false);
    }, [user]);

    const markAsRead = useCallback(async (notificationId) => {
        const result = await NotificationAPI.markAsRead(notificationId);
        if (result.success) {
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
        return result;
    }, []);

    const markAllAsRead = useCallback(async () => {
        const result = await NotificationAPI.markAllAsRead();
        if (result.success) {
            setNotifications(prev =>
                prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
            );
            setUnreadCount(0);
        }
        return result;
    }, []);

    // Poll for new notifications every 30 seconds
    useEffect(() => {
        if (user) {
            fetchUnreadCount();
            intervalRef.current = setInterval(fetchUnreadCount, 30000);
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [user, fetchUnreadCount]);

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            fetchNotifications,
            fetchUnreadCount,
            markAsRead,
            markAllAsRead
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
