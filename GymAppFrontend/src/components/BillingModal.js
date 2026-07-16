import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function BillingModal({ visible, onClose, onConfirm, initialData = {} }) {
  const { theme } = useTheme();

  const [billingName, setBillingName] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [billingPhone, setBillingPhone] = useState('');
  const [billingId, setBillingId] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingAddress, setBillingAddress] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (visible) {
      setBillingName(initialData?.name || initialData?.billing_name || '');
      setBillingEmail(initialData?.email || initialData?.billing_email || '');
      setBillingPhone(initialData?.phone || initialData?.billing_phone || '');
      setBillingId(initialData?.billing_id_number || '');
      setBillingCity(initialData?.billing_city || '');
      setBillingAddress(initialData?.billing_address || '');
      setErrorMsg('');
    }
  }, [visible, initialData]);

  const handleConfirmPress = () => {
    if (!billingName.trim() || !billingEmail.trim() || !billingPhone.trim() || !billingId.trim() || !billingCity.trim() || !billingAddress.trim()) {
      setErrorMsg('Todos los campos de facturación son obligatorios');
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
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <Ionicons name="document-text" size={22} color={theme.colors.primary} />
                <Text style={[styles.title, { color: theme.colors.text }]}>Datos de Facturación</Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {errorMsg ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                Confirma o edita los datos para la emisión de tu comprobante de compra:
              </Text>

              {/* Nombre Completo */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Nombre / Razón Social</Text>
                <TextInput
                  style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                  value={billingName}
                  onChangeText={setBillingName}
                  placeholder="Nombre completo"
                  placeholderTextColor="#6B7280"
                />
              </View>

              {/* Identificación */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Cédula o RUC</Text>
                <TextInput
                  style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                  value={billingId}
                  onChangeText={setBillingId}
                  placeholder="Ej: 1309876543"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                />
              </View>

              {/* Correo */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Correo Electrónico</Text>
                <TextInput
                  style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                  value={billingEmail}
                  onChangeText={setBillingEmail}
                  placeholder="ejemplo@correo.com"
                  placeholderTextColor="#6B7280"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Teléfono */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Teléfono (WhatsApp)</Text>
                <TextInput
                  style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                  value={billingPhone}
                  onChangeText={setBillingPhone}
                  placeholder="+593 99 999 9999"
                  placeholderTextColor="#6B7280"
                  keyboardType="phone-pad"
                />
              </View>

              {/* Ciudad */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Ciudad de Domicilio</Text>
                <TextInput
                  style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                  value={billingCity}
                  onChangeText={setBillingCity}
                  placeholder="Ej: Manta"
                  placeholderTextColor="#6B7280"
                />
              </View>

              {/* Dirección */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Dirección Completa</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: theme.colors.text,
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.background,
                      height: 60,
                      paddingTop: 8,
                    },
                  ]}
                  value={billingAddress}
                  onChangeText={setBillingAddress}
                  placeholder="Ej: Calle 15 y Av. 24, Barrio Córdoba"
                  placeholderTextColor="#6B7280"
                  multiline
                />
              </View>
            </ScrollView>

            {/* Footer Buttons */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.btn, { borderColor: theme.colors.border, borderWidth: 1.5, marginRight: 12 }]}
                onPress={onClose}
              >
                <Text style={[styles.btnText, { color: theme.colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: theme.colors.primary }]}
                onPress={handleConfirmPress}
              >
                <Text style={[styles.btnText, { color: theme.colors.background, fontWeight: '800' }]}>Confirmar</Text>
              </TouchableOpacity>
            </View>

          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  keyboardContainer: {
    width: '100%',
    maxWidth: 440,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    padding: 10,
    borderRadius: 10,
    gap: 6,
    marginBottom: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  scrollContent: {
    maxHeight: 380,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    marginTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 16,
  },
  btn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
