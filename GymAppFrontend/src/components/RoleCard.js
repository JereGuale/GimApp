import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function RoleCard({ icon, name, count, label, onPress }) {
    const { theme } = useTheme();

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.colors.background }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.leftSection}>
                <View style={styles.iconContainer}>
                    <Ionicons name={icon} size={20} color="#22D3EE" />
                </View>
                <View>
                    <Text style={[styles.name, { color: theme.colors.text }]}>
                        {name}
                    </Text>
                    <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                        {label}
                    </Text>
                </View>
            </View>

            <View style={styles.rightSection}>
                <Text style={[styles.count, { color: theme.colors.text }]}>
                    {count}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(255, 255, 255, 0.03)' // More subtle glass effect

    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(34, 211, 238, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(34, 211, 238, 0.3)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    name: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 2
    },
    label: {
        fontSize: 13,
        fontWeight: '500'
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    count: {
        fontSize: 18,
        fontWeight: '800'
    }
});
