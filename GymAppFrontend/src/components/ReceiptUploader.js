import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Modal from 'react-native-modal';
import { useTheme } from '../context/ThemeContext';
import { API_URL } from '../services/api';

// ─── Bank color badges ───────────────────────────────────────────────────────
function getBankAccent(name = '') {
    const n = name.toLowerCase();
    if (n.includes('pichincha'))  return '#FBBF24'; // Amarillo
    if (n.includes('guayaquil')) return '#CC0066';  // Magenta intenso
    if (n.includes('produbanco')) return '#1A6B3C'; // Verde oscuro
    return '#FB923C'; // app orange as default
}

// ─── Single detail row ───────────────────────────────────────────────────────
function DetailRow({ icon, label, value, isDark }) {
    return (
        <View style={rowStyles.row}>
            <View style={[rowStyles.iconBox, { backgroundColor: isDark ? 'rgba(251,146,60,0.12)' : 'rgba(0,0,0,0.05)' }]}>
                <Ionicons name={icon} size={15} color={isDark ? '#FB923C' : '#000000'} />
            </View>
            <Text style={[rowStyles.label, { color: isDark ? '#6B7280' : '#6B6B6B' }]}>{label}</Text>
            <Text style={[rowStyles.value, { color: isDark ? '#F1F5F9' : '#181818' }]}>{value}</Text>
        </View>
    );
}

const rowStyles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    iconBox: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    label: { fontSize: 12, fontWeight: '600', width: 58 },
    value: { fontSize: 14, fontWeight: '700', flex: 1 },
});

