import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_W } = Dimensions.get('window');

/**
 * CustomAlertModal
 * Modal flotante estilizado con diseño premium para alertas y confirmaciones del sistema.
 */
export default function CustomAlertModal({ 
  visible, 
  title, 
  message, 
  onClose, 
  showCancel = false, 
  onConfirm = null, 
  confirmText = 'Aceptar', 
  cancelText = 'Cancelar',
  isDestructive = false,
  type = 'warning' // 'warning', 'error', 'success', 'info', 'question'
}) {
  const { theme } = useTheme();

  // Configuración de icono, colores y acentos según el tipo
  let iconName = 'alert-circle';
  let iconColor = '#EF4444';
  let iconBg = 'rgba(239, 68, 68, 0.15)';
  let iconBorder = 'rgba(239, 68, 68, 0.3)';
  let primaryBtnBg = isDestructive ? '#EF4444' : '#5B3DF5';

  if (type === 'success') {
    iconName = 'checkmark-circle';
    iconColor = '#10B981';
    iconBg = 'rgba(16, 185, 129, 0.15)';
    iconBorder = 'rgba(16, 185, 129, 0.3)';
    primaryBtnBg = '#10B981';
  } else if (type === 'info') {
    iconName = 'information-circle';
    iconColor = '#3B82F6';
    iconBg = 'rgba(59, 130, 246, 0.15)';
    iconBorder = 'rgba(59, 130, 246, 0.3)';
    primaryBtnBg = '#3B82F6';
  } else if (type === 'question') {
    iconName = 'help-circle';
    iconColor = '#5B3DF5';
    iconBg = 'rgba(91, 61, 245, 0.15)';
    iconBorder = 'rgba(91, 61, 245, 0.3)';
    primaryBtnBg = '#5B3DF5';
  } else if (type === 'warning' || type === 'error') {
    iconName = 'warning';
    iconColor = '#EF4444';
    iconBg = 'rgba(239, 68, 68, 0.15)';
    iconBorder = 'rgba(239, 68, 68, 0.3)';
    primaryBtnBg = isDestructive ? '#EF4444' : '#5B3DF5';
  }

  const isDark = theme.isDark;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          activeOpacity={1} 
          onPress={onClose} 
        />
        
        <View style={[
          styles.card, 
          { 
            backgroundColor: isDark ? '#161B26' : '#FFFFFF', 
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)' 
          }
        ]}>
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: iconBg, borderColor: iconBorder }]}>
              <Ionicons name={iconName} size={30} color={iconColor} />
            </View>
            <Text style={[styles.title, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
              {title || (showCancel ? 'Confirmación' : 'Aviso')}
            </Text>
          </View>
          
          <Text style={[styles.message, { color: isDark ? '#94A3B8' : '#475569' }]}>
            {message}
          </Text>
          
          <View style={styles.btnRow}>
            {showCancel && (
              <TouchableOpacity 
                style={[
                  styles.btn, 
                  styles.btnSecondary, 
                  { 
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F1F5F9'
                  }
                ]} 
                onPress={onClose} 
                activeOpacity={0.8}
              >
                <Text style={[styles.btnTextSecondary, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  {cancelText}
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[
                styles.btn, 
                styles.btnPrimary,
                { 
                  backgroundColor: primaryBtnBg, 
                }
              ]} 
              onPress={onConfirm ? onConfirm : onClose} 
              activeOpacity={0.85}
            >
              <Text style={styles.btnTextPrimary}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  header: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 14.5,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 6,
  },
  btnRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  btnSecondary: {
    borderWidth: 1.5,
  },
  btnPrimary: {
    shadowColor: '#5B3DF5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  btnTextPrimary: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  btnTextSecondary: {
    fontSize: 15,
    fontWeight: '700',
  },
});
