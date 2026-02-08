import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function AdminProfileScreen() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const roleLabel = user?.role === 'trainer' ? 'ENTRENADOR' : 'ADMIN';

  const handleLogout = async () => {
    console.log('[AdminProfileScreen] handleLogout called');
    console.log('[AdminProfileScreen] Calling logout()...');
    try {
      await logout();
      console.log('[AdminProfileScreen] logout() completed successfully');
    } catch (error) {
      console.error('[AdminProfileScreen] logout error:', error);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name="shield-checkmark" size={80} color="#FB923C" />
        </View>
        <Text style={[styles.userName, { color: theme.colors.text }]}>
          {user?.name || 'Administrador'}
        </Text>
        <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
          {user?.email || 'admin@ejemplo.com'}
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{roleLabel}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Administración</Text>
        
        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="people-outline" size={24} color="#FB923C" />
          <Text style={[styles.menuText, { color: theme.colors.text }]}>Gestionar Usuarios</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="stats-chart-outline" size={24} color="#FB923C" />
          <Text style={[styles.menuText, { color: theme.colors.text }]}>Reportes</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="card-outline" size={24} color="#FB923C" />
          <Text style={[styles.menuText, { color: theme.colors.text }]}>Suscripciones</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Configuración</Text>
        
        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="settings-outline" size={24} color="#FB923C" />
          <Text style={[styles.menuText, { color: theme.colors.text }]}>Configuración General</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="notifications-outline" size={24} color="#FB923C" />
          <Text style={[styles.menuText, { color: theme.colors.text }]}>Notificaciones</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="shield-checkmark-outline" size={24} color="#FB923C" />
          <Text style={[styles.menuText, { color: theme.colors.text }]}>Seguridad</Text>
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
        <Text style={styles.version}>Versión 1.0.0 - Admin Panel</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0B0F14'
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20
  },
  avatarContainer: {
    marginBottom: 15
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 5
  },
  userEmail: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 10
  },
  badge: {
    backgroundColor: '#FB923C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  badgeText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700'
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 25
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.2)'
  },
  menuText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 15
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 30
  },
  version: {
    color: '#6B7280',
    fontSize: 12
  }
});