// ─── Main Component ──────────────────────────────────────────────────────────
export default function ReceiptUploader({ visible, onClose, onUpload }) {
    const { theme, isDark } = useTheme();
    const [selectedImage, setSelectedImage] = useState(null);
    const [uploading, setUploading]         = useState(false);
    const [selectedBank, setSelectedBank]   = useState(0);
    const [bankAccounts, setBankAccounts]   = useState([]);
    const [loadingBanks, setLoadingBanks]   = useState(true);

    React.useEffect(() => {
        if (visible) {
            setLoadingBanks(true);
            fetch(`${API_URL}/settings/public`)
                .then(res => res.json())
                .then(data => {
                    const bankSetting = data.find(s => s.key === 'bank_accounts');
                    if (bankSetting?.value) {
                        const parsed = typeof bankSetting.value === 'string'
                            ? JSON.parse(bankSetting.value)
                            : bankSetting.value;
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            setBankAccounts(parsed.map(b => ({
                                bank:        b.name,
                                accountType: b.accountType || 'Ahorros',
                                account:     b.account,
                                holder:      b.holder,
                                cedula:      b.cedula || '',
                                accent:      getBankAccent(b.name),
                            })));
                        }
                    }
                })
                .catch(err => console.error('Error fetching banks', err))
                .finally(() => setLoadingBanks(false));
        }
    }, [visible]);

    const pickImage = async () => {
        const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!granted) {
            Alert.alert('Permiso Denegado', 'Necesitas dar permiso para acceder a las fotos.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });
        if (!result.canceled) setSelectedImage(result.assets[0]);
    };

    const handleUpload = async () => {
        if (!selectedImage) {
            Alert.alert('Sin Imagen', 'Por favor selecciona un comprobante primero.');
            return;
        }
        setUploading(true);
        try {
            await onUpload(selectedImage);
            setSelectedImage(null);
            onClose();
        } catch {
            Alert.alert('Error', 'No se pudo subir el comprobante. Intenta nuevamente.');
        } finally {
            setUploading(false);
        }
    };

    // ── theme shortcuts ──────────────────────────────────────────────────────
    const bg       = isDark ? '#0B0F14' : '#FFFFFF';
    const surface  = isDark ? '#141821' : '#F8F8F8';
    const border   = isDark ? '#1F2937' : '#E5E5E5';
    const textPri  = isDark ? '#F1F5F9' : '#181818';
    const textSec  = isDark ? '#6B7280' : '#6B6B6B';
    const divider  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';

    const currentBank = bankAccounts[selectedBank];

    // ── Loading / empty states ───────────────────────────────────────────────
    const renderLoading = () => (
        <View style={{ padding: 50, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#FB923C" />
            <Text style={[styles.stateText, { color: textSec, marginTop: 14 }]}>
                Cargando cuentas bancarias...
            </Text>
        </View>
    );

    const renderEmpty = () => (
        <View style={{ padding: 50, alignItems: 'center', gap: 16 }}>
            <View style={[styles.emptyIcon, { backgroundColor: isDark ? '#1F2937' : '#F2F2F2' }]}>
                <Ionicons name="business-outline" size={28} color={textSec} />
            </View>
            <Text style={[styles.stateText, { color: '#EF4444' }]}>
                No hay cuentas bancarias configuradas.
            </Text>
            <TouchableOpacity
                style={[styles.ghostBtn, { borderColor: border }]}
                onPress={onClose}
            >
                <Text style={{ color: textPri, fontWeight: '700', fontSize: 14 }}>Cerrar</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <Modal
            isVisible={visible}
            onBackdropPress={onClose}
            style={styles.modal}
            animationIn="slideInUp"
            animationOut="slideOutDown"
            backdropOpacity={0.75}
        >
            <View style={[styles.sheet, { backgroundColor: bg }]}>

                {/* ── Handle bar ── */}
                <View style={[styles.handle, { backgroundColor: isDark ? '#2D3748' : '#D1D5DB' }]} />

                {loadingBanks ? renderLoading()
                : !currentBank ? renderEmpty()
                : (
                    <ScrollView showsVerticalScrollIndicator={false}>

                        {/* ── Header ── */}
                        <View style={styles.header}>
                            <View style={styles.headerLeft}>
                                <View style={[styles.headerIcon, { backgroundColor: isDark ? 'rgba(251,146,60,0.12)' : '#F2F2F2' }]}>
                                    <Ionicons name="swap-horizontal" size={22} color={isDark ? '#FB923C' : '#000'} />
                                </View>
                                <View>
                                    <Text style={[styles.title, { color: textPri }]}>Transferencia Bancaria</Text>
                                    <Text style={[styles.subtitle, { color: textSec }]}>Selecciona el banco destino</Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={[styles.closeBtn, { backgroundColor: isDark ? '#1F2937' : '#F2F2F2' }]}
                                onPress={onClose}
                            >
                                <Ionicons name="close" size={20} color={textSec} />
                            </TouchableOpacity>
                        </View>

                        {/* ── Bank Tabs ── */}
                        <View style={styles.tabRow}>
                            {bankAccounts.map((bank, i) => {
                                const isActive = selectedBank === i;
                                return (
                                    <TouchableOpacity
                                        key={i}
                                        style={[
                                            styles.tab,
                                            {
                                                backgroundColor: isActive
                                                    ? (isDark ? '#1F2937' : '#000000')
                                                    : (isDark ? '#141821' : '#F2F2F2'),
                                                borderColor: isActive ? (isDark ? '#374151' : '#000000') : border,
                                            }
                                        ]}
                                        onPress={() => setSelectedBank(i)}
                                        activeOpacity={0.75}
                                    >
                                        {/* Accent dot */}
                                        <View style={[styles.tabDot, { backgroundColor: bank.accent }]} />
                                        <Text style={[
                                            styles.tabText,
                                            {
                                                color: isActive
                                                    ? (isDark ? '#F1F5F9' : '#FFFFFF')
                                                    : textSec,
                                                fontWeight: isActive ? '800' : '600',
                                            }
                                        ]}>
                                            {bank.bank.replace('Banco ', '')}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* ── Account Card ── */}
                        <View style={[styles.accountCard, { backgroundColor: surface, borderColor: border }]}>
                            {/* Top stripe */}
                            <View style={[styles.cardStripe, { backgroundColor: currentBank.accent }]} />
                            <View style={styles.cardBody}>
                                <View style={styles.cardBankRow}>
                                    <Ionicons name="business-outline" size={18} color={currentBank.accent} />
                                    <Text style={[styles.cardBankName, { color: textPri }]}>
                                        {currentBank.bank}
                                    </Text>
                                    <View style={[styles.typePill, {
                                        backgroundColor: isDark ? 'rgba(251,146,60,0.12)' : 'rgba(0,0,0,0.06)',
                                    }]}>
                                        <Text style={[styles.typePillText, { color: isDark ? '#FB923C' : '#181818' }]}>
                                            {currentBank.accountType}
                                        </Text>
                                    </View>
                                </View>
                                <View style={[styles.divider, { backgroundColor: divider }]} />
                                <DetailRow icon="card-outline"         label="Cuenta"  value={currentBank.account} isDark={isDark} />
                                <DetailRow icon="person-outline"       label="Titular" value={currentBank.holder}  isDark={isDark} />
                                {currentBank.cedula ? (
                                    <DetailRow icon="document-text-outline" label="Cédula"  value={currentBank.cedula}  isDark={isDark} />
                                ) : null}
                            </View>
                        </View>

                        {/* ── Instruction banner ── */}
                        <View style={[styles.infoBanner, { backgroundColor: isDark ? '#1F2937' : '#F2F2F2', borderColor: border }]}>
                            <Ionicons name="information-circle-outline" size={18} color={isDark ? '#FB923C' : '#181818'} />
                            <Text style={[styles.infoText, { color: textSec }]}>
                                Realiza la transferencia y sube el comprobante para que sea aprobado.
                            </Text>
                        </View>

                        {/* ── Section Title ── */}
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionBar, { backgroundColor: isDark ? '#FB923C' : '#000000' }]} />
                            <Text style={[styles.sectionTitle, { color: textPri }]}>Comprobante de Pago</Text>
                        </View>

                        {/* ── Image picker ── */}
                        {!selectedImage ? (
                            <TouchableOpacity
                                style={[styles.pickArea, { backgroundColor: surface, borderColor: border }]}
                                onPress={pickImage}
                                activeOpacity={0.75}
                            >
                                <View style={[styles.pickIconCircle, { backgroundColor: isDark ? '#1F2937' : '#EBEBEB' }]}>
                                    <Ionicons name="image-outline" size={30} color={isDark ? '#FB923C' : '#181818'} />
                                </View>
                                <Text style={[styles.pickTitle, { color: textPri }]}>Seleccionar desde Galería</Text>
                                <Text style={[styles.pickSub, { color: textSec }]}>PNG, JPG · Máx 5 MB</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.previewWrapper}>
                                <Image
                                    source={{ uri: selectedImage.uri }}
                                    style={styles.previewImage}
                                    resizeMode="contain"
                                />
                                <TouchableOpacity
                                    style={styles.removeBtn}
                                    onPress={() => setSelectedImage(null)}
                                >
                                    <Ionicons name="close-circle" size={30} color="#EF4444" />
                                </TouchableOpacity>
                                <View style={[styles.previewBadge, { backgroundColor: isDark ? '#1F2937' : '#000' }]}>
                                    <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
                                    <Text style={styles.previewBadgeText}>Imagen seleccionada</Text>
                                </View>
                            </View>
                        )}

                        {/* ── Upload Button ── */}
                        <TouchableOpacity
                            style={[
                                styles.uploadBtn,
                                {
                                    backgroundColor: !selectedImage || uploading
                                        ? (isDark ? '#1F2937' : '#D1D5DB')
                                        : (isDark ? '#FFFFFF' : '#000000'),
                                }
                            ]}
                            onPress={handleUpload}
                            disabled={!selectedImage || uploading}
                            activeOpacity={0.85}
                        >
                            {uploading ? (
                                <ActivityIndicator size="small" color={isDark ? '#000' : '#FFF'} />
                            ) : (
                                <Ionicons
                                    name="cloud-upload-outline"
                                    size={20}
                                    color={!selectedImage
                                        ? (isDark ? '#374151' : '#9CA3AF')
                                        : (isDark ? '#000' : '#FFF')}
                                />
                            )}
                            <Text style={[
                                styles.uploadBtnText,
                                {
                                    color: !selectedImage || uploading
                                        ? (isDark ? '#374151' : '#9CA3AF')
                                        : (isDark ? '#000000' : '#FFFFFF'),
                                }
                            ]}>
                                {uploading ? 'Subiendo...' : 'Subir Comprobante'}
                            </Text>
                        </TouchableOpacity>

                    </ScrollView>
                )}
            </View>
        </Modal>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    modal: { margin: 0, justifyContent: 'flex-end' },
    sheet: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: '92%',
        paddingHorizontal: 18,
        paddingBottom: 36,
        paddingTop: 10,
    },

    // Handle
    handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },

    // State helpers
    stateText: { fontSize: 14, fontWeight: '500', textAlign: 'center' },
    emptyIcon: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    ghostBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5 },

    // Header
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
    subtitle: { fontSize: 12, marginTop: 1, fontWeight: '500' },
    closeBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

    // Tabs
    tabRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    tab: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingVertical: 11, paddingHorizontal: 6,
        borderRadius: 12, borderWidth: 1.5,
    },
    tabDot: { width: 8, height: 8, borderRadius: 4 },
    tabText: { fontSize: 12 },

    // Account card
    accountCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginBottom: 14 },
    cardStripe: { height: 4 },
    cardBody: { padding: 16 },
    cardBankRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    cardBankName: { fontSize: 15, fontWeight: '800', flex: 1 },
    typePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    typePillText: { fontSize: 11, fontWeight: '700' },
    divider: { height: 1, marginBottom: 14 },

    // Info banner
    infoBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 22,
    },
    infoText: { flex: 1, fontSize: 12, fontWeight: '500', lineHeight: 17 },

    // Section header
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    sectionBar: { width: 3, height: 16, borderRadius: 2 },
    sectionTitle: { fontSize: 15, fontWeight: '800' },

    // Image picker
    pickArea: {
        borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed',
        paddingVertical: 30, alignItems: 'center', gap: 8, marginBottom: 16,
    },
    pickIconCircle: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    pickTitle: { fontSize: 14, fontWeight: '700' },
    pickSub: { fontSize: 12, fontWeight: '500' },

    // Preview
    previewWrapper: { borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
    previewImage: { width: '100%', height: 240, backgroundColor: '#111' },
    removeBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 16, padding: 2 },
    previewBadge: {
        position: 'absolute', bottom: 10, left: 10,
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    },
    previewBadgeText: { color: '#22C55E', fontSize: 11, fontWeight: '700' },

    // Upload button
    uploadBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, height: 54, borderRadius: 16,
    },
    uploadBtnText: { fontSize: 15, fontWeight: '800' },
});
