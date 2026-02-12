import { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ScrollView, Dimensions, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isWide = screenWidth > 600;

export default function ProductDetailScreen() {
  const { theme } = useTheme();
  const { addToCart } = useCart();
  const navigation = useNavigation();
  const route = useRoute();
  const product = route.params?.product || null;
  const [activeTab, setActiveTab] = useState('description');

  const images = useMemo(() => {
    if (!product) return [];
    if (product.images && product.images.length > 0) return product.images;
    if (product.image) return [product.image];
    return [];
  }, [product]);
  const [activeImage, setActiveImage] = useState(images[0] || null);

  if (!product) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.headerBar, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Producto</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Producto no disponible</Text>
        </View>
      </View>
    );
  }

  const handleAddToCart = () => {
    addToCart(product, 1);
    Alert.alert('✓ Añadido', `${product.name} se añadió al carrito`, [
      { text: 'Seguir comprando' },
      { text: 'Ver carrito', onPress: () => navigation.navigate('Cart') }
    ]);
  };

  const handleBuyNow = () => {
    addToCart(product, 1);
    navigation.navigate('Cart');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.headerBar, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]} numberOfLines={1}>Detalle del Producto</Text>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
          <Ionicons name="share-outline" size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, isWide && styles.scrollContentWide]}
        showsVerticalScrollIndicator={false}
      >
        {/* Left: Image gallery */}
        <View style={[styles.gallerySection, isWide && { flex: 1 }]}>
          {/* Main image */}
          <View style={[
            styles.mainImageContainer,
            {
              backgroundColor: theme.isDark ? '#0F172A' : '#F1F5F9',
              borderColor: theme.isDark ? '#1E3A5F' : '#E2E8F0',
              height: isWide ? Math.min(screenHeight * 0.75, 650) : screenWidth * 1.25,
            }
          ]}>
            <Image
              source={{ uri: activeImage || images[0] || 'https://via.placeholder.com/400' }}
              style={styles.mainImage}
              resizeMode="contain"
            />
            <TouchableOpacity style={[styles.favBtn, { backgroundColor: theme.isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)' }]}>
              <Ionicons name="star-outline" size={22} color="#FBBF24" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Right: Product info */}
        <View style={[styles.infoSection, isWide && { flex: 1 }]}>
          <Text style={[styles.productName, { color: theme.colors.text }]}>{product.name}</Text>
          <Text style={styles.productPrice}>${Number(product.price).toFixed(2)}</Text>
          {/* Thumbnails horizontally below price */}
          {images.length > 1 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
              {images.map((img, idx) => (
                <TouchableOpacity
                  key={img + idx}
                  style={{ width: 70, height: 70, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: activeImage === img ? '#22D3EE' : '#E2E8F0', marginRight: idx !== images.length - 1 ? 8 : 0 }}
                  onPress={() => setActiveImage(img)}
                >
                  <Image
                    source={{ uri: img }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Size selector */}
          <View style={styles.optionGroup}>
            <Text style={[styles.optionLabel, { color: theme.colors.textSecondary }]}>Talla</Text>
            <View style={[styles.sizeSelector, { backgroundColor: theme.isDark ? '#0F172A' : '#F1F5F9', borderColor: theme.isDark ? '#1E3A5F' : '#E2E8F0' }]}>
              <Ionicons name="grid-outline" size={18} color={theme.colors.textSecondary} />
              <Ionicons name="chevron-down" size={16} color={theme.colors.textSecondary} />
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actionBtns}>
            <TouchableOpacity style={styles.addToCartBtn} onPress={handleAddToCart}>
              <Ionicons name="cart-outline" size={20} color="#000" />
              <Text style={styles.addToCartText}>Añadir al Carrito</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.buyNowBtn, { borderColor: '#22D3EE' }]} onPress={handleBuyNow}>
              <Text style={styles.buyNowText}>Comprar Ahora</Text>
            </TouchableOpacity>
          </View>

          {/* Description / Reviews tabs */}
          <View style={[styles.tabBar, { borderColor: theme.isDark ? '#1E3A5F' : '#E2E8F0' }]}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'description' && styles.tabActive]}
              onPress={() => setActiveTab('description')}
            >
              <Text style={[styles.tabText, { color: activeTab === 'description' ? '#22D3EE' : theme.colors.textSecondary }]}>
                Descripción
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'reviews' && styles.tabActive]}
              onPress={() => setActiveTab('reviews')}
            >
              <Text style={[styles.tabText, { color: activeTab === 'reviews' ? '#22D3EE' : theme.colors.textSecondary }]}>
                Reseñas
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabContent}>
            {activeTab === 'description' ? (
              <Text style={[styles.descText, { color: theme.colors.text }]}>
                {product.description || 'Sin descripción disponible para este producto.'}
              </Text>
            ) : (
              <View style={styles.reviewsEmpty}>
                <Ionicons name="chatbubble-ellipses-outline" size={36} color={theme.colors.textSecondary} />
                <Text style={[styles.reviewsEmptyText, { color: theme.colors.textSecondary }]}>
                  Aún no hay reseñas
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* Header */
  headerBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', textAlign: 'center' },

  /* Content */
  scrollContent: { padding: 16, paddingBottom: 40 },
  scrollContentWide: { flexDirection: 'row', gap: 24 },

  /* Gallery */
  gallerySection: { marginBottom: 20 },
  mainImageContainer: {
    width: '100%', borderRadius: 18,
    overflow: 'hidden', borderWidth: 1.5,
    marginBottom: 12, position: 'relative',
  },
  mainImage: { width: '100%', height: '100%' },
  favBtn: {
    position: 'absolute', bottom: 12, right: 12,
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  thumbRow: { gap: 10, paddingVertical: 4 },
  thumbContainer: {
    width: 70, height: 70, borderRadius: 12,
    overflow: 'hidden', borderWidth: 2,
  },
  thumbImage: { width: '100%', height: '100%' },

  /* Info */
  infoSection: {},
  productName: { fontSize: 26, fontWeight: '800', marginBottom: 6, letterSpacing: 0.3 },
  productPrice: { fontSize: 28, fontWeight: '900', color: '#22D3EE', marginBottom: 20 },

  /* Options */
  optionGroup: { marginBottom: 18 },
  optionLabel: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  colorRow: { flexDirection: 'row', gap: 10 },
  colorThumb: {
    width: 50, height: 50, borderRadius: 10,
    overflow: 'hidden', borderWidth: 2.5,
  },
  colorThumbImg: { width: '100%', height: '100%' },
  sizeSelector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, width: 60, height: 42, borderRadius: 10, borderWidth: 1.5,
  },

  /* Actions */
  actionBtns: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  addToCartBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#22D3EE', paddingVertical: 14, borderRadius: 14,
    shadowColor: '#22D3EE', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 4,
  },
  addToCartText: { color: '#000', fontSize: 14, fontWeight: '800' },
  buyNowBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 14, borderWidth: 2,
  },
  buyNowText: { color: '#22D3EE', fontSize: 14, fontWeight: '800' },

  /* Tabs */
  tabBar: {
    flexDirection: 'row', borderBottomWidth: 1, marginBottom: 16,
  },
  tab: { paddingVertical: 12, paddingHorizontal: 4, marginRight: 24 },
  tabActive: { borderBottomWidth: 2.5, borderBottomColor: '#22D3EE' },
  tabText: { fontSize: 14, fontWeight: '700' },

  /* Tab content */
  tabContent: { minHeight: 80 },
  descText: { fontSize: 14, lineHeight: 22 },
  reviewsEmpty: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  reviewsEmptyText: { fontSize: 14 },

  /* Empty */
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: 16 },
});
