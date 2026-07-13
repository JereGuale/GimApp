import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { PasswordResetAPI } from '../../services/passwordResetService';

export default function ForgotPasswordScreen({ navigation }) {
    const { theme } = useTheme();
    const [step, setStep] = useState(1); // 1: Email, 2: Code, 3: New Password
    const [email, setEmail] = useState('');
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds

    // Refs for code inputs
    const codeInputsRef = useRef([]);

    // Timer for code expiration
    useEffect(() => {
        if (step === 2 && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0) {
            Alert.alert('Código Expirado', 'El código ha expirado. Por favor solicita uno nuevo.');
            setStep(1);
            setTimeLeft(900);
        }
    }, [step, timeLeft]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSendCode = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Por favor ingresa tu email');
            return;
        }

        setLoading(true);
        const result = await PasswordResetAPI.requestResetCode(email);
        setLoading(false);

        if (result.success) {
            Alert.alert('¡Código Enviado!', 'Revisa tu email para obtener el código de verificación.');
            setStep(2);
            setTimeLeft(900); // Reset timer
        } else {
            Alert.alert('Error', result.error);
        }
    };

    const handleCodeChange = (text, index) => {
        if (!/^\d*$/.test(text)) return; // Only numbers

        const newCode = [...code];
        newCode[index] = text;
        setCode(newCode);

        // Auto-focus next input
        if (text && index < 5) {
            codeInputsRef.current[index + 1]?.focus();
        }
    };

    const handleCodeKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
            codeInputsRef.current[index - 1]?.focus();
        }
    };

    const handleVerifyCode = async () => {
        const codeString = code.join('');

        if (codeString.length !== 6) {
            Alert.alert('Error', 'Por favor ingresa el código completo de 6 dígitos');
            return;
        }

        setLoading(true);
        const result = await PasswordResetAPI.verifyResetCode(email, codeString);
        setLoading(false);

        if (result.success && result.valid) {
            Alert.alert('¡Código Verificado!', 'Ahora puedes crear tu nueva contraseña.');
            setStep(3);
        } else {
            Alert.alert('Error', result.error);
        }
    };

    const handleResetPassword = async () => {
        if (!password || !passwordConfirmation) {
            Alert.alert('Error', 'Por favor completa todos los campos');
            return;
        }

        if (password.length < 8) {
            Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres');
            return;
        }

        if (password !== passwordConfirmation) {
            Alert.alert('Error', 'Las contraseñas no coinciden');
            return;
        }

        setLoading(true);
        const codeString = code.join('');
        const result = await PasswordResetAPI.resetPassword(email, codeString, password, passwordConfirmation);
        setLoading(false);

        if (result.success) {
            Alert.alert(
                '¡Contraseña Actualizada!',
                'Tu contraseña ha sido cambiada exitosamente. Ya puedes iniciar sesión.',
                [{ text: 'Ir a Login', onPress: () => navigation.navigate('Login') }]
            );
        } else {
            Alert.alert('Error', result.error);
        }
    };

    const handleGoBack = () => {
        if (step > 1) {
            setStep(step - 1);
        } else {
            navigation.goBack();
        }
    };

    const renderStepIndicator = () => (
        <View style={styles.stepIndicator}>
            {[1, 2, 3].map((s) => (
                <View key={s} style={styles.stepItem}>
                    <View style={[
                        styles.stepCircle,
                        {
                            backgroundColor: s <= step ? '#22D3EE' : 'rgba(255, 255, 255, 0.1)',
                            borderColor: s <= step ? '#22D3EE' : theme.colors.border
                        }
                    ]}>
                        <Text style={[
                            styles.stepNumber,
                            { color: s <= step ? '#0f172a' : theme.colors.textSecondary }
                        ]}>{s}</Text>
                    </View>
                    {s < 3 && (
                        <View style={[
                            styles.stepLine,
                            { backgroundColor: s < step ? '#22D3EE' : theme.colors.border }
                        ]} />
                    )}
                </View>
            ))}
        </View>
    );

    const renderStep1 = () => (
        <View style={styles.stepContent}>
            <View style={styles.iconContainer}>
                <Ionicons name="mail-outline" size={64} color="#22D3EE" />
            </View>

            <Text style={[styles.title, { color: theme.colors.text }]}>
                Recuperar Contraseña
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                Ingresa tu email y te enviaremos un código de verificación
            </Text>

            <View style={styles.inputContainer}>
                <Ionicons name="mail" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                    style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                    placeholder="Email"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                />
            </View>

            <TouchableOpacity
                style={[styles.button, { opacity: loading ? 0.6 : 1 }]}
                onPress={handleSendCode}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#0f172a" />
                ) : (
                    <Text style={styles.buttonText}>Enviar Código</Text>
                )}
            </TouchableOpacity>
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.stepContent}>
            <View style={styles.iconContainer}>
                <Ionicons name="shield-checkmark-outline" size={64} color="#22D3EE" />
            </View>

            <Text style={[styles.title, { color: theme.colors.text }]}>
                Verificar Código
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                Ingresa el código de 6 dígitos que enviamos a {email}
            </Text>

            <View style={styles.codeContainer}>
                {code.map((digit, index) => (
                    <TextInput
                        key={index}
                        ref={ref => codeInputsRef.current[index] = ref}
                        style={[styles.codeInput, {
                            color: theme.colors.text,
                            borderColor: digit ? '#22D3EE' : theme.colors.border,
                            backgroundColor: digit ? 'rgba(34, 211, 238, 0.1)' : 'transparent'
                        }]}
                        value={digit}
                        onChangeText={(text) => handleCodeChange(text, index)}
                        onKeyPress={(e) => handleCodeKeyPress(e, index)}
                        keyboardType="number-pad"
                        maxLength={1}
                        selectTextOnFocus
                    />
                ))}
            </View>

            <View style={styles.timerContainer}>
                <Ionicons name="time-outline" size={16} color="#fb923c" />
                <Text style={[styles.timerText, { color: '#fb923c' }]}>
                    Expira en: {formatTime(timeLeft)}
                </Text>
            </View>

            <TouchableOpacity
                style={[styles.button, { opacity: loading ? 0.6 : 1 }]}
                onPress={handleVerifyCode}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#0f172a" />
                ) : (
                    <Text style={styles.buttonText}>Verificar Código</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.resendButton}
                onPress={() => {
                    setStep(1);
                    setCode(['', '', '', '', '', '']);
                    setTimeLeft(900);
                }}
            >
                <Text style={styles.resendText}>Reenviar código</Text>
            </TouchableOpacity>
        </View>
    );

    const renderStep3 = () => (
        <View style={styles.stepContent}>
            <View style={styles.iconContainer}>
                <Ionicons name="lock-closed-outline" size={64} color="#22D3EE" />
            </View>

            <Text style={[styles.title, { color: theme.colors.text }]}>
                Nueva Contraseña
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                Crea una contraseña segura de al menos 8 caracteres
            </Text>

            <View style={styles.inputContainer}>
                <Ionicons name="lock-closed" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                    style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                    placeholder="Nueva contraseña"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
                <Ionicons name="lock-closed" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                    style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                    placeholder="Confirmar contraseña"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={passwordConfirmation}
                    onChangeText={setPasswordConfirmation}
                    secureTextEntry={!showPasswordConfirmation}
                    editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowPasswordConfirmation(!showPasswordConfirmation)} style={styles.eyeIcon}>
                    <Ionicons name={showPasswordConfirmation ? 'eye-outline' : 'eye-off-outline'} size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={[styles.button, { opacity: loading ? 0.6 : 1 }]}
                onPress={handleResetPassword}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#0f172a" />
                ) : (
                    <Text style={styles.buttonText}>Restablecer Contraseña</Text>
                )}
            </TouchableOpacity>
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                    <Text style={[styles.backText, { color: theme.colors.text }]}>Volver</Text>
                </TouchableOpacity>

                {renderStepIndicator()}

                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
        paddingTop: 60
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24
    },
    backText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8
    },
    stepIndicator: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    stepCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center'
    },
    stepNumber: {
        fontSize: 16,
        fontWeight: '700'
    },
    stepLine: {
        width: 60,
        height: 2
    },
    stepContent: {
        flex: 1
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 24
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 12
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        position: 'relative'
    },
    inputIcon: {
        position: 'absolute',
        left: 16,
        zIndex: 1
    },
    input: {
        flex: 1,
        height: 56,
        borderWidth: 2,
        borderRadius: 12,
        paddingLeft: 48,
        paddingRight: 48,
        fontSize: 16,
        fontWeight: '500'
    },
    eyeIcon: {
        position: 'absolute',
        right: 16,
        zIndex: 1
    },
    button: {
        backgroundColor: '#22D3EE',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8
    },
    buttonText: {
        color: '#0f172a',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5
    },
    codeContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 24
    },
    codeInput: {
        width: 50,
        height: 60,
        borderWidth: 2,
        borderRadius: 12,
        textAlign: 'center',
        fontSize: 24,
        fontWeight: '700'
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 24,
        padding: 12,
        backgroundColor: 'rgba(251, 146, 60, 0.1)',
        borderRadius: 8
    },
    timerText: {
        fontSize: 14,
        fontWeight: '600'
    },
    resendButton: {
        marginTop: 16,
        alignItems: 'center'
    },
    resendText: {
        color: '#22D3EE',
        fontSize: 15,
        fontWeight: '600'
    }
});
