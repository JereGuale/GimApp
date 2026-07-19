import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput, Modal, Animated, Dimensions, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ProfileAPI } from '../../services/notificationService';
import { SubscriptionAPI } from '../../services/subscriptionService';
import { OrderAPI } from '../../services/orderService';
import { useResponsive } from '../../hooks/useResponsive';
import * as ImagePicker from 'expo-image-picker';
import React, { useState, useRef, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import AuthModal from '../../components/AuthModal';

import { API_URL } from '../../services/api';
const BASE_URL = API_URL.replace('/api', '');

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { width, isSmallScreen, isTablet, isDesktop } = useResponsive();

  const DRAWER_WIDTH = width * 0.75 > 300 ? 300 : width * 0.75;

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const [authModalVisible, setAuthModalVisible] = useState(false);

  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [billingName, setBillingName] = useState(user?.billing_name || user?.name || '');
  const [billingEmail, setBillingEmail] = useState(user?.billing_email || user?.email || '');
  const [billingPhone, setBillingPhone] = useState(user?.billing_phone || user?.phone || '');
  const [billingIdNumber, setBillingIdNumber] = useState(user?.billing_id_number || '');
  const [billingCity, setBillingCity] = useState(user?.billing_city || '');
  const [billingAddress, setBillingAddress] = useState(user?.billing_address || '');
  const [billingEditVisible, setBillingEditVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoKey, setPhotoKey] = useState(Date.now());
  const [localPhotoUri, setLocalPhotoUri] = useState(null);

  const [subscription, setSubscription] = useState({ data: null, loading: true });
  const [rejectedOrders, setRejectedOrders] = useState([]);

  // Escuchar el parámetro editProfile de la cabecera superior para abrir el modal de edición de perfil con un retraso suave
  React.useEffect(() => {
    if (route.params?.editProfile) {
      setEditName(user?.name || '');
      setEditEmail(user?.email || '');
      setEditPhone(user?.phone || '');
      const timer = setTimeout(() => {
        setEditModalVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [route.params?.editProfile]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      const fetchProfileData = async () => {
        const [subscriptionResult, ordersResult] = await Promise.all([
          SubscriptionAPI.getMySubscription(),
          OrderAPI.getMyOrders(),
        ]);

        if (mounted) {
          setSubscription({
            data: subscriptionResult.success ? subscriptionResult.data : null,
            loading: false
          });

          if (ordersResult.success) {
            const allRejected = (ordersResult.data || []).filter(order => order.status === 'rejected');
            setRejectedOrders(allRejected);
          } else {
            setRejectedOrders([]);
          }
        }
      };

      // Keep loader on when refreshing on focus
      if (!subscription.data) {
        setSubscription(prev => ({ ...prev, loading: true }));
      }

      fetchProfileData();
      return () => { mounted = false; };
    }, [])
  );

  const openDrawer = () => {
    setDrawerVisible(true);
    Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
  };
  const closeDrawer = () => {
    Animated.timing(slideAnim, { toValue: -DRAWER_WIDTH, duration: 300, useNativeDriver: true }).start(() => setDrawerVisible(false));
  };

  const handleLogout = async () => await logout();

  const handlePickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galería');
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      if (!result.canceled && result.assets[0]) {
        const selectedUri = result.assets[0].uri;
        setLocalPhotoUri(selectedUri);
        setUploadingPhoto(true);
        const uploadResult = await ProfileAPI.uploadPhoto(selectedUri);
        if (uploadResult.success) {
          Alert.alert('¡Éxito!', 'Foto de perfil actualizada');
          const newTimestamp = Date.now();
          setLocalPhotoUri(null); // Limpiar previsualización local para mostrar la URL remota actualizada
          if (updateUser) {
            updateUser({
              ...user,
              profile_photo: uploadResult.data.profile_photo,
              profile_photo_url: uploadResult.data.profile_photo_url ? `${uploadResult.data.profile_photo_url}?t=${newTimestamp}` : null
            });
          }
          setPhotoKey(newTimestamp);
        } else {
          Alert.alert('Error', uploadResult.error || 'No se pudo subir la foto');
          setLocalPhotoUri(null);
        }
        setUploadingPhoto(false);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const result = await ProfileAPI.updateProfile({
      name: editName,
      email: editEmail,
      phone: editPhone
    });
    if (result.success) {
      Alert.alert('¡Éxito!', 'Perfil actualizado');
      if (updateUser) {
        updateUser({
          ...user,
          name: editName,
          email: editEmail,
          phone: editPhone
        });
      }
      setEditModalVisible(false);
    } else {
      Alert.alert('Error', result.error || 'No se pudo actualizar');
    }
    setSaving(false);
  };

  const handleSaveBilling = async () => {
    setSaving(true);
    const result = await ProfileAPI.updateProfile({
      billing_name: billingName,
      billing_email: billingEmail,
      billing_phone: billingPhone,
      billing_id_number: billingIdNumber,
      billing_city: billingCity,
      billing_address: billingAddress
    });
    if (result.success) {
      Alert.alert('¡Éxito!', 'Datos de facturación actualizados');
      if (updateUser) {
        updateUser({
          ...user,
          billing_name: billingName,
          billing_email: billingEmail,
          billing_phone: billingPhone,
          billing_id_number: billingIdNumber,
          billing_city: billingCity,
          billing_address: billingAddress
        });
      }
      setBillingEditVisible(false);
    } else {
      Alert.alert('Error', result.error || 'No se pudo actualizar');
    }
    setSaving(false);
  };

  const profilePhotoUri = (() => {
    if (localPhotoUri) return localPhotoUri;

    let photoUrl = user?.profile_photo_url || user?.profile_photo;
    if (!photoUrl) return null;

    // Si la URL es de un backend local (contiene 192.168, localhost, 127.0.0.1) 
    // y el BASE_URL actual es diferente, la reemplazamos para que cargue correctamente.
    if (photoUrl.match(/^http:\/\/(192\.168\.\d+\.\d+|localhost|127\.0\.0\.1):\d+/)) {
      const pathPart = photoUrl.split('/storage/')[1];
      if (pathPart) {
        photoUrl = `${BASE_URL}/storage/${pathPart}`;
      }
    } else if (!photoUrl.startsWith('http')) {
      photoUrl = `${BASE_URL}/storage/${photoUrl}`;
    }

    return photoUrl.includes('?') ? photoUrl : `${photoUrl}?t=${photoKey}`;
  })();

  const DrawerContent = () => (
    <View style={[styles.drawer, { backgroundColor: theme.colors.background }]}>
      <View style={styles.drawerHeader}>
        <Text style={[styles.drawerTitle, { color: theme.colors.text }]}>Menú</Text>
        <TouchableOpacity onPress={closeDrawer}><Ionicons name="close" size={28} color={theme.colors.text} /></TouchableOpacity>
      </View>
      <ScrollView>
        <Text style={[styles.drawerSection, { color: theme.colors.textSecondary }]}>MI CUENTA</Text>
        <DrawerItem icon="person-outline" label="Editar Perfil" onPress={() => {
          closeDrawer();
          setEditName(user?.name || '');
          setEditEmail(user?.email || '');
          setEditPhone(user?.phone || '');
          setEditModalVisible(true);
        }} />
        <DrawerItem icon="card-outline" label="Mi Suscripción" onPress={() => { closeDrawer(); navigation.navigate('Suscripción'); }} />
        <DrawerItem icon="cart-outline" label="Mis Compras" onPress={() => { closeDrawer(); navigation.navigate('Mis Compras'); }} />
        <DrawerItem icon="document-text-outline" label="Datos de facturación" onPress={() => {
          closeDrawer();
          setBillingName(user?.billing_name || user?.name || '');
          setBillingEmail(user?.billing_email || user?.email || '');
          setBillingPhone(user?.billing_phone || user?.phone || '');
          setBillingIdNumber(user?.billing_id_number || '');
          setBillingCity(user?.billing_city || '');
          setBillingAddress(user?.billing_address || '');
          setBillingEditVisible(true);
        }} />

        <Text style={[styles.drawerSection, { color: theme.colors.textSecondary, marginTop: 24 }]}>PREFERENCIAS</Text>
        <DrawerItem icon={theme.isDark ? 'sunny-outline' : 'moon-outline'} label={theme.isDark ? 'Modo Claro' : 'Modo Oscuro'} onPress={toggleTheme} />

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const DrawerItem = ({ icon, label, onPress }) => (
    <TouchableOpacity style={[styles.drawerItem, { borderBottomColor: theme.colors.border }]} onPress={onPress}>
      <Ionicons name={icon} size={22} color={theme.colors.text} style={{ width: 30 }} />
      <Text style={[styles.drawerItemText, { color: theme.colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );

  if (!user) {
    return (
      <View style={[styles.container, styles.guestContainer, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.guestCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '1A' }]}>
            <Ionicons name="person-circle-outline" size={64} color={theme.colors.primary} />
          </View>
          <Text style={[styles.guestTitle, { color: theme.colors.text }]}>Mi Cuenta</Text>
          <Text style={[styles.guestSubtitle, { color: theme.colors.textSecondary }]}>
            Inicia sesión o regístrate para gestionar tu perfil, ver tu membresía activa y acceder a tu historial de visitas al gimnasio.
          </Text>
          <TouchableOpacity
            style={[styles.guestBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => setAuthModalVisible(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.guestBtnText}>INGRESAR O REGISTRARSE</Text>
          </TouchableOpacity>
        </View>

        <AuthModal
          visible={authModalVisible}
          onClose={() => setAuthModalVisible(false)}
          onSuccess={() => {
            setAuthModalVisible(false);
          }}
        />
      </View>
    );
  }

  const screenBg = theme.isDark ? '#090D16' : '#FFFFFF';
  const textMain = theme.isDark ? '#F3F4F6' : '#111827';
  const textMuted = theme.isDark ? '#9CA3AF' : '#6B7280';
  const cardBg = theme.isDark ? '#111827' : '#FFFFFF';
  const cardBorder = theme.isDark ? '#1F2937' : '#E2E8F0';
  const bentoBg = theme.isDark ? '#111827' : '#F9FAFB';

  const getSubscriptionProgress = () => {
    if (!subscription.data?.ends_at) return 0;
    const end = new Date(subscription.data.ends_at).getTime();
    const start = subscription.data.starts_at ? new Date(subscription.data.starts_at).getTime() : (end - 30 * 24 * 60 * 60 * 1000);
    const now = Date.now();
    const total = end - start;
    const elapsed = now - start;
    if (total <= 0) return 0;
    const percent = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
    return percent;
  };

  const getDaysRemaining = () => {
    if (!subscription.data?.ends_at) return 0;
    const end = new Date(subscription.data.ends_at).getTime();
    const now = Date.now();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const isStacked = isSmallScreen;
  const hasRejectedSubscription = subscription.data?.status === 'rejected';
  const hasRejectedOrder = rejectedOrders.length > 0;
  const subscriptionBadgeColor = hasRejectedSubscription
    ? '#EF4444'
    : subscription.data?.status === 'active'
      ? '#22C55E'
      : '#F59E0B';
  const subscriptionBadgeLabel = hasRejectedSubscription
    ? 'RECHAZADA'
    : subscription.data?.status === 'active'
      ? 'ACTIVA'
      : 'PENDIENTE';

  return (
    <View style={[styles.container, { backgroundColor: screenBg }]}>
      {/* Drawer Overlay */}
      {drawerVisible && (
        <TouchableOpacity style={styles.drawerOverlay} activeOpacity={1} onPress={closeDrawer} />
      )}
      <Animated.View style={[styles.drawerContainer, { width: DRAWER_WIDTH, transform: [{ translateX: slideAnim }], backgroundColor: theme.colors.surface }]}>
        <DrawerContent />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.mainContent} showsVerticalScrollIndicator={false}>
        {/* Header Dashboard */}
        <View style={styles.header}>
          <TouchableOpacity onPress={openDrawer} style={[styles.menuButton, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Ionicons name="menu-outline" size={26} color={textMain} />
          </TouchableOpacity>
        </View>

        {/* Hero Header (Apple Fitness style) */}
        <View style={styles.heroHeader}>
          <View style={styles.heroTextContainer}>
            <Text style={[styles.heroGreeting, { color: textMain }]}>
              Hola, {user?.name ? user.name.split(' ')[0] : 'Usuario'} 👋
            </Text>
            <Text style={[styles.heroLevel, { color: textMuted }]}>Nivel 1 • Principiante</Text>

            {/* XP progress bar inside header */}
            <View style={styles.headerXpContainer}>
              <View style={[styles.headerXpBarBg, { backgroundColor: theme.isDark ? '#1F2937' : '#F3F4F6' }]}>
                <View style={[styles.headerXpBarFill, { width: '32%', backgroundColor: '#5B3DF5' }]} />
              </View>
              <Text style={[styles.headerXpValue, { color: textMuted }]}>320 / 1000 XP</Text>
            </View>
          </View>
        </View>

        {/* Stats Section - 3 columns on Desktop/Tablet, stacked on mobile */}
        <View style={isStacked ? styles.statsSectionStacked : styles.statsSectionRow}>
          <View style={[styles.statCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(249, 115, 22, 0.08)' }]}>
              <Ionicons name="flame" size={24} color="#F97316" />
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statValue, { color: textMain }]}>0 Días</Text>
              <Text style={[styles.statLabel, { color: textMuted }]}>Racha Actual</Text>
              <Text style={[styles.statDesc, { color: textMuted }]}>Sigue entrenando para iniciar tu racha</Text>
            </View>
          </View>

          <View style={[styles.statCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(0, 194, 255, 0.08)' }]}>
              <Ionicons name="fitness" size={24} color="#00C2FF" />
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statValue, { color: textMain }]}>0 Sesiones</Text>
              <Text style={[styles.statLabel, { color: textMuted }]}>Entrenamientos</Text>
              <Text style={[styles.statDesc, { color: textMuted }]}>Registros acumulados este mes</Text>
            </View>
          </View>

          <View style={[styles.statCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(91, 61, 245, 0.08)' }]}>
              <Ionicons name="trophy" size={24} color="#5B3DF5" />
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statValue, { color: textMain }]}>Nivel 1</Text>
              <Text style={[styles.statLabel, { color: textMuted }]}>Nivel de Cuenta</Text>
              <Text style={[styles.statDesc, { color: textMuted }]}>Categoría inicial del usuario</Text>
            </View>
          </View>
        </View>

        {/* Membership Platinum Section */}
        <Text style={[styles.sectionTitle, { color: textMain }]}>Membresía Activa</Text>

        {subscription.loading ? (
          <View style={[styles.loadingCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <ActivityIndicator size="large" color="#5B3DF5" />
          </View>
        ) : !subscription.data || (subscription.data.status !== 'active' && subscription.data.status !== 'pending' && subscription.data.status !== 'rejected') ? (
          <View style={[styles.noSubCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Ionicons name="card-outline" size={48} color={textMuted} style={{ marginBottom: 16 }} />
            <Text style={[styles.noSubTitle, { color: textMain }]}>Sin membresía activa</Text>
            <Text style={[styles.noSubDesc, { color: textMuted }]}>Únete al club fitness hoy mismo y obtén acceso ilimitado a nuestras sedes, planes nutricionales y entrenadores expertos.</Text>
            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={() => navigation.navigate('Suscripción')}
            >
              <Text style={styles.primaryActionButtonText}>Ver Planes de Suscripción</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.platinumCardOuter}>
            <LinearGradient
              colors={theme.isDark ? ['#1E293B', '#0F172A'] : ['#F9FAFB', '#F3F4F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.platinumCard, { borderColor: theme.isDark ? '#334155' : '#D1D5DB' }]}
            >
              {/* Platinum Card Header */}
              <View style={styles.platinumHeader}>
                <View>
                  <Text style={[styles.platinumTitle, { color: textMuted }]}>Elite Pass Platinum</Text>
                  <Text style={styles.platinumPlanName}>⭐ {subscription.data.plan?.name || 'Membresía Gym'}</Text>
                </View>
                <View style={[
                  styles.platinumBadge,
                  { backgroundColor: subscriptionBadgeColor }
                ]}>
                  <Text style={styles.platinumBadgeText}>
                    {subscriptionBadgeLabel}
                  </Text>
                </View>
              </View>

              {/* Platinum Card Body Split */}
              <View style={styles.platinumBody}>
                <View style={styles.platinumPriceSection}>
                  <Text style={[styles.platinumPrice, { color: textMain }]}>
                    ${subscription.data.price ? Number(subscription.data.price).toFixed(0) : '20'}
                  </Text>
                  <Text style={[styles.platinumPeriod, { color: textMuted }]}>/mes</Text>
                </View>

                <View style={styles.platinumDetailList}>
                  <View style={styles.platinumDetailItem}>
                    <Ionicons name="card-sharp" size={14} color="#5B3DF5" />
                    <Text style={[styles.platinumDetailText, { color: textMuted }]}>
                      Pago: {subscription.data.payment_method === 'transfer' ? 'Transferencia' : 'Tarjeta'}
                    </Text>
                  </View>
                  <View style={styles.platinumDetailItem}>
                    <Ionicons name="calendar-sharp" size={14} color="#5B3DF5" />
                    <Text style={[styles.platinumDetailText, { color: textMuted }]}>
                      Siguiente cobro: {subscription.data.ends_at ? new Date(subscription.data.ends_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : '—'}
                    </Text>
                  </View>
                  {hasRejectedSubscription && (
                    <View style={styles.platinumDetailItem}>
                      <Ionicons name="warning" size={14} color="#EF4444" />
                      <Text style={[styles.platinumDetailText, { color: '#EF4444' }]}>
                        Motivo: {subscription.data.rejection_reason || 'Comprobante no válido'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Progress and Renewal Info */}
              {subscription.data.status === 'active' && (
                <View style={styles.renewalSection}>
                  <View style={[styles.renewalBarBg, { backgroundColor: theme.isDark ? '#334155' : '#E5E7EB' }]}>
                    <View style={[styles.renewalBarFill, { width: `${getSubscriptionProgress()}%`, backgroundColor: '#5B3DF5' }]} />
                  </View>
                  <Text style={[styles.renewalText, { color: textMuted }]}>
                    Renueva en {getDaysRemaining()} días ({getSubscriptionProgress()}% consumido)
                  </Text>
                </View>
              )}

              {/* Platinum Card Action Buttons */}
              <View style={styles.platinumActions}>
                <TouchableOpacity
                  style={[styles.platinumButtonOutlined, { borderColor: theme.isDark ? '#475569' : '#D1D5DB' }]}
                  onPress={() => navigation.navigate('Suscripción')}
                >
                  <Text style={[styles.platinumButtonTextOutlined, { color: textMain }]}>Cambiar plan</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.platinumButtonSolid}
                  onPress={() => navigation.navigate('Suscripción')}
                >
                  <Text style={styles.platinumButtonTextSolid}>Administrar membresía</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        )}

        {(hasRejectedSubscription || hasRejectedOrder) && (
          <View style={styles.rejectionSection}>
            <Text style={[styles.sectionTitle, { color: textMain }]}>Estado de revisión</Text>

            {hasRejectedSubscription && (
              <View style={[styles.rejectionCard, { borderColor: '#FCA5A5', backgroundColor: theme.isDark ? 'rgba(127, 29, 29, 0.2)' : '#FEF2F2' }]}>
                <View style={styles.rejectionHeader}>
                  <Ionicons name="alert-circle" size={18} color="#EF4444" />
                  <Text style={[styles.rejectionTitle, { color: '#B91C1C' }]}>Suscripción rechazada</Text>
                </View>
                <Text style={[styles.rejectionText, { color: textMain }]}>
                  Motivo: {subscription.data?.rejection_reason || 'Comprobante no válido'}
                </Text>
                <View style={styles.rejectionActionsRow}>
                  <TouchableOpacity style={styles.rejectionActionBtn} onPress={() => navigation.navigate('Suscripción')}>
                    <Ionicons name="card-outline" size={14} color="#FFFFFF" />
                    <Text style={styles.rejectionActionText}>Volver a suscribirme</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {hasRejectedOrder && rejectedOrders.map((rejOrder) => (
              <View key={rejOrder.id} style={[styles.rejectionCard, { borderColor: '#FCA5A5', backgroundColor: theme.isDark ? 'rgba(127, 29, 29, 0.2)' : '#FEF2F2' }]}>
                <View style={styles.rejectionHeader}>
                  <Ionicons name="alert-circle" size={18} color="#EF4444" />
                  <Text style={[styles.rejectionTitle, { color: '#B91C1C' }]}>Compra rechazada #{rejOrder.id}</Text>
                </View>
                <Text style={[styles.rejectionText, { color: textMain }]}>
                  Motivo: {rejOrder.rejection_reason || 'Comprobante no válido'}
                </Text>
                <View style={styles.rejectionActionsRow}>
                  <TouchableOpacity style={styles.rejectionActionBtn} onPress={() => navigation.navigate('Mis Compras')}>
                    <Ionicons name="bag-handle-outline" size={14} color="#FFFFFF" />
                    <Text style={styles.rejectionActionText}>Ver mis compras</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Benefits list & Purchases Section: Two Columns on Desktop/Tablet, Stacked on Mobile */}
        <View style={isStacked ? styles.bottomSectionStacked : styles.bottomSectionRow}>
          {/* Column Left: Benefits */}
          <View style={isStacked ? styles.bottomColMobile : styles.bottomColLeft}>
            <Text style={[styles.sectionTitle, { color: textMain }]}>Beneficios Incluidos</Text>
            <View style={[styles.benefitsContainer, { borderColor: cardBorder, backgroundColor: cardBg }]}>
              <Text style={[styles.benefitsHeaderTitle, { color: textMuted }]}>Elite Access Perks</Text>
              <View style={styles.benefitsGrid}>
                <View style={styles.benefitRow}>
                  <Ionicons name="checkmark-circle-sharp" size={18} color="#22C55E" />
                  <Text style={[styles.benefitText, { color: textMain }]}>Acceso total ilimitado 24/7 a todas las sedes</Text>
                </View>
                <View style={styles.benefitRow}>
                  <Ionicons name="checkmark-circle-sharp" size={18} color="#22C55E" />
                  <Text style={[styles.benefitText, { color: textMain }]}>Rutinas inteligentes personalizadas por IA</Text>
                </View>
                <View style={styles.benefitRow}>
                  <Ionicons name="checkmark-circle-sharp" size={18} color="#22C55E" />
                  <Text style={[styles.benefitText, { color: textMain }]}>Asesoría nutricional y seguimiento mensual</Text>
                </View>
                <View style={styles.benefitRow}>
                  <Ionicons name="checkmark-circle-sharp" size={18} color="#22C55E" />
                  <Text style={[styles.benefitText, { color: textMain }]}>Descuentos exclusivos en suplementos y productos</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Column Right: Purchase History */}
          <View style={isStacked ? styles.bottomColMobile : styles.bottomColRight}>
            <Text style={[styles.sectionTitle, { color: textMain }]}>Compras Recientes</Text>
            <View style={[styles.purchaseContainer, { borderColor: cardBorder, backgroundColor: cardBg }]}>
              <View style={[styles.purchaseItem, { borderBottomColor: cardBorder }]}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?q=80&w=800&auto=format&fit=crop' }}
                  style={styles.purchaseImg}
                  contentFit="cover"
                />
                <View style={styles.purchaseInfo}>
                  <Text style={[styles.purchaseName, { color: textMain }]}>Creatina Monohidratada</Text>
                  <Text style={[styles.purchaseDate, { color: textMuted }]}>15 Jul 2026</Text>
                </View>
                <View style={styles.purchaseRight}>
                  <Text style={[styles.purchasePrice, { color: textMain }]}>$30.00</Text>
                  <View style={[styles.purchaseBadge, { backgroundColor: theme.isDark ? '#1E293B' : '#F3F4F6' }]}>
                    <Text style={[styles.purchaseBadgeText, { color: textMuted }]}>Entregado</Text>
                  </View>
                </View>
              </View>

              <View style={styles.purchaseItem}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=800&auto=format&fit=crop' }}
                  style={styles.purchaseImg}
                  contentFit="cover"
                />
                <View style={styles.purchaseInfo}>
                  <Text style={[styles.purchaseName, { color: textMain }]}>Botella Térmica Elite</Text>
                  <Text style={[styles.purchaseDate, { color: textMuted }]}>10 Jun 2026</Text>
                </View>
                <View style={styles.purchaseRight}>
                  <Text style={[styles.purchasePrice, { color: textMain }]}>$15.00</Text>
                  <View style={[styles.purchaseBadge, { backgroundColor: theme.isDark ? '#1E293B' : '#F3F4F6' }]}>
                    <Text style={[styles.purchaseBadgeText, { color: textMuted }]}>Entregado</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.editModalOverlay}>
          <View style={[styles.editModalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.editModalTitle, { color: theme.colors.text }]}>Editar Perfil</Text>
            <TouchableOpacity onPress={handlePickPhoto} disabled={uploadingPhoto} style={styles.editPhotoSection} activeOpacity={0.8}>
              <View style={styles.avatarWrapper}>
                {profilePhotoUri ? (
                  <Image source={{ uri: profilePhotoUri }} style={styles.editAvatar} contentFit="cover" transition={300} cachePolicy="memory-disk" />
                ) : (
                  <View style={[styles.editAvatarPlaceholder, { borderColor: theme.colors.primary, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                    <Ionicons name="person" size={32} color={theme.colors.text} />
                  </View>
                )}
                <View style={[styles.editCameraOverlay, { backgroundColor: theme.colors.primary, borderColor: theme.colors.surface }]}>
                  {uploadingPhoto ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera" size={14} color={theme.colors.background} />}
                </View>
              </View>
              <Text style={[styles.changePhotoText, { color: theme.colors.primary }]}>
                {uploadingPhoto ? 'Subiendo foto...' : 'Cambiar foto de perfil'}
              </Text>
            </TouchableOpacity>

            <View style={styles.editField}>
              <Text style={[styles.editLabel, { color: theme.colors.textSecondary }]}>Nombre</Text>
              <TextInput style={[styles.editInput, { color: theme.colors.text, borderColor: theme.colors.border }]} value={editName} onChangeText={setEditName} placeholder="Tu nombre" placeholderTextColor={theme.colors.textSecondary} autoCapitalize="words" />
            </View>
            {user?.username && (
              <View style={styles.editField}>
                <Text style={[styles.editLabel, { color: theme.colors.textSecondary }]}>Nombre de usuario</Text>
                <View style={[styles.editInput, { borderColor: theme.colors.border, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.05)' }]}>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 15 }}>@{user.username}</Text>
                </View>
              </View>
            )}
            <View style={styles.editField}>
              <Text style={[styles.editLabel, { color: theme.colors.textSecondary }]}>Email</Text>
              <TextInput style={[styles.editInput, { color: theme.colors.text, borderColor: theme.colors.border }]} value={editEmail} onChangeText={setEditEmail} placeholder="tu@email.com" placeholderTextColor={theme.colors.textSecondary} keyboardType="email-address" autoCapitalize="none" />
            </View>
            <View style={styles.editField}>
              <Text style={[styles.editLabel, { color: theme.colors.textSecondary }]}>Teléfono</Text>
              <TextInput style={[styles.editInput, { color: theme.colors.text, borderColor: theme.colors.border }]} value={editPhone} onChangeText={setEditPhone} placeholder="+593 99 999 9999" placeholderTextColor={theme.colors.textSecondary} keyboardType="phone-pad" />
            </View>

            <View style={styles.editModalBtns}>
              <TouchableOpacity style={[styles.editModalBtn, { borderColor: theme.colors.border, borderWidth: 1.5 }]} onPress={() => setEditModalVisible(false)}>
                <Text style={[styles.editModalBtnText, { color: theme.colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.editModalBtn, { backgroundColor: theme.colors.primary }]} onPress={handleSaveProfile} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[styles.editModalBtnText, { color: theme.colors.background }]}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Billing Modal */}
      <Modal visible={billingEditVisible} transparent animationType="slide" onRequestClose={() => setBillingEditVisible(false)}>
        <View style={styles.editModalOverlay}>
          <View style={[styles.editModalContent, { backgroundColor: theme.colors.surface, maxHeight: '90%' }]}>
            <Text style={[styles.editModalTitle, { color: theme.colors.text }]}>Datos de Facturación</Text>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
              <View style={styles.editField}>
                <Text style={[styles.editLabel, { color: theme.colors.textSecondary }]}>Nombre / Razón Social</Text>
                <TextInput style={[styles.editInput, { color: theme.colors.text, borderColor: theme.colors.border }]} value={billingName} onChangeText={setBillingName} placeholder="Tu nombre completo o Razón Social" placeholderTextColor={theme.colors.textSecondary} />
              </View>

              <View style={styles.editField}>
                <Text style={[styles.editLabel, { color: theme.colors.textSecondary }]}>Correo Electrónico</Text>
                <TextInput style={[styles.editInput, { color: theme.colors.text, borderColor: theme.colors.border }]} value={billingEmail} onChangeText={setBillingEmail} placeholder="ejemplo@correo.com" placeholderTextColor={theme.colors.textSecondary} keyboardType="email-address" autoCapitalize="none" />
              </View>

              <View style={styles.editField}>
                <Text style={[styles.editLabel, { color: theme.colors.textSecondary }]}>Teléfono</Text>
                <TextInput style={[styles.editInput, { color: theme.colors.text, borderColor: theme.colors.border }]} value={billingPhone} onChangeText={setBillingPhone} placeholder="Ej: 0999999999" placeholderTextColor={theme.colors.textSecondary} keyboardType="phone-pad" />
              </View>

              <View style={styles.editField}>
                <Text style={[styles.editLabel, { color: theme.colors.textSecondary }]}>Cédula o RUC</Text>
                <TextInput style={[styles.editInput, { color: theme.colors.text, borderColor: theme.colors.border }]} value={billingIdNumber} onChangeText={setBillingIdNumber} placeholder="Ej: 1309876543" placeholderTextColor={theme.colors.textSecondary} keyboardType="numeric" />
              </View>

              <View style={styles.editField}>
                <Text style={[styles.editLabel, { color: theme.colors.textSecondary }]}>Ciudad</Text>
                <TextInput style={[styles.editInput, { color: theme.colors.text, borderColor: theme.colors.border }]} value={billingCity} onChangeText={setBillingCity} placeholder="Ej: Manta" placeholderTextColor={theme.colors.textSecondary} />
              </View>

              <View style={styles.editField}>
                <Text style={[styles.editLabel, { color: theme.colors.textSecondary }]}>Dirección de Domicilio</Text>
                <TextInput style={[styles.editInput, { color: theme.colors.text, borderColor: theme.colors.border, height: 60, paddingTop: 8 }]} value={billingAddress} onChangeText={setBillingAddress} placeholder="Ej: Calle 15 y Av. 24" placeholderTextColor={theme.colors.textSecondary} multiline />
              </View>
            </ScrollView>

            <View style={styles.editModalBtns}>
              <TouchableOpacity style={[styles.editModalBtn, { borderColor: theme.colors.border, borderWidth: 1.5 }]} onPress={() => setBillingEditVisible(false)}>
                <Text style={[styles.editModalBtnText, { color: theme.colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.editModalBtn, { backgroundColor: theme.colors.primary }]} onPress={handleSaveBilling} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[styles.editModalBtnText, { color: theme.colors.background }]}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mainContent: { padding: 24, paddingBottom: 80, alignSelf: 'center', width: '100%', maxWidth: 1400 },

  drawerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40 },
  drawerContainer: { position: 'absolute', top: 0, bottom: 0, left: 0, zIndex: 50, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  drawer: { flex: 1, paddingTop: 60, paddingHorizontal: 20, paddingBottom: 40 },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
  drawerTitle: { fontSize: 24, fontWeight: '800' },
  drawerSection: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  drawerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  drawerItemText: { fontSize: 16, fontWeight: '600', flex: 1 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 32, paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(220, 38, 38, 0.2)' },
  logoutText: { color: '#DC2626', fontSize: 16, fontWeight: '700' },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  menuButton: { padding: 10, borderRadius: 14, borderWidth: 1 },
  themeButton: { padding: 10, borderRadius: 14, borderWidth: 1 },

  heroHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 20, gap: 16 },
  heroTextContainer: { flex: 1 },
  heroGreeting: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5, fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined },
  heroLevel: { fontSize: 14, fontWeight: '600', marginTop: 4 },

  headerXpContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 12 },
  headerXpBarBg: { height: 6, borderRadius: 3, flex: 1, overflow: 'hidden' },
  headerXpBarFill: { height: '100%', borderRadius: 3 },
  headerXpValue: { fontSize: 12, fontWeight: '700' },

  headerAvatarWrapper: { width: 44, height: 44, borderRadius: 22, position: 'relative' },
  headerAvatar: { width: '100%', height: '100%', borderRadius: 22, borderWidth: 1, borderColor: '#E2E8F0' },
  headerAvatarPlaceholder: { width: '100%', height: '100%', borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarEditBadge: { position: 'absolute', bottom: -2, right: -2, backgroundColor: '#5B3DF5', width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#FFFFFF' },

  statsSectionRow: { flexDirection: 'row', gap: 20, marginVertical: 24 },
  statsSectionStacked: { flexDirection: 'column', gap: 16, marginVertical: 24 },
  statCard: { flex: 1, padding: 20, borderRadius: 24, borderWidth: 1, flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  statIconWrapper: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  statContent: { flex: 1 },
  statValue: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined },
  statLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  statDesc: { fontSize: 12, marginTop: 6, lineHeight: 16 },

  sectionTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5, marginBottom: 16, marginTop: 8 },

  loadingCard: { height: 200, borderRadius: 28, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  noSubCard: { padding: 32, borderRadius: 28, borderWidth: 1, alignItems: 'center', textAlign: 'center' },
  noSubTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  noSubDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  primaryActionButton: { backgroundColor: '#5B3DF5', height: 52, borderRadius: 16, width: '100%', alignItems: 'center', justifyContent: 'center' },
  primaryActionButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },

  platinumCardOuter: { borderRadius: 28, overflow: 'hidden', marginBottom: 24 },
  platinumCard: { borderRadius: 28, padding: 32, borderWidth: 1 },
  platinumHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  platinumTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },
  platinumPlanName: { fontSize: 24, fontWeight: '800', color: '#5B3DF5', marginTop: 4, fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined },
  platinumBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99 },
  platinumBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  platinumBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginVertical: 24 },
  platinumPriceSection: { flexDirection: 'row', alignItems: 'baseline' },
  platinumPrice: { fontSize: 48, fontWeight: '800', letterSpacing: -1, fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined },
  platinumPeriod: { fontSize: 14, fontWeight: '600', marginLeft: 2 },
  platinumDetailList: { gap: 8 },
  platinumDetailItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  platinumDetailText: { fontSize: 13, fontWeight: '600' },

  renewalSection: { marginBottom: 24 },
  renewalBarBg: { height: 6, borderRadius: 3, width: '100%' },
  renewalBarFill: { height: '100%', borderRadius: 3 },
  renewalText: { fontSize: 12, fontWeight: '600', marginTop: 8 },

  platinumActions: { flexDirection: 'row', gap: 12 },
  platinumButtonOutlined: { flex: 1, height: 52, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  platinumButtonTextOutlined: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  platinumButtonSolid: { flex: 1.2, height: 52, borderRadius: 16, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' },
  platinumButtonTextSolid: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },

  bottomSectionRow: { flexDirection: 'row', gap: 24, marginVertical: 24 },
  bottomSectionStacked: { flexDirection: 'column', gap: 24, marginVertical: 24 },
  bottomColLeft: { flex: 1 },
  bottomColRight: { flex: 1.5 },
  bottomColMobile: { width: '100%' },

  rejectionSection: { marginBottom: 12 },
  rejectionCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    marginBottom: 10,
  },
  rejectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rejectionTitle: { fontSize: 15, fontWeight: '800' },
  rejectionText: { fontSize: 13, fontWeight: '500', lineHeight: 18 },
  rejectionActionsRow: { flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  rejectionActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  rejectionActionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  rejectionActionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  benefitsContainer: { borderRadius: 28, borderWidth: 1, padding: 24, gap: 16 },
  benefitsHeaderTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },
  benefitsGrid: { gap: 12 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitText: { fontSize: 13, fontWeight: '500', lineHeight: 18 },

  purchaseContainer: { borderRadius: 28, borderWidth: 1, paddingHorizontal: 24 },
  purchaseItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1 },
  purchaseImg: { width: 56, height: 56, borderRadius: 14, marginRight: 16 },
  purchaseInfo: { flex: 1 },
  purchaseName: { fontSize: 14, fontWeight: '700' },
  purchaseDate: { fontSize: 12, marginTop: 4, fontWeight: '500' },
  purchaseRight: { alignItems: 'flex-end', marginLeft: 12 },
  purchasePrice: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  purchaseBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  purchaseBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },

  editModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  editModalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  editModalTitle: { fontSize: 22, fontWeight: '800', marginBottom: 20, textAlign: 'center' },
  editPhotoSection: { alignItems: 'center', marginBottom: 24 },
  avatarWrapper: { width: 80, height: 80, position: 'relative' },
  editAvatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 2.5, borderColor: '#E5E7EB' },
  editAvatarPlaceholder: { width: 80, height: 80, borderRadius: 40, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  editCameraOverlay: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  changePhotoText: { marginTop: 12, fontSize: 14, fontWeight: '600' },
  editField: { marginBottom: 16 },
  editLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  editInput: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, fontWeight: '500' },
  editModalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  editModalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  editModalBtnText: { fontSize: 15, fontWeight: '700' },

  /* Guest View Styles */
  guestContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  guestCard: { width: '100%', maxWidth: 400, borderRadius: 24, borderWidth: 1, padding: 28, alignItems: 'center', textAlign: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, elevation: 2 },
  iconContainer: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  guestTitle: { fontSize: 24, fontWeight: '800', marginBottom: 10 },
  guestSubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  guestBtn: { width: '100%', height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  guestBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 }
});
