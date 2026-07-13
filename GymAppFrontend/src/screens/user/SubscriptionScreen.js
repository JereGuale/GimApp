import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { SubscriptionAPI, SubscriptionPlanAPI } from '../../services/subscriptionService';
import SubscriptionStatusBadge from '../../components/SubscriptionStatusBadge';
import ReceiptUploader from '../../components/ReceiptUploader';
import AuthModal from '../../components/AuthModal';
import { useNavigation } from '@react-navigation/native';
import { useResponsive } from '../../hooks/useResponsive';


export default function SubscriptionScreen() {
  const { theme } = useTheme();
  const { isSmallScreen } = useResponsive();
  const navigation = useNavigation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [pendingPlan, setPendingPlan] = useState(null);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);

  // Suscripción existente
  const [existingSub, setExistingSub] = useState(null);
  const [loadingSub, setLoadingSub] = useState(true);
  
  // Planes dinámicos
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    fetchPlans();
    if (user) {
      fetchExistingSubscription();
    } else {
      setLoadingSub(false);
    }
  }, [user]);

  const fetchExistingSubscription = async () => {
    setLoadingSub(true);
    const result = await SubscriptionAPI.getMySubscription();
    if (result.success && result.data && ['active', 'pending'].includes(result.data.status)) {
      setExistingSub(result.data);
    } else {
      setExistingSub(null);
    }
    setLoadingSub(false);
  };

  const fetchPlans = async () => {
    setLoadingPlans(true);
    const result = await SubscriptionPlanAPI.getPlans();
    if (result.success && Array.isArray(result.data)) {
      setPlans(result.data);
    } else {
      setPlans([]);
    }
    setLoadingPlans(false);
  };

  const handlePlanPress = (plan) => {
    if (!user) {
      setPendingPlan(plan);
      setAuthModalVisible(true);
      return;
    }
    // Validar si ya tiene suscripción activa o pendiente
    if (existingSub) {
      const statusLabel = existingSub.status === 'active' ? 'activa' : 'pendiente de aprobación';
      Alert.alert(
        'Suscripción existente',
        `Ya tienes una suscripción ${statusLabel} (${existingSub.plan?.name || 'Plan actual'}). No puedes suscribirte a otro plan hasta que termine tu periodo.`,
        [{ text: 'Entendido' }]
      );
      return;
    }
    // Solo transferencia bancaria: ir directo al uploader
    setSelectedPlan(plan);
    setReceiptModalVisible(true);
  };

  const handleAuthSuccess = () => {
    setAuthModalVisible(false);
    if (pendingPlan) {
      const planToOpen = pendingPlan;
      setPendingPlan(null);
      setTimeout(() => {
        fetchExistingSubscription().then(() => {
          setSelectedPlan(planToOpen);
          setReceiptModalVisible(true);
        });
      }, 450);
    }
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
      let subscriptionId = null;

      // Primero verificar si ya tiene una suscripción pendiente
      const mySubResult = await SubscriptionAPI.getMySubscription();
      if (mySubResult.success && mySubResult.data && mySubResult.data.status === 'pending' && mySubResult.data.payment_method === 'transfer') {
        // Ya tiene una suscripción pendiente, usar esa
        subscriptionId = mySubResult.data.id;
        console.log('[ReceiptUpload] Using existing pending subscription:', subscriptionId);
      } else {
        // Crear nueva suscripción
        const createResult = await SubscriptionAPI.createSubscription(
          selectedPlan.id,
          'transfer'
        );

        if (!createResult.success) {
          Alert.alert('Error', createResult.error || 'No se pudo crear la suscripción');
          return;
        }
        subscriptionId = createResult.data.id;
        console.log('[ReceiptUpload] Created new subscription:', subscriptionId);
      }

      console.log('[ReceiptUpload] Uploading receipt for subscription:', subscriptionId, 'image URI:', imageAsset.uri);

      const uploadResult = await SubscriptionAPI.uploadReceipt(
        subscriptionId,
        imageAsset.uri
      );

      console.log('[ReceiptUpload] Upload result:', uploadResult);

      if (uploadResult.success) {
        Alert.alert(
          '¡Comprobante enviado con éxito!',
          'Tu suscripción está en estado PENDIENTE. Un administrador revisará tu comprobante y aprobará tu suscripción. Te notificaremos cuando sea activada.',
          [{ text: 'Ir a mi perfil', onPress: () => navigation.navigate('Profile') }]
        );
        setReceiptModalVisible(false);
        setSelectedPlan(null);
        fetchExistingSubscription();
      } else {
        Alert.alert('Error', uploadResult.error || 'No se pudo subir el comprobante');
      }
    } catch (error) {
      console.error('[ReceiptUpload] Unexpected error:', error);
      Alert.alert('Error', 'Ocurrió un error al subir el comprobante');
    }
  };

  // Renderizar banner de suscripción existente
  const renderExistingSubscriptionBanner = () => {
    if (!existingSub) return null;

    const isActive = existingSub.status === 'active';
    const isPending = existingSub.status === 'pending';
    const bannerColor = isActive ? '#10B981' : '#F59E0B';
    const bgColor = isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)';

    return (
      <View style={[styles.existingSubBanner, { backgroundColor: theme.isDark ? (isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)') : bgColor, borderColor: bannerColor }]}>
        <View style={styles.existingSubHeader}>
          <Ionicons name={isActive ? 'checkmark-circle' : 'time'} size={28} color={bannerColor} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.existingSubTitle, { color: theme.colors.text }]}>
              {isActive ? '¡Suscripción Activa!' : 'Suscripción Pendiente'}
            </Text>
            <Text style={[styles.existingSubPlan, { color: bannerColor }]}>
              {existingSub.plan?.name || 'Plan actual'}
            </Text>
          </View>
          <View style={[styles.existingSubBadge, { backgroundColor: bannerColor }]}>
            <Text style={styles.existingSubBadgeText}>
              {isActive ? 'ACTIVA' : 'PENDIENTE'}
            </Text>
          </View>
        </View>

        {isActive && existingSub.ends_at && (
          <View style={styles.existingSubDetail}>
            <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.existingSubDetailText, { color: theme.colors.textSecondary }]}>
              Tu suscripción vence el {new Date(existingSub.ends_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
          </View>
        )}

        {isPending && (
          <View style={styles.existingSubDetail}>
            <Ionicons name="information-circle-outline" size={16} color={theme.isDark ? '#FCD34D' : '#D97706'} />
            <Text style={[styles.existingSubDetailText, { color: theme.isDark ? '#FCD34D' : '#D97706' }]}>
              Tu comprobante está siendo revisado por un administrador. Te notificaremos cuando tu suscripción sea aprobada.
            </Text>
          </View>
        )}

        <View style={styles.existingSubDetail}>
          <Ionicons name="cash-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.existingSubDetailText, { color: theme.colors.textSecondary }]}>
            Precio: ${existingSub.price ? Number(existingSub.price).toFixed(2) : '—'} | Método: {existingSub.payment_method === 'transfer' ? 'Transferencia' : existingSub.payment_method === 'card' ? 'Tarjeta' : existingSub.payment_method}
          </Text>
        </View>

        <Text style={[styles.existingSubNote, { color: theme.colors.textSecondary }]}>
          Podrás elegir un nuevo plan cuando termine tu periodo actual.
        </Text>
      </View>
    );
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

        {loadingSub ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <>
            {renderExistingSubscriptionBanner()}

            <View style={!isSmallScreen ? styles.plansWebRow : styles.plansMobileCol}>
              {plans.map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.planCard,
                    { backgroundColor: theme.isDark ? theme.colors.surface : '#FFFFFF', borderColor: plan.color || '#22D3EE' },
                    !isSmallScreen && { flex: 1, marginHorizontal: 12 },
                    existingSub && { opacity: 0.5 }
                  ]}
                  onPress={() => handlePlanPress(plan)}
                  activeOpacity={existingSub ? 1 : 0.85}
                  disabled={!!existingSub}
                >
                  {(plan.is_best_value || plan.badge) && (
                    <View style={[styles.badge, { backgroundColor: plan.color || '#22D3EE' }]}>
                      <Text style={styles.badgeText}>{plan.badge || 'RECOMENDADO'}</Text>
                    </View>
                  )}

                  <View style={styles.planHeader}>
                    <View style={styles.planInfo}>
                      <View style={styles.titleRow}>
                        <Text style={[styles.planName, { color: theme.colors.text }]}>
                          {plan.name}
                        </Text>
                        <View style={[styles.smallIconBox, { backgroundColor: (plan.color || '#22D3EE') + '1A' }]}>
                          <Ionicons name={plan.icon || 'barbell-outline'} size={20} color={plan.color || '#22D3EE'} />
                        </View>
                      </View>
                      <Text style={[styles.planPrice, { color: plan.color || '#22D3EE' }]}>
                        <Text style={styles.priceBig}>${parseFloat(plan.price || 0).toFixed(2)}</Text>
                        <Text style={styles.priceSmall}>/{plan.duration === 'monthly' ? 'mes' : (plan.duration || 'mes')}</Text>
                      </Text>
                    </View>
                  </View>

                  <View style={styles.features}>
                    {Array.isArray(plan.features) ? plan.features.map((feature, index) => {
                      const isString = typeof feature === 'string';
                      const iconName = isString ? 'checkmark-circle-outline' : (feature.icon || 'checkmark-circle-outline');
                      const textVal = isString ? feature : feature.text;
                      return (
                        <View key={index} style={styles.featureRow}>
                          <Ionicons name={iconName} size={16} color={plan.color || '#22D3EE'} />
                          <Text style={[styles.featureText, { color: theme.colors.textSecondary || '#6B7280' }]}>
                            {textVal}
                          </Text>
                        </View>
                      );
                    }) : null}
                  </View>

                  <View style={[styles.planButton, { backgroundColor: existingSub ? '#9CA3AF' : (plan.color || '#22D3EE') }]}>
                    <Text style={styles.planButtonText}>
                      {existingSub ? 'NO DISPONIBLE' : `ELEGIR ${plan.name.toUpperCase()}`}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Modals */}

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

      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
        onSuccess={handleAuthSuccess}
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
  },
  existingSubBanner: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 20,
    marginBottom: 24,
  },
  existingSubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  existingSubTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  existingSubPlan: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  existingSubBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  existingSubBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  existingSubDetail: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  existingSubDetailText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },
  existingSubNote: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  }
});
