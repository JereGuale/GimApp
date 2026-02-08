
import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { CategoryService } from '../../services/api';

const { width: screenWidth } = Dimensions.get('window');
const PADDING = 16;
const CARD_GAP = 12;
const numColumns = screenWidth > 768 ? 3 : 2;
const cardWidth = (screenWidth - PADDING * 2 - CARD_GAP * (numColumns - 1)) / numColumns;

// Colores por posición de categoría
const BUTTON_COLORS = ['#22D3EE', '#FB923C', '#A78BFA', '#34D399', '#F472B6', '#60A5FA'];

// Imágenes de fondo por categoría (alta calidad, orientadas a gym)
const CATEGORY_IMAGES = {
  suplementos: 'https://images.unsplash.com/photo-1616803689943-5601631c7fec?w=800&q=80&auto=format&fit=crop',
  ropa: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&q=80&auto=format&fit=crop',
  deportiva: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&q=80&auto=format&fit=crop',
  equipamiento: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80&auto=format&fit=crop',
  accesorios: 'https://images.unsplash.com/photo-1576633587382-13ddf37b1fc1?w=800&q=80&auto=format&fit=crop',
  otros: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80&auto=format&fit=crop',
};

const CATEGORY_ICONS_MAP = {
  suplementos: 'flask-outline',
  ropa: 'shirt-outline',
  deportiva: 'shirt-outline',
  equipamiento: 'barbell-outline',
  accesorios: 'watch-outline',
  otros: 'fitness-outline',
};

function getCategoryImage(name) {
  const lower = (name || '').toLowerCase();
  for (const key of Object.keys(CATEGORY_IMAGES)) {
    if (lower.includes(key)) return CATEGORY_IMAGES[key];
  }
  return CATEGORY_IMAGES.otros;
}

function getCategoryIcon(name) {
  const lower = (name || '').toLowerCase();
  for (const key of Object.keys(CATEGORY_ICONS_MAP)) {
    if (lower.includes(key)) return CATEGORY_ICONS_MAP[key];
  }
  return 'grid-outline';
}

