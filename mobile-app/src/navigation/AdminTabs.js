import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View, Text } from 'react-native';
import React, { useState } from 'react';
import AdminDashboard from '../screens/admin/AdminDashboard';
import AdminCategories from '../screens/admin/AdminCategories';
import AdminProducts from '../screens/admin/AdminProducts';
import AdminProfileScreen from '../screens/admin/AdminProfileScreen';
import AdminSubscriptionManagement from '../screens/admin/AdminSubscriptionManagement';
import NotificationPanel from '../components/NotificationPanel';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { RoleGuard } from '../components/RoleGuard';

const Tab = createBottomTabNavigator();

export default function AdminTabs() {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [notificationVisible, setNotificationVisible] = useState(false);

  const handleLogout = async () => {
    console.log('[AdminTabs] handleLogout called');
    try {
      await logout();
      console.log('[AdminTabs] logout completed');
    } catch (error) {
      console.error('[AdminTabs] logout error:', error);
    }
  };

  const handleNotificationPress = (notification) => {
    // Close panel - the admin can navigate to subscriptions tab
    setNotificationVisible(false);
  };

  return (
    <RoleGuard requiredRole="trainer">
      <Tab.Navigator
        screenOptions={({ navigation }) => ({
          headerShown: true,
          headerStyle: {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
            borderBottomWidth: 1,
            elevation: 0
          },
          headerTintColor: theme.colors.text,
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18
          },
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
              <TouchableOpacity
                onPress={toggleTheme}
                style={{ marginRight: 8, padding: 8 }}
              >
                <Ionicons
                  name={theme.isDark ? 'sunny' : 'moon'}
                  size={24}
                  color={theme.isDark ? '#FB923C' : '#FFD700'}
                />
              </TouchableOpacity>

              {/* Notification Bell */}
              <TouchableOpacity
                onPress={() => setNotificationVisible(true)}
                style={{ marginRight: 8, padding: 8, position: 'relative' }}
              >
                <Ionicons
                  name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
                  size={23}
                  color={unreadCount > 0 ? '#FB923C' : theme.colors.text}
                />
                {unreadCount > 0 && (
                  <View style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    backgroundColor: '#EF4444',
                    borderRadius: 9,
                    minWidth: 18,
                    height: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 4,
                    borderWidth: 2,
                    borderColor: theme.colors.surface,
                  }}>
                    <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '800' }}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Profile Icon in Header */}
              <TouchableOpacity
                onPress={() => navigation.navigate('Perfil')}
                style={{
                  marginRight: 8,
                  padding: 4,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  borderRadius: 20
                }}
              >
                <Ionicons name="person-circle-outline" size={28} color={theme.colors.primary} />
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
          tabBarActiveTintColor: '#FB923C',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
          tabBarIconStyle: { marginTop: 6 }
        })}
      >
        <Tab.Screen
          name="Panel"
          component={AdminDashboard}
          options={{
            title: 'Panel',
            tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />
          }}
        />
        <Tab.Screen
          name="Suscripciones"
          component={AdminSubscriptionManagement}
          options={{
            title: 'Suscripciones',
            tabBarIcon: ({ color, size }) => <Ionicons name="card" size={size} color={color} />
          }}
        />
        <Tab.Screen
          name="Categorias"
          component={AdminCategories}
          options={{
            title: 'Categorías',
            tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />
          }}
        />
        <Tab.Screen
          name="Productos"
          component={AdminProducts}
          options={{
            title: 'Productos',
            tabBarIcon: ({ color, size }) => <Ionicons name="cube" size={size} color={color} />
          }}
        />
        <Tab.Screen
          name="Perfil"
          component={AdminProfileScreen}
          options={{
            title: 'Perfil',
            tabBarButton: () => null,
            tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />
          }}
        />
      </Tab.Navigator>

      {/* Notification Panel */}
      <NotificationPanel
        visible={notificationVisible}
        onClose={() => setNotificationVisible(false)}
        onNotificationPress={handleNotificationPress}
      />
    </RoleGuard>
  );
}
