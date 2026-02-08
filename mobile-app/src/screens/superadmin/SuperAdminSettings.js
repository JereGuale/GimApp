import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function SuperAdminSettings() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const navigation = useNavigation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarCircle}>
            <Ionicons name="shield-checkmark" size={48} color="#A78BFA" />
          </View>
        </View>
        <Text style={[styles.userName, { color: theme.colors.text }]}>
          {user?.name || 'SuperAdmin'}
        </Text>
        <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
          {user?.email || 'admin@ejemplo.com'}
        </Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>SUPERADMINISTRADOR</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Configuración del Sistema</Text>

        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.menuIconContainer}>
            <Ionicons name="cog-outline" size={24} color="#22D3EE" />
          </View>
          <Text style={[styles.menuText, { color: theme.colors.text }]}>Configuración General</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.menuIconContainer}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#22D3EE" />
          </View>
          <Text style={[styles.menuText, { color: theme.colors.text }]}>Seguridad y Permisos</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.menuIconContainer}>
            <Ionicons name="cash-outline" size={24} color="#22D3EE" />
          </View>
          <Text style={[styles.menuText, { color: theme.colors.text }]}>Métodos de Pago</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Aplicación</Text>

        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.menuIconContainer}>
            <Ionicons name="notifications-outline" size={24} color="#22D3EE" />
          </View>
          <Text style={[styles.menuText, { color: theme.colors.text }]}>Notificaciones</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.menuIconContainer}>
            <Ionicons name="analytics-outline" size={24} color="#22D3EE" />
          </View>
          <Text style={[styles.menuText, { color: theme.colors.text }]}>Estadísticas</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.menuIconContainer}>
            <Ionicons name="help-circle-outline" size={24} color="#22D3EE" />
          </View>
          <Text style={[styles.menuText, { color: theme.colors.text }]}>Ayuda y Soporte</Text>
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
        <Text style={styles.version}>Sistema de Gestión v1.0.0</Text>
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
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#A78BFA',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 14,
    elevation: 10
  },
  userName: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.5
  },
  userEmail: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 12
  },
  roleBadge: {
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#A78BFA'
  },
  roleBadgeText: {
    color: '#A78BFA',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1
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
    width: 42,
    height: 42,
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
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
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
