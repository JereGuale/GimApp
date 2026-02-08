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
  Alert
} from 'react-native';
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
  const { login } = useAuth();
  const { width } = useWindowDimensions();
  const isNarrow = width < 360;
  const inputHalfStyle = isNarrow ? styles.inputFull : styles.inputHalf;

  const handleRegister = async () => {
    if (!fullName || !email || !username || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (!accepted) {
      Alert.alert('Error', 'Debes aceptar los términos y condiciones');
      return;
    }

    try {
      const { user, token } = await authRegister(fullName, email, password, confirmPassword);
      await login(user, token);
      Alert.alert('Éxito', 'Cuenta creada exitosamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear la cuenta');
      console.error('Register error:', error);
    }
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1600&auto=format&fit=crop' }}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.backdrop} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.content}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Text style={styles.backIcon}>{'<'}</Text>
              </TouchableOpacity>
              <Text style={styles.brand}>APP FITNESS</Text>
            </View>

            <Text style={styles.title}>CREAR CUENTA</Text>

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

            <TouchableOpacity style={styles.btn} onPress={handleRegister}>
              <Text style={styles.btnText}>REGISTRARSE</Text>
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
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: 'rgba(21, 24, 32, 0.75)',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  backButton: {
    position: 'absolute',
    left: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)'
  },
  backIcon: { color: '#8BD3FF', fontSize: 18, fontWeight: '700' },
  brand: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  title: { color: '#FFFFFF', textAlign: 'center', fontSize: 16, fontWeight: '700', marginBottom: 14 },
  formRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  input: {
    height: 46,
    borderRadius: 16,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)'
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
  btnText: { color: '#FFFFFF', fontWeight: '700', letterSpacing: 0.5 }
});
