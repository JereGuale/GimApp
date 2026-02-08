
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import HomeScreen from '../screens/user/HomeScreen';
import CategoriesScreen from '../screens/user/CategoriesScreen';
import SubscriptionScreen from '../screens/user/SubscriptionScreen';
import ProfileScreen from '../screens/user/ProfileScreen';
import { useTheme } from '../context/ThemeContext';
import { RoleGuard } from '../components/RoleGuard';

const Tab = createBottomTabNavigator();

export default function UserTabs() {
  const { theme, toggleTheme } = useTheme();

  return (
    <RoleGuard requiredRole="user">
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
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18
          },
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
          name="Inicio"
          component={HomeScreen}
          options={{
            title: 'Inicio',
            tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />
          }}
        />
        <Tab.Screen
          name="Productos"
          component={CategoriesScreen}
          options={{
            title: 'Productos',
            tabBarIcon: ({ color, size }) => <Ionicons name="barbell" size={size} color={color} />
          }}
        />
        <Tab.Screen
          name="Suscripcion"
          component={SubscriptionScreen}
          options={{
            title: 'Suscripción',
            tabBarIcon: ({ color, size }) => <Ionicons name="card" size={size} color={color} />
          }}
        />
        <Tab.Screen
          name="Perfil"
          component={ProfileScreen}
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />
          }}
        />
      </Tab.Navigator>
    </RoleGuard>
  );
}
