import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { SubscriptionAPI, SubscriptionPlanAPI } from '../../services/subscriptionService';
import SubscriptionStatusBadge from '../../components/SubscriptionStatusBadge';
import PaymentMethodModal from '../../components/PaymentMethodModal';
import CardPaymentForm from '../../components/CardPaymentForm';
import ReceiptUploader from '../../components/ReceiptUploader';
import { useNavigation } from '@react-navigation/native';
import { useResponsive } from '../../hooks/useResponsive';


export default function SubscriptionScreen() {
  const { theme } = useTheme();
  const { isSmallScreen } = useResponsive();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [cardFormVisible, setCardFormVisible] = useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);

  const plans = [
    {
      id: 1,
      name: 'Plan Estudiantil',
      price: 20.00,
      color: '#22D3EE',
      icon: 'school-outline',
      features: [
        { icon: 'id-card-outline', text: 'Presentando carnet estudiantil vigente' },
        { icon: 'fitness-outline', text: 'Acceso total al gimnasio por 30 días' },
        { icon: 'barbell-outline', text: 'Uso de todas las máquinas y pesas' },
        { icon: 'time-outline', text: 'Horario libre sin restricciones' }
      ]
    },
    {
      id: 2,
      name: 'Plan Standar',
      price: 25.00,
      color: '#FB923C',
      icon: 'person-outline',
      badge: 'NORMAL',
      features: [
        { icon: 'barbell-outline', text: 'El plan ideal para tu rutina diaria' },
        { icon: 'fitness-outline', text: 'Acceso a todas las máquinas por 30 días' },
        { icon: 'water-outline', text: 'Uso de áreas comunes y vestidores' },
        { icon: 'chatbubble-outline', text: 'Soporte de entrenadores en piso' }
      ]
    },
    {
      id: 3,
      name: 'Plan Duo',
      price: 34.00,
      color: '#A78BFA',
      icon: 'people-outline',
      badge: 'PROMO',
      features: [
        { icon: 'people-circle-outline', text: 'Promoción especial para 2 personas' },
        { icon: 'flash-outline', text: 'Acceso completo para ti y un amigo por 30 días' },
        { icon: 'lock-open-outline', text: 'Uso de todas las áreas e instalaciones' },
        { icon: 'heart-outline', text: '¡Entrena mejor acompañado y ahorra!' }
      ]
    }
  ];

  const handlePlanPress = (plan) => {
    setSelectedPlan(plan);
    setPaymentModalVisible(true);
  };

  const handlePaymentMethodSelect = (method) => {
    setPaymentModalVisible(false);
    if (method === 'card') {
      setCardFormVisible(true);
    } else if (method === 'transfer') {
      setReceiptModalVisible(true);
    }
  };

  const handleCardPayment = async (cardData) => {
    try {
      const result = await SubscriptionAPI.createSubscription(
        selectedPlan.id,
        'card',
        cardData
      );

      if (result.success) {
        Alert.alert(
          '¡Suscripción adquirida exitosamente!',
          'Tu suscripción ha sido activada inmediatamente.',
          [{ text: 'Aceptar', onPress: () => navigation.navigate('Profile') }]
        );
        setCardFormVisible(false);
        setSelectedPlan(null);
      } else {
        Alert.alert('Error', result.error || 'No se pudo procesar el pago');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al procesar el pago');
    }
  };

  const handleReceiptUpload = async (imageAsset) => {
    try {
      const createResult = await SubscriptionAPI.createSubscription(
        selectedPlan.id,
        'transfer'
      );

      if (!createResult.success) {
        Alert.alert('Error', createResult.error || 'No se pudo crear la suscripción');
        return;
      }

      const uploadResult = await SubscriptionAPI.uploadReceipt(
        createResult.data.id,
        imageAsset.uri
      );

      if (uploadResult.success) {
        Alert.alert(
          '¡Comprobante enviado con éxito!',
          'Tu solicitud será revisada por un administrador. Te notificaremos cuando sea aprobada.',
          [{ text: 'Aceptar', onPress: () => navigation.navigate('Profile') }]
        );
        setReceiptModalVisible(false);
        setSelectedPlan(null);
      } else {
        Alert.alert('Error', uploadResult.error || 'No se pudo subir el comprobante');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al subir el comprobante');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>Suscripciones</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Elige el plan ideal para tu progreso
        </Text>

        <View style={!isSmallScreen ? styles.plansWebRow : styles.plansMobileCol}>
          {plans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                { backgroundColor: theme.isDark ? theme.colors.surface : '#FFFFFF', borderColor: plan.color },
                !isSmallScreen && { flex: 1, marginHorizontal: 12 }
              ]}
              onPress={() => handlePlanPress(plan)}
              activeOpacity={0.85}
            >
              {plan.badge && (
                <View style={[styles.badge, { backgroundColor: plan.color }]}>
                  <Text style={styles.badgeText}>{plan.badge}</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <View style={styles.planInfo}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.planName, { color: theme.colors.text }]}>
                      {plan.name}
                    </Text>
                    <View style={[styles.smallIconBox, { backgroundColor: plan.color + '1A' }]}>
                      <Ionicons name={plan.icon} size={20} color={plan.color} />
                    </View>
                  </View>
                  <Text style={[styles.planPrice, { color: plan.color }]}>
                    <Text style={styles.priceBig}>${plan.price.toFixed(2)}</Text>
                    <Text style={styles.priceSmall}>/mes</Text>
                  </Text>
                </View>
              </View>

              <View style={styles.features}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Ionicons name={feature.icon} size={16} color={plan.color} />
                    <Text style={[styles.featureText, { color: theme.colors.textSecondary || '#6B7280' }]}>
                      {feature.text}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={[styles.planButton, { backgroundColor: plan.color }]}>
                <Text style={styles.planButtonText}>ELEGIR {plan.name.toUpperCase()}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Payment Modals */}
      <PaymentMethodModal
        visible={paymentModalVisible}
        onClose={() => setPaymentModalVisible(false)}
        onSelectMethod={handlePaymentMethodSelect}
        plan={selectedPlan}
      />

      <CardPaymentForm
        visible={cardFormVisible}
        onClose={() => setCardFormVisible(false)}
        onSubmit={handleCardPayment}
        plan={selectedPlan}
      />

      <ReceiptUploader
        visible={receiptModalVisible}
        onClose={() => setReceiptModalVisible(false)}
        onUpload={handleReceiptUpload}
        bankDetails={{
          bank: 'Banco Nacional',
          account: '1234-5678-9012-3456',
          holder: 'Gimnasio Elite S.A.'
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    padding: 16,
    paddingBottom: 100
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24
  },
  plansWebRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: -12,
  },
  plansMobileCol: {
    flexDirection: 'column',
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 30,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 400,
    justifyContent: 'space-between',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  badge: {
    position: 'absolute',
    top: -14,
    right: 32,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  planHeader: {
    flexDirection: 'column',
    marginBottom: 24,
  },
  planInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planName: {
    fontSize: 20,
    fontWeight: '800',
  },
  planPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceBig: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1,
  },
  priceSmall: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
    marginLeft: 4,
  },
  smallIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  features: {
    gap: 16,
    flex: 1,
    paddingVertical: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 20,
    fontWeight: '500',
  },
  planButton: {
    marginTop: 24,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  }
});
