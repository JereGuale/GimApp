import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Image, Alert, ActivityIndicator, Platform, Modal, FlatList, Dimensions,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const { width: screenWidth } = Dimensions.get('window');

// Platform-aware API URL
import Constants from 'expo-constants';
const DEV_BACKEND_IP = Constants.manifest?.extra?.DEV_BACKEND_IP || '127.0.0.1';
const API_URL = `http://${DEV_BACKEND_IP}:8000/api`;

const apiRequest = async (url, options = {}) => {
  const res = await fetch(url, {
    ...options,
    headers: { Accept: 'application/json', ...options.headers },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `HTTP ${res.status}`);
  }
  return res.json();
};

export default function AdminBannerManager() {
  const { theme } = useTheme();
  const { token } = useAuth();
  const { width: winWidth } = useWindowDimensions();
  const isWide = winWidth > 700;

  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBanner, setEditingBanner] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [buttonAction, setButtonAction] = useState('subscription');
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState('0');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  // ─── API Calls ───
  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await apiRequest(`${API_URL}/admin/banners`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.success) {
        setBanners(response.data || []);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los banners');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPrice('');
    setButtonText('Comprar Ahora');
    setButtonAction('subscription');
    setIsActive(true);
    setDisplayOrder('0');
    setSelectedImage(null);
  };

  const openCreateForm = () => {
    resetForm();
    setEditingBanner(null);
    setIsCreating(true);
    setShowForm(true);
  };

  const openEditForm = (banner) => {
    setEditingBanner(banner);
    setIsCreating(false);
    setTitle(banner.title || '');
    setDescription(banner.description || '');
    setPrice(banner.price ? String(banner.price) : '');
    setButtonText(banner.button_text || 'Comprar Ahora');
    setButtonAction(banner.button_action || 'subscription');
    setIsActive(banner.is_active === 1 || banner.is_active === true);
    setDisplayOrder(banner.display_order ? String(banner.display_order) : '0');
    setSelectedImage(null);
    setShowForm(true);
  };

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permiso Requerido', 'Necesitas dar permiso para acceder a las fotos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 7],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const handleCreateBanner = async () => {
    try {
      setSaving(true);

      // Step 1: Create banner with JSON (text data only)
      const bannerData = {
        title: title || '',
        description: description || '',
        button_text: buttonText || '',
        button_action: buttonAction || 'subscription',
        is_active: isActive,
        display_order: parseInt(displayOrder) || 0,
      };
      if (price) bannerData.price = parseFloat(price);

      const createRes = await apiRequest(`${API_URL}/admin/banners`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bannerData),
      });

      // Step 2: Upload image separately if selected
      if (selectedImage && createRes.data?.id) {
        const imgFormData = new FormData();
        if (Platform.OS === 'web') {
          const resp = await fetch(selectedImage.uri);
          const blob = await resp.blob();
          imgFormData.append('image', blob, `banner_${Date.now()}.jpg`);
        } else {
          const ext = selectedImage.uri.split('.').pop() || 'jpg';
          imgFormData.append('image', {
            uri: selectedImage.uri,
            type: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
            name: `banner_${Date.now()}.${ext}`,
          });
        }

        await apiRequest(`${API_URL}/admin/banners/${createRes.data.id}/image`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: imgFormData,
        });
      }

      Alert.alert('¡Éxito!', 'Banner creado correctamente');
      setShowForm(false);
      fetchBanners();
    } catch (error) {
      console.error('Create banner error:', error);
      let msg = 'No se pudo crear el banner';
      try {
        const parsed = JSON.parse(error.message);
        if (parsed.message) msg = parsed.message;
      } catch (e) {}
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBanner = async () => {
    if (!editingBanner) return;
    try {
      setSaving(true);

      // Step 1: Update text data via JSON
      await apiRequest(`${API_URL}/admin/banners/${editingBanner.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title || '',
          description: description || '',
          price: price ? parseFloat(price) : null,
          button_text: buttonText || '',
          button_action: buttonAction || 'subscription',
          is_active: isActive,
          display_order: parseInt(displayOrder) || 0,
        }),
      });

      // Step 2: Upload image separately if a new one was selected
      if (selectedImage) {
        const imgFormData = new FormData();
        if (Platform.OS === 'web') {
          const resp = await fetch(selectedImage.uri);
          const blob = await resp.blob();
          imgFormData.append('image', blob, `banner_${Date.now()}.jpg`);
        } else {
          const ext = selectedImage.uri.split('.').pop() || 'jpg';
          imgFormData.append('image', {
            uri: selectedImage.uri,
            type: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
            name: `banner_${Date.now()}.${ext}`,
          });
        }

        await apiRequest(`${API_URL}/admin/banners/${editingBanner.id}/image`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: imgFormData,
        });
      }

      Alert.alert('¡Éxito!', 'Banner actualizado correctamente');
      setShowForm(false);
      fetchBanners();
    } catch (error) {
      console.error('Update banner error:', error);
      Alert.alert('Error', 'No se pudo actualizar el banner');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBanner = (banner) => {
    Alert.alert(
      'Eliminar Banner',
      `¿Estás seguro de eliminar "${banner.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiRequest(`${API_URL}/admin/banners/${banner.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              Alert.alert('Éxito', 'Banner eliminado');
              fetchBanners();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar');
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async (banner) => {
    try {
      await apiRequest(`${API_URL}/admin/banners/${banner.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !(banner.is_active === 1 || banner.is_active === true) }),
      });
      fetchBanners();
    } catch (error) {
      Alert.alert('Error', 'No se pudo cambiar el estado');
    }
  };

  const getImagePreview = () => {
    if (selectedImage) return selectedImage.uri;
    if (editingBanner?.image_url) return editingBanner.image_url;
    return null;
  };

  // ─── Loading ───
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color="#22D3EE" />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Cargando banners...
        </Text>
      </View>
    );
  }

  // ─── Banner Card ───
  const renderBannerCard = (banner, index) => {
    const active = banner.is_active === 1 || banner.is_active === true;
    return (
      <View
        key={banner.id}
        style={[styles.bannerCard, { backgroundColor: theme.colors.surface }]}
      >
        {/* Preview image */}
        <View style={styles.bannerCardPreview}>
          {banner.image_url ? (
            <Image
              source={{ uri: banner.image_url }}
              style={styles.bannerCardImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.bannerNoImage}>
              <Ionicons name="image-outline" size={32} color="#4B5563" />
            </View>
          )}
          <View style={styles.bannerCardOverlay} />
          <View style={styles.bannerCardInfo}>
            <Text style={styles.bannerCardTitle} numberOfLines={1}>
              {banner.title || 'Sin título'}
            </Text>
            {banner.price ? (
              <Text style={styles.bannerCardPrice}>Bs. {Number(banner.price).toFixed(2)}</Text>
            ) : null}
          </View>

          {/* Order badge */}
          <View style={styles.orderBadge}>
            <Text style={styles.orderBadgeText}>#{index + 1}</Text>
          </View>

          {/* Status */}
          <View style={[styles.statusChip, active ? styles.statusActive : styles.statusInactive]}>
            <View style={[styles.statusDot, { backgroundColor: active ? '#22D3EE' : '#6B7280' }]} />
            <Text style={[styles.statusText, { color: active ? '#22D3EE' : '#6B7280' }]}>
              {active ? 'Activo' : 'Inactivo'}
            </Text>
          </View>
        </View>

        {/* Actions row */}
        <View style={styles.bannerCardActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnEdit]}
            onPress={() => openEditForm(banner)}
          >
            <Ionicons name="create-outline" size={18} color="#22D3EE" />
            <Text style={[styles.actionBtnText, { color: '#22D3EE' }]}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnToggle]}
            onPress={() => handleToggleActive(banner)}
          >
            <Ionicons
              name={active ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={active ? '#FB923C' : '#34D399'}
            />
            <Text style={[styles.actionBtnText, { color: active ? '#FB923C' : '#34D399' }]}>
              {active ? 'Ocultar' : 'Mostrar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnDelete]}
            onPress={() => handleDeleteBanner(banner)}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, isWide && { maxWidth: 960, alignSelf: 'center' }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.pageTitle, { color: theme.colors.text }]}>
              Gestión de Banners
            </Text>
            <Text style={[styles.pageSubtitle, { color: theme.colors.textSecondary }]}>
              {banners.length} banner{banners.length !== 1 ? 's' : ''} — Los activos se muestran como carrusel en el inicio
            </Text>
          </View>
          <TouchableOpacity style={styles.createButtonSmall} onPress={openCreateForm}>
            <Ionicons name="add" size={22} color="#000" />
            <Text style={styles.createButtonSmallText}>{isWide ? 'Nuevo Banner' : 'Nuevo'}</Text>
          </TouchableOpacity>
        </View>

        {/* Banners Grid/List */}
        {banners.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="images-outline" size={64} color="#4B5563" />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              No hay banners
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
              Crea tu primer banner para que aparezca en el inicio de los usuarios
            </Text>
          </View>
        ) : (
          <View style={isWide ? styles.bannersGrid : undefined}>
            {banners.map((banner, i) => renderBannerCard(banner, i))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ─── Create/Edit Modal ─── */}
      <Modal visible={showForm} animationType="slide" transparent={Platform.OS === 'web'}>
        <View style={[styles.modalOverlay, Platform.OS === 'web' && styles.modalOverlayWeb]}>
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }, Platform.OS === 'web' && styles.modalContainerWeb]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[{ padding: 20 }, isWide && { maxWidth: 640, alignSelf: 'center', width: '100%' }]}>
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowForm(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {isCreating ? 'Crear Banner' : 'Editar Banner'}
              </Text>
              <View style={{ width: 36 }} />
            </View>

            {/* Image Preview */}
            <View style={[styles.imagePreviewCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.cardHeader}>
                <Ionicons name="image" size={20} color="#FB923C" />
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Imagen del Banner</Text>
              </View>

              <TouchableOpacity style={styles.imagePickerArea} onPress={handlePickImage}>
                {getImagePreview() ? (
                  <Image source={{ uri: getImagePreview() }} style={styles.imagePreview} resizeMode="cover" />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="cloud-upload-outline" size={40} color="#4B5563" />
                    <Text style={styles.imagePlaceholderText}>Toca para seleccionar imagen</Text>
                    <Text style={styles.imageHint}>Formatos: JPG, PNG, WebP — Máx: 5MB</Text>
                  </View>
                )}
              </TouchableOpacity>

              {getImagePreview() && (
                <TouchableOpacity style={styles.changeImageBtn} onPress={handlePickImage}>
                  <Ionicons name="refresh" size={18} color="#22D3EE" />
                  <Text style={styles.changeImageText}>Cambiar imagen</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Content Form */}
            <View style={[styles.formCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.cardHeader}>
                <Ionicons name="create" size={20} color="#60A5FA" />
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Contenido</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Título <Text style={{ color: '#6B7280' }}>(opcional)</Text>
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border || '#333' }]}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Ej: Oferta Especial de Verano"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Descripción</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border || '#333' }]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Descripción breve del banner"
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>Precio (Bs.)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border || '#333' }]}
                    value={price}
                    onChangeText={setPrice}
                    placeholder="0.00"
                    placeholderTextColor="#666"
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>Orden</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border || '#333' }]}
                    value={displayOrder}
                    onChangeText={setDisplayOrder}
                    placeholder="0"
                    placeholderTextColor="#666"
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>Texto del Botón</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border || '#333' }]}
                    value={buttonText}
                    onChangeText={setButtonText}
                    placeholder="Comprar Ahora"
                    placeholderTextColor="#666"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>Acción</Text>
                  <View style={styles.actionPicker}>
                    {['subscription', 'explore'].map((action) => (
                      <TouchableOpacity
                        key={action}
                        style={[styles.actionOption, buttonAction === action && styles.actionOptionActive]}
                        onPress={() => setButtonAction(action)}
                      >
                        <Text style={[styles.actionOptionText, buttonAction === action && styles.actionOptionTextActive]}>
                          {action === 'subscription' ? 'Suscripción' : 'Explorar'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Toggle Active */}
              <View style={styles.toggleRow}>
                <View>
                  <Text style={[styles.label, { color: theme.colors.text, marginBottom: 2 }]}>Banner Activo</Text>
                  <Text style={[styles.toggleHint, { color: theme.colors.textSecondary }]}>
                    {isActive ? 'Visible en el carrusel' : 'Oculto para los usuarios'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.toggle, isActive ? styles.toggleActive : styles.toggleInactive]}
                  onPress={() => setIsActive(!isActive)}
                >
                  <View style={[styles.toggleThumb, isActive && styles.toggleThumbActive]} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Save / Create button */}
            <TouchableOpacity
              style={[styles.saveButton, saving && { opacity: 0.6 }]}
              onPress={isCreating ? handleCreateBanner : handleUpdateBanner}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <Ionicons name={isCreating ? 'add-circle' : 'checkmark-circle'} size={24} color="#000" />
                  <Text style={styles.saveButtonText}>
                    {isCreating ? 'Crear Banner' : 'Guardar Cambios'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, width: '100%' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 15 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 24,
  },
  pageTitle: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  pageSubtitle: { fontSize: 14, lineHeight: 20 },

  // Create button (compact in header)
  createButtonSmall: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#22D3EE', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12,
    shadowColor: '#22D3EE', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
  },
  createButtonSmallText: { color: '#000', fontWeight: '800', fontSize: 14 },

  // Banners Grid (web)
  bannersGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 16,
  },

  // Banner Card
  bannerCard: {
    borderRadius: 18, overflow: 'hidden', marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
    ...(Platform.OS === 'web' ? { flex: 1, minWidth: 280, maxWidth: '48%' } : {}),
  },
  bannerCardPreview: {
    width: '100%', height: 160, position: 'relative',
  },
  bannerCardImage: { width: '100%', height: '100%' },
  bannerNoImage: {
    width: '100%', height: '100%', backgroundColor: '#1F2937',
    justifyContent: 'center', alignItems: 'center',
  },
  bannerCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  bannerCardInfo: {
    position: 'absolute', bottom: 12, left: 14,
  },
  bannerCardTitle: {
    color: '#FFF', fontSize: 17, fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.7)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  bannerCardPrice: {
    color: '#FB923C', fontSize: 22, fontWeight: '900', marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  orderBadge: {
    position: 'absolute', top: 10, left: 10,
    backgroundColor: 'rgba(34,211,238,0.9)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  orderBadgeText: { color: '#000', fontWeight: '800', fontSize: 12 },
  statusChip: {
    position: 'absolute', top: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  statusActive: {},
  statusInactive: {},
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },

  // Actions row
  bannerCardActions: {
    flexDirection: 'row', padding: 10, gap: 8,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10,
  },
  actionBtnEdit: { backgroundColor: 'rgba(34,211,238,0.1)', flex: 1, justifyContent: 'center' },
  actionBtnToggle: { backgroundColor: 'rgba(251,146,60,0.1)', flex: 1, justifyContent: 'center' },
  actionBtnDelete: { backgroundColor: 'rgba(239,68,68,0.1)', paddingHorizontal: 12 },
  actionBtnText: { fontSize: 13, fontWeight: '600' },

  // Empty state
  emptyState: { borderRadius: 20, padding: 50, alignItems: 'center', marginTop: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 6 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },

  // Modal
  modalOverlay: { flex: 1 },
  modalOverlayWeb: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalContainer: { flex: 1 },
  modalContainerWeb: {
    width: '90%', maxWidth: 680, maxHeight: '92%',
    borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 24,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center',
  },
  modalTitle: { fontSize: 20, fontWeight: '800' },

  // Cards inside modal
  imagePreviewCard: { borderRadius: 18, padding: 18, marginBottom: 18 },
  formCard: { borderRadius: 18, padding: 18, marginBottom: 18 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  cardTitle: { fontSize: 17, fontWeight: '700' },

  // Image picker
  imagePickerArea: {
    width: '100%', aspectRatio: 16 / 7, borderRadius: 14, overflow: 'hidden',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', borderStyle: 'dashed',
  },
  imagePreview: { width: '100%', height: '100%' },
  imagePlaceholder: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#1F2937',
  },
  imagePlaceholderText: { color: '#9CA3AF', marginTop: 10, fontSize: 14, fontWeight: '500' },
  imageHint: { color: '#6B7280', fontSize: 12, marginTop: 4 },
  changeImageBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 12,
  },
  changeImageText: { color: '#22D3EE', fontWeight: '600', fontSize: 14 },

  // Form
  formGroup: { marginBottom: 18 },
  formRow: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  textArea: { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 },

  // Action picker
  actionPicker: { flexDirection: 'row', gap: 6 },
  actionOption: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1.5, borderColor: 'transparent',
  },
  actionOptionActive: { borderColor: '#22D3EE', backgroundColor: 'rgba(34,211,238,0.1)' },
  actionOptionText: { color: '#9CA3AF', fontSize: 13, fontWeight: '600' },
  actionOptionTextActive: { color: '#22D3EE' },

  // Toggle
  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, marginTop: 6,
  },
  toggleHint: { fontSize: 13 },
  toggle: { width: 52, height: 30, borderRadius: 15, padding: 2, justifyContent: 'center' },
  toggleActive: { backgroundColor: '#22D3EE', alignItems: 'flex-end' },
  toggleInactive: { backgroundColor: '#374151', alignItems: 'flex-start' },
  toggleThumb: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: '#FFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 3,
  },
  toggleThumbActive: {},

  // Save
  saveButton: {
    backgroundColor: '#22D3EE', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, borderRadius: 14,
    shadowColor: '#22D3EE', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  saveButtonText: { color: '#000', fontWeight: '800', fontSize: 16 },
});
