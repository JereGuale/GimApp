import React from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, Alert, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';

const screenWidth = Dimensions.get('window').width;

export default function CartScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { items, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart();

  const handleCheckout = () => {
    if (items.length === 0) return;
    Alert.alert(
      'Confirmar Compra',
      `Total: $${totalPrice.toFixed(2)} (${totalItems} artículos)`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            clearCart();
            Alert.alert('¡Compra Exitosa!', 'Tu pedido ha sido procesado correctamente.', [
              { text: 'OK', onPress: () => navigation.goBack() }
            ]);
          }
        }
      ]
    );
  };

  const handleRemove = (item) => {
    Alert.alert('Eliminar', `¿Eliminar ${item.product.name} del carrito?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => removeFromCart(item.product.id) }
    ]);
  };

  const getImage = (product) => {
    if (product.images && product.images.length > 0) return product.images[0];
    if (product.image) return product.image;
    return null;
  };

  const renderItem = ({ item }) => {
    const img = getImage(item.product);
    return (
      <View style={[styles.cartItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        {/* Product image */}
        <View style={[styles.itemImageWrap, { backgroundColor: theme.isDark ? '#0F172A' : '#F1F5F9' }]}>
          {img ? (
            <Image source={{ uri: img }} style={styles.itemImage} resizeMode="cover" />
          ) : (
            <Ionicons name="cube-outline" size={32} color={theme.colors.textSecondary} />
          )}
        </View>

        {/* Product info */}
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: theme.colors.text }]} numberOfLines={2}>
            {item.product.name}
          </Text>
          <Text style={styles.itemPrice}>${Number(item.product.price).toFixed(2)}</Text>

          {/* Quantity controls */}
          <View style={styles.qtyRow}>
            <TouchableOpacity
              onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
              style={[styles.qtyBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
            >
              <Ionicons name="remove" size={16} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.qtyText, { color: theme.colors.text }]}>{item.quantity}</Text>
            <TouchableOpacity
              onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
              style={[styles.qtyBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
            >
              <Ionicons name="add" size={16} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Subtotal + delete */}
        <View style={styles.itemRight}>
          <Text style={styles.subtotal}>
            ${(Number(item.product.price) * item.quantity).toFixed(2)}
          </Text>
          <TouchableOpacity onPress={() => handleRemove(item)} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.headerBar, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Mi Carrito</Text>
        {items.length > 0 ? (
          <TouchableOpacity onPress={() => Alert.alert('Vaciar carrito', '¿Eliminar todos los artículos?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Vaciar', style: 'destructive', onPress: clearCart }
          ])}>
            <Text style={styles.clearText}>Vaciar</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconWrap, { backgroundColor: theme.isDark ? 'rgba(34,211,238,0.08)' : 'rgba(34,211,238,0.1)' }]}>
            <Ionicons name="cart-outline" size={56} color="#22D3EE" />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Tu carrito está vacío</Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
            Explora nuestros productos y añade artículos al carrito
          </Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="storefront-outline" size={18} color="#000" />
            <Text style={styles.shopBtnText}>Ir a Productos</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.product.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          />

          {/* Summary footer */}
          <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                Subtotal ({totalItems} artículo{totalItems !== 1 ? 's' : ''})
              </Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                ${totalPrice.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Envío</Text>
              <Text style={[styles.freeShipping]}>Gratis</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Total</Text>
              <Text style={styles.totalValue}>${totalPrice.toFixed(2)}</Text>
            </View>

            <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
              <Ionicons name="lock-closed" size={18} color="#000" />
              <Text style={styles.checkoutText}>Proceder al Pago</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* Header */
  headerBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12,
    borderBottomWidth: 1, gap: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  clearText: { color: '#EF4444', fontSize: 14, fontWeight: '700', paddingRight: 4 },

  /* List */
  listContent: { padding: 16 },

  /* Cart item */
  cartItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderRadius: 16, borderWidth: 1, gap: 12,
  },
  itemImageWrap: {
    width: 80, height: 80, borderRadius: 12,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  itemImage: { width: '100%', height: '100%' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  itemPrice: { color: '#22D3EE', fontSize: 14, fontWeight: '800', marginBottom: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  qtyText: { fontSize: 15, fontWeight: '800', minWidth: 20, textAlign: 'center' },
  itemRight: { alignItems: 'flex-end', gap: 12 },
  subtotal: { color: '#22D3EE', fontSize: 16, fontWeight: '900' },
  deleteBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },

  /* Empty */
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyIconWrap: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  emptyTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  shopBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#22D3EE', paddingVertical: 14, paddingHorizontal: 28,
    borderRadius: 14,
  },
  shopBtnText: { color: '#000', fontSize: 15, fontWeight: '800' },

  /* Footer */
  footer: {
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32,
    borderTopWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontSize: 14, fontWeight: '700' },
  freeShipping: { color: '#22C55E', fontSize: 14, fontWeight: '700' },
  divider: { height: 1, marginVertical: 10 },
  totalLabel: { fontSize: 18, fontWeight: '800' },
  totalValue: { fontSize: 22, fontWeight: '900', color: '#22D3EE' },
  checkoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#22D3EE', paddingVertical: 16,
    borderRadius: 14, marginTop: 16,
    shadowColor: '#22D3EE', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 4,
  },
  checkoutText: { color: '#000', fontSize: 16, fontWeight: '800' },
});
