import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggleFAB() {
    const { isDark, toggleTheme } = useTheme();
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(rotateAnim, {
            toValue: isDark ? 1 : 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [isDark]);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={toggleTheme}
            style={[
                styles.fab,
                { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' },
            ]}
        >
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Ionicons
                    name={isDark ? 'moon' : 'sunny'}
                    size={24}
                    color={isDark ? '#A78BFA' : '#F59E0B'}
                />
            </Animated.View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        bottom: 30, // Bottom corner
        left: 20,   // Left side
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
        zIndex: 9999, // Ensure it sits on top of everything
    },
});
