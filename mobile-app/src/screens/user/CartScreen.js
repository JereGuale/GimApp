import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, Alert, Dimensions, Animated, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';
import { LinearGradient } from 'expo-linear-gradient';
import { API_URL } from '../../services/api';
import PaymentMethodModal from '../../components/PaymentMethodModal';
import CardPaymentForm from '../../components/CardPaymentForm';
import ReceiptUploader from '../../components/ReceiptUploader';

const BASE_URL = API_URL.replace('/api', '');

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const DRAWER_WIDTH = screenWidth > 400 ? 400 : screenWidth * 0.85;

export default function CartScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { items, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart();

  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Payment Modals State
  const [paymentModalVisible, setPaymentModalVisible] = React.useState(false);
  const [cardFormVisible, setCardFormVisible] = React.useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = React.useState(false);

  // Mock plan for payment modales
  const checkoutPlan = {
    name: 'Pedido del Carrito',
    price: totalPrice || 0
  };

  // Animar apertura
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  }, [fadeAnim, slideAnim]);

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: DRAWER_WIDTH,
        duration: 250,
        useNativeDriver: true,
      })
    ]).start(() => navigation.goBack());
  };

  const handleCheckout = () => {
    if (items.length === 0) return;
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
    // Simulando compra con tarjeta
    setTimeout(() => {
      setCardFormVisible(false);
      clearCart();
      Alert.alert('¡Compra Exitosa!', 'Tu pedido ha sido procesado mediante tarjeta de crédito.', [
        { text: 'OK', onPress: closeDrawer }
      ]);
    }, 1500);
  };

  const handleReceiptUpload = async (imageAsset) => {
    // Simulando subida de comprobante
    setTimeout(() => {
      setReceiptModalVisible(false);
      clearCart();
      Alert.alert(
        '¡Comprobante enviado con éxito!',
        'Tu solicitud será revisada por un administrador. Te notificaremos cuando el pedido sea aprobado.',
        [{ text: 'Aceptar', onPress: closeDrawer }]
      );
    }, 1500);
  };

  const handleRemove = (item) => {
    Alert.alert('Eliminar', `¿Eliminar ${item.product.name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => removeFromCart(item.product.id) }
    ]);
  };

  const getImage = (product) => {
    const rawImage = product.images && product.images.length > 0 ? product.images[0] : product.image;
    if (!rawImage) return null;
    return rawImage.startsWith('http') ? rawImage : `${BASE_URL}/storage/${rawImage}`;
  };

  const renderItem = ({ item }) => {
    const img = getImage(item.product);
    return (
      <View style={[styles.cartItem, { backgroundColor: theme.colors.surface, borderColor: theme.isDark ? '#374151' : '#E5E7EB' }]}>
        {/* Product image */}
        <View style={styles.itemImageWrap}>
          {img ? (
            <Image source={{ uri: img }} style={styles.itemImage} resizeMode="cover" />
          ) : (
            <View style={[styles.itemImageFallback, { backgroundColor: theme.isDark ? '#1F2937' : '#F3F4F6' }]}>
              <Ionicons name="cube-outline" size={24} color={theme.colors.textSecondary} />
            </View>
          )}
        </View>

        {/* Product info */}
        <View style={styles.itemInfo}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text style={[styles.itemName, { color: theme.colors.text }]} numberOfLines={2}>
              {item.product.name}
            </Text>
            <TouchableOpacity onPress={() => handleRemove(item)} style={styles.deleteBtnTop}>
              <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.itemSubtitle, { color: theme.colors.textSecondary }]}>Categoría: {item.product.category?.name || 'General'}</Text>

          <View style={styles.qtyPriceRow}>
            {/* Quantity controls */}
            <View style={styles.qtyContainer}>
              <TouchableOpacity
                onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                style={[styles.qtyBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
              >
                <Ionicons name="remove" size={14} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={[styles.qtyText, { color: theme.colors.text }]}>{item.quantity}</Text>
              <TouchableOpacity
                onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                style={[styles.qtyBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
              >
                <Ionicons name="add" size={14} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={[styles.qtyMultiplier, { color: theme.colors.textSecondary }]}>{item.quantity} x</Text>
              <Text style={[styles.itemPriceMain, { color: theme.colors.primary }]}>${Number(item.product.price).toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.modalOverlayCtn}>
      {/* Background overlay that closes on touch */}
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeDrawer} />
      </Animated.View>

      {/* Drawer panel */}
      <Animated.View style={[
        styles.drawer,
        {
          backgroundColor: theme.colors.background,
          transform: [{ translateX: slideAnim }]
        }
      ]}>

        {/* Header */}
        <View style={[styles.headerBar, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Mi Carrito</Text>
          <TouchableOpacity onPress={closeDrawer} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
            <Text style={[styles.closeText, { color: theme.colors.text }]}>Cerrar</Text>
          </TouchableOpacity>
        </View>

        {/* Promo Card like the reference */}
        <View style={styles.promoWrapper}>
          <LinearGradient
            colors={['rgba(16, 185, 129, 0.1)', 'rgba(6, 182, 212, 0.05)', 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.promoCard, { borderColor: theme.isDark ? '#1F2937' : '#E5E7EB' }]}
          >
            <View style={styles.promoIconContainer}>
              <Ionicons name="gift" size={20} color="#F59E0B" />
            </View>
            <View style={styles.promoContent}>
              <View style={styles.promoBadge}><Text style={styles.promoBadgeText}>ESPECIAL</Text></View>
              <Text style={[styles.promoTitle, { color: theme.colors.text }]}>Promo de Suplementos</Text>
              <Text style={[styles.promoDesc, { color: theme.colors.textSecondary }]}>
                Añade <Text style={{ color: '#10B981', fontWeight: '700' }}>2 más</Text> y obtén <Text style={{ color: '#10B981', fontWeight: '700' }}>uno gratis</Text>.
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Action Clear */}
        {items.length > 0 && (
          <View style={styles.clearRow}>
            <TouchableOpacity onPress={() => Alert.alert('Vaciar', '¿Eliminar todo?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Vaciar', style: 'destructive', onPress: clearCart }
            ])} style={styles.clearBtn}>
              <Ionicons name="trash-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.clearText, { color: theme.colors.textSecondary }]}>Limpiar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Items List */}
        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={64} color={theme.colors.textSecondary} style={{ opacity: 0.5 }} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Tu carrito está vacío</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
              Añade artículos desde la tienda
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.product.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Footer FixBottom */}
        {items.length > 0 && (
          <View style={[styles.footer, { backgroundColor: theme.isDark ? '#111827' : '#F9FAFB', borderTopColor: theme.colors.border }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Subtotal:</Text>
              <Text style={[styles.totalValue, { color: theme.colors.primary }]}>${totalPrice.toFixed(2)}</Text>
            </View>

            <TouchableOpacity style={[styles.viewCartBtn, { backgroundColor: theme.isDark ? '#000000' : '#E5E7EB' }]} onPress={closeDrawer}>
              <Text style={[styles.viewCartText, { color: theme.colors.text }]}>Seguir Comprando</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
              <Text style={styles.checkoutText}>Finalizar Compra</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>

      {/* Payment Modals */}
      <PaymentMethodModal
        visible={paymentModalVisible}
        onClose={() => setPaymentModalVisible(false)}
        onSelectMethod={handlePaymentMethodSelect}
        plan={checkoutPlan}
      />

      <CardPaymentForm
        visible={cardFormVisible}
        onClose={() => setCardFormVisible(false)}
        onSubmit={handleCardPayment}
        plan={checkoutPlan}
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
  modalOverlayCtn: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    zIndex: 1000,
    flexDirection: 'row', justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  drawer: {
    width: DRAWER_WIDTH,
    height: '100%',
    shadowColor: '#000', shadowOffset: { width: -5, height: 0 },
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 20,
    borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.05)',
  },

  /* Header */
  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 30, paddingBottom: 20,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  closeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, opacity: 0.8 },
  closeText: { fontSize: 14, fontWeight: '600' },

  /* Promo Card */
  promoWrapper: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 10 },
  promoCard: {
    flexDirection: 'row', padding: 16, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', gap: 12,
  },
  promoIconContainer: {
    width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  promoContent: { flex: 1 },
  promoBadge: { backgroundColor: '#10B981', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, alignSelf: 'flex-start', marginBottom: 4 },
  promoBadgeText: { color: '#000', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  promoTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  promoDesc: { fontSize: 12 },

  /* Clear row */
  clearRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingBottom: 10 },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  clearText: { fontSize: 13 },

  /* List */
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },

  /* Cart Item - Compact Style */
  cartItem: {
    flexDirection: 'row',
    padding: 12, borderRadius: 12, borderWidth: 1,
    marginBottom: 12,
  },
  itemImageWrap: { width: 64, height: 80, borderRadius: 6, overflow: 'hidden', marginRight: 12 },
  itemImage: { width: '100%', height: '100%' },
  itemImageFallback: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },

  itemInfo: { flex: 1, justifyContent: 'space-between' },
  itemName: { fontSize: 14, fontWeight: '700', flexShrink: 1, marginRight: 8, lineHeight: 18 },
  deleteBtnTop: { padding: 4, marginRight: -4, marginTop: -4 },

  itemSubtitle: { fontSize: 11, marginTop: 2, marginBottom: 8 },

  qtyPriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 6, overflow: 'hidden' },
  qtyBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: 13, fontWeight: '700', width: 28, textAlign: 'center' },

  qtyMultiplier: { fontSize: 12 },
  itemPriceMain: { fontSize: 15, fontWeight: '800' },

  /* Empty */
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center' },

  /* Footer Bottom */
  footer: {
    paddingHorizontal: 20, paddingVertical: 20, borderTopWidth: 1,
    marginTop: 'auto',
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  totalLabel: { fontSize: 18, fontWeight: '800' },
  totalValue: { fontSize: 20, fontWeight: '900' },

  viewCartBtn: {
    paddingVertical: 14, borderRadius: 25, alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  viewCartText: { fontWeight: '700', fontSize: 14 },

  checkoutBtn: {
    backgroundColor: '#10B981', // Neon green like the reference
    paddingVertical: 14, borderRadius: 25, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
  },
  checkoutText: { color: '#000000', fontSize: 15, fontWeight: '800' },
});