export default function CategoriesScreen() {
  const { theme } = useTheme();
  const { token } = useAuth();
  const navigation = useNavigation();

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadCategories = async () => {
    try {
      const data = await CategoryService.getAll(token);
      const list = Array.isArray(data) ? data : (data?.data || []);
      setCategories(list);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryProducts = async (category) => {
    setSelectedCategory(category);
    setProductsLoading(true);
    try {
      const data = await CategoryService.getProductsByCategory(category.id, token);
      const list = Array.isArray(data) ? data : (data?.data || []);
      setProducts(list);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadCategories();
  }, [token]);

  const onRefresh = async () => {
    setRefreshing(true);
    setSelectedCategory(null);
    setProducts([]);
    await loadCategories();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color="#22D3EE" />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Cargando categorías...</Text>
      </View>
    );
  }

  // ─── Products view for selected category ───
  if (selectedCategory) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Back header */}
        <View style={styles.productsHeader}>
          <TouchableOpacity
            onPress={() => { setSelectedCategory(null); setProducts([]); }}
            style={[styles.backBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.productsHeaderTitle, { color: theme.colors.text }]}>
            {selectedCategory.name}
          </Text>
          <Text style={[styles.productsCount, { color: theme.colors.textSecondary }]}>
            {products.length} producto{products.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {productsLoading ? (
          <View style={styles.productsLoadingWrap}>
            <ActivityIndicator size="large" color="#22D3EE" />
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={56} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Sin productos</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
              No hay productos en esta categoría
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.productsGridWrap} showsVerticalScrollIndicator={false}>
            <View style={styles.productsGrid}>
              {products.map((product) => {
                const imageUri = product.images && product.images.length > 0
                  ? product.images[0]
                  : product.image || null;
                return (
                  <TouchableOpacity
                    key={product.id}
                    style={[styles.productCard, {
                      backgroundColor: theme.colors.surface,
                      width: cardWidth,
                    }]}
                    onPress={() => navigation.navigate('ProductDetail', { product })}
                    activeOpacity={0.8}
                  >
                    <View style={styles.imageContainer}>
                      {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.productImage} resizeMode="cover" />
                      ) : (
                        <View style={[styles.productImage, styles.imagePlaceholder, { backgroundColor: theme.isDark ? '#1F2937' : '#F1F5F9' }]}>
                          <Ionicons name="image-outline" size={36} color={theme.colors.textSecondary} />
                        </View>
                      )}
                      <View style={styles.priceTag}>
                        <Text style={styles.priceText}>${Number(product.price).toFixed(2)}</Text>
                      </View>
                    </View>
                    <View style={styles.productInfo}>
                      <Text style={[styles.productName, { color: theme.colors.text }]} numberOfLines={2}>
                        {product.name}
                      </Text>
                      {product.description && (
                        <Text style={[styles.productDesc, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                          {product.description}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>
    );
  }

  // ─── Category cards view ───
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22D3EE" />}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.mainTitle, { color: theme.colors.text }]}>
        Categorias de Productos
      </Text>

      {categories.map((cat, index) => {
        const btnColor = BUTTON_COLORS[index % BUTTON_COLORS.length];
        const bgImage = getCategoryImage(cat.name);
        const iconName = getCategoryIcon(cat.name);

        return (
          <TouchableOpacity
            key={cat.id}
            activeOpacity={0.85}
            style={[styles.categoryCard, { backgroundColor: theme.colors.surface }]}
            onPress={() => loadCategoryProducts(cat)}
          >
            {/* Background image - positioned right */}
            <Image
              source={typeof bgImage === 'string' ? { uri: bgImage } : bgImage}
              style={styles.categoryBgImg}
              resizeMode="cover"
            />

            {/* Gradient overlay: dark left → transparent right */}
            <LinearGradient
              colors={[
                'rgba(0,0,0,0.75)',
                'rgba(0,0,0,0.45)',
                'rgba(0,0,0,0.15)',
                'transparent',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.categoryGradient}
            />

            {/* Content */}
            <View style={styles.categoryContent}>
              <View style={styles.categoryLeft}>
                <Text style={styles.categoryName}>{cat.name}</Text>
                <TouchableOpacity
                  style={[styles.verProductosBtn, { backgroundColor: btnColor }]}
                  onPress={() => loadCategoryProducts(cat)}
                >
                  <Text style={styles.verProductosText}>Ver Productos</Text>
                </TouchableOpacity>
              </View>

              {/* Category icon */}
              <View style={[styles.categoryIconWrap, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                <Ionicons name={iconName} size={30} color="rgba(255,255,255,0.65)" />
              </View>
            </View>
          </TouchableOpacity>
        );
      })}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: PADDING, paddingBottom: 32 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 14, fontWeight: '600' },

  /* Main title */
  mainTitle: {
    fontSize: 26, fontWeight: '900', textAlign: 'center',
    marginBottom: 20, marginTop: 4,
  },

  /* Category card */
  categoryCard: {
    marginBottom: 16, borderRadius: 20, overflow: 'hidden',
    height: 190, position: 'relative',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  categoryBgImg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    width: '100%', height: '100%', borderRadius: 20,
  },
  categoryGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  categoryContent: {
    flex: 1, flexDirection: 'row', alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: 22, paddingBottom: 24,
  },
  categoryLeft: { flex: 1, justifyContent: 'flex-end' },
  categoryName: {
    fontSize: 24, fontWeight: '900', color: '#FFFFFF',
    marginBottom: 14, textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },
  verProductosBtn: {
    paddingHorizontal: 22, paddingVertical: 11,
    borderRadius: 25, alignSelf: 'flex-start',
  },
  verProductosText: {
    color: '#FFFFFF', fontSize: 14, fontWeight: '800',
  },
  categoryIconWrap: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-end',
  },

  /* Products header (when viewing a category) */
  productsHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: PADDING, paddingTop: 8, paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  productsHeaderTitle: { flex: 1, fontSize: 20, fontWeight: '800' },
  productsCount: { fontSize: 13, fontWeight: '600' },
  productsLoadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  /* Products grid */
  productsGridWrap: { padding: PADDING, paddingTop: 4, paddingBottom: 32 },
  productsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  productCard: {
    borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  imageContainer: { position: 'relative', width: '100%' },
  productImage: { width: '100%', height: cardWidth * 1.0, backgroundColor: '#F1F5F9' },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  priceTag: {
    position: 'absolute', bottom: 8, left: 8,
    backgroundColor: '#FB923C',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  priceText: { color: '#000', fontWeight: '800', fontSize: 13 },
  productInfo: { padding: 12 },
  productName: { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  productDesc: { fontSize: 12, lineHeight: 16 },

  /* Empty */
  emptyContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 12, marginBottom: 6 },
  emptySubtitle: { fontSize: 14, textAlign: 'center' },
});
