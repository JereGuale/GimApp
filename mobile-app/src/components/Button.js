import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';

/**
 * Componente Button reutilizable con variantes y tamaños
 * @param {object} props
 * @param {string} props.variant - 'primary' | 'secondary' | 'danger' | 'ghost'
 * @param {string} props.size - 'small' | 'medium' | 'large'
 * @param {boolean} props.loading - Muestra indicador de carga
 * @param {boolean} props.disabled - Deshabilita el botón
 * @param {string} props.title - Texto del botón
 */
export default function Button({
    variant = 'primary',
    size = 'medium',
    loading = false,
    disabled = false,
    title,
    onPress,
    style,
    textStyle,
    icon,
    ...props
}) {
    const { theme } = useTheme();

    const getVariantStyles = () => {
        switch (variant) {
            case 'secondary':
                return {
                    backgroundColor: 'rgba(34, 211, 238, 0.15)',
                    borderWidth: 2,
                    borderColor: theme.colors.cyan,
                };
            case 'danger':
                return {
                    backgroundColor: theme.colors.red,
                    borderWidth: 0,
                };
            case 'ghost':
                return {
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                };
            default: // primary
                return {
                    backgroundColor: theme.colors.cyan,
                    borderWidth: 0,
                };
        }
    };

    const getSizeStyles = () => {
        switch (size) {
            case 'small':
                return {
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                };
            case 'large':
                return {
                    paddingVertical: 16,
                    paddingHorizontal: 32,
                };
            default: // medium
                return {
                    paddingVertical: 12,
                    paddingHorizontal: 24,
                };
        }
    };

    const getTextColor = () => {
        if (variant === 'ghost') return theme.colors.text;
        if (variant === 'secondary') return theme.colors.cyan;
        return '#FFFFFF';
    };

    const getTextSize = () => {
        switch (size) {
            case 'small': return 12;
            case 'large': return 16;
            default: return 14;
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                getVariantStyles(),
                getSizeStyles(),
                disabled && styles.disabled,
                style,
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} size="small" />
            ) : (
                <>
                    {icon}
                    <Text
                        style={[
                            styles.text,
                            { color: getTextColor(), fontSize: getTextSize() },
                            textStyle,
                        ]}
                    >
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    text: {
        fontWeight: '700',
        textAlign: 'center',
    },
    disabled: {
        opacity: 0.5,
    },
});
