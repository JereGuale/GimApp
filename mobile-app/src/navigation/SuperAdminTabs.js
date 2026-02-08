import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import SuperAdminDashboard from '../screens/superadmin/SuperAdminDashboard';
import SuperAdminUsers from '../screens/superadmin/SuperAdminUsers';
import SuperAdminSettings from '../screens/superadmin/SuperAdminSettings';
import RoleManagementScreen from '../screens/superadmin/RoleManagementScreen';
import UserRolesScreen from '../screens/superadmin/UserRolesScreen';
import AdminBannerManager from '../screens/admin/AdminBannerManager';
import AdminProducts from '../screens/admin/AdminProducts';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { RoleGuard } from '../components/RoleGuard';

const Tab = createBottomTabNavigator();

export default function SuperAdminTabs() {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const navigation = useNavigation();

  const handleLogout = async () => {
    console.log('[SuperAdminTabs] handleLogout called');
    try {
      await logout();
      console.log('[SuperAdminTabs] logout completed');
    } catch (error) {
      console.error('[SuperAdminTabs] logout error:', error);
    }
  };

  return (
    <RoleGuard requiredRole="admin">
      <Tab.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
            borderBottomWidth: 1,
            elevation: 0
          },
          headerTintColor: theme.colors.text,
          headerTitleStyle: { fontWeight: '700', fontSize: 18 },
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
              <TouchableOpacity onPress={toggleTheme} style={{ padding: 8 }}>
                <Ionicons
                  name={theme.isDark ? 'sunny' : 'moon'}
                  size={24}
                  color={theme.isDark ? '#FB923C' : '#FFD700'}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} style={{ padding: 8 }}>
                <Ionicons name="log-out-outline" size={22} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ),
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            height: 60,
            paddingBottom: 8
          },
          tabBarActiveTintColor: '#22D3EE',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
          tabBarIconStyle: { marginTop: 6 }
        }}
      >
        <Tab.Screen
          name="SuperDashboard"
          component={SuperAdminDashboard}
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" size={size} color={color} />
          }}
        />
        <Tab.Screen
          name="SuperUsers"
          component={SuperAdminUsers}
          options={{
            title: 'Usuarios',
            tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />
          }}
        />
        <Tab.Screen
          name="Banner"
          component={AdminBannerManager}
          options={{
            title: 'Banner',
            tabBarIcon: ({ color, size }) => <Ionicons name="image" size={size} color={color} />
          }}
        />
        <Tab.Screen
          name="SuperSettings"
          component={SuperAdminSettings}
          options={{
            title: 'Ajustes',
            tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />
          }}
        />
        <Tab.Screen
          name="Productos"
          component={AdminProducts}
          options={{
            tabBarButton: () => null, // Hide from tab bar
            title: 'Gestión de Productos'
          }}
        />
        <Tab.Screen
          name="RoleManagement"
          component={RoleManagementScreen}
          options={{
            tabBarButton: () => null,
            title: 'Gestión de Roles'
          }}
        />
        <Tab.Screen
          name="UserRoles"
          component={UserRolesScreen}
          options={{
            tabBarButton: () => null, // Hide from tab bar
            title: 'Asignar Roles a Usuarios'
          }}
        />
      </Tab.Navigator>
    </RoleGuard>
  );
}
