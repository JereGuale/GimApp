import { View, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

/**
 * Componente Card reutilizable para mantener consistencia visual
 * @param {object} props
 * @param {string} props.variant - 'default' | 'neon' | 'premium'
 * @param {string} props.accentColor - Color de acento para bordes y sombras
 * @param {object} props.style - Estilos adicionales
 */
export default function Card({ children, variant = 'default', accentColor, style, ...props }) {
    const { theme } = useTheme();

    const getVariantStyles = () => {
        switch (variant) {
            case 'neon':
                return {
                    borderWidth: 2,
                    borderColor: accentColor || theme.colors.cyan,
                    shadowColor: accentColor || theme.colors.cyan,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.4,
                    shadowRadius: 12,
                    elevation: 6,
                };
            case 'premium':
                return {
                    borderWidth: 3,
                    borderColor: accentColor || theme.colors.cyan,
                    shadowColor: accentColor || theme.colors.cyan,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.6,
                    shadowRadius: 16,
                    elevation: 8,
                };
            default:
                return {
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                };
        }
    };

    return (
        <View
            style={[
                styles.card,
                { backgroundColor: theme.colors.surface },
                getVariantStyles(),
                style,
            ]}
            {...props}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        padding: 16,
        overflow: 'hidden',
    },
});
