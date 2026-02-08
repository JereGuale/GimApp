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

export default function ReceiptUploader({ visible, onClose, onUpload }) {
    const { theme } = useTheme();
    const [selectedImage, setSelectedImage] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [selectedBank, setSelectedBank] = useState(0);

    // Datos bancarios de Ecuador
    const bankAccounts = [
        {
            bank: 'Banco Pichincha',
            accountType: 'Ahorros',
            account: '2100456789',
            holder: 'Lili Anchundia',
            icon: 'business',
            color: '#FFB800'
        },
        {
            bank: 'Banco Guayaquil',
            accountType: 'Ahorros',
            account: '0015345678',
            holder: 'Lili Anchundia',
            icon: 'business',
            color: '#003B7A'
        },
        {
            bank: 'Banco Produbanco',
            accountType: 'Ahorros',
            account: '1200234567',
            holder: 'Lili Anchundia',
            icon: 'business',
            color: '#E31837'
        }
    ];

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

    const takePhoto = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert('Permiso Denegado', 'Necesitas dar permiso para usar la cámara');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
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
            <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.colors.text }]}>
                            Transferencia Bancaria
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close-circle" size={28} color="#6B7280" />
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
                                        backgroundColor: 'rgba(34, 211, 238, 0.15)',
                                        borderColor: '#22D3EE'
                                    }
                                ]}
                                onPress={() => setSelectedBank(index)}
                            >
                                <Ionicons
                                    name="business"
                                    size={18}
                                    color={selectedBank === index ? '#22D3EE' : theme.colors.textSecondary}
                                />
                                <Text style={[
                                    styles.bankTabText,
                                    { color: selectedBank === index ? '#22D3EE' : theme.colors.textSecondary }
                                ]}>
                                    {bank.bank.replace('Banco ', '')}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Bank Details Card - Compacto */}
                    <View style={styles.bankDetailsCard}>
                        <View style={styles.detailRow}>
                            <Ionicons name="wallet-outline" size={18} color="#FB923C" />
                            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Tipo:</Text>
                            <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                                {currentBank.accountType}
                            </Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Ionicons name="card-outline" size={18} color="#FB923C" />
                            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Cuenta:</Text>
                            <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                                {currentBank.account}
                            </Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Ionicons name="person-outline" size={18} color="#FB923C" />
                            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Titular:</Text>
                            <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                                {currentBank.holder}
                            </Text>
                        </View>
                    </View>

                    {/* Compact Instructions */}
                    <View style={styles.instructionsCard}>
                        <Text style={[styles.instructionText, { color: theme.colors.textSecondary }]}>
                            💡 Realiza la transferencia y sube el comprobante para aprobación
                        </Text>
                    </View>

                    {/* Image Selection */}
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                        Comprobante de Pago
                    </Text>

                    {!selectedImage ? (
                        <View style={styles.imageButtons}>
                            <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
                                <Ionicons name="camera" size={28} color="#22D3EE" />
                                <Text style={styles.imageButtonText}>Cámara</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                                <Ionicons name="images" size={28} color="#22D3EE" />
                                <Text style={styles.imageButtonText}>Galería</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.imagePreview}>
                            <Image
                                source={{ uri: selectedImage.uri }}
                                style={styles.previewImage}
                                resizeMode="cover"
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
        maxHeight: '85%',
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
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
        backgroundColor: 'rgba(107, 114, 128, 0.1)'
    },
    bankTabText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.3
    },
    bankDetailsCard: {
        backgroundColor: 'rgba(34, 211, 238, 0.1)',
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#22D3EE',
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
        backgroundColor: 'rgba(251, 146, 60, 0.1)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FB923C'
    },
    instructionText: {
        fontSize: 13,
        lineHeight: 19,
        textAlign: 'center'
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
        letterSpacing: 0.3
    },
    imageButtons: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16
    },
    imageButton: {
        flex: 1,
        backgroundColor: 'rgba(34, 211, 238, 0.15)',
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        gap: 6,
        borderWidth: 2,
        borderColor: '#22D3EE'
    },
    imageButtonText: {
        color: '#22D3EE',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.3
    },
    imagePreview: {
        position: 'relative',
        marginBottom: 16,
        borderRadius: 14,
        overflow: 'hidden'
    },
    previewImage: {
        width: '100%',
        height: 200,
        borderRadius: 14
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
        backgroundColor: '#22C55E',
        borderRadius: 14,
        paddingVertical: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#22C55E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 5
    },
    uploadButtonDisabled: {
        backgroundColor: '#6B7280',
        shadowOpacity: 0
    },
    uploadButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5
    }
});
