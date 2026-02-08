import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigation = useNavigation();

  const handleLogout = async () => {
    console.log('[ProfileScreen] handleLogout called');
    console.log('[ProfileScreen] Calling logout()...');
    try {
      await logout();
      console.log('[ProfileScreen] logout() completed successfully');
    } catch (error) {
      console.error('[ProfileScreen] logout error:', error);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={48} color="#22D3EE" />
          </View>
        </View>
        <Text style={[styles.userName, { color: theme.colors.text }]}>
          {user?.name || 'Usuario'}
        </Text>
        <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
          {user?.email || 'email@ejemplo.com'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Cuenta</Text>

        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.menuIconContainer}>
            <Ionicons name="person-outline" size={24} color="#22D3EE" />
          </View>
          <Text style={[styles.menuText, { color: theme.colors.text }]}>Editar Perfil</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.menuIconContainer}>
            <Ionicons name="card-outline" size={24} color="#22D3EE" />
          </View>
          <Text style={[styles.menuText, { color: theme.colors.text }]}>Mi Suscripción</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.menuIconContainer}>
            <Ionicons name="cart-outline" size={24} color="#22D3EE" />
          </View>
          <Text style={[styles.menuText, { color: theme.colors.text }]}>Mis Pedidos</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Configuración</Text>

        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.menuIconContainer}>
            <Ionicons name="notifications-outline" size={24} color="#22D3EE" />
          </View>
          <Text style={[styles.menuText, { color: theme.colors.text }]}>Notificaciones</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.menuIconContainer}>
            <Ionicons name="lock-closed-outline" size={24} color="#22D3EE" />
          </View>
          <Text style={[styles.menuText, { color: theme.colors.text }]}>Privacidad</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}
          onPress={toggleTheme}
        >
          <View style={styles.menuIconContainer}>
            <Ionicons
              name={theme.isDark ? 'sunny' : 'moon'}
              size={24}
              color={theme.isDark ? '#FB923C' : '#FFD700'}
            />
          </View>
          <Text style={[styles.menuText, { color: theme.colors.text }]}>
            {theme.isDark ? 'Modo Claro' : 'Modo Oscuro'}
          </Text>
          <Ionicons
            name={theme.isDark ? 'toggle' : 'toggle-outline'}
            size={24}
            color="#22D3EE"
          />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.menuIconContainer}>
            <Ionicons name="help-circle-outline" size={24} color="#22D3EE" />
          </View>
          <Text style={[styles.menuText, { color: theme.colors.text }]}>Ayuda</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.version}>Versión 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20
  },
  avatarContainer: {
    marginBottom: 18
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#22D3EE',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 211, 238, 0.15)',
    shadowColor: '#22D3EE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8
  },
  userName: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.5
  },
  userEmail: {
    fontSize: 15,
    fontWeight: '500'
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 28
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 14,
    letterSpacing: 0.3
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'rgba(34, 211, 238, 0.3)',
    shadowColor: '#22D3EE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(34, 211, 238, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    marginBottom: 32,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
    gap: 10
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 32
  },
  version: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500'
  }
});
