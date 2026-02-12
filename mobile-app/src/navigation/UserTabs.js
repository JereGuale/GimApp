import Constants from 'expo-constants';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View, Text, Image } from 'react-native';
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
  const { user } = require('../context/AuthContext').useAuth();
  // Lógica para mostrar la foto de perfil
 
  const DEV_BACKEND_IP = Constants.manifest?.extra?.DEV_BACKEND_IP || '127.0.0.1';
  const BASE_URL = `http://${DEV_BACKEND_IP}:8000`;
  const profilePhotoUri = user && user.profile_photo
    ? `${BASE_URL}/storage/${user.profile_photo}`
    : null;

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
                  width: 32, height: 32,
                  borderRadius: 16,
                  overflow: 'hidden',
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: 'transparent',
                  marginLeft: 4,
                  padding: 0,
                }}
              >
                {profilePhotoUri ? (
                  <Image
                    source={{ uri: profilePhotoUri }}
                    style={{ width: 32, height: 32, borderRadius: 16, resizeMode: 'cover' }}
                  />
                ) : (
                  <Ionicons name="person-circle-outline" size={32} color={'#181818'} />
                )}
              </TouchableOpacity>
            </View>
          ),
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            height: 60,
            paddingBottom: 8
          },
          tabBarActiveTintColor: '#FF6A1A',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
          tabBarIconStyle: { marginTop: 6 }
        })}
      >
        <Tab.Screen
          name="Inicio"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
            title: 'Inicio',
          }}
        />
        <Tab.Screen
          name="Categorías"
          component={CategoriesScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="grid-outline" size={size} color={color} />
            ),
            title: 'Categorías',
          }}
        />
        <Tab.Screen
          name="Suscripción"
          component={SubscriptionScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="card-outline" size={size} color={color} />
            ),
            title: 'Suscripción',
          }}
        />
        <Tab.Screen
          name="Perfil"
          component={ProfileScreen}
          options={{
            tabBarButton: () => null, // Hide from tab bar
          }}
        />
      </Tab.Navigator>
    </RoleGuard>
  );
}
