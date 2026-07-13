import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    ScrollView,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Modal from 'react-native-modal';
import { useTheme } from '../context/ThemeContext';
import { API_URL } from '../services/api';

export default function ReceiptUploader({ visible, onClose, onUpload }) {
    const { theme } = useTheme();
    const [selectedImage, setSelectedImage] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [selectedBank, setSelectedBank] = useState(0);

    const [bankAccounts, setBankAccounts] = useState([]);
    const [loadingBanks, setLoadingBanks] = useState(true);

    React.useEffect(() => {
        if (visible) {
            setLoadingBanks(true);
            fetch(`${API_URL}/settings/public`)
                .then(res => res.json())
                .then(data => {
                    const bankSetting = data.find(s => s.key === 'bank_accounts');
                    if (bankSetting && bankSetting.value) {
                        const parsed = typeof bankSetting.value === 'string' ? JSON.parse(bankSetting.value) : bankSetting.value;
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            // Asignar colores por defecto basados en nombre
                            const formatted = parsed.map(b => ({
                                bank: b.name,
                                accountType: b.accountType || 'Ahorros',
                                account: b.account,
                                holder: b.holder,
                                cedula: b.cedula || '',
                                icon: 'business',
                                color: b.name.toLowerCase().includes('pichincha') ? '#FFB800' :
                                       b.name.toLowerCase().includes('guayaquil') ? '#003B7A' :
                                       b.name.toLowerCase().includes('produbanco') ? '#E31837' : '#10B981'
                            }));
                            setBankAccounts(formatted);
                        }
                    }
                })
                .catch(err => console.error('Error fetching banks', err))
                .finally(() => setLoadingBanks(false));
        }
    }, [visible]);

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert('Permiso Denegado', 'Necesitas dar permiso para acceder a las fotos');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedImage) {
            Alert.alert('Sin Imagen', 'Por favor selecciona un comprobante primero');
            return;
        }

        setUploading(true);

        try {
            await onUpload(selectedImage);
            setSelectedImage(null);
            onClose();
        } catch (error) {
            console.error('Upload error:', error);
            Alert.alert('Error', 'No se pudo subir el comprobante. Intenta nuevamente.');
        } finally {
            setUploading(false);
        }
    };

    const currentBank = bankAccounts[selectedBank];

    return (
        <Modal
            isVisible={visible}
            onBackdropPress={onClose}
            style={styles.modal}
            animationIn="slideInUp"
            animationOut="slideOutDown"
        >
            <View style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
                {loadingBanks ? (
                    <View style={{ padding: 40, alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#06B6D4" />
                        <Text style={{ marginTop: 10, color: '#6B7280' }}>Cargando cuentas bancarias...</Text>
                    </View>
                ) : !currentBank ? (
                    <View style={{ padding: 40, alignItems: 'center' }}>
                        <Text style={{ color: '#EF4444' }}>No hay cuentas bancarias configuradas.</Text>
                        <TouchableOpacity onPress={onClose} style={{ marginTop: 20 }}>
                            <Text style={{ color: '#06B6D4' }}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: '#111827' }]}>
                            Transferencia Bancaria
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Bank Selector - Tabs compactos */}
                    <View style={styles.bankTabs}>
                        {bankAccounts.map((bank, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.bankTab,
                                    selectedBank === index && {
                                        backgroundColor: '#ECFEFF',
                                        borderColor: '#06B6D4'
                                    }
                                ]}
                                onPress={() => setSelectedBank(index)}
                            >
                                <Ionicons
                                    name="business"
                                    size={18}
                                    color={selectedBank === index ? '#06B6D4' : '#6B7280'}
                                />
                                <Text style={[
                                    styles.bankTabText,
                                    { color: selectedBank === index ? '#06B6D4' : '#6B7280' }
                                ]}>
                                    {bank.bank.replace('Banco ', '')}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Bank Details Card - Compacto */}
                    <View style={styles.bankDetailsCard}>
                        <View style={styles.detailRow}>
                            <Ionicons name="wallet-outline" size={18} color="#F59E0B" />
                            <Text style={[styles.detailLabel, { color: '#6B7280' }]}>Tipo:</Text>
                            <Text style={[styles.detailValue, { color: '#111827' }]}>
                                {currentBank.accountType}
                            </Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Ionicons name="card-outline" size={18} color="#F59E0B" />
                            <Text style={[styles.detailLabel, { color: '#6B7280' }]}>Cuenta:</Text>
                            <Text style={[styles.detailValue, { color: '#111827' }]}>
                                {currentBank.account}
                            </Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Ionicons name="person-outline" size={18} color="#F59E0B" />
                            <Text style={[styles.detailLabel, { color: '#6B7280' }]}>Titular:</Text>
                            <Text style={[styles.detailValue, { color: '#111827' }]}>
                                {currentBank.holder}
                            </Text>
                        </View>
                        {currentBank.cedula ? (
                        <View style={styles.detailRow}>
                            <Ionicons name="document-text-outline" size={18} color="#F59E0B" />
                            <Text style={[styles.detailLabel, { color: '#6B7280' }]}>Cédula:</Text>
                            <Text style={[styles.detailValue, { color: '#111827' }]}>
                                {currentBank.cedula}
                            </Text>
                        </View>
                        ) : null}
                    </View>

                    {/* Compact Instructions */}
                    <View style={styles.instructionsCard}>
                        <Text style={[styles.instructionText, { color: '#6B7280' }]}>
                            💡 Realiza la transferencia y sube el comprobante para aprobación
                        </Text>
                    </View>

                    {/* Image Selection */}
                    <Text style={[styles.sectionTitle, { color: '#111827' }]}>
                        Comprobante de Pago
                    </Text>

                    {!selectedImage ? (
                        <View style={styles.imageButtons}>
                            <TouchableOpacity style={[styles.imageButton, { flex: 1 }]} onPress={pickImage}>
                                <Ionicons name="images" size={28} color="#06B6D4" />
                                <Text style={styles.imageButtonText}>Seleccionar desde Galería</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.imagePreview}>
                            <Image
                                source={{ uri: selectedImage.uri }}
                                style={styles.previewImage}
                                resizeMode="contain"
                            />
                            <TouchableOpacity
                                style={styles.removeImageButton}
                                onPress={() => setSelectedImage(null)}
                            >
                                <Ionicons name="close-circle" size={28} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Upload Button */}
                    <TouchableOpacity
                        style={[
                            styles.uploadButton,
                            (!selectedImage || uploading) && styles.uploadButtonDisabled
                        ]}
                        onPress={handleUpload}
                        disabled={!selectedImage || uploading}
                    >
                        {uploading ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <Ionicons name="cloud-upload" size={22} color="#FFF" />
                        )}
                        <Text style={styles.uploadButtonText}>
                            {uploading ? 'Subiendo...' : 'Subir Comprobante'}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modal: {
        margin: 0,
        justifyContent: 'flex-end'
    },
    container: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
        padding: 20,
        paddingBottom: 30
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: 0.5
    },
    closeButton: {
        padding: 4
    },
    bankTabs: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16
    },
    bankTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB'
    },
    bankTabText: {
        fontSize: 12,
        fontWeight: '600',
    },
    bankDetailsCard: {
        backgroundColor: '#FEFCE8',
        borderRadius: 8,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#FEF08A',
        gap: 8
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    detailLabel: {
        fontSize: 13,
        fontWeight: '600',
        width: 55
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '700',
        flex: 1
    },
    instructionsCard: {
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    instructionText: {
        fontSize: 13,
        lineHeight: 18,
        textAlign: 'center',
        fontWeight: '500'
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 12,
    },
    imageButtons: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16
    },
    imageButton: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    imageButtonText: {
        color: '#06B6D4',
        fontSize: 13,
        fontWeight: '600',
    },
    imagePreview: {
        position: 'relative',
        marginBottom: 16,
        borderRadius: 14,
        overflow: 'hidden'
    },
    previewImage: {
        width: '100%',
        height: 350,
        borderRadius: 8,
        backgroundColor: '#F3F4F6'
    },
    removeImageButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 14,
        padding: 4
    },
    uploadButton: {
        backgroundColor: '#06B6D4',
        borderRadius: 8,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    uploadButtonDisabled: {
        backgroundColor: '#6B7280',
        shadowOpacity: 0
    },
    uploadButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    }
});
