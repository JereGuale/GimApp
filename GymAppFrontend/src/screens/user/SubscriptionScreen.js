import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { SubscriptionAPI, SubscriptionPlanAPI } from '../../services/subscriptionService';
import SubscriptionStatusBadge from '../../components/SubscriptionStatusBadge';
import ReceiptUploader from '../../components/ReceiptUploader';
import AuthModal from '../../components/AuthModal';
import OrderConfirmationModal from '../../components/OrderConfirmationModal';
import CustomAlertModal from '../../components/CustomAlertModal';
import { useNavigation } from '@react-navigation/native';
import { useResponsive } from '../../hooks/useResponsive';
import BillingModal from '../../components/BillingModal';
import { ProfileAPI } from '../../services/notificationService';

const getPlanCategory = (planName) => {
  const name = planName.toLowerCase();
  if (name.includes('estudiantil') || name.includes('student')) return 'FLEXIBILIDAD';
  if (name.includes('elite') || name.includes('premium')) return 'EXPERIENCIA PREMIUM';
  return 'ESTÁNDAR';
};

export default function SubscriptionScreen() {
  const { theme } = useTheme();
  const { isSmallScreen } = useResponsive();
  const navigation = useNavigation();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [pendingPlan, setPendingPlan] = useState(null);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [billingModalVisible, setBillingModalVisible] = useState(false);
  const [confirmedBilling, setConfirmedBilling] = useState(null);

  // Custom Alert State
  const [customAlert, setCustomAlert] = React.useState({ visible: false, title: '', message: '' });

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
      setCustomAlert({
        visible: true,
        title: 'Suscripción existente',
        message: `Ya tienes una suscripción ${statusLabel} (${existingSub.plan?.name || 'Plan actual'}). No puedes suscribirte a otro plan hasta que termine tu periodo.`
      });
      return;
    }
    // Abrir confirmación de facturación antes del comprobante
    setSelectedPlan(plan);
    const hasBilling = user?.billing_id_number && user?.billing_city && user?.billing_address;
    if (hasBilling) {
      setConfirmedBilling({
        billing_name: user.name,
        billing_email: user.email,
        billing_phone: user.phone,
        billing_id_number: user.billing_id_number,
        billing_city: user.billing_city,
        billing_address: user.billing_address
      });
      setReceiptModalVisible(true);
    } else {
      setBillingModalVisible(true);
    }
  };

  const handleAuthSuccess = () => {
    setAuthModalVisible(false);
    if (pendingPlan) {
      const planToOpen = pendingPlan;
      setPendingPlan(null);
      setTimeout(() => {
        fetchExistingSubscription().then(() => {
          setSelectedPlan(planToOpen);
          const hasBilling = user?.billing_id_number && user?.billing_city && user?.billing_address;
          if (hasBilling) {
            setConfirmedBilling({
              billing_name: user.name,
              billing_email: user.email,
              billing_phone: user.phone,
              billing_id_number: user.billing_id_number,
              billing_city: user.billing_city,
              billing_address: user.billing_address
            });
            setReceiptModalVisible(true);
          } else {
            setBillingModalVisible(true);
          }
        });
      }, 450);
    }
  };

  const handleConfirmBilling = async (billingData) => {
    setConfirmedBilling(billingData);
    setBillingModalVisible(false);
    
    // Guardar en el perfil del usuario para no volver a pedírselo en el futuro
    try {
      const result = await ProfileAPI.updateProfile({
        billing_id_number: billingData.billing_id_number,
        billing_city: billingData.billing_city,
        billing_address: billingData.billing_address
      });
      if (result.success && updateUser) {
        updateUser({
          ...user,
          billing_id_number: billingData.billing_id_number,
          billing_city: billingData.billing_city,
          billing_address: billingData.billing_address
        });
      }
    } catch (e) {
      console.log('[SubscriptionScreen] Error saving billing data to profile:', e);
    }

    setTimeout(() => {
      setReceiptModalVisible(true);
    }, 450);
  };



  const showAlert = (title, message) => {
    setCustomAlert({ visible: true, title, message });
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
        // Crear nueva suscripción con datos de facturación
        const createResult = await SubscriptionAPI.createSubscription(
          selectedPlan.id,
          'transfer',
          {},
          confirmedBilling
        );

        if (!createResult.success) {
          showAlert('Error', createResult.error || 'No se pudo crear la suscripción');
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
        setReceiptModalVisible(false);
        setSelectedPlan(null);
        fetchExistingSubscription();
        setConfirmModalVisible(true);
      } else {
        showAlert('Error', uploadResult.error || 'No se pudo subir el comprobante');
      }
    } catch (error) {
      console.error('[ReceiptUpload] Unexpected error:', error);
      showAlert('Error', 'Ocurrió un error al subir el comprobante');
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

  // Sort plans by price
  const sortedPlans = [...plans]
    .sort((a, b) => parseFloat(a.price || 0) - parseFloat(b.price || 0));

  const mappedPlans = sortedPlans.map((plan) => {
    let category = 'ESTÁNDAR';
    const nameLower = (plan.name || '').toLowerCase();
    if (nameLower.includes('estudiantil') || nameLower.includes('flex')) category = 'FLEXIBILIDAD';
    else if (nameLower.includes('elite') || nameLower.includes('premium')) category = 'EXPERIENCIA PREMIUM';

    let featuresList = [];
    if (Array.isArray(plan.features)) {
      featuresList = plan.features;
    } else if (typeof plan.features === 'string') {
      try {
        const parsed = JSON.parse(plan.features);
        featuresList = Array.isArray(parsed) ? parsed : [plan.features];
      } catch (e) {
        featuresList = [plan.features];
      }
    }

    if (featuresList.length === 0 && plan.description) {
      featuresList = [plan.description];
    }

    let badge = null;
    if (plan.is_best_value) badge = 'MÁS POPULAR';
    else if (category === 'EXPERIENCIA PREMIUM') badge = 'PREMIUM';

    const accentColor = plan.color || (category === 'FLEXIBILIDAD' ? '#00C2FF' : category === 'EXPERIENCIA PREMIUM' ? '#5B3DF5' : '#F97316');

    return {
      ...plan,
      displayName: plan.name,
      displayPrice: plan.price ? Number(plan.price).toFixed(0) : '0',
      category: category,
      accentColor: accentColor,
      badge: badge,
      description: plan.description || '',
      features: featuresList
    };
  });

  const screenBg = theme.isDark ? '#090D16' : '#FFFFFF';
  const textMain = theme.isDark ? '#F3F4F6' : '#111827';
  const textMuted = theme.isDark ? '#9CA3AF' : '#6B7280';
  const cardBg = theme.isDark ? '#111827' : '#FFFFFF';
  const cardBorder = theme.isDark ? '#1F2937' : '#E2E8F0';
  const bentoBg = theme.isDark ? '#111827' : '#F9FAFB';

  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  const CARD_WIDTH_MOBILE = SCREEN_WIDTH * 0.88;
  const CARD_WIDTH_DESKTOP = 380;

  return (
    <View style={[styles.container, { backgroundColor: screenBg }]}>
      {/* TopAppBar */}
      <View style={[styles.header, { borderBottomColor: theme.isDark ? '#1F2937' : '#F3F4F6', backgroundColor: screenBg }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={textMain} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textMain }]}>Suscripciones</Text>
        <TouchableOpacity style={styles.helpButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="help-circle-outline" size={24} color={textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={[styles.heroTitle, { color: textMain }]}>
            Elige tu nivel de entrenamiento
          </Text>
          <Text style={[styles.heroSubtitle, { color: textMuted }]}>
            Planes diseñados para superar tus límites con la mejor tecnología fitness.
          </Text>
        </View>

        {loadingSub || loadingPlans ? (
          <View style={{ alignItems: 'center', paddingVertical: 80 }}>
            <ActivityIndicator size="large" color="#5B3DF5" />
          </View>
        ) : (
          <>
            {renderExistingSubscriptionBanner()}

            <ScrollView
              horizontal={isSmallScreen}
              showsHorizontalScrollIndicator={false}
              snapToInterval={isSmallScreen ? (CARD_WIDTH_MOBILE + 20) : null}
              snapToAlignment="center"
              decelerationRate="fast"
              contentContainerStyle={!isSmallScreen ? styles.plansWebRow : styles.plansMobileColHorizontal}
              style={isSmallScreen ? { marginHorizontal: -16, marginBottom: 32 } : null}
            >
              {mappedPlans.map((plan) => {
                const isElite = plan.badge === 'PREMIUM';
                const cardColor = plan.accentColor;

                const cardContent = (
                  <View style={[
                    styles.planCardInner,
                    { backgroundColor: cardBg },
                    existingSub && { opacity: 0.6 }
                  ]}>
                    {/* Badge header */}
                    {plan.badge && (
                      <View style={[styles.badge, { backgroundColor: cardColor }]}>
                        {isElite && <Ionicons name="star" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />}
                        <Text style={styles.badgeText}>{plan.badge}</Text>
                      </View>
                    )}

                    <View>
                      <Text style={[styles.planCategory, { color: cardColor }]}>
                        {plan.category}
                      </Text>
                      <Text style={[styles.planName, { color: textMain }]}>
                        {plan.displayName}
                      </Text>
                      <Text style={[styles.planDesc, { color: textMuted }]}>
                        {plan.description}
                      </Text>
                    </View>

                    <View style={styles.priceContainer}>
                      <Text style={[styles.priceBig, { color: textMain }]}>
                        ${plan.displayPrice}
                      </Text>
                      <Text style={[styles.priceSmall, { color: textMuted }]}>/mes</Text>
                    </View>

                    <View style={styles.features}>
                      {plan.features.map((feature, index) => {
                        const isFirstEliteFeature = isElite && index === 0;
                        return (
                          <View key={index} style={styles.featureRow}>
                            <Ionicons
                              name={isFirstEliteFeature ? 'star' : 'checkmark-sharp'}
                              size={18}
                              color={cardColor}
                            />
                            <Text style={[
                              styles.featureText,
                              { color: textMain },
                              isFirstEliteFeature && { fontWeight: '700' }
                            ]}>
                              {feature}
                            </Text>
                          </View>
                        );
                      })}
                    </View>

                    <TouchableOpacity
                      style={
                        existingSub
                          ? [styles.planButton, { backgroundColor: '#9CA3AF' }]
                          : [styles.planButton, { backgroundColor: cardColor }]
                      }
                      onPress={() => handlePlanPress(plan)}
                      activeOpacity={existingSub ? 1 : 0.8}
                      disabled={!!existingSub}
                    >
                      <Text style={styles.planButtonText}>
                        {existingSub ? 'NO DISPONIBLE' : isElite ? 'Suscribirse Ahora' : 'Seleccionar'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );

                if (isElite) {
                  return (
                    <View key={plan.id} style={[styles.cardOuter, isSmallScreen ? { width: CARD_WIDTH_MOBILE } : { width: CARD_WIDTH_DESKTOP, marginHorizontal: 12 }]}>
                      <LinearGradient
                        colors={['#5B3DF5', '#00C2FF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.eliteCardGradient}
                      >
                        {cardContent}
                      </LinearGradient>
                    </View>
                  );
                }

                return (
                  <View key={plan.id} style={[styles.cardOuter, isSmallScreen ? { width: CARD_WIDTH_MOBILE } : { width: CARD_WIDTH_DESKTOP, marginHorizontal: 12 }]}>
                    <View style={[styles.standardCardBorder, { borderColor: cardBorder, backgroundColor: cardBg }]}>
                      {cardContent}
                    </View>
                  </View>
                );
              })}
            </ScrollView>


          </>
        )}
      </ScrollView>

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

      <OrderConfirmationModal
        visible={confirmModalVisible}
        type="subscription"
        onClose={() => { setConfirmModalVisible(false); navigation.navigate('Perfil'); }}
        onGoToOrders={() => { setConfirmModalVisible(false); navigation.navigate('Perfil'); }}
      />

      <CustomAlertModal
        visible={customAlert.visible}
        title={customAlert.title}
        message={customAlert.message}
        onClose={() => setCustomAlert({ ...customAlert, visible: false })}
      />

      <BillingModal
        visible={billingModalVisible}
        onClose={() => setBillingModalVisible(false)}
        onConfirm={handleConfirmBilling}
        initialData={user}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    height: 64,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    borderRadius: 99,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  helpButton: {
    padding: 8,
    borderRadius: 99,
  },
  content: {
    padding: 24,
    paddingBottom: 140,
  },
  heroSection: {
    alignItems: 'center',
    textAlign: 'center',
    marginVertical: 32,
    paddingHorizontal: 16,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  heroSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
    maxWidth: 480,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  plansWebRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginVertical: 16,
  },
  plansMobileColHorizontal: {
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  cardOuter: {
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 3,
  },
  eliteCardGradient: {
    padding: 2,
    borderRadius: 28,
  },
  standardCardBorder: {
    borderWidth: 1,
    borderRadius: 28,
  },
  planCardInner: {
    borderRadius: 26,
    paddingHorizontal: 32,
    paddingVertical: 40,
    height: 560,
    justifyContent: 'space-between',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -14,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 99,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  planCategory: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  planName: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  planDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 10,
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 16,
  },
  priceBig: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  priceSmall: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  features: {
    gap: 12,
    marginVertical: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    marginLeft: 12,
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  planButton: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  planButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  bentoSection: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 32,
    marginBottom: 32,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  bentoCard: {
    flex: 1,
    height: 120,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  bentoText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  existingSubBanner: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    marginBottom: 32,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  existingSubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  existingSubTitle: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  existingSubPlan: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  existingSubBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
  },
  existingSubBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  existingSubDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  existingSubDetailText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  existingSubNote: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  }
});
