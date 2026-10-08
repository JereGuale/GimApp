import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { authLogin, authRegister } from '../services/api';
import { performGoogleSignIn } from '../services/googleAuth';

// ─── Premium Icon-prefixed Input Field ────────────────────────────────────────
function InputField({ label, icon, value, onChangeText, placeholder, keyboardType, autoCapitalize, secureTextEntry, maxLength, autoCorrect, isDark }) {
  const [focused, setFocused] = useState(false);

  const borderColor = focused
    ? (isDark ? '#FFFFFF' : '#000000')
    : (isDark ? '#1F2937' : '#E5E5E5');

  const bgColor = isDark
    ? (focused ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)')
    : (focused ? 'rgba(0,0,0,0.04)' : '#F8F8F8');

  const iconColor = focused
    ? (isDark ? '#FB923C' : '#000000')
    : (isDark ? '#6B7280' : '#ADADAD');

  return (
    <View style={styles.inputContainer}>
      <Text style={[styles.inputLabel, { color: isDark ? '#9CA3AF' : '#4B5563' }]}>{label}</Text>
      <View style={[
        styles.inputRow,
        {
          borderColor,
          backgroundColor: bgColor,
          height: 48,
          alignItems: 'center',
          flexDirection: 'row',
          borderWidth: 1.5,
          borderRadius: 12,
          paddingHorizontal: 12,
        }
      ]}>
        <Ionicons
          name={icon}
          size={18}
          color={iconColor}
          style={{ marginRight: 8 }}
        />
        <TextInput
          style={{
            flex: 1,
            color: isDark ? '#F1F5F9' : '#181818',
            fontSize: 14,
            fontWeight: '500',
            height: '100%',
          }}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={isDark ? '#4B5563' : '#CCCCCC'}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize || 'sentences'}
          secureTextEntry={secureTextEntry}
          maxLength={maxLength}
          autoCorrect={autoCorrect}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}

