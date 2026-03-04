import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, TextInput, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { authLogin } from '../../services/api';

export default function AdminLoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);

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
    try {
      if (!email.trim() || !password.trim()) {
        showToast('Ingresa correo y contraseña', 'error');
        return;
      }
      const { user, token } = await authLogin(email.trim(), password);

      // Validar que el usuario sea admin
      if (user.role !== 'admin') {
        showToast('Solo administradores pueden acceder aquí', 'error');
        return;
      }

      console.log('[AdminLoginScreen] Admin login successful - role:', user?.role);

      showToast('¡Inicio de sesión exitoso!', 'success');

      setTimeout(async () => {
        await login(user, token, keepLoggedIn);
      }, 1000);

    } catch (error) {
      showToast('Credenciales inválidas o cuenta no existe', 'error');
      console.error('Admin login error:', error);
    }
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=1600&auto=format&fit=crop' }}
      style={styles.container}
      resizeMode="cover"
    >
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

      {/* Botón de volver */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}
      >
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={60} color="#22D3EE" />
          </View>

          <Text style={styles.title}>PANEL ADMINISTRADOR</Text>
          <Text style={styles.subtitle}>Acceso solo para administradores</Text>

          <View style={styles.inputGroup}>
            <TextInput
              placeholder="Correo electrónico"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              placeholder="Contraseña"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setKeepLoggedIn(!keepLoggedIn)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, keepLoggedIn && styles.checkboxChecked]}>
              {keepLoggedIn && <Ionicons name="checkmark" size={14} color="#000000" />}
            </View>
            <Text style={styles.checkboxLabel}>Guardar inicio de sesión</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btn} onPress={handleLogin}>
            <Text style={styles.btnText}>INICIAR SESIÓN</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 10, 14, 0.7)'
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
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12
  },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: 'rgba(21, 24, 32, 0.85)',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)'
  },
  iconContainer: {
    marginBottom: 16
  },
  title: {
    color: '#22D3EE',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    marginBottom: 24
  },
  inputGroup: { width: '100%', gap: 12, marginBottom: 20 },
  input: {
    width: '100%',
    height: 50,
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.2)'
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
    backgroundColor: '#22D3EE',
    borderColor: '#22D3EE'
  },
  checkboxLabel: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  btn: {
    width: '100%',
    backgroundColor: '#22D3EE',
    paddingVertical: 14,
    borderRadius: 999,
    shadowColor: '#22D3EE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  btnText: {
    color: '#000000',
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 0.5,
    fontSize: 15
  }
});
