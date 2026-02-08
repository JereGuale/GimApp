import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

// Platform-aware API URL
const API_URL = Platform.OS === 'web'
    ? 'http://localhost:8000/api'
    : 'http://10.0.2.2:8000/api';

export default function AdminBannerManager() {
    const { theme } = useTheme();
    const { token } = useAuth();

    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingBanner, setEditingBanner] = useState(null);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [buttonText, setButtonText] = useState('');
    const [isActive, setIsActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            setLoading(true);
            console.log('[AdminBannerManager] Fetching banners...');
            console.log('[AdminBannerManager] API URL:', `${API_URL}/admin/banners`);
            console.log('[AdminBannerManager] Token:', token ? 'Present' : 'Missing');

            const response = await axios.get(`${API_URL}/admin/banners`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('[AdminBannerManager] Response:', response.data);

            if (response.data.success) {
                setBanners(response.data.data);
                if (response.data.data.length > 0) {
                    selectBannerForEdit(response.data.data[0]);
                } else {
                    console.log('[AdminBannerManager] No banners found in database');
                }
            }
        } catch (error) {
            console.error('[AdminBannerManager] Fetch banners error:', error);
            console.error('[AdminBannerManager] Error response:', error.response?.data);
            Alert.alert('Error', `No se pudieron cargar los banners: ${error.response?.data?.message || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const selectBannerForEdit = (banner) => {
        setEditingBanner(banner);
        setTitle(banner.title || '');
        setDescription(banner.description || '');
        setPrice(banner.price ? banner.price.toString() : '');
        setButtonText(banner.button_text || 'Comprar Ahora');
        setIsActive(banner.is_active === 1);
    };

    const handleUpdateBanner = async () => {
        if (!editingBanner) return;

        try {
            setSaving(true);
            const response = await axios.put(
                `${API_URL}/admin/banners/${editingBanner.id}`,
                {
                    title,
                    description,
                    price: price ? parseFloat(price) : null,
                    button_text: buttonText,
                    is_active: isActive
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                Alert.alert('¡Éxito!', 'Banner actualizado correctamente');
                fetchBanners();
            }
        } catch (error) {
            console.error('Update banner error:', error);
            Alert.alert('Error', 'No se pudo actualizar el banner');
        } finally {
            setSaving(false);
        }
    };

    const handlePickImage = async () => {
        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                Alert.alert('Permiso Requerido', 'Necesitas dar permiso para acceder a las fotos');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [3, 1],
                quality: 0.8
            });

            if (!result.canceled && result.assets[0]) {
                await uploadImage(result.assets[0]);
            }
        } catch (error) {
            console.error('Pick image error:', error);
            Alert.alert('Error', 'No se pudo seleccionar la imagen');
        }
    };

    const uploadImage = async (imageAsset) => {
        if (!editingBanner) return;

        try {
            setUploading(true);

            const formData = new FormData();
            formData.append('image', {
                uri: imageAsset.uri,
                type: 'image/jpeg',
                name: 'banner.jpg'
            });

            const response = await axios.post(
                `${API_URL}/admin/banners/${editingBanner.id}/upload-image`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            if (response.data.success) {
                Alert.alert('¡Éxito!', 'Imagen subida correctamente');
                fetchBanners();
            }
        } catch (error) {
            console.error('Upload image error:', error);
            Alert.alert('Error', 'No se pudo subir la imagen');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteImage = async () => {
        if (!editingBanner || !editingBanner.image_url) return;

        Alert.alert(
            'Confirmar',
            '¿Eliminar la imagen del banner?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await axios.delete(
                                `${API_URL}/admin/banners/${editingBanner.id}/delete-image`,
                                {
                                    headers: { Authorization: `Bearer ${token}` }
                                }
                            );

                            if (response.data.success) {
                                Alert.alert('Éxito', 'Imagen eliminada');
                                fetchBanners();
                            }
                        } catch (error) {
                            console.error('Delete image error:', error);
                            Alert.alert('Error', 'No se pudo eliminar la imagen');
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color="#22D3EE" />
                <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                    Cargando banner...
                </Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={[styles.title, { color: theme.colors.text }]}>
                            Gestor de Banner
                        </Text>
                        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                            Personaliza el banner promocional del inicio
                        </Text>
                    </View>
                    {editingBanner && (
                        <View style={[styles.statusBadge, isActive ? styles.activeBadge : styles.inactiveBadge]}>
                            <View style={[styles.statusDot, isActive ? styles.activeDot : styles.inactiveDot]} />
                            <Text style={styles.statusText}>
                                {isActive ? 'Activo' : 'Inactivo'}
                            </Text>
                        </View>
                    )}
                </View>

                {editingBanner ? (
                    <>
                        {/* Live Preview Card */}
                        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="eye-outline" size={20} color="#22D3EE" />
                                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                                    Vista Previa en Vivo
                                </Text>
                            </View>

                            <View style={styles.previewContainer}>
                                <View style={styles.bannerPreview}>
                                    {editingBanner.image_url ? (
                                        <Image
                                            source={{ uri: editingBanner.image_url }}
                                            style={styles.previewImage}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <View style={styles.noImagePlaceholder}>
                                            <Ionicons name="image-outline" size={48} color="#444" />
                                            <Text style={styles.placeholderText}>Sin imagen</Text>
                                        </View>
                                    )}

                                    <View style={styles.previewGradient} />

                                    <View style={styles.previewOverlay}>
                                        <Text style={styles.previewTitle}>{title || 'Título del Banner'}</Text>
                                        {price && (
                                            <Text style={styles.previewPrice}>${price}</Text>
                                        )}
                                        {description && (
                                            <Text style={styles.previewDescription}>{description}</Text>
                                        )}
                                        <View style={styles.previewButton}>
                                            <Text style={styles.previewButtonText}>{buttonText || 'Ver Más'}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Image Upload Card */}
                        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="image" size={20} color="#FB923C" />
                                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                                    Imagen del Banner
                                </Text>
                            </View>

                            <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
                                Tamaño recomendado: 1920x640px (3:1) • Formatos: JPG, PNG • Máx: 2MB
                            </Text>

                            <View style={styles.imageActions}>
                                <TouchableOpacity
                                    style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
                                    onPress={handlePickImage}
                                    disabled={uploading}
                                >
                                    {uploading ? (
                                        <ActivityIndicator size="small" color="#000" />
                                    ) : (
                                        <>
                                            <Ionicons name="cloud-upload" size={22} color="#000" />
                                            <Text style={styles.uploadButtonText}>Subir Nueva Imagen</Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                {editingBanner.image_url && (
                                    <TouchableOpacity
                                        style={styles.deleteButton}
                                        onPress={handleDeleteImage}
                                    >
                                        <Ionicons name="trash" size={20} color="#FFF" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        {/* Content Editor Card */}
                        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="create" size={20} color="#60A5FA" />
                                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                                    Contenido del Banner
                                </Text>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={[styles.label, { color: theme.colors.text }]}>
                                    Título <Text style={styles.required}>*</Text>
                                </Text>
                                <TextInput
                                    style={[styles.input, {
                                        backgroundColor: theme.colors.background,
                                        color: theme.colors.text,
                                        borderColor: theme.colors.border
                                    }]}
                                    value={title}
                                    onChangeText={setTitle}
                                    placeholder="Ej: Oferta Mes de Carnaval!"
                                    placeholderTextColor="#666"
                                />
                            </View>

                            <View style={styles.formRow}>
                                <View style={[styles.formGroup, styles.formGroupHalf]}>
                                    <Text style={[styles.label, { color: theme.colors.text }]}>
                                        Precio ($)
                                    </Text>
                                    <TextInput
                                        style={[styles.input, {
                                            backgroundColor: theme.colors.background,
                                            color: theme.colors.text,
                                            borderColor: theme.colors.border
                                        }]}
                                        value={price}
                                        onChangeText={setPrice}
                                        placeholder="25.00"
                                        placeholderTextColor="#666"
                                        keyboardType="decimal-pad"
                                    />
                                </View>

                                <View style={[styles.formGroup, styles.formGroupHalf]}>
                                    <Text style={[styles.label, { color: theme.colors.text }]}>
                                        Texto del Botón
                                    </Text>
                                    <TextInput
                                        style={[styles.input, {
                                            backgroundColor: theme.colors.background,
                                            color: theme.colors.text,
                                            borderColor: theme.colors.border
                                        }]}
                                        value={buttonText}
                                        onChangeText={setButtonText}
                                        placeholder="Comprar Ahora"
                                        placeholderTextColor="#666"
                                    />
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={[styles.label, { color: theme.colors.text }]}>
                                    Descripción
                                </Text>
                                <TextInput
                                    style={[styles.input, styles.textArea, {
                                        backgroundColor: theme.colors.background,
                                        color: theme.colors.text,
                                        borderColor: theme.colors.border
                                    }]}
                                    value={description}
                                    onChangeText={setDescription}
                                    placeholder="¡Aprovecha esta oferta especial!"
                                    placeholderTextColor="#666"
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>

                            <View style={styles.toggleContainer}>
                                <View>
                                    <Text style={[styles.toggleLabel, { color: theme.colors.text }]}>
                                        Banner Activo
                                    </Text>
                                    <Text style={[styles.toggleHint, { color: theme.colors.textSecondary }]}>
                                        {isActive ? 'Los usuarios pueden ver este banner' : 'Este banner está oculto'}
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

                        {/* Save Button */}
                        <TouchableOpacity
                            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                            onPress={handleUpdateBanner}
                            disabled={saving || !title}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color="#000" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={24} color="#000" />
                                    <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </>
                ) : (
                    <View style={[styles.emptyState, { backgroundColor: theme.colors.surface }]}>
                        <Ionicons name="image-outline" size={80} color="#666" />
                        <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>
                            No hay banners disponibles
                        </Text>
                        <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                            Asegúrate de que la tabla promotional_banners tenga datos.
                        </Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    content: {
        padding: 20,
        maxWidth: 900,
        width: '100%',
        alignSelf: 'center'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    loadingText: {
        marginTop: 16,
        fontSize: 15
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 4
    },
    subtitle: {
        fontSize: 15,
        lineHeight: 20
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6
    },
    activeBadge: {
        backgroundColor: 'rgba(34, 211, 238, 0.15)'
    },
    inactiveBadge: {
        backgroundColor: 'rgba(156, 163, 175, 0.15)'
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4
    },
    activeDot: {
        backgroundColor: '#22D3EE'
    },
    inactiveDot: {
        backgroundColor: '#9CA3AF'
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#22D3EE'
    },
    card: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700'
    },
    previewContainer: {
        marginTop: 8
    },
    bannerPreview: {
        width: '100%',
        aspectRatio: 3 / 1,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#0a0a1a',
        position: 'relative'
    },
    previewImage: {
        width: '100%',
        height: '100%',
        position: 'absolute'
    },
    noImagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a2e'
    },
    placeholderText: {
        color: '#666',
        marginTop: 12,
        fontSize: 14
    },
    previewGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.4)'
    },
    previewOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        zIndex: 2
    },
    previewTitle: {
        color: '#60A5FA',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8
    },
    previewPrice: {
        color: '#FB923C',
        fontSize: 32,
        fontWeight: '900',
        marginBottom: 6,
        textShadowColor: 'rgba(0, 0, 0, 0.9)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8
    },
    previewDescription: {
        color: '#E2E8F0',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 16,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 6
    },
    previewButton: {
        backgroundColor: '#22D3EE',
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 25
    },
    previewButtonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 14
    },
    hint: {
        fontSize: 13,
        marginBottom: 16,
        lineHeight: 18
    },
    imageActions: {
        flexDirection: 'row',
        gap: 12
    },
    uploadButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#22D3EE',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        shadowColor: '#22D3EE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4
    },
    uploadButtonDisabled: {
        opacity: 0.6
    },
    uploadButtonText: {
        color: '#000',
        fontWeight: '700',
        fontSize: 15
    },
    deleteButton: {
        backgroundColor: '#EF4444',
        width: 52,
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4
    },
    formGroup: {
        marginBottom: 20
    },
    formRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 0
    },
    formGroupHalf: {
        flex: 1
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8
    },
    required: {
        color: '#EF4444'
    },
    input: {
        borderWidth: 1.5,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
        paddingTop: 14
    },
    toggleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        marginTop: 8
    },
    toggleLabel: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4
    },
    toggleHint: {
        fontSize: 13
    },
    toggle: {
        width: 56,
        height: 32,
        borderRadius: 16,
        padding: 2,
        justifyContent: 'center'
    },
    toggleActive: {
        backgroundColor: '#22D3EE',
        alignItems: 'flex-end'
    },
    toggleInactive: {
        backgroundColor: '#374151',
        alignItems: 'flex-start'
    },
    toggleThumb: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3
    },
    toggleThumbActive: {
        transform: [{ translateX: 0 }]
    },
    saveButton: {
        backgroundColor: '#22D3EE',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingVertical: 18,
        borderRadius: 16,
        marginTop: 8,
        marginBottom: 40,
        shadowColor: '#22D3EE',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6
    },
    saveButtonDisabled: {
        opacity: 0.6
    },
    saveButtonText: {
        color: '#000',
        fontWeight: '800',
        fontSize: 17
    },
    emptyState: {
        borderRadius: 20,
        padding: 60,
        alignItems: 'center',
        marginTop: 40
    },
    emptyStateTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 20,
        marginBottom: 8
    },
    emptyStateText: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22
    }
});
