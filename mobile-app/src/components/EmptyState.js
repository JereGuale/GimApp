import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

/**
 * Componente EmptyState para mostrar cuando no hay datos
 * @param {object} props
 * @param {string} props.icon - Nombre del ícono de Ionicons
 * @param {string} props.title - Título del estado vacío
 * @param {string} props.message - Mensaje descriptivo
 * @param {string} props.iconColor - Color del ícono
 */
export default function EmptyState({
    icon = 'file-tray-outline',
    title = 'No hay datos',
    message,
    iconColor,
    style
}) {
    const { theme } = useTheme();
    const color = iconColor || theme.colors.textSecondary;

    return (
        <View style={[styles.container, style]}>
            <Ionicons name={icon} size={64} color={color} style={styles.icon} />
            <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
            {message && (
                <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
                    {message}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
        paddingHorizontal: 24,
    },
    icon: {
        marginBottom: 16,
        opacity: 0.5,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
});
