import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// ─── Icon-prefixed Input Field ────────────────────────────────────────────────
function InputField({ label, icon, value, onChangeText, placeholder, keyboardType, autoCapitalize, multiline, isDark }) {
  const [focused, setFocused] = useState(false);

  const borderColor = focused
    ? (isDark ? '#FFFFFF' : '#000000')
    : (isDark ? '#1F2937' : '#E5E5E5');

  const bgColor = isDark
    ? (focused ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)')
    : (focused ? 'rgba(0,0,0,0.04)'       : '#F8F8F8');

  const iconColor = focused
    ? (isDark ? '#FB923C' : '#000000')
    : (isDark ? '#374151' : '#ADADAD');

  return (
    <View style={styles.fieldWrapper}>
      <Text style={[styles.label, { color: isDark ? '#6B7280' : '#6B6B6B' }]}>{label}</Text>
      <View style={[
        styles.inputRow,
        {
          borderColor,
          backgroundColor: bgColor,
          height: multiline ? 76 : 50,
          alignItems: multiline ? 'flex-start' : 'center',
        }
      ]}>
        <Ionicons
          name={icon}
          size={18}
          color={iconColor}
          style={[styles.inputIcon, multiline && { marginTop: 15 }]}
        />
        <TextInput
          style={[
            styles.input,
            {
              color: isDark ? '#F1F5F9' : '#181818',
              height: multiline ? 72 : 48,
              paddingTop: multiline ? 13 : 0,
              textAlignVertical: multiline ? 'top' : 'center',
            }
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={isDark ? '#374151' : '#CCCCCC'}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize || 'sentences'}
          multiline={multiline}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BillingModal({ visible, onClose, onConfirm, initialData = {} }) {
  const { theme, isDark } = useTheme();

  const [billingName, setBillingName]       = useState('');
  const [billingEmail, setBillingEmail]     = useState('');
  const [billingPhone, setBillingPhone]     = useState('');
  const [billingId, setBillingId]           = useState('');
  const [billingCity, setBillingCity]       = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [errorMsg, setErrorMsg]             = useState('');

  // Slide-up + fade animation
  const slideAnim = useRef(new Animated.Value(80)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setBillingName(initialData?.billing_name || initialData?.name || '');
      setBillingEmail(initialData?.billing_email || initialData?.email || '');
      setBillingPhone(initialData?.billing_phone || initialData?.phone || '');
      setBillingId(initialData?.billing_id_number || '');
      setBillingCity(initialData?.billing_city || '');
      setBillingAddress(initialData?.billing_address || '');
      setErrorMsg('');

      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      slideAnim.setValue(80);
      fadeAnim.setValue(0);
    }
  }, [visible, initialData]);

  const handleConfirmPress = () => {
    if (
      !billingName.trim() || !billingEmail.trim() || !billingPhone.trim() ||
      !billingId.trim()   || !billingCity.trim()  || !billingAddress.trim()
    ) {
      setErrorMsg('Todos los campos de facturación son obligatorios.');
      return;
    }
    setErrorMsg('');
    onConfirm({
      billing_name:      billingName.trim(),
      billing_email:     billingEmail.trim(),
      billing_phone:     billingPhone.trim(),
      billing_id_number: billingId.trim(),
      billing_city:      billingCity.trim(),
      billing_address:   billingAddress.trim(),
    });
  };

  // ── theme shortcuts ──────────────────────────────────────────────────────
  const cardBg   = isDark ? '#0B0F14' : '#FFFFFF';
  const surface  = isDark ? '#141821' : '#F8F8F8';
  const border   = isDark ? '#1F2937' : '#E5E5E5';
  const textPri  = isDark ? '#F1F5F9' : '#181818';
  const textSec  = isDark ? '#6B7280' : '#6B6B6B';
  const divider  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor: cardBg,
                shadowColor: isDark ? '#000' : '#9CA3AF',
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            {/* ── Header ── */}
            <View style={[styles.headerArea, { backgroundColor: surface, borderBottomColor: border }]}>
              {/* Accent bar */}
              <View style={[styles.accentBar, { backgroundColor: isDark ? '#FB923C' : '#000000' }]} />

              <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                  <View style={[styles.headerIconBox, { backgroundColor: isDark ? 'rgba(251,146,60,0.12)' : 'rgba(0,0,0,0.06)' }]}>
                    <Ionicons name="receipt-outline" size={20} color={isDark ? '#FB923C' : '#000000'} />
                  </View>
                  <View>
                    <Text style={[styles.title, { color: textPri }]}>Datos de Facturación</Text>
                    <Text style={[styles.headerSub, { color: textSec }]}>Comprobante de compra</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.closeBtn, { backgroundColor: isDark ? '#1F2937' : '#EBEBEB' }]}
                  onPress={onClose}
                >
                  <Ionicons name="close" size={18} color={textSec} />
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Error Banner ── */}
            {errorMsg ? (
              <View style={[styles.errorBanner, { backgroundColor: 'rgba(239,68,68,0.08)', borderLeftColor: '#EF4444' }]}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* ── Form ── */}
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <InputField label="NOMBRE / RAZÓN SOCIAL"  icon="person-outline"       value={billingName}    onChangeText={setBillingName}    placeholder="Tu nombre completo"                isDark={isDark} />
              <InputField label="CÉDULA O RUC"           icon="card-outline"         value={billingId}      onChangeText={setBillingId}      placeholder="Ej: 1309876543"  keyboardType="numeric"        isDark={isDark} />
              <InputField label="CORREO ELECTRÓNICO"     icon="mail-outline"         value={billingEmail}   onChangeText={setBillingEmail}   placeholder="ejemplo@correo.com" keyboardType="email-address" autoCapitalize="none" isDark={isDark} />
              <InputField label="TELÉFONO (WHATSAPP)"    icon="call-outline"         value={billingPhone}   onChangeText={setBillingPhone}   placeholder="+593 99 999 9999"  keyboardType="phone-pad"      isDark={isDark} />
              <InputField label="CIUDAD DE DOMICILIO"    icon="location-outline"     value={billingCity}    onChangeText={setBillingCity}    placeholder="Ej: Manta"                         isDark={isDark} />
              <InputField label="DIRECCIÓN COMPLETA"     icon="home-outline"         value={billingAddress} onChangeText={setBillingAddress} placeholder="Calle 15 y Av. 24..."              isDark={isDark} multiline />
            </ScrollView>

            {/* ── Footer ── */}
            <View style={[styles.footer, { borderTopColor: divider }]}>
              <TouchableOpacity
                style={[styles.btnCancel, { borderColor: border, backgroundColor: isDark ? '#141821' : '#F2F2F2' }]}
                onPress={onClose}
                activeOpacity={0.75}
              >
                <Text style={[styles.btnCancelText, { color: textSec }]}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnConfirm, { backgroundColor: isDark ? '#FFFFFF' : '#000000' }]}
                onPress={handleConfirmPress}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color={isDark ? '#000000' : '#FFFFFF'} style={{ marginRight: 6 }} />
                <Text style={[styles.btnConfirmText, { color: isDark ? '#000000' : '#FFFFFF' }]}>Confirmar</Text>
              </TouchableOpacity>
            </View>

          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  keyboardContainer: { width: '100%', maxWidth: 440 },
  card: {
    borderRadius: 28,
    overflow: 'hidden',
    width: '100%',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },

  // Header
  headerArea: { borderBottomWidth: 1, paddingBottom: 16 },
  accentBar: { height: 3, marginHorizontal: 20, marginTop: 16, marginBottom: 14, borderRadius: 2 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIconBox: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  headerSub: { fontSize: 11, marginTop: 1, fontWeight: '500' },
  closeBtn: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },

  // Error
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderLeftWidth: 3, paddingVertical: 10, paddingHorizontal: 14,
    marginHorizontal: 16, marginTop: 12, borderRadius: 10,
  },
  errorText: { color: '#EF4444', fontSize: 12, fontWeight: '600', flex: 1 },

  // Scroll
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },

  // Field
  fieldWrapper: { marginBottom: 12 },
  label: {
    fontSize: 10, fontWeight: '800', letterSpacing: 0.8,
    textTransform: 'uppercase', marginBottom: 6, marginLeft: 2,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 13,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 14, fontWeight: '500' },

  // Footer
  footer: {
    flexDirection: 'row', gap: 10,
    padding: 16, borderTopWidth: 1,
  },
  btnCancel: {
    flex: 1, height: 50, borderRadius: 14, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  btnCancelText: { fontSize: 14, fontWeight: '700' },
  btnConfirm: {
    flex: 1.6, height: 50, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  btnConfirmText: { fontSize: 15, fontWeight: '800' },
});
