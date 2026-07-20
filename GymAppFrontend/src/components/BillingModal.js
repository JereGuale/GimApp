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
function InputField({ label, icon, value, onChangeText, placeholder, keyboardType, autoCapitalize, multiline, isDark, secureTextEntry }) {
  const [focused, setFocused] = useState(false);

  const borderColor = focused
    ? (isDark ? '#FFFFFF' : '#000000')
    : (isDark ? '#1F2937' : '#E5E5E5');

  const bgColor = isDark
    ? (focused ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)')
    : (focused ? 'rgba(0,0,0,0.04)' : '#F8F8F8');

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
          secureTextEntry={secureTextEntry}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}

// ─── Summary Row ──────────────────────────────────────────────────────────────
function SummaryRow({ icon, value, isDark }) {
  if (!value) return null;
  return (
    <View style={styles.summaryRow}>
      <Ionicons name={icon} size={15} color={isDark ? '#6B7280' : '#9CA3AF'} style={{ width: 20 }} />
      <Text style={[styles.summaryValue, { color: isDark ? '#E2E8F0' : '#181818' }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BillingModal({ visible, onClose, onConfirm, initialData = {} }) {
  const { theme, isDark } = useTheme();

  const [billingName, setBillingName] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [billingPhone, setBillingPhone] = useState('');
  const [billingId, setBillingId] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingMethod, setShippingMethod] = useState('local');
  const [errorMsg, setErrorMsg] = useState('');

  // editMode: false = muestra resumen, true = muestra formulario completo
  const [editMode, setEditMode] = useState(false);

  // Slide-up + fade animation
  const slideAnim = useRef(new Animated.Value(80)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ¿Ya tiene datos guardados?
  const hasSavedData = !!(
    (initialData?.billing_id_number || '') ||
    (initialData?.billing_city || '') ||
    (initialData?.billing_address || '')
  );

  useEffect(() => {
    if (visible) {
      const name  = initialData?.billing_name  || initialData?.name  || '';
      const email = initialData?.billing_email || initialData?.email || '';
      const phone = initialData?.billing_phone || initialData?.phone || '';

      setBillingName(name);
      setBillingEmail(email);
      setBillingPhone(phone);
      setBillingId(initialData?.billing_id_number || '');
      setBillingCity(initialData?.billing_city || '');
      setBillingAddress(initialData?.billing_address || '');
      setShippingMethod(initialData?.shipping_method || 'local');
      setErrorMsg('');

      // Si ya tiene datos → modo resumen; si no → modo edición directamente
      const alreadyHasData = !!(
        (initialData?.billing_id_number || '') ||
        (initialData?.billing_city || '') ||
        (initialData?.billing_address || '')
      );
      setEditMode(!alreadyHasData);

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
      !billingId.trim() || !billingCity.trim() || !billingAddress.trim()
    ) {
      setErrorMsg('Todos los campos de facturación son obligatorios.');
      return;
    }
    setErrorMsg('');
    onConfirm({
      billing_name: billingName.trim(),
      billing_email: billingEmail.trim(),
      billing_phone: billingPhone.trim(),
      billing_id_number: billingId.trim(),
      billing_city: billingCity.trim(),
      billing_address: billingAddress.trim(),
      shipping_method: shippingMethod,
    });
  };

  // Confirm directo desde el modo resumen (sin re-validar, ya están guardados)
  const handleSummaryConfirm = () => {
    onConfirm({
      billing_name: billingName,
      billing_email: billingEmail,
      billing_phone: billingPhone,
      billing_id_number: billingId,
      billing_city: billingCity,
      billing_address: billingAddress,
      shipping_method: shippingMethod,
    });
  };

  // ── theme shortcuts ──────────────────────────────────────────────────────
  const cardBg  = isDark ? '#0B0F14' : '#FFFFFF';
  const surface = isDark ? '#141821' : '#F8F8F8';
  const border  = isDark ? '#1F2937' : '#E5E5E5';
  const textPri = isDark ? '#F1F5F9' : '#181818';
  const textSec = isDark ? '#6B7280' : '#6B6B6B';
  const divider = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const accent  = isDark ? '#FB923C' : '#000000';

  const shippingLabel = shippingMethod === 'local' ? 'Retiro en Local' : 'Envío a Domicilio';
  const shippingIcon  = shippingMethod === 'local' ? 'storefront-outline' : 'bicycle-outline';

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
              <View style={[styles.accentBar, { backgroundColor: accent }]} />
              <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                  <View style={[styles.headerIconBox, { backgroundColor: isDark ? 'rgba(251,146,60,0.12)' : 'rgba(0,0,0,0.06)' }]}>
                    <Ionicons name="receipt-outline" size={20} color={accent} />
                  </View>
                  <View>
                    <Text style={[styles.title, { color: textPri }]}>Datos de Facturación</Text>
                    <Text style={[styles.headerSub, { color: textSec }]}>
                      {editMode ? 'Completa tus datos' : 'Datos guardados'}
                    </Text>
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

            {/* ══════════════════════════════════════════════════
                MODO RESUMEN — datos ya guardados
            ══════════════════════════════════════════════════ */}
            {!editMode ? (
              <>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                  {/* Tarjeta resumen */}
                  <View style={[styles.summaryCard, { backgroundColor: surface, borderColor: border }]}>
                    {/* Nombre + badge */}
                    <View style={styles.summaryHeader}>
                      <View style={[styles.summaryAvatar, { backgroundColor: isDark ? 'rgba(251,146,60,0.15)' : 'rgba(0,0,0,0.06)' }]}>
                        <Ionicons name="person" size={18} color={accent} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.summaryName, { color: textPri }]}>{billingName || '—'}</Text>
                        <Text style={[styles.summarySub, { color: textSec }]}>CI/RUC: {billingId || '—'}</Text>
                      </View>
                    </View>

                    <View style={[styles.summaryDivider, { backgroundColor: divider }]} />

                    <SummaryRow icon="mail-outline"     value={billingEmail}   isDark={isDark} />
                    <SummaryRow icon="call-outline"     value={billingPhone}   isDark={isDark} />
                    <SummaryRow icon="pin-outline"      value={billingCity}    isDark={isDark} />
                    <SummaryRow icon="location-outline" value={billingAddress} isDark={isDark} />
                  </View>

                  {/* Método de entrega (siempre editable en resumen) */}
                  <View style={[styles.fieldWrapper, { marginTop: 4 }]}>
                    <Text style={[styles.label, { color: textSec }]}>Método de Entrega</Text>
                    <View style={styles.methodToggleRow}>
                      <TouchableOpacity
                        style={[
                          styles.methodButton,
                          { borderColor: border },
                          shippingMethod === 'local' && { backgroundColor: accent, borderColor: accent }
                        ]}
                        activeOpacity={0.8}
                        onPress={() => setShippingMethod('local')}
                      >
                        <Ionicons name="storefront-outline" size={15} color={shippingMethod === 'local' ? (isDark ? '#000' : '#FFF') : theme.colors.text} />
                        <Text style={[styles.methodButtonText, { color: shippingMethod === 'local' ? (isDark ? '#000' : '#FFF') : theme.colors.text }]}>
                          Retiro en Local
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.methodButton,
                          { borderColor: border },
                          shippingMethod === 'delivery' && { backgroundColor: accent, borderColor: accent }
                        ]}
                        activeOpacity={0.8}
                        onPress={() => setShippingMethod('delivery')}
                      >
                        <Ionicons name="bicycle-outline" size={15} color={shippingMethod === 'delivery' ? (isDark ? '#000' : '#FFF') : theme.colors.text} />
                        <Text style={[styles.methodButtonText, { color: shippingMethod === 'delivery' ? (isDark ? '#000' : '#FFF') : theme.colors.text }]}>
                          Envío a Domicilio
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                </ScrollView>

                {/* Footer resumen */}
                <View style={[styles.footer, { borderTopColor: divider }]}>
                  {/* Botón editar */}
                  <TouchableOpacity
                    style={[styles.btnEdit, { borderColor: border, backgroundColor: isDark ? '#141821' : '#F2F2F2' }]}
                    onPress={() => setEditMode(true)}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="create-outline" size={16} color={textSec} style={{ marginRight: 5 }} />
                    <Text style={[styles.btnCancelText, { color: textSec }]}>Editar</Text>
                  </TouchableOpacity>

                  {/* Botón confirmar */}
                  <TouchableOpacity
                    style={[styles.btnConfirm, { backgroundColor: accent }]}
                    onPress={handleSummaryConfirm}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color={isDark ? '#000' : '#FFF'} style={{ marginRight: 6 }} />
                    <Text style={[styles.btnConfirmText, { color: isDark ? '#000' : '#FFF' }]}>Confirmar</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
            /* ══════════════════════════════════════════════════
               MODO EDICIÓN — formulario completo
            ══════════════════════════════════════════════════ */
              <>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                  {/* Método de Entrega */}
                  <View style={styles.fieldWrapper}>
                    <Text style={[styles.label, { color: textSec }]}>Método de Entrega</Text>
                    <View style={styles.methodToggleRow}>
                      <TouchableOpacity
                        style={[
                          styles.methodButton,
                          { borderColor: border },
                          shippingMethod === 'local' && { backgroundColor: accent, borderColor: accent }
                        ]}
                        activeOpacity={0.8}
                        onPress={() => setShippingMethod('local')}
                      >
                        <Ionicons name="storefront-outline" size={15} color={shippingMethod === 'local' ? (isDark ? '#000' : '#FFF') : theme.colors.text} />
                        <Text style={[styles.methodButtonText, { color: shippingMethod === 'local' ? (isDark ? '#000' : '#FFF') : theme.colors.text }]}>
                          Retiro en Local
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.methodButton,
                          { borderColor: border },
                          shippingMethod === 'delivery' && { backgroundColor: accent, borderColor: accent }
                        ]}
                        activeOpacity={0.8}
                        onPress={() => setShippingMethod('delivery')}
                      >
                        <Ionicons name="bicycle-outline" size={15} color={shippingMethod === 'delivery' ? (isDark ? '#000' : '#FFF') : theme.colors.text} />
                        <Text style={[styles.methodButtonText, { color: shippingMethod === 'delivery' ? (isDark ? '#000' : '#FFF') : theme.colors.text }]}>
                          Envío a Domicilio
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <InputField
                    label="Nombre / Razón Social"
                    icon="person-outline"
                    value={billingName}
                    onChangeText={setBillingName}
                    placeholder="Nombre completo"
                    isDark={isDark}
                  />

                  <InputField
                    label="Cédula o RUC"
                    icon="card-outline"
                    value={billingId}
                    onChangeText={setBillingId}
                    placeholder="Ej: 1309876543"
                    keyboardType="numeric"
                    isDark={isDark}
                  />

                  <InputField
                    label="Correo Electrónico"
                    icon="mail-outline"
                    value={billingEmail}
                    onChangeText={setBillingEmail}
                    placeholder="ejemplo@correo.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    isDark={isDark}
                  />

                  <InputField
                    label="Teléfono (WhatsApp)"
                    icon="call-outline"
                    value={billingPhone}
                    onChangeText={setBillingPhone}
                    placeholder="+593 99 999 9999"
                    keyboardType="phone-pad"
                    isDark={isDark}
                  />

                  <InputField
                    label="Ciudad de Domicilio"
                    icon="pin-outline"
                    value={billingCity}
                    onChangeText={setBillingCity}
                    placeholder="Ej: Manta"
                    isDark={isDark}
                  />

                  <InputField
                    label="Dirección Completa"
                    icon="location-outline"
                    value={billingAddress}
                    onChangeText={setBillingAddress}
                    placeholder="Ej: Calle 15 y Av. 24, Barrio Córdoba"
                    multiline
                    isDark={isDark}
                  />
                </ScrollView>

                {/* Footer edición */}
                <View style={[styles.footer, { borderTopColor: divider }]}>
                  <TouchableOpacity
                    style={[styles.btnEdit, { borderColor: border, backgroundColor: isDark ? '#141821' : '#F2F2F2' }]}
                    onPress={hasSavedData ? () => setEditMode(false) : onClose}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.btnCancelText, { color: textSec }]}>
                      {hasSavedData ? 'Cancelar' : 'Cerrar'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.btnConfirm, { backgroundColor: accent }]}
                    onPress={handleConfirmPress}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color={isDark ? '#000' : '#FFF'} style={{ marginRight: 6 }} />
                    <Text style={[styles.btnConfirmText, { color: isDark ? '#000' : '#FFF' }]}>Guardar y Confirmar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

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
    maxHeight: Platform.OS === 'web' ? '85vh' : '90%',
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

  // Summary card
  summaryCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  summaryAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryName: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  summarySub: { fontSize: 12, marginTop: 2, fontWeight: '500' },
  summaryDivider: { height: 1, marginBottom: 12 },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  summaryValue: { fontSize: 13, fontWeight: '500', flex: 1 },

  // Field
  fieldWrapper: { marginBottom: 12 },
  label: {
    fontSize: 10, fontWeight: '800', letterSpacing: 0.8,
    textTransform: 'uppercase', marginBottom: 6, marginLeft: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  inputIcon: { marginRight: 8 },

  // Footer
  footer: {
    flexDirection: 'row', gap: 10,
    padding: 16, borderTopWidth: 1,
  },
  btnEdit: {
    flex: 1, height: 50, borderRadius: 14, borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
  },
  btnCancelText: { fontSize: 14, fontWeight: '700' },
  btnConfirm: {
    flex: 1.6, height: 50, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  btnConfirmText: { fontSize: 14, fontWeight: '700' },

  // Shipping
  methodToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  methodButtonText: {
    fontSize: 13,
    fontWeight: '700'
  },
});
