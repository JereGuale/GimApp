import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';


export default function QuickStatCard({ icon, title, count, action, onActionPress, iconColor = '#22D3EE', gradientColors }) {
    const { theme } = useTheme();

    const CardContent = () => (
        <>
            <View style={styles.content}>
                <View style={[styles.iconContainer, { backgroundColor: gradientColors ? 'rgba(255,255,255,0.1)' : iconColor + '20' }]}>
                    <Ionicons name={icon} size={32} color={gradientColors ? '#fff' : iconColor} />
                </View>
                <Text style={[styles.count, { color: gradientColors ? '#fff' : theme.colors.text }]}>
                    {count}
                </Text>
            </View>

            <View style={{ flex: 1 }} />

            <View style={{ marginBottom: 12 }}>
                <Text style={[styles.title, { color: gradientColors ? 'rgba(255,255,255,0.7)' : theme.colors.textSecondary }]}>
                    {title}
                </Text>
            </View>

            {action && (
                <TouchableOpacity
                    style={[styles.actionButton, gradientColors && { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)' }]}
                    onPress={onActionPress}
                >
                    <Ionicons name="add-circle" size={18} color={gradientColors ? '#fff' : "#22D3EE"} />
                    <Text style={[styles.actionText, gradientColors && { color: '#fff' }]}>{action}</Text>
                </TouchableOpacity>
            )}
        </>
    );

    if (gradientColors) {
        return (
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.card, { padding: 20 }]}
            >
                <CardContent />
            </LinearGradient>
        );
    }

    return (
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.content}>
                <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
                    <Ionicons name={icon} size={32} color={iconColor} />
                </View>
                <Text style={[styles.count, { color: theme.colors.text }]}>
                    {count}
                </Text>
            </View>

            {/* Replicate layout for non-gradient version to allow title below */}
            <View style={{ flex: 1 }} />
            <View style={{ marginBottom: 12 }}>
                <Text style={[styles.title, { color: theme.colors.textSecondary, fontSize: 16, fontWeight: '600' }]}>
                    {title}
                </Text>
            </View>

            {action && (
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={onActionPress}
                >
                    <Ionicons name="add-circle" size={18} color="#22D3EE" />
                    <Text style={styles.actionText}>{action}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 16
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center'
    },
    count: {
        fontSize: 48,
        fontWeight: '900'
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(34, 211, 238, 0.15)',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: 'rgba(34, 211, 238, 0.3)'
    },
    actionText: {
        color: '#22D3EE',
        fontWeight: '700',
        fontSize: 14
    }
});
