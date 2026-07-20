
import { View, Text, TouchableOpacity, StyleSheet, Image, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { authLogin } from '../../services/api';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [loading, setLoading] = useState(false);

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('error');
  const [toastVisible, setToastVisible] = useState(false);

  const { login } = useAuth();

  const showToast = (message, type = 'error') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 3500);
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      showToast('Ingresa correo y contraseña', 'error');
      return;
    }
    try {
      setLoading(true);
      const { user, token } = await authLogin(username.trim(), password);
      showToast('¡Inicio de sesión exitoso!', 'success');
      setTimeout(async () => {
        await login(user, token, keepLoggedIn);
      }, 1000);
    } catch (error) {
      const msg = error.message || '';
      if (msg.includes('401') || msg.includes('credentials') || msg.includes('Invalid')) {
        showToast('Correo o contraseña incorrectos', 'error');
      } else if (msg.includes('Network') || msg.includes('fetch')) {
        showToast('Sin conexión al servidor. Intenta en un momento', 'error');
      } else {
        showToast('Error al iniciar sesión. Intenta de nuevo', 'error');
      }
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/images/fitnesgim.png')}
        style={styles.bgImage}
      />
      <View style={styles.backdrop} />

      {toastVisible && (
        <View style={styles.toast}>
          <Ionicons
            name={toastType === 'success' ? 'checkmark-circle' : 'alert-circle'}
            size={20}
            color={toastType === 'success' ? '#10B981' : '#EF4444'}
          />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}
      >
        <View style={styles.card}>
          <View style={styles.logoHeader}>
            <View style={styles.logoIconWrapper}>
              <Ionicons name="barbell" size={32} color="#2E8BFF" />
            </View>
            <Text style={styles.logo}>APP FITNESS</Text>
            <Text style={styles.subtitle}>Tu gimnasio en tu mano</Text>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                placeholder="Correo electrónico o usuario"
                placeholderTextColor="#9CA3AF"
                style={styles.inputWithIcon}
                autoCapitalize="none"
                autoCorrect={false}
                value={username}
                onChangeText={setUsername}
              />
            </View>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                placeholder="Contraseña"
                placeholderTextColor="#9CA3AF"
                style={styles.inputWithIcon}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setKeepLoggedIn(!keepLoggedIn)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, keepLoggedIn && styles.checkboxChecked]}>
              {keepLoggedIn && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
            </View>
            <Text style={styles.checkboxLabel}>Guardar inicio de sesión</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={styles.btnText}>INICIAR SESIÓN</Text>
            }
          </TouchableOpacity>

          <View style={styles.linksRow}>
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.link}>Crear cuenta</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.roleButtonsContainer}>
            <TouchableOpacity
              style={[styles.roleButton, { flex: 1 }]}
              onPress={() => navigation.navigate('AdminLogin')}
            >
              <Ionicons name="shield-checkmark" size={18} color="#22D3EE" />
              <Text style={styles.roleButtonText}>Soy Administrador</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F14' },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '110%',
    resizeMode: 'cover',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 10, 14, 0.55)'
  },
  toast: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 100,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  toastText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '500',
  },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: 'rgba(21, 24, 32, 0.75)',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center'
  },
  logoHeader: { alignItems: 'center', marginBottom: 20 },
  logoIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(46, 139, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  logo: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', letterSpacing: 0.8 },
  subtitle: { color: '#9CA3AF', fontSize: 13, marginTop: 4, fontWeight: '500' },
  inputGroup: { width: '100%', gap: 12, marginBottom: 18 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    height: 50,
    paddingHorizontal: 14,
    width: '100%'
  },
  inputIcon: { marginRight: 8, opacity: 0.7 },
  inputWithIcon: {
    flex: 1,
    height: '100%',
    color: '#FFFFFF',
    fontSize: 14.5
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 20,
    marginTop: -8,
    marginLeft: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)'
  },
  checkboxChecked: {
    backgroundColor: '#2E8BFF',
    borderColor: '#2E8BFF'
  },
  checkboxLabel: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  btn: {
    width: '100%',
    backgroundColor: '#2E8BFF',
    paddingVertical: 14,
    borderRadius: 999,
    marginBottom: 14
  },
  btnText: { color: '#FFFFFF', textAlign: 'center', fontWeight: '700', letterSpacing: 0.5 },
  linksRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  link: { color: '#C7D2FE', fontSize: 12 },
  roleButtonsContainer: {
    width: '100%',
    gap: 10,
    marginTop: 16
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  roleButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600'
  }
});
