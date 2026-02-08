import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View } from 'react-native';
import AdminDashboard from '../screens/admin/AdminDashboard';
import AdminCategories from '../screens/admin/AdminCategories';
import AdminProducts from '../screens/admin/AdminProducts';
import AdminProfileScreen from '../screens/admin/AdminProfileScreen';
import AdminSubscriptionManagement from '../screens/admin/AdminSubscriptionManagement';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { RoleGuard } from '../components/RoleGuard';

const Tab = createBottomTabNavigator();

export default function AdminTabs() {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();

  const handleLogout = async () => {
    console.log('[AdminTabs] handleLogout called');
    try {
      await logout();
      console.log('[AdminTabs] logout completed');
    } catch (error) {
      console.error('[AdminTabs] logout error:', error);
    }
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
    </RoleGuard>
  );
}
