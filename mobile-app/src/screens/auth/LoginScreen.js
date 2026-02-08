
import { View, Text, TouchableOpacity, StyleSheet, Image, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { authLogin } from '../../services/api';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleLogin = async () => {
    try {
      if (!username.trim() || !password.trim()) {
        Alert.alert('Error', 'Ingresa correo y contraseña');
        return;
      }
      const { user, token } = await authLogin(username.trim(), password);
      console.log('[LoginScreen] Response from backend:', { user, token });
      console.log('[LoginScreen] User role:', user?.role);
      await login(user, token);
    } catch (error) {
      Alert.alert('Error', 'Credenciales invalidas');
      console.error('Login error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/images/fitnesgim.png')}
        style={styles.bgImage}
      />
      <View style={styles.backdrop} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}
      >
        <View style={styles.card}>
          <Text style={styles.logo}>APP FITNESS</Text>

          <View style={styles.inputGroup}>
            <TextInput
              placeholder="Nombre de usuario"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              value={username}
              onChangeText={setUsername}
            />
            <TextInput
              placeholder="Contrasena"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity style={styles.btn} onPress={handleLogin}>
            <Text style={styles.btnText}>INICIAR SESION</Text>
          </TouchableOpacity>

          <View style={styles.linksRow}>
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.link}>Olvidaste tu contrasena?</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.link}>Crear cuenta</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.roleButtonsContainer}>
            <TouchableOpacity
              style={styles.roleButton}
              onPress={() => navigation.navigate('AdminLogin')}
            >
              <Ionicons name="shield-checkmark" size={20} color="#22D3EE" />
              <Text style={styles.roleButtonText}>Soy Administrador</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.roleButton}
              onPress={() => navigation.navigate('TrainerLogin')}
            >
              <Ionicons name="barbell" size={20} color="#FB923C" />
              <Text style={styles.roleButtonText}>Soy Entrenador</Text>
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
  logo: { color: '#FFFFFF', fontSize: 26, fontWeight: '800', letterSpacing: 1, marginBottom: 18 },
  inputGroup: { width: '100%', gap: 12, marginBottom: 18 },
  input: {
    width: '100%',
    height: 48,
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)'
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
