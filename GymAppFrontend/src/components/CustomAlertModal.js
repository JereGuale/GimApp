import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_W } = Dimensions.get('window');

/**
 * CustomAlertModal
 * Modal flotante personalizado para reemplazar las alertas del sistema (Alert.alert / window.alert/confirm).
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
  type = 'warning' // 'warning', 'success', 'info', 'question'
}) {
  const { theme } = useTheme();

  // Choice of icon and color accent
  let iconName = 'warning';
  let iconColor = '#EF4444';
  let iconBg = 'rgba(239, 68, 68, 0.12)';

  if (type === 'success') {
    iconName = 'checkmark-circle';
    iconColor = '#10B981';
    iconBg = 'rgba(16, 185, 129, 0.12)';
  } else if (type === 'info') {
    iconName = 'information-circle';
    iconColor = '#3B82F6';
    iconBg = 'rgba(59, 130, 246, 0.12)';
  } else if (type === 'question') {
    iconName = 'help-circle';
    iconColor = '#FB923C';
    iconBg = 'rgba(251, 146, 60, 0.12)';
  }

  const confirmBtnBg = isDestructive ? '#EF4444' : '#FB923C';

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
            backgroundColor: theme.colors.card, 
            borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' 
          }
        ]}>
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
              <Ionicons name={iconName} size={26} color={iconColor} />
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {title || (showCancel ? 'Confirmación' : 'Alerta')}
            </Text>
          </View>
          
          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
            {message}
          </Text>
          
          <View style={[styles.btnRow, showCancel && styles.btnRowSplit]}>
            {showCancel && (
              <TouchableOpacity 
                style={[
                  styles.btn, 
                  styles.btnSecondary, 
                  { borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)' }
                ]} 
                onPress={onClose} 
                activeOpacity={0.8}
              >
                <Text style={[styles.btnTextSecondary, { color: theme.colors.textSecondary }]}>
                  {cancelText}
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[
                styles.btn, 
                { 
                  backgroundColor: confirmBtnBg, 
                  flex: showCancel ? 1 : 0, 
                  width: showCancel ? 'auto' : '100%' 
                }
              ]} 
              onPress={onConfirm ? onConfirm : onClose} 
              activeOpacity={0.8}
            >
              <Text style={[styles.btnText, { color: isDestructive ? '#FFFFFF' : '#000000' }]}>
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  card: {
    width: Math.min(SCREEN_W - 40, 340),
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    fontSize: 14.5,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  btnRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  btnRowSplit: {
    gap: 12,
  },
  btn: {
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  btnSecondary: {
    flex: 1,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  btnTextSecondary: {
    fontSize: 14,
    fontWeight: '700',
  },
});
