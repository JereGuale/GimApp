import { useMemo, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Dimensions, Alert, Platform
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';
import { useResponsive } from '../../hooks/useResponsive';
import { API_URL } from '../../services/api';

const BASE_URL = API_URL.replace('/api', '');

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { theme } = useTheme();
  const { addToCart } = useCart();
  const { isDesktop: isWide } = useResponsive();
  const navigation = useNavigation();
  const route = useRoute();
  const product = route.params?.product || null;
  const [activeTab, setActiveTab] = useState('description');

  const categoryName = (product?.category_name || product?.category?.name || '').toLowerCase();
  const productNameLower = (product?.name || '').toLowerCase();
  const isClothing = categoryName.includes('ropa') || 
                     categoryName.includes('vestimenta') || 
                     categoryName.includes('clothing') || 
                     categoryName.includes('wear') ||
                     productNameLower.includes('camisa') ||
                     productNameLower.includes('camiseta') ||
                     productNameLower.includes('pantalon') ||
                     productNameLower.includes('short') ||
                     productNameLower.includes('buzo') ||
                     productNameLower.includes('sueter') ||
                     productNameLower.includes('prenda');
                     
  const isSupplement = categoryName.includes('suplemento') || categoryName.includes('supplement') || categoryName.includes('proteina') || categoryName.includes('whey');

  const getProductOptions = () => {
    if (product?.options && Array.isArray(product.options) && product.options.length > 0) {
      return product.options;
    }
    if (product?.options && typeof product.options === 'string') {
      try {
        const parsed = JSON.parse(product.options);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        const split = product.options.split(',').map(s => s.trim()).filter(Boolean);
        if (split.length > 0) return split;
      }
    }
    if (isClothing) {
      return ['S', 'M', 'L', 'XL', 'XXL'];
    }
    if (isSupplement) {
      return ['500g', '1kg', '2kg'];
    }
    return [];
  };

  const optionsList = useMemo(() => getProductOptions(), [product, isClothing, isSupplement]);
  const [selectedOption, setSelectedOption] = useState(null);

  useEffect(() => {
    if (optionsList.length > 0) {
      setSelectedOption(optionsList[0]);
    } else {
      setSelectedOption(null);
    }
  }, [optionsList]);

  const images = useMemo(() => {
    if (!product) return [];
    let rawImages = [];
    if (product.images) {
      rawImages = Array.isArray(product.images) ? product.images : (typeof product.images === 'string' ? JSON.parse(product.images) : [product.images]);
    } else if (product.image) {
      rawImages = [product.image];
    }

    if (!Array.isArray(rawImages)) {
      rawImages = [];
    }

    return rawImages.map(img => {
      let url = img;
      if (url.match(/^http:\/\/(192\.168\.\d+\.\d+|localhost|127\.0\.0\.1):\d+/)) {
        const pathPart = url.split('/storage/')[1];
        if (pathPart) {
          url = `${BASE_URL}/storage/${pathPart}`;
        }
      } else if (!url.startsWith('http')) {
        url = `${BASE_URL}/storage/${url}`;
      }
      return url;
    });
  }, [product]);
  const [activeImage, setActiveImage] = useState(images[0] || null);

  if (!product) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.floatingBackBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Producto no disponible</Text>
        </View>
      </View>
    );
  }

  const handleAddToCart = () => {
    addToCart({ ...product, selectedOption }, 1);
    navigation.navigate('Cart');
  };

  const handleBuyNow = () => {
    addToCart({ ...product, selectedOption }, 1);
    navigation.navigate('Cart');
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={[styles.scrollContent, isWide && styles.scrollContentWide]}
      showsVerticalScrollIndicator={true}
      scrollEnabled={true}
    >
      <View style={styles.floatingHeaderArea}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.floatingBackBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
        {/* Left: Image gallery */}
        <View style={[styles.gallerySection, isWide && { flex: 1 }]}>
          {/* Main image */}
          <View style={[
            styles.mainImageContainer,
            {
              backgroundColor: theme.isDark ? '#0F172A' : '#F1F5F9',
              borderColor: theme.isDark ? '#1E3A5F' : '#E2E8F0',
              height: isWide ? Math.min(screenHeight * 0.75, 650) : screenWidth * 0.75,
            }
          ]}>
            <Image
              source={{ uri: activeImage || images[0] || 'https://via.placeholder.com/400' }}
              style={styles.mainImage}
              contentFit="contain"
              transition={300}
              cachePolicy="memory-disk"
            />
          </View>
        </View>

        {/* Right: Product info */}
        <View style={[styles.infoSection, isWide && { flex: 1 }]}>
          <Text style={[styles.productName, { color: theme.colors.text }]}>{product.name}</Text>
          <Text style={styles.productPrice}>${Number(product.price).toFixed(2)}</Text>
          {product.stock !== null && product.stock !== undefined && Number(product.stock) > 0 && Number(product.stock) < 5 && (
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              backgroundColor: theme.isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2', 
              borderColor: '#EF4444', 
              borderWidth: 1, 
              borderRadius: 10, 
              paddingHorizontal: 12, 
              paddingVertical: 8, 
              marginVertical: 10,
              gap: 8
            }}>
              <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
              <Text style={{ 
                color: theme.isDark ? '#FCA5A5' : '#B91C1C', 
                fontSize: 13, 
                fontWeight: '700' 
              }}>
                ¡Quedan pocas unidades! Menos de 5 disponibles
              </Text>
            </View>
          )}
          {/* Thumbnails horizontally below price */}
          {images.length > 1 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
              {images.map((img, idx) => (
                <TouchableOpacity
                  key={img + idx}
                  style={{ width: 70, height: 70, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: activeImage === img ? '#FB923C' : '#E2E8F0', marginRight: idx !== images.length - 1 ? 8 : 0 }}
                  onPress={() => setActiveImage(img)}
                >
                  <Image
                    source={{ uri: img }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    transition={300}
                    cachePolicy="memory-disk"
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {optionsList.length > 0 && (
            <View style={styles.optionGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={[styles.optionLabel, { color: theme.colors.text, margin: 0 }]}>
                  {isClothing ? 'Selecciona Talla' : (isSupplement ? 'Presentación' : 'Selecciona Opción')}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#FB923C' }}>
                  Elegida: {selectedOption}
                </Text>
              </View>
              <View style={styles.selectorRow}>
                {optionsList.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.optionSelectorItem,
                      { 
                        borderColor: selectedOption === opt ? '#FB923C' : (theme.isDark ? '#334155' : '#E2E8F0'),
                        backgroundColor: selectedOption === opt ? 'rgba(251, 146, 60, 0.12)' : (theme.isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC'),
                        width: 'auto',
                        minWidth: 54,
                        paddingHorizontal: 12,
                        height: 44,
                        borderRadius: 10
                      }
                    ]}
                    onPress={() => setSelectedOption(opt)}
                  >
                    <Text style={{ 
                      color: selectedOption === opt ? '#FB923C' : theme.colors.text, 
                      fontWeight: '800',
                      fontSize: 14 
                    }}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actionBtns}>
            <TouchableOpacity style={styles.addToCartBtn} onPress={handleAddToCart}>
              <Ionicons name="cart-outline" size={20} color="#000" />
              <Text style={styles.addToCartText}>Añadir al Carrito</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.buyNowBtn, { borderColor: '#FB923C' }]} onPress={handleBuyNow}>
              <Text style={styles.buyNowText}>Comprar Ahora</Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 20, borderTopWidth: 1, borderColor: theme.isDark ? '#1E293B' : '#F1F5F9', paddingTop: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: theme.colors.text, marginBottom: 8 }}>
              Descripción del Producto
            </Text>
            <Text style={[styles.descText, { color: theme.colors.text, opacity: 0.8, lineHeight: 22 }]}>
              {product.description || 'Sin descripción disponible para este producto.'}
            </Text>
          </View>
        </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },

  /* Floating Header */
  floatingHeaderArea: {
    position: 'absolute',
    top: 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  floatingBackBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },

  /* Content */
  scrollContent: { padding: 16, paddingTop: 80, paddingBottom: 120 },
  scrollContentWide: { flexDirection: 'row', gap: 24, paddingTop: 80 },

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
  productPrice: { fontSize: 28, fontWeight: '900', color: '#FB923C', marginBottom: 20 },

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
  selectorRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionSelectorItem: {
    borderWidth: 1.5,
    borderRadius: 8,
    width: 48,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Actions */
  actionBtns: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  addToCartBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#FB923C', paddingVertical: 14, borderRadius: 14,
    shadowColor: '#FB923C', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 4,
  },
  addToCartText: { color: '#000', fontSize: 14, fontWeight: '800' },
  buyNowBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 14, borderWidth: 2,
  },
  buyNowText: { color: '#FB923C', fontSize: 14, fontWeight: '800' },

  /* Tabs */
  tabBar: {
    flexDirection: 'row', borderBottomWidth: 1, marginBottom: 16,
  },
  tab: { paddingVertical: 12, paddingHorizontal: 4, marginRight: 24 },
  tabActive: { borderBottomWidth: 2.5, borderBottomColor: '#FB923C' },
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
