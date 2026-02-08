import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { SuperAdminService } from '../../services/adminApi';

export default function SuperAdminUsers() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const loadUsers = async () => {
    try {
      const data = await SuperAdminService.getAllUsers(token);
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'No se pudo cargar los usuarios');
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await SuperAdminService.updateUserRole(token, userId, newRole);
      Alert.alert('Éxito', 'Rol actualizado correctamente');
      loadUsers();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el rol');
      console.error('Error:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    Alert.alert(
      'Confirmar',
      '¿Estás seguro de eliminar este usuario?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await SuperAdminService.deleteUser(token, userId);
              Alert.alert('Éxito', 'Usuario eliminado');
              loadUsers();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el usuario');
            }
          }
        }
      ]
    );
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: { label: 'SuperAdmin', color: '#A78BFA', icon: 'shield-checkmark' },
      trainer: { label: 'Trainer', color: '#FB923C', icon: 'barbell' },
      user: { label: 'Usuario', color: '#22D3EE', icon: 'person' }
    };
    return roleConfig[role] || roleConfig.user;
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Gestión de Usuarios</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {filteredUsers.length} usuarios totales
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#22D3EE" style={styles.searchIcon} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar por nombre o email..."
          placeholderTextColor={theme.colors.textSecondary}
          style={[styles.searchInput, { color: theme.colors.text }]}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* User List */}
      {filteredUsers.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="people-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            {searchQuery ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
          </Text>
        </View>
      ) : (
        filteredUsers.map((user) => {
          const roleBadge = getRoleBadge(user.role);
          return (
            <View key={user.id} style={[styles.userCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.userHeader}>
                <View style={[styles.avatarContainer, { borderColor: roleBadge.color }]}>
                  <Ionicons name={roleBadge.icon} size={32} color={roleBadge.color} />
                </View>
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: theme.colors.text }]}>{user.name}</Text>
                  <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>{user.email}</Text>
                </View>
                <View style={[styles.roleBadge, { backgroundColor: `${roleBadge.color}20`, borderColor: roleBadge.color }]}>
                  <Text style={[styles.roleBadgeText, { color: roleBadge.color }]}>{roleBadge.label}</Text>
                </View>
              </View>

              <View style={styles.userActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.changeRoleButton]}
                  onPress={() => {
                    const nextRole = user.role === 'user' ? 'trainer' : user.role === 'trainer' ? 'admin' : 'user';
                    handleUpdateRole(user.id, nextRole);
                  }}
                >
                  <Ionicons name="swap-horizontal" size={18} color="#22D3EE" />
                  <Text style={styles.changeRoleText}>Cambiar Rol</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteUser(user.id)}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  header: {
    marginBottom: 20,
    paddingVertical: 8
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.5
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#22D3EE',
    shadowColor: '#22D3EE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6
  },
  searchIcon: {
    marginRight: 10
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500'
  },
  emptyCard: {
    borderRadius: 18,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16
  },
  userCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: 'rgba(34, 211, 238, 0.4)',
    shadowColor: '#22D3EE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    marginRight: 14
  },
  userInfo: {
    flex: 1
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.3
  },
  userEmail: {
    fontSize: 13,
    fontWeight: '500'
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 2
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  userActions: {
    flexDirection: 'row',
    gap: 10
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 2
  },
  changeRoleButton: {
    flex: 1,
    backgroundColor: 'rgba(34, 211, 238, 0.15)',
    borderColor: '#22D3EE',
    justifyContent: 'center'
  },
  changeRoleText: {
    color: '#22D3EE',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0
  }
});
