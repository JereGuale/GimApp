import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput, Modal, Animated, Dimensions, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ProfileAPI } from '../../services/notificationService';
import { SubscriptionAPI } from '../../services/subscriptionService';
import * as ImagePicker from 'expo-image-picker';
import React, { useState, useRef, useCallback } from 'react';

import { API_URL } from '../../services/api';
const BASE_URL = API_URL.replace('/api', ''); // e.g. https://gym-backend-api.onrender.com

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75 > 300 ? 300 : width * 0.75;

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigation = useNavigation();

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [photoKey, setPhotoKey] = useState(Date.now());
  const [localPhotoUri, setLocalPhotoUri] = useState(null);

  const [subscription, setSubscription] = useState({ data: null, loading: true });

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      const fetchSubscription = async () => {
        const result = await SubscriptionAPI.getMySubscription();
        if (mounted) {
          setSubscription({
            data: result.success ? result.data : null,
            loading: false
          });
        }
      };

      // Keep loader on when refreshing on focus
      if (!subscription.data) {
        setSubscription(prev => ({ ...prev, loading: true }));
      }

      fetchSubscription();
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
          if (updateUser) updateUser({ ...user, profile_photo: uploadResult.data.profile_photo });
          setPhotoKey(Date.now());
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
    const result = await ProfileAPI.updateProfile({ name: editName, email: editEmail });
    if (result.success) {
      Alert.alert('¡Éxito!', 'Perfil actualizado');
      if (updateUser) updateUser({ ...user, name: editName, email: editEmail });
      setEditModalVisible(false);
    } else {
      Alert.alert('Error', result.error || 'No se pudo actualizar');
    }
    setSaving(false);
  };

  const profilePhotoUri = (() => {
    if (localPhotoUri) return localPhotoUri;
    const photo = user?.profile_photo_url || user?.profile_photo;
    if (!photo) return null;
    // Supabase or other absolute URL
    if (photo.startsWith('http')) return `${photo}?t=${photoKey}`;
    // Legacy relative path
    return `${BASE_URL}/storage/${photo}?t=${photoKey}`;
  })();

  const DrawerContent = () => (
    <View style={[styles.drawer, { backgroundColor: theme.colors.background }]}>
      <View style={styles.drawerHeader}>
        <Text style={[styles.drawerTitle, { color: theme.colors.text }]}>Menú</Text>
        <TouchableOpacity onPress={closeDrawer}><Ionicons name="close" size={28} color={theme.colors.text} /></TouchableOpacity>
      </View>
      <ScrollView>
        <Text style={[styles.drawerSection, { color: theme.colors.textSecondary }]}>PANEL</Text>
        <DrawerItem icon="person-outline" label="Mi Perfil" onPress={() => { closeDrawer(); setEditName(user?.name || ''); setEditEmail(user?.email || ''); setEditModalVisible(true); }} />
        <DrawerItem icon="card-outline" label="Suscripción" onPress={() => { closeDrawer(); /* navigation.navigate('Subscription') */ }} />
        <DrawerItem icon="cart-outline" label="Mis Compras" onPress={() => { closeDrawer(); /* navigation.navigate('Orders') */ }} />

        <Text style={[styles.drawerSection, { color: theme.colors.textSecondary, marginTop: 24 }]}>AJUSTES</Text>
        <DrawerItem icon="settings-outline" label="Configuración" onPress={() => { closeDrawer(); setEditName(user?.name || ''); setEditEmail(user?.email || ''); setEditModalVisible(true); }} />
        <DrawerItem icon="lock-closed-outline" label="Privacidad" onPress={() => { closeDrawer(); }} />
        <DrawerItem icon={theme.isDark ? 'sunny-outline' : 'moon-outline'} label={theme.isDark ? 'Modo Claro' : 'Modo Oscuro'} onPress={toggleTheme} />
      </ScrollView>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#DC2626" />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );

  const DrawerItem = ({ icon, label, onPress }) => (
    <TouchableOpacity style={[styles.drawerItem, { borderBottomColor: theme.colors.border }]} onPress={onPress}>
      <Ionicons name={icon} size={22} color={theme.colors.text} style={{ width: 30 }} />
      <Text style={[styles.drawerItemText, { color: theme.colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Drawer Overlay */}
      {drawerVisible && (
        <TouchableOpacity style={styles.drawerOverlay} activeOpacity={1} onPress={closeDrawer} />
      )}
      <Animated.View style={[styles.drawerContainer, { transform: [{ translateX: slideAnim }], backgroundColor: theme.colors.surface }]}>
        <DrawerContent />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.mainContent}>
        {/* Header Dashboard */}
        <View style={styles.header}>
          <TouchableOpacity onPress={openDrawer} style={[styles.menuButton, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="menu" size={28} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={[styles.headerButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Ionicons name="notifications-outline" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePickPhoto} style={[styles.headerAvatarContainer, { borderColor: theme.colors.surface }]}>
            {profilePhotoUri ? (
              <Image source={{ uri: profilePhotoUri }} style={styles.headerAvatar} contentFit="cover" transition={300} cachePolicy="memory-disk" />
            ) : (
              <View style={[styles.headerAvatarPlaceholder, { backgroundColor: theme.isDark ? '#374151' : '#F3F4F6' }]}>
                <Ionicons name="person" size={20} color={theme.colors.textSecondary} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.greetingSection}>
          <Text style={[styles.greetingTitle, { color: theme.colors.text }]}>Hola, {user?.name ? user.name.split(' ')[0] : 'Usuario'} 👋</Text>
          <Text style={[styles.greetingSub, { color: theme.colors.textSecondary }]}>Gestiona tu suscripción, revisa tus pedidos y actualiza tus datos.</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>🔥 Racha actual</Text>
            </View>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>12 Días</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderLeftColor: '#10B981' }]}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>📈 Entrenamientos (Mes)</Text>
            </View>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>18 Sesiones</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderLeftColor: '#8B5CF6' }]}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>🏆 Nivel</Text>
            </View>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>Avanzado</Text>
          </View>
        </View>

        <View style={styles.rowLayout}>
          <View style={styles.leftCol}>
            {/* Suscripción */}
            {subscription.loading ? (
              <View style={[styles.card, { backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', minHeight: 150 }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            ) : (
              <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.cardHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Mi Suscripción</Text>
                    <View style={[styles.badgeActive, { backgroundColor: subscription.data?.status === 'active' ? '#10B981' : (subscription.data?.status === 'pending' ? '#F59E0B' : '#6B7280') }]}>
                      <Text style={styles.badgeText}>{subscription.data?.status === 'active' ? 'Activa' : (subscription.data?.status === 'pending' ? 'Pendiente' : 'Inactiva')}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => navigation.navigate('Subscription')}><Text style={[styles.linkText, { color: theme.colors.primary }]}>Ver planes →</Text></TouchableOpacity>
                </View>

                {subscription.data?.status === 'pending' && (
                  <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: 12, borderRadius: 8, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#F59E0B' }}>
                    <Text style={{ color: theme.isDark ? '#FCD34D' : '#D97706', fontSize: 13, fontWeight: '600' }}>
                      Tu pago por transferencia está siendo revisado. La suscripción se activará pronto.
                    </Text>
                  </View>
                )}

                <View style={[styles.subInfoRow, { borderBottomColor: theme.colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoLabel}>Plan Actual</Text>
                    <Text style={[styles.infoValue, { color: theme.colors.text }]}>{subscription.data?.plan?.name || 'Ninguno'}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.infoLabel}>Precio</Text>
                    <Text style={[styles.infoValue, { color: theme.colors.text }]}>{subscription.data?.price ? `$${Number(subscription.data.price).toFixed(2)}` : '-'}</Text>
                  </View>
                </View>
                <View style={[styles.subInfoRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoLabel}>{subscription.data?.status === 'active' ? 'Vence el' : 'Próximo cobro'}</Text>
                    <Text style={[styles.infoValueSmall, { color: theme.colors.text }]}>{subscription.data?.ends_at ? new Date(subscription.data.ends_at).toLocaleDateString() : '-'}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.infoLabel}>Método de pago</Text>
                    <Text style={[styles.infoValueSmall, { color: theme.colors.textSecondary }]}>{subscription.data?.payment_method === 'card' ? 'Tarjeta' : (subscription.data?.payment_method === 'transfer' ? 'Transferencia' : 'No registrado')}</Text>
                  </View>
                </View>
                {(!subscription.data || (subscription.data.status !== 'active' && subscription.data.status !== 'pending')) && (
                  <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => navigation.navigate('Subscription')} style={[styles.btnPrimary, { backgroundColor: theme.colors.primary }]}>
                      <Text style={[styles.btnPrimaryText, { color: theme.colors.background }]}>Suscribirse Ahora</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Compras */}
            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Compras Activas / Recientes</Text>
                <TouchableOpacity><Text style={[styles.linkText, { color: theme.colors.primary }]}>Ver historial completo</Text></TouchableOpacity>
              </View>
              <View style={[styles.purchaseItem, { borderBottomColor: theme.colors.border }]}>
                <View style={[styles.purchaseImgPlaceholder, { backgroundColor: theme.isDark ? '#374151' : '#F3F4F6' }]}>
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&q=80&w=150' }} style={styles.purchaseImg} contentFit="cover" transition={300} cachePolicy="memory-disk" />
                </View>
                <View style={styles.purchaseInfo}>
                  <Text style={[styles.purchaseName, { color: theme.colors.text }]}>Proteína Whey Isolate 2kg - Sabor Vainilla</Text>
                  <Text style={styles.purchaseDesc}>Pedido #98234 • 12 de Oct, 2024</Text>
                  <View style={styles.badgeWarning}><Text style={styles.badgeWarningText}>En camino</Text></View>
                </View>
                <View style={styles.purchaseRight}>
                  <Text style={[styles.purchasePrice, { color: theme.colors.text }]}>$79.00</Text>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>
              </View>
              <View style={[styles.purchaseItem, { borderBottomWidth: 0 }]}>
                <View style={[styles.purchaseImgPlaceholder, { backgroundColor: theme.isDark ? '#374151' : '#F3F4F6' }]}>
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=150' }} style={styles.purchaseImg} contentFit="cover" transition={300} cachePolicy="memory-disk" />
                </View>
                <View style={styles.purchaseInfo}>
                  <Text style={[styles.purchaseName, { color: theme.colors.text }]}>Camiseta de Entrenamiento DryFit - Talla M</Text>
                  <Text style={styles.purchaseDesc}>Pedido #98102 • 05 de Oct, 2024</Text>
                  <View style={styles.badgeSuccess}><Text style={styles.badgeSuccessText}>Entregado</Text></View>
                </View>
                <View style={styles.purchaseRight}>
                  <Text style={[styles.purchasePrice, { color: theme.colors.text }]}>$24.50</Text>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
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
            <TouchableOpacity onPress={handlePickPhoto} disabled={uploadingPhoto} style={styles.editPhotoSection}>
              {profilePhotoUri ? (
                <Image source={{ uri: profilePhotoUri }} style={styles.editAvatar} contentFit="cover" transition={300} cachePolicy="memory-disk" />
              ) : (
                <View style={[styles.editAvatarPlaceholder, { borderColor: theme.colors.primary, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                  <Ionicons name="person" size={32} color={theme.colors.text} />
                </View>
              )}
              <View style={[styles.editCameraOverlay, { backgroundColor: theme.colors.primary, borderColor: theme.colors.background }]}>
                {uploadingPhoto ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera" size={14} color={theme.colors.background} />}
              </View>
              <Text style={[styles.changePhotoText, { color: theme.colors.primary }]}>Cambiar foto</Text>
            </TouchableOpacity>

            <View style={styles.editField}>
              <Text style={[styles.editLabel, { color: theme.colors.textSecondary }]}>Nombre</Text>
              <TextInput style={[styles.editInput, { color: theme.colors.text, borderColor: theme.colors.border }]} value={editName} onChangeText={setEditName} placeholder="Tu nombre" placeholderTextColor={theme.colors.textSecondary} />
            </View>
            <View style={styles.editField}>
              <Text style={[styles.editLabel, { color: theme.colors.textSecondary }]}>Email</Text>
              <TextInput style={[styles.editInput, { color: theme.colors.text, borderColor: theme.colors.border }]} value={editEmail} onChangeText={setEditEmail} placeholder="tu@email.com" placeholderTextColor={theme.colors.textSecondary} keyboardType="email-address" autoCapitalize="none" />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mainContent: { padding: 16, paddingBottom: 60, alignSelf: 'center', width: '100%' },

  drawerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40 },
  drawerContainer: { position: 'absolute', top: 0, bottom: 0, left: 0, width: DRAWER_WIDTH, zIndex: 50, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  drawer: { flex: 1, paddingTop: 60, paddingHorizontal: 20, paddingBottom: 40 },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
  drawerTitle: { fontSize: 24, fontWeight: '800' },
  drawerSection: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  drawerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  drawerItemText: { fontSize: 16, fontWeight: '600', flex: 1 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 'auto', paddingTop: 20 },
  logoutText: { color: '#DC2626', fontSize: 16, fontWeight: '700' },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, gap: 16 },
  menuButton: { padding: 8, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  headerButton: { padding: 8, borderRadius: 12, borderWidth: 1 },
  headerAvatarContainer: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', borderWidth: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  headerAvatar: { width: '100%', height: '100%' },
  headerAvatarPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },

  greetingSection: { marginBottom: 30 },
  greetingTitle: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  greetingSub: { fontSize: 15, fontWeight: '500' },

  statsContainer: { flexDirection: 'row', gap: 12, marginBottom: 30, flexWrap: 'wrap' },
  statCard: { flex: 1, minWidth: 140, padding: 18, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#06B6D4', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  statHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  statLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  statValue: { fontSize: 22, fontWeight: '800' },

  rowLayout: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  leftCol: { flex: 1, gap: 16, minWidth: '100%' },

  card: { borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' },
  cardTitle: { fontSize: 17, fontWeight: '800' },
  linkText: { fontWeight: '600', fontSize: 13 },

  badgeActive: { backgroundColor: '#10B981', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 10 },
  badgeText: { color: '#FFF', fontSize: 12, fontWeight: '700' },

  subInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1 },
  infoLabel: { fontSize: 13, color: '#9CA3AF', fontWeight: '500', marginBottom: 6 },
  infoValue: { fontSize: 16, fontWeight: '700' },
  infoValueSmall: { fontSize: 14, fontWeight: '600' },

  cardActions: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginTop: 12 },
  btnPrimary: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  btnPrimaryText: { color: '#FFF', fontWeight: '700', fontSize: 14, textAlign: 'center' },
  btnSecondary: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  btnSecondaryText: { fontWeight: '600', fontSize: 14, textAlign: 'center' },

  purchaseItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  purchaseImgPlaceholder: { width: 60, height: 60, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 16, overflow: 'hidden' },
  purchaseImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  purchaseInfo: { flex: 1 },
  purchaseName: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  purchaseDesc: { fontSize: 12, color: '#9CA3AF', marginBottom: 8 },
  badgeWarning: { backgroundColor: '#D1FAE5', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeWarningText: { color: '#059669', fontSize: 11, fontWeight: '700' },
  badgeSuccess: { backgroundColor: '#EFF6FF', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeSuccessText: { color: '#3B82F6', fontSize: 11, fontWeight: '700' },
  purchaseRight: { alignItems: 'flex-end', marginLeft: 12, gap: 10 },
  purchasePrice: { fontSize: 15, fontWeight: '700' },

  editModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  editModalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  editModalTitle: { fontSize: 22, fontWeight: '800', marginBottom: 20, textAlign: 'center' },
  editPhotoSection: { alignItems: 'center', marginBottom: 24 },
  editAvatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 2.5, borderColor: '#E5E7EB' },
  editAvatarPlaceholder: { width: 80, height: 80, borderRadius: 40, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  editCameraOverlay: { position: 'absolute', bottom: 20, right: '35%', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  changePhotoText: { marginTop: 8, fontSize: 13, fontWeight: '600' },
  editField: { marginBottom: 16 },
  editLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  editInput: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, fontWeight: '500' },
  editModalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  editModalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  editModalBtnText: { fontSize: 15, fontWeight: '700' }
});
