import { API_URL } from '../services/api';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View, Text, Modal, ScrollView } from 'react-native';
import HomeScreen from '../screens/user/HomeScreen';
import CategoriesScreen from '../screens/user/CategoriesScreen';
import SubscriptionScreen from '../screens/user/SubscriptionScreen';
import ProfileScreen from '../screens/user/ProfileScreen';
import MyPurchasesScreen from '../screens/user/MyPurchasesScreen';
import ProductDetailScreen from '../screens/user/ProductDetailScreen';
import { Image as ExpoImage } from 'expo-image';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { RoleGuard } from '../components/RoleGuard';
import { useAuth } from '../context/AuthContext';
import { useResponsive } from '../hooks/useResponsive';
import React, { useEffect, useState } from 'react';
import { useNotifications } from '../context/NotificationContext';

const Tab = createBottomTabNavigator();

export default function UserTabs() {
  const { theme } = useTheme();
  const { totalItems } = useCart();
  const { user, avatarPreview } = useAuth();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotifications();
  const { width, isSmallScreen } = useResponsive();
  const [avatarFailedUri, setAvatarFailedUri] = useState(null);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  
  const tabHorizontalInset = isSmallScreen ? 8 : 16;
  const tabWidth = Math.max(320, width - (tabHorizontalInset * 2));
  const translateXOffset = -tabWidth / 2;
  
  // Lógica para mostrar la foto de perfil
  const BASE_URL = API_URL.replace('/api', '');

  const profilePhotoUri = (() => {
    if (avatarPreview) return avatarPreview;

    let photoUrl = user?.profile_photo_url || user?.profile_photo;
    if (!photoUrl) return null;

    if (photoUrl.match(/^http:\/\/(192\.168\.\d+\.\d+|localhost|127\.0\.0\.1):\d+/)) {
      const pathPart = photoUrl.split('/storage/')[1];
      if (pathPart) {
        photoUrl = `${BASE_URL}/storage/${pathPart}`;
      }
    } else if (!photoUrl.startsWith('http') && !photoUrl.startsWith('file:') && !photoUrl.startsWith('blob:') && !photoUrl.startsWith('data:')) {
      photoUrl = `${BASE_URL}/storage/${photoUrl}`;
    }

    return photoUrl;
  })();

  useEffect(() => {
    setAvatarFailedUri(null);
  }, [profilePhotoUri]);

  return (
    <RoleGuard requiredRole={['user', 'admin', 'super_admin']}>
      <Tab.Navigator
        screenOptions={({ navigation, route }) => ({
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
                style={{ padding: 8, position: 'relative' }}
                onPress={() => {
                  setNotificationsVisible(true);
                  fetchNotifications();
                }}
              >
                <Ionicons name="notifications-outline" size={30} color={theme.colors.text} />
                {unreadCount > 0 && (
                  <View style={{
                    position: 'absolute', top: 0, right: 0,
                    backgroundColor: '#EF4444', borderRadius: 9,
                    minWidth: 18, height: 18, alignItems: 'center',
                    justifyContent: 'center', paddingHorizontal: 4,
                  }}>
                    <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '800' }}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={{ padding: 8, position: 'relative' }}
                onPress={() => navigation.navigate('Cart')}
              >
                <Ionicons name="cart-outline" size={31} color={theme.colors.text} />
                {totalItems > 0 && (
                  <View style={{
                    position: 'absolute', top: -2, right: -2,
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
                onPress={() => {
                  if (route.name === 'Perfil') {
                    navigation.setParams({ editProfile: Date.now() });
                  } else {
                    navigation.navigate('Perfil');
                  }
                }}
                style={{
                  width: 48, height: 48,
                  borderRadius: 24,
                  overflow: 'hidden',
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: theme.isDark ? '#374151' : '#F3F4F6',
                  marginLeft: 8,
                  borderWidth: 1.5,
                  borderColor: theme.colors.border,
                }}
              >
                <Ionicons name="person" size={28} color={theme.colors.textSecondary || '#9CA3AF'} />
                {profilePhotoUri && profilePhotoUri !== avatarFailedUri && (
                  <ExpoImage
                    source={{ uri: profilePhotoUri }}
                    style={{ position: 'absolute', width: '100%', height: '100%' }}
                    contentFit="cover"
                    priority="high"
                    cachePolicy="memory-disk"
                    transition={0}
                    onError={() => setAvatarFailedUri(profilePhotoUri)}
                  />
                )}
              </TouchableOpacity>
            </View>
          ),
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderRadius: 30,
            height: 62,
            paddingBottom: 8,
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: [{ translateX: translateXOffset }],
            width: tabWidth,
            overflow: 'visible',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 10,
            elevation: 4
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
              tabBarButton: () => null,
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="grid-outline" size={size} color={color} />
              ),
              title: 'Categorías',
            }}
          />
          <Tab.Screen
            name="ProductDetail"
            component={ProductDetailScreen}
            options={{
              tabBarButton: () => null,
              headerShown: false,
              title: 'Detalle del Producto',
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
          {user && (
            <Tab.Screen
              name="Mis Compras"
              component={MyPurchasesScreen}
              options={{
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="bag-handle-outline" size={size} color={color} />
                ),
                title: 'Mis Compras',
              }}
            />
          )}
        <Tab.Screen
          name="Perfil"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
            title: 'Perfil',
          }}
        />
      </Tab.Navigator>
      <Modal
        visible={notificationsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNotificationsVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setNotificationsVisible(false)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 72, paddingRight: 12 }}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{ width: Math.min(width - 24, 380), maxHeight: '75%', backgroundColor: theme.colors.surface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
              <View>
                <Text style={{ color: theme.colors.text, fontSize: 17, fontWeight: '800' }}>Notificaciones</Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 11, marginTop: 3 }}>
                  Mantén tus avisos importantes al día
                </Text>
              </View>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={markAllAsRead}>
                  <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '700' }}>Marcar todas</Text>
                </TouchableOpacity>
              )}
            </View>
            <ScrollView>
              {notifications.length === 0 ? (
                <View style={{ alignItems: 'center', padding: 32 }}>
                  <Ionicons name="notifications-off-outline" size={34} color={theme.colors.textSecondary} />
                  <Text style={{ color: theme.colors.textSecondary, marginTop: 10 }}>No tienes notificaciones</Text>
                </View>
              ) : notifications.map((notification) => (
                (() => {
                  const isExpiring = notification.type === 'subscription_expiring';
                  const isSubscription = notification.type?.includes('subscription');
                  const isOrder = notification.type?.includes('order');
                  const accent = isExpiring ? '#F59E0B' : isSubscription ? '#8B5CF6' : '#10B981';
                  const icon = isExpiring ? 'warning' : isSubscription ? 'card' : isOrder ? 'bag-handle' : 'notifications';

                  return (
                <TouchableOpacity
                  key={notification.id}
                  onPress={() => !notification.read_at && markAsRead(notification.id)}
                  style={{
                    marginHorizontal: 10,
                    marginVertical: 6,
                    padding: 12,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: notification.read_at ? theme.colors.border : `${accent}80`,
                    backgroundColor: notification.read_at
                      ? (theme.isDark ? 'rgba(255,255,255,0.025)' : '#FFFFFF')
                      : (theme.isDark ? `${accent}18` : `${accent}10`),
                    opacity: notification.read_at ? 0.78 : 1,
                  }}
                >
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: `${accent}22` }}>
                      <Ionicons name={`${icon}-outline`} size={21} color={accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <Text style={{ color: theme.colors.text, fontWeight: '800', fontSize: 13, flex: 1 }}>{notification.title}</Text>
                        {!notification.read_at && (
                          <View style={{ backgroundColor: accent, borderRadius: 99, paddingHorizontal: 7, paddingVertical: 3 }}>
                            <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '800' }}>NUEVA</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ color: theme.colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 3 }}>{notification.message}</Text>
                      <Text style={{ color: theme.colors.textSecondary, fontSize: 10, marginTop: 7 }}>
                        {notification.created_at ? new Date(notification.created_at).toLocaleString('es-MX') : ''}
                      </Text>
                      {!notification.read_at && (
                        <TouchableOpacity
                          onPress={() => markAsRead(notification.id)}
                          style={{ alignSelf: 'flex-start', marginTop: 8, paddingVertical: 4 }}
                        >
                          <Text style={{ color: accent, fontSize: 11, fontWeight: '800' }}>Marcar como vista</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
                  );
                })()
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </RoleGuard>
  );
}