export default function AuthModal({ visible, onClose, onSuccess }) {
  const { theme, isDark } = useTheme();
  const { login } = useAuth();
  
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const resetForm = () => {
    setName('');
    setUsername('');
    setEmail('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setErrorMsg('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleGoogleAuth = async () => {
    try {
      setGoogleLoading(true);
      setErrorMsg('');
      const res = await performGoogleSignIn();
      if (!res) return;
      if (res.user && res.token) {
        await login(res.user, res.token, true);
        resetForm();
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      if (error.message === 'GOOGLE_CONFIG_MISSING') {
        setErrorMsg('Falta configurar el Google Client ID en el proyecto');
      } else {
        setErrorMsg(error.message || 'Error al autenticar con Google');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLoginSubmit = async () => {
    const inputVal = email.trim();
    if (!inputVal || !password.trim()) {
      setErrorMsg('Ingresa tu usuario o correo y contraseña');
      return;
    }
    // Allow email logins. If it is NOT an email (no '@'), validate 10-char limit for username.
    if (!inputVal.includes('@') && inputVal.length > 10) {
      setErrorMsg('El nombre de usuario no debe superar los 10 caracteres');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const { user, token } = await authLogin(inputVal, password);
      await login(user, token, true);
      resetForm();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('[AuthModal] Login error:', error);
      const msg = error.message || '';
      if (msg.includes('401') || msg.includes('Invalid') || msg.includes('credentials')) {
        setErrorMsg('Usuario/correo o contraseña incorrectos');
      } else if (msg.includes('Network') || msg.includes('fetch')) {
        setErrorMsg('Sin conexión al servidor');
      } else {
        setErrorMsg('Error al iniciar sesión. Intenta de nuevo');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async () => {
    if (!name.trim() || !username.trim() || !email.trim() || !phone.trim() || !password.trim() || !confirmPassword.trim()) {
      setErrorMsg('Todos los campos son obligatorios');
      return;
    }
    if (name.trim().length > 40) {
      setErrorMsg('El nombre completo no debe superar los 40 caracteres');
      return;
    }
    if (username.trim().length > 10) {
      setErrorMsg('El nombre de usuario no debe superar los 10 caracteres');
      return;
    }
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username.trim())) {
      setErrorMsg('El usuario solo puede tener letras, números, _ y -');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>_#$-]/;
    if (!specialCharRegex.test(password)) {
      setErrorMsg('La contraseña debe incluir al menos un carácter especial');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const { user, token } = await authRegister(name.trim(), username.trim(), email.trim(), password, confirmPassword, phone.trim());
      await login(user, token, true);
      resetForm();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('[AuthModal] Register error:', error);
      const raw = error.message || '';
      try {
        const parsed = JSON.parse(raw);
        const errors = parsed.errors || {};
        const firstField = Object.keys(errors)[0];
        if (firstField === 'username') {
          setErrorMsg('Ese nombre de usuario ya está en uso');
        } else if (firstField === 'email') {
          setErrorMsg('Ese correo ya está registrado');
        } else if (firstField === 'password') {
          setErrorMsg('La contraseña debe tener al menos 8 caracteres');
        } else {
          setErrorMsg(errors[firstField]?.[0] || 'Error al crear la cuenta');
        }
      } catch (_) {
        if (raw.includes('Network') || raw.includes('fetch')) {
          setErrorMsg('Sin conexión al servidor');
        } else {
          setErrorMsg('Error al crear la cuenta. Intenta de nuevo.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={[styles.modalCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                {activeTab === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {errorMsg ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Tab buttons */}
            <View style={[styles.tabBar, { borderBottomColor: theme.colors.border }]}>
              <TouchableOpacity
                onPress={() => { setActiveTab('login'); setErrorMsg(''); }}
                style={[
                  styles.tabButton,
                  activeTab === 'login' && { borderBottomColor: theme.colors.primary }
                ]}
              >
                <Text style={[
                  styles.tabButtonText,
                  { color: activeTab === 'login' ? theme.colors.primary : theme.colors.textSecondary }
                ]}>
                  Ingresar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => { setActiveTab('register'); setErrorMsg(''); }}
                style={[
                  styles.tabButton,
                  activeTab === 'register' && { borderBottomColor: theme.colors.primary }
                ]}
              >
                <Text style={[
                  styles.tabButtonText,
                  { color: activeTab === 'register' ? theme.colors.primary : theme.colors.textSecondary }
                ]}>
                  Registrarse
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.formScroll}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {activeTab === 'login' ? (
                /* LOGIN FORM */
                <View style={styles.form}>
                  <InputField
                    label="Nombre de usuario o correo electrónico"
                    icon="person-outline"
                    placeholder="Tu usuario o correo"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={setEmail}
                    isDark={isDark}
                  />

                  <InputField
                    label="Contraseña"
                    icon="lock-closed-outline"
                    placeholder="••••••••"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    isDark={isDark}
                  />

                  <TouchableOpacity
                    style={[styles.submitBtn, { backgroundColor: theme.colors.primary }, (loading || googleLoading) && { opacity: 0.6 }]}
                    onPress={handleLoginSubmit}
                    disabled={loading || googleLoading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.submitBtnText}>ENTRAR</Text>
                    )}
                  </TouchableOpacity>

                  {/* Divider */}
                  <View style={styles.dividerRow}>
                    <View style={[styles.dividerLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB' }]} />
                    <Text style={[styles.dividerText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>o bien</Text>
                    <View style={[styles.dividerLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB' }]} />
                  </View>

                  {/* Google Button */}
                  <TouchableOpacity
                    style={[styles.btnGoogle, (googleLoading || loading) && { opacity: 0.7 }]}
                    onPress={handleGoogleAuth}
                    disabled={googleLoading || loading}
                    activeOpacity={0.85}
                  >
                    {googleLoading ? (
                      <ActivityIndicator color="#1F2937" size="small" />
                    ) : (
                      <>
                        <Ionicons name="logo-google" size={18} color="#EA4335" style={{ marginRight: 8 }} />
                        <Text style={styles.btnGoogleText}>Continuar con Google</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                /* REGISTER FORM */
                <View style={styles.form}>
                  <InputField
                    label="Nombre Completo"
                    icon="person-outline"
                    placeholder="Nombre completo"
                    autoCapitalize="words"
                    maxLength={40}
                    value={name}
                    onChangeText={setName}
                    isDark={isDark}
                  />

                  <InputField
                    label="Nombre de usuario único"
                    icon="at-outline"
                    placeholder="mi_usuario (sin espacios)"
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={10}
                    value={username}
                    onChangeText={(t) => setUsername(t.replace(/\s/g, ''))}
                    isDark={isDark}
                  />

                  <InputField
                    label="Correo Electrónico"
                    icon="mail-outline"
                    placeholder="ejemplo@correo.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    isDark={isDark}
                  />

                  <InputField
                    label="Teléfono (WhatsApp)"
                    icon="call-outline"
                    placeholder="+593 99 999 9999"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    isDark={isDark}
                  />

                  <InputField
                    label="Contraseña"
                    icon="lock-closed-outline"
                    placeholder="Mínimo 8 caracteres"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    isDark={isDark}
                  />

                  <InputField
                    label="Confirmar Contraseña"
                    icon="lock-closed-outline"
                    placeholder="Mínimo 8 caracteres"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    isDark={isDark}
                  />

                  <TouchableOpacity
                    style={[styles.submitBtn, { backgroundColor: theme.colors.primary }, (loading || googleLoading) && { opacity: 0.6 }]}
                    onPress={handleRegisterSubmit}
                    disabled={loading || googleLoading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.submitBtnText}>REGISTRARSE</Text>
                    )}
                  </TouchableOpacity>

                  {/* Divider */}
                  <View style={styles.dividerRow}>
                    <View style={[styles.dividerLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB' }]} />
                    <Text style={[styles.dividerText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>o bien</Text>
                    <View style={[styles.dividerLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB' }]} />
                  </View>

                  {/* Google Button */}
                  <TouchableOpacity
                    style={[styles.btnGoogle, (googleLoading || loading) && { opacity: 0.7 }]}
                    onPress={handleGoogleAuth}
                    disabled={googleLoading || loading}
                    activeOpacity={0.85}
                  >
                    {googleLoading ? (
                      <ActivityIndicator color="#1F2937" size="small" />
                    ) : (
                      <>
                        <Ionicons name="logo-google" size={18} color="#EA4335" style={{ marginRight: 8 }} />
                        <Text style={styles.btnGoogleText}>Registrarse con Google</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 440,
    maxHeight: Platform.OS === 'web' ? '88vh' : '92%',
  },
  modalCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    maxHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 19,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonText: {
    fontSize: 14.5,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  formScroll: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 11,
  },
  inputRow: {},
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '500',
    marginBottom: 5,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  submitBtn: {
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 14.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginHorizontal: 20,
    padding: 9,
    borderRadius: 8,
    marginBottom: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12.5,
    marginLeft: 8,
    flex: 1,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 10,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  btnGoogle: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 11,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  btnGoogleText: {
    color: '#1F2937',
    fontSize: 13.5,
    fontWeight: '700',
  },
});
