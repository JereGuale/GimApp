import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { authRegister } from '../../services/api';

export default function RegisterScreen({ navigation }) {
  const [accepted, setAccepted] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('error');
  const [toastVisible, setToastVisible] = useState(false);

  const { login } = useAuth();
  const { width } = useWindowDimensions();
  const isNarrow = width < 360;
  const inputHalfStyle = isNarrow ? styles.inputFull : styles.inputHalf;

  const showToast = (message, type = 'error') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 3500);
  };

  const handleRegister = async () => {
    if (!fullName || !email || !username || !password) {
      showToast('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    // Validar nombre sin números
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!nameRegex.test(fullName)) {
      showToast('El nombre no puede contener números ni caracteres especiales', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Las contraseñas no coinciden', 'error');
      return;
    }

    if (!accepted) {
      showToast('Debes aceptar los términos y condiciones', 'error');
      return;
    }

    try {
      setLoading(true);
      const { user, token } = await authRegister(fullName, email, password, confirmPassword);
      showToast('¡Cuenta creada con éxito!', 'success');

      setTimeout(async () => {
        await login(user, token);
      }, 1500);

    } catch (error) {
      console.error('Register error:', error);
      let errorMsg = 'No se pudo crear la cuenta. Intenta de nuevo';
      const raw = error.message || '';
      // Intentar parsear el JSON de error de Laravel
      try {
        const parsed = JSON.parse(raw);
        const errors = parsed.errors || {};
        const firstField = Object.keys(errors)[0];
        if (firstField) {
          const firstMsg = errors[firstField][0] || '';
          if (firstField === 'email' || firstMsg.includes('email')) {
            errorMsg = firstMsg.includes('taken') || firstMsg.includes('already')
              ? 'Ese correo ya está registrado'
              : 'El correo no es válido';
          } else if (firstField === 'password') {
            errorMsg = 'La contraseña debe tener al menos 8 caracteres';
          } else if (firstField === 'name') {
            errorMsg = 'El nombre no es válido';
          } else {
            errorMsg = firstMsg || errorMsg;
          }
        } else if (parsed.message) {
          if (parsed.message.includes('taken') || parsed.message.includes('already')) {
            errorMsg = 'Ese correo ya está registrado';
          }
        }
      } catch (_) {
        // Si no es JSON, verificar texto plano
        if (raw.includes('email') && (raw.includes('taken') || raw.includes('already'))) {
          errorMsg = 'Ese correo ya está registrado';
        } else if (raw.includes('Network') || raw.includes('fetch')) {
          errorMsg = 'Sin conexión. Espera un momento y vuelve a intentar';
        }
      }
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1600&auto=format&fit=crop' }}
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

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.content}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={26} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.brand}>APP FITNESS</Text>
            </View>

            <Text style={styles.title}>Crear cuenta</Text>

            <View style={styles.formRow}>
              <TextInput
                placeholder="Nombre completo"
                placeholderTextColor="#9CA3AF"
                style={[styles.input, inputHalfStyle]}
                value={fullName}
                onChangeText={setFullName}
              />
              <TextInput
                placeholder="Correo electronico"
                placeholderTextColor="#9CA3AF"
                style={[styles.input, inputHalfStyle]}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.formRow}>
              <TextInput
                placeholder="Usuario"
                placeholderTextColor="#9CA3AF"
                style={[styles.input, inputHalfStyle]}
                value={username}
                onChangeText={setUsername}
              />
              <TextInput
                placeholder="Telefono"
                placeholderTextColor="#9CA3AF"
                style={[styles.input, inputHalfStyle]}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={styles.formRow}>
              <TextInput
                placeholder="Contrasena"
                placeholderTextColor="#9CA3AF"
                style={[styles.input, inputHalfStyle]}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <TextInput
                placeholder="Confirmar contrasena"
                placeholderTextColor="#9CA3AF"
                style={[styles.input, inputHalfStyle]}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            <TouchableOpacity style={styles.checkRow} onPress={() => setAccepted(!accepted)}>
              <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
                {accepted ? <Text style={styles.checkboxTick}>x</Text> : null}
              </View>
              <Text style={styles.checkText}>Acepto terminos y condiciones</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleRegister} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text style={styles.btnText}>REGISTRARSE</Text>
              }
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
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
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  card: {
    width: '100%',
    maxWidth: 600, // Made wider
    backgroundColor: 'rgba(21, 24, 32, 0.75)',
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 32
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  backButton: {
    position: 'absolute',
    left: -5,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { color: '#2E8BFF', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  title: { color: '#FFFFFF', textAlign: 'center', fontSize: 24, fontWeight: '700', marginBottom: 28, letterSpacing: 0.5, textTransform: 'uppercase' },
  formRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  input: {
    height: 52,
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    fontSize: 15
  },
  inputHalf: { width: '48%' },
  inputFull: { width: '100%', marginBottom: 10 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#60A5FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  },
  checkboxChecked: { backgroundColor: '#2E8BFF' },
  checkboxTick: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  checkText: { color: '#C7D2FE', fontSize: 12 },
  btn: {
    backgroundColor: '#2E8BFF',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center'
  },
  btnDisabled: {
    backgroundColor: 'rgba(46, 139, 255, 0.6)',
  },
  btnText: { color: '#FFFFFF', fontWeight: '700', letterSpacing: 0.5 }
});
