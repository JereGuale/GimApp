import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SubscriptionStatusBadge({ status }) {
    const getBadgeConfig = () => {
        switch (status) {
            case 'active':
                return {
                    text: 'ACTIVA',
                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                    borderColor: '#22C55E',
                    textColor: '#22C55E'
                };
            case 'pending':
                return {
                    text: 'PENDIENTE',
                    backgroundColor: 'rgba(251, 146, 60, 0.15)',
                    borderColor: '#FB923C',
                    textColor: '#FB923C'
                };
            case 'rejected':
                return {
                    text: 'RECHAZADA',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    borderColor: '#EF4444',
                    textColor: '#EF4444'
                };
            case 'expired':
                return {
                    text: 'EXPIRADA',
                    backgroundColor: 'rgba(107, 114, 128, 0.15)',
                    borderColor: '#6B7280',
                    textColor: '#6B7280'
                };
            default:
                return {
                    text: 'SIN SUSCRIPCIÓN',
                    backgroundColor: 'rgba(107, 114, 128, 0.15)',
                    borderColor: '#6B7280',
                    textColor: '#9CA3AF'
                };
        }
    };

    const config = getBadgeConfig();

    return (
        <View
            style={[
                styles.badge,
                {
                    backgroundColor: config.backgroundColor,
                    borderColor: config.borderColor
                }
            ]}
        >
            <Text style={[styles.badgeText, { color: config.textColor }]}>
                {config.text}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 2,
        alignSelf: 'flex-start'
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 0.5
    }
});
