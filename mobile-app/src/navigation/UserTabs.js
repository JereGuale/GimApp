
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View, Text } from 'react-native';
import HomeScreen from '../screens/user/HomeScreen';
import CategoriesScreen from '../screens/user/CategoriesScreen';
import SubscriptionScreen from '../screens/user/SubscriptionScreen';
import ProfileScreen from '../screens/user/ProfileScreen';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { RoleGuard } from '../components/RoleGuard';

const Tab = createBottomTabNavigator();

export default function UserTabs() {
  const { theme, toggleTheme } = useTheme();
  const { totalItems } = useCart();

  return (
    <RoleGuard requiredRole="user">
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
              <TouchableOpacity style={{ padding: 8 }}>
                <Ionicons name="notifications-outline" size={22} color={theme.colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={{ padding: 8, position: 'relative' }}
                onPress={() => navigation.navigate('Cart')}
              >
                <Ionicons name="cart-outline" size={23} color={theme.colors.text} />
                {totalItems > 0 && (
                  <View style={{
                    position: 'absolute', top: 2, right: 2,
                    backgroundColor: '#EF4444', borderRadius: 9,
                    minWidth: 18, height: 18,
                    alignItems: 'center', justifyContent: 'center',
                    paddingHorizontal: 4,
                  }}>
                    <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '800' }}>
                      {totalItems > 99 ? '99+' : totalItems}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('Perfil')}
                style={{
                  padding: 4, marginLeft: 4,
                  borderWidth: 1.5, borderColor: '#22D3EE',
                  borderRadius: 20,
                }}
              >
                <Ionicons name="person-circle-outline" size={26} color="#22D3EE" />
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
        })}
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
            tabBarButton: () => null,
            tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />
          }}
        />
      </Tab.Navigator>
    </RoleGuard>
  );
}
