import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { authLogin } from '../../services/api';

export default function TrainerLoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleLogin = async () => {
    try {
      if (!email.trim() || !password.trim()) {
        Alert.alert('Error', 'Ingresa correo y contraseña');
        return;
      }
      const { user, token } = await authLogin(email.trim(), password);
      
      // Validar que el usuario sea trainer
      if (user.role !== 'trainer') {
        Alert.alert('Acceso Denegado', 'Solo entrenadores pueden acceder aquí');
        return;
      }
      
      console.log('[TrainerLoginScreen] Trainer login successful - role:', user?.role);
      await login(user, token);
    } catch (error) {
      Alert.alert('Error', 'Credenciales invalidas');
      console.error('Trainer login error:', error);
    }
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1600&auto=format&fit=crop' }}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.backdrop} />
      
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
            <Ionicons name="barbell" size={60} color="#FB923C" />
          </View>
          
          <Text style={styles.title}>PANEL ENTRENADOR</Text>
          <Text style={styles.subtitle}>Acceso solo para entrenadores</Text>

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
    backgroundColor: 'rgba(8, 10, 14, 0.65)'
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
    borderColor: 'rgba(251, 146, 60, 0.3)'
  },
  iconContainer: {
    marginBottom: 16
  },
  title: { 
    color: '#FB923C', 
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
    borderColor: 'rgba(251, 146, 60, 0.2)'
  },
  btn: {
    width: '100%',
    backgroundColor: '#FB923C',
    paddingVertical: 14,
    borderRadius: 999,
    shadowColor: '#FB923C',
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
