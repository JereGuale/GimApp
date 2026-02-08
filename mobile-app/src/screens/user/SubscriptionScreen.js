import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { SubscriptionAPI, SubscriptionPlanAPI } from '../../services/subscriptionService';
import SubscriptionStatusBadge from '../../components/SubscriptionStatusBadge';
import PaymentMethodModal from '../../components/PaymentMethodModal';
import CardPaymentForm from '../../components/CardPaymentForm';
import ReceiptUploader from '../../components/ReceiptUploader';

export default function SubscriptionScreen() {
  const { theme } = useTheme();
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
      name: 'Plan Basico',
      price: 12.99,
      color: '#22D3EE',
      icon: 'barbell-outline',
      features: [
        { icon: 'home-outline', text: 'Acceso al gym' },
        { icon: 'fitness-outline', text: 'Rutinas básicas' },
        { icon: 'chatbubble-outline', text: 'Soporte por chat' }
      ]
    },
    {
      id: 2,
      name: 'Plan Pro',
      price: 24.99,
      color: '#FB923C',
      icon: 'body-outline',
      badge: 'POPULAR',
      features: [
        { icon: 'lock-open-outline', text: 'Acceso total' },
        { icon: 'flash-outline', text: 'Rutinas avanzadas' },
        { icon: 'calendar-outline', text: 'Seguimiento semanal' },
        { icon: 'gift-outline', text: 'Oferta Carnaval!' }
      ]
    },
    {
      id: 3,
      name: 'Plan Elite',
      price: 39.99,
      color: '#A78BFA',
      icon: 'trophy-outline',
      features: [
        { icon: 'star-outline', text: 'Acceso VIP' },
        { icon: 'people-outline', text: 'Entrenador personal' },
        { icon: 'nutrition-outline', text: 'Nutrición guiada' }
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
        Alert.alert('¡Éxito!', 'Suscripción activada exitosamente');
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
        Alert.alert('¡Comprobante Enviado!', 'Esperando aprobación del administrador');
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

        {plans.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[styles.planCard, { borderColor: plan.color }]}
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
                <Text style={[styles.planName, { color: theme.colors.text }]}>
                  {plan.name}
                </Text>
                <Text style={[styles.planPrice, { color: plan.color }]}>
                  ${plan.price.toFixed(2)}/mes
                </Text>
              </View>
              <View style={[styles.iconBox, { borderColor: plan.color }]}>
                <Ionicons name={plan.icon} size={40} color={plan.color} />
              </View>
            </View>

            <View style={styles.features}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Ionicons name={feature.icon} size={16} color={plan.color} />
                  <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>
                    {feature.text}
                  </Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}
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
  planCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 2,
    padding: 18,
    marginBottom: 16,
    position: 'relative'
  },
  badge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    transform: [{ rotate: '8deg' }]
  },
  badgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20
  },
  planInfo: {
    flex: 1
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '700'
  },
  iconBox: {
    width: 70,
    height: 70,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  features: {
    gap: 12
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  featureText: {
    fontSize: 13,
    flex: 1
  }
});
