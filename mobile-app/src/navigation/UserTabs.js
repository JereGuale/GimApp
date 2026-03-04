import { API_URL } from '../services/api';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View, Text, Image } from 'react-native';
import HomeScreen from '../screens/user/HomeScreen';
import CategoriesScreen from '../screens/user/CategoriesScreen';
import SubscriptionScreen from '../screens/user/SubscriptionScreen';
import ProfileScreen from '../screens/user/ProfileScreen';
import { Image as ExpoImage } from 'expo-image';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { RoleGuard } from '../components/RoleGuard';
import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator();

export default function UserTabs() {
  const { theme, toggleTheme } = useTheme();
  const { totalItems } = useCart();
  const { user } = useAuth();
  // Lógica para mostrar la foto de perfil
  const BASE_URL = API_URL.replace('/api', '');

  const profilePhotoUri = (() => {
    let photoUrl = user?.profile_photo_url || user?.profile_photo;
    if (!photoUrl) return null;

    if (photoUrl.match(/^http:\/\/(192\.168\.\d+\.\d+|localhost|127\.0\.0\.1):\d+/)) {
      const pathPart = photoUrl.split('/storage/')[1];
      if (pathPart) {
        photoUrl = `${BASE_URL}/storage/${pathPart}`;
      }
    } else if (!photoUrl.startsWith('http')) {
      photoUrl = `${BASE_URL}/storage/${photoUrl}`;
    }

    return photoUrl;
  })();
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
                  width: 34, height: 34,
                  borderRadius: 17,
                  overflow: 'hidden',
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: theme.isDark ? '#374151' : '#F3F4F6',
                  marginLeft: 8,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
              >
                {profilePhotoUri ? (
                  <ExpoImage
                    source={{ uri: profilePhotoUri }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                  />
                ) : (
                  <Ionicons name="person" size={20} color={theme.colors.textSecondary || '#9CA3AF'} />
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
