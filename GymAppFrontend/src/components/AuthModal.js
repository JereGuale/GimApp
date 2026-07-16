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

export default function AuthModal({ visible, onClose, onSuccess }) {
  const { theme } = useTheme();
  const { login } = useAuth();
  
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
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

  const handleLoginSubmit = async () => {
    const inputVal = email.trim();
    if (!inputVal || !password.trim()) {
      setErrorMsg('Ingresa tu nombre de usuario y contraseña');
      return;
    }
    if (inputVal.includes('@')) {
      setErrorMsg('Por favor ingresa tu nombre de usuario, no tu correo');
      return;
    }
    if (inputVal.length > 10) {
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
        setErrorMsg('Nombre de usuario o contraseña incorrectos');
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

            <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false}>
              {activeTab === 'login' ? (
                /* LOGIN FORM */
                <View style={styles.form}>
                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Nombre de usuario</Text>
                    <TextInput
                      style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                      placeholder="Tu Nombre de usuario"
                      placeholderTextColor="#6B7280"
                      autoCapitalize="none"
                      autoCorrect={false}
                      maxLength={10}
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Contraseña</Text>
                    <TextInput
                      style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                      placeholder="••••••••"
                      placeholderTextColor="#6B7280"
                      secureTextEntry
                      value={password}
                      onChangeText={setPassword}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.submitBtn, { backgroundColor: theme.colors.primary }, loading && { opacity: 0.6 }]}
                    onPress={handleLoginSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.submitBtnText}>ENTRAR</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                /* REGISTER FORM */
                <View style={styles.form}>
                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Nombre Completo</Text>
                    <TextInput
                      style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                      placeholder="Nombre completo"
                      placeholderTextColor="#6B7280"
                      autoCapitalize="words"
                      maxLength={40}
                      value={name}
                      onChangeText={setName}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Nombre de usuario único</Text>
                    <TextInput
                      style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                      placeholder="mi_usuario (sin espacios)"
                      placeholderTextColor="#6B7280"
                      autoCapitalize="none"
                      autoCorrect={false}
                      maxLength={10}
                      value={username}
                      onChangeText={(t) => setUsername(t.replace(/\s/g, ''))}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Correo Electrónico</Text>
                    <TextInput
                      style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                      placeholder="ejemplo@correo.com"
                      placeholderTextColor="#6B7280"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Teléfono (WhatsApp)</Text>
                    <TextInput
                      style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                      placeholder="+593 99 999 9999"
                      placeholderTextColor="#6B7280"
                      keyboardType="phone-pad"
                      value={phone}
                      onChangeText={setPhone}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Contraseña</Text>
                    <TextInput
                      style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                      placeholder="Mínimo 8 caracteres"
                      placeholderTextColor="#6B7280"
                      secureTextEntry
                      value={password}
                      onChangeText={setPassword}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Confirmar Contraseña</Text>
                    <TextInput
                      style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                      placeholder="Mínimo 8 caracteres"
                      placeholderTextColor="#6B7280"
                      secureTextEntry
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.submitBtn, { backgroundColor: theme.colors.primary }, loading && { opacity: 0.6 }]}
                    onPress={handleRegisterSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.submitBtnText}>REGISTRARSE</Text>
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  container: {
    width: '100%',
    maxWidth: 420,
  },
  modalCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  formScroll: {
    padding: 20,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  submitBtn: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginHorizontal: 20,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  }
});
