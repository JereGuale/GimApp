import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ProfileAPI } from '../../services/notificationService';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';

import Constants from 'expo-constants';
const DEV_BACKEND_IP = Constants.manifest?.extra?.DEV_BACKEND_IP || '127.0.0.1';
const DEV_HOST = DEV_BACKEND_IP;
const BASE_URL = `http://${DEV_HOST}:8000`;

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigation = useNavigation();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [photoKey, setPhotoKey] = useState(Date.now());
  const [localPhotoUri, setLocalPhotoUri] = useState(null);

  const handleLogout = async () => {
    console.log('[ProfileScreen] handleLogout called');
    console.log('[ProfileScreen] Calling logout()...');
    try {
      await logout();
      console.log('[ProfileScreen] logout() completed successfully');
    } catch (error) {
      console.error('[ProfileScreen] logout error:', error);
    }
  };

  const handlePickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galería para cambiar la foto');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const selectedUri = result.assets[0].uri;
        setLocalPhotoUri(selectedUri); // Show photo immediately
        setUploadingPhoto(true);
        const uploadResult = await ProfileAPI.uploadPhoto(selectedUri);

        if (uploadResult.success) {
          Alert.alert('¡Éxito!', 'Foto de perfil actualizada');
          if (updateUser) {
            updateUser({ ...user, profile_photo: uploadResult.data.profile_photo });
          }
          setPhotoKey(Date.now()); // Force image reload
        } else {
          Alert.alert('Error', uploadResult.error || 'No se pudo subir la foto');
          setLocalPhotoUri(null); // Revert on error
        }
        setUploadingPhoto(false);
      }
    } catch (error) {
      console.error('Error picking photo:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const result = await ProfileAPI.updateProfile({ name: editName, email: editEmail });
    if (result.success) {
      Alert.alert('¡Éxito!', 'Perfil actualizado exitosamente');
      if (updateUser) {
        updateUser({ ...user, name: editName, email: editEmail });
      }
      setEditModalVisible(false);
    } else {
      Alert.alert('Error', result.error || 'No se pudo actualizar el perfil');
    }
    setSaving(false);
  };

  const profilePhotoUri = localPhotoUri
    || (user?.profile_photo_url ? `${user.profile_photo_url}?t=${photoKey}` : null)
    || (user?.profile_photo ? `${BASE_URL}/storage/${user.profile_photo}?t=${photoKey}` : null);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={handlePickPhoto} disabled={uploadingPhoto}>
            {profilePhotoUri ? (
              <Image source={{ uri: profilePhotoUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={48} color="#22D3EE" />
              </View>
            )}
            {/* Camera overlay */}
            <View style={styles.cameraOverlay}>
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={18} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
        </View>
        <Text style={[styles.userName, { color: theme.colors.text }]}>
          {user?.name || 'Usuario'}
        </Text>
        <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
          {user?.email || 'email@ejemplo.com'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Cuenta</Text>

        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}
          onPress={() => {
            setEditName(user?.name || '');
            setEditEmail(user?.email || '');
            setEditModalVisible(true);
          }}
        >
          <View style={styles.menuIconContainer}>
            <Ionicons name="person-outline" size={24} color="#22D3EE" />
          </View>
          <Text style={[styles.menuText, { color: theme.colors.text }]}>Editar Perfil</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.menuIconContainer}>
            <Ionicons name="card-outline" size={24} color="#22D3EE" />
          </View>
          <Text style={[styles.menuText, { color: theme.colors.text }]}>Mi Suscripción</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.menuIconContainer}>
            <Ionicons name="cart-outline" size={24} color="#22D3EE" />
          </View>
          <Text style={[styles.menuText, { color: theme.colors.text }]}>Mis Pedidos</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Configuración</Text>

        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.menuIconContainer}>
            <Ionicons name="notifications-outline" size={24} color="#22D3EE" />
          </View>
          <Text style={[styles.menuText, { color: theme.colors.text }]}>Notificaciones</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.menuIconContainer}>
            <Ionicons name="lock-closed-outline" size={24} color="#22D3EE" />
          </View>
          <Text style={[styles.menuText, { color: theme.colors.text }]}>Privacidad</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}
          onPress={toggleTheme}
        >
          <View style={styles.menuIconContainer}>
            <Ionicons
              name={theme.isDark ? 'sunny' : 'moon'}
              size={24}
              color={theme.isDark ? '#FB923C' : '#FFD700'}
            />
          </View>
          <Text style={[styles.menuText, { color: theme.colors.text }]}>
            {theme.isDark ? 'Modo Claro' : 'Modo Oscuro'}
          </Text>
          <Ionicons
            name={theme.isDark ? 'toggle' : 'toggle-outline'}
            size={24}
            color="#22D3EE"
          />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.menuIconContainer}>
            <Ionicons name="help-circle-outline" size={24} color="#22D3EE" />
          </View>
          <Text style={[styles.menuText, { color: theme.colors.text }]}>Ayuda</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.version}>Versión 1.0.0</Text>
      </View>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.editModalOverlay}>
          <View style={[styles.editModalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.editModalTitle, { color: theme.colors.text }]}>Editar Perfil</Text>

            {/* Photo section in modal */}
            <TouchableOpacity onPress={handlePickPhoto} disabled={uploadingPhoto} style={styles.editPhotoSection}>
              {profilePhotoUri ? (
                <Image source={{ uri: profilePhotoUri }} style={styles.editAvatar} />
              ) : (
                <View style={styles.editAvatarPlaceholder}>
                  <Ionicons name="person" size={32} color="#22D3EE" />
                </View>
              )}
              <View style={styles.editCameraOverlay}>
                {uploadingPhoto ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="camera" size={14} color="#fff" />
                )}
              </View>
              <Text style={[styles.changePhotoText, { color: '#22D3EE' }]}>Cambiar foto</Text>
            </TouchableOpacity>

            <View style={styles.editField}>
              <Text style={[styles.editLabel, { color: theme.colors.textSecondary }]}>Nombre</Text>
              <TextInput
                style={[styles.editInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Tu nombre"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            <View style={styles.editField}>
              <Text style={[styles.editLabel, { color: theme.colors.textSecondary }]}>Email</Text>
              <TextInput
                style={[styles.editInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="tu@email.com"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.editModalBtns}>
              <TouchableOpacity
                style={[styles.editModalBtn, { borderColor: theme.colors.border, borderWidth: 1.5 }]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={[styles.editModalBtnText, { color: theme.colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editModalBtn, { backgroundColor: '#22D3EE' }]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.editModalBtnText, { color: '#fff' }]}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20
  },
  avatarContainer: {
    marginBottom: 18
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#22D3EE',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 211, 238, 0.15)',
    shadowColor: '#22D3EE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#22D3EE',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#22D3EE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#1A1A2E',
  },
  userName: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.5
  },
  userEmail: {
    fontSize: 15,
    fontWeight: '500'
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 28
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 14,
    letterSpacing: 0.3
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'rgba(34, 211, 238, 0.3)',
    shadowColor: '#22D3EE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(34, 211, 238, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    marginBottom: 32,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
    gap: 10
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 32
  },
  version: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500'
  },
  // Edit Profile Modal
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  editModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  editModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
  },
  editPhotoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  editAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2.5,
    borderColor: '#22D3EE',
  },
  editAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2.5,
    borderColor: '#22D3EE',
    backgroundColor: 'rgba(34, 211, 238, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editCameraOverlay: {
    position: 'absolute',
    bottom: 20,
    right: '35%',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#22D3EE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1A1A2E',
  },
  changePhotoText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
  },
  editField: {
    marginBottom: 16,
  },
  editLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  editInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '500',
  },
  editModalBtns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  editModalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editModalBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
