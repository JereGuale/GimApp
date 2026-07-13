import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';


export default function MetricCard({ icon, iconColor, title, value, subtitle, trend, gradientColors }) {
    const { theme } = useTheme();

    const getTrendColor = () => {
        if (gradientColors) return '#fff'; // White trend on colored bg
        if (!trend) return theme.colors.textSecondary;
        return trend === 'up' ? '#10B981' : '#EF4444';
    };

    const getTrendIcon = () => {
        if (!trend) return null;
        return trend === 'up' ? 'trending-up' : 'trending-down';
    };

    const CardContent = () => (
        <>
            <View style={[styles.iconContainer, { backgroundColor: gradientColors ? 'rgba(255,255,255,0.2)' : iconColor + '20' }]}>
                <Ionicons name={icon} size={24} color={gradientColors ? '#fff' : iconColor} />
            </View>

            <View style={styles.content}>
                <Text style={[styles.title, { color: gradientColors ? 'rgba(255,255,255,0.8)' : theme.colors.textSecondary }]}>
                    {title}
                </Text>
                <Text style={[styles.value, { color: gradientColors ? '#fff' : theme.colors.text }]}>
                    {value}
                </Text>
                {subtitle && (
                    <View style={styles.subtitleRow}>
                        {getTrendIcon() && (
                            <Ionicons
                                name={getTrendIcon()}
                                size={14}
                                color={getTrendColor()}
                                style={styles.trendIcon}
                            />
                        )}
                        <Text style={[styles.subtitle, { color: getTrendColor() }]}>
                            {subtitle}
                        </Text>
                    </View>
                )}
            </View>
        </>
    );

    if (gradientColors) {
        return (
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.card, { padding: 0 }]} // Reset padding for gradient container
            >
                <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <CardContent />
                </View>
            </LinearGradient>
        );
    }

    return (
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <CardContent />
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        minHeight: 120
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16
    },
    content: {
        flex: 1
    },
    title: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    value: {
        fontSize: 32,
        fontWeight: '900',
        marginBottom: 4
    },
    subtitleRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    trendIcon: {
        marginRight: 4
    },
    subtitle: {
        fontSize: 13,
        fontWeight: '600'
    }
});
