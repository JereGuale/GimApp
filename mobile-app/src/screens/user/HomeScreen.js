import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
  FlatList,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { CategoryService, BannerService } from '../../services/api';

const MAX_CONTENT_WIDTH = 1100; // max width for content sections on web
const AUTO_SCROLL_INTERVAL = 4000;

export default function HomeScreen() {
  const { theme } = useTheme();
  const { token } = useAuth();
  const navigation = useNavigation();
  const { width: winWidth } = useWindowDimensions();

  // Responsive sizing
  const isWeb = Platform.OS === 'web';
  // Banner: full width on all platforms
  const bannerWidth = winWidth;
  const bannerHeight = isWeb ? Math.min(winWidth * 0.3, 380) : winWidth * 0.48;
  // Content padding: center within max width
  const innerWidth = Math.min(winWidth, MAX_CONTENT_WIDTH);
  const contentPadding = isWeb ? Math.max((winWidth - MAX_CONTENT_WIDTH) / 2, 20) : 16;
  // Products: responsive card count — 4 per row on web
  const PRODUCTS_PER_PAGE = isWeb ? 4 : 2;
  const productGap = isWeb ? 16 : 12;
  const productCardWidth = isWeb
    ? Math.min((innerWidth - productGap * 5) / 4, 270)
    : winWidth * 0.42;
  const productImageHeight = isWeb ? productCardWidth * 1.1 : productCardWidth * 1.05;

  const productScrollRef = useRef(null);
  const [productScrollX, setProductScrollX] = useState(0);

  // Banner carousel state
  const [banners, setBanners] = useState([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const bannerFlatListRef = useRef(null);
  const autoScrollTimer = useRef(null);

  // Products state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [searchText, setSearchText] = useState('');

  const borderColors = ['#22D3EE', '#FB923C', '#A78BFA', '#34D399'];

  // Fallback banners when no API data
  const fallbackBanners = [
    {
      id: 'fallback-1',
      title: 'Oferta Mes de Carnaval!',
      description: '¡Aprovecha esta oferta especial!',
      price: 25.00,
      image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=60&w=800&auto=format&fit=crop',
      button_text: 'Comprar Ahora',
      button_action: 'subscription',
    },
    {
      id: 'fallback-2',
      title: 'Plan Mensual Premium',
      description: '¡Acceso ilimitado a todas las áreas!',
      price: 35.00,
      image_url: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=60&w=800&auto=format&fit=crop',
      button_text: 'Suscribirse',
      button_action: 'subscription',
    },
    {
      id: 'fallback-3',
      title: 'Nuevos Suplementos',
      description: 'Los mejores productos para tu entrenamiento',
      price: null,
      image_url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=60&w=800&auto=format&fit=crop',
      button_text: 'Ver Productos',
      button_action: 'explore',
    },
  ];

  // Fetch banners from API
  useEffect(() => {
    let isMounted = true;
    const loadBanners = async () => {
      try {
        setBannersLoading(true);
        const response = await BannerService.getActiveBanners(token);
        if (!isMounted) return;

        const bannerData = response?.data || response || [];
        if (Array.isArray(bannerData) && bannerData.length > 0) {
          // Merge: API banners first, then fallback banners
          setBanners([...bannerData, ...fallbackBanners]);
        } else {
          setBanners(fallbackBanners);
        }
      } catch (error) {
        if (!isMounted) return;
        console.log('Banner fetch error, using fallbacks:', error.message);
        setBanners(fallbackBanners);
      } finally {
        if (isMounted) setBannersLoading(false);
      }
    };

    if (token) {
      loadBanners();
    } else {
      setBanners(fallbackBanners);
      setBannersLoading(false);
    }

    return () => { isMounted = false; };
  }, [token]);

  // Auto-scroll carousel
  useEffect(() => {
    if (banners.length <= 1) return;

    autoScrollTimer.current = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % banners.length;
        bannerFlatListRef.current?.scrollToOffset({
          offset: nextIndex * bannerWidth,
          animated: true,
        });
        return nextIndex;
      });
    }, AUTO_SCROLL_INTERVAL);

    return () => {
      if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);
    };
  }, [banners, bannerWidth]);

  const onBannerScroll = useCallback((event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / bannerWidth);
    setCurrentBannerIndex(index);

    // Reset auto-scroll timer on manual scroll
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
      autoScrollTimer.current = setInterval(() => {
        setCurrentBannerIndex((prev) => {
          const next = (prev + 1) % banners.length;
          bannerFlatListRef.current?.scrollToOffset({
            offset: next * bannerWidth,
            animated: true,
          });
          return next;
        });
      }, AUTO_SCROLL_INTERVAL);
    }
  }, [banners, bannerWidth]);

  // Fetch products
  useEffect(() => {
    let isMounted = true;
    const loadProducts = async () => {
      try {
        setLoading(true);
        const categories = await CategoryService.getAll(token);
        if (!isMounted) return;

        const allProds = [];
        categories.forEach((cat) => {
          if (cat.products && Array.isArray(cat.products)) {
            cat.products.forEach((prod) => {
              allProds.push(prod);
            });
          }
        });
        // Sort: featured products first
        allProds.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
        setProducts(allProds);
      } catch (error) {
        if (!isMounted) return;
        setProducts([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (token) {
      loadProducts();
    } else {
      setProducts([]);
      setLoading(false);
    }

    return () => { isMounted = false; };
  }, [token]);

  const toggleFavorite = (productId) => {
    setFavorites((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleBannerPress = (banner) => {
    if (banner?.button_action === 'subscription') {
      navigation.navigate('Subscription');
    }
  };

  const filteredProducts = searchText
    ? products.filter((p) =>
        p.name?.toLowerCase().includes(searchText.toLowerCase())
      )
    : products;

  // ─── Banner Item ───
  const renderBannerItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={() => handleBannerPress(item)}
      style={[styles.bannerSlide, { width: bannerWidth, height: bannerHeight }]}
    >
      <Image
        source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=60&w=800&auto=format&fit=crop' }}
        style={styles.bannerImage}
        resizeMode="cover"
      />
      {/* Dark gradient overlay */}
      <View style={styles.bannerGradient} />

      {/* Banner content — centered */}
      <View style={styles.bannerContent}>
        {item.title ? (
          <Text style={styles.bannerTitle} numberOfLines={2}>
            {item.title}
          </Text>
        ) : null}
        {item.price ? (
          <Text style={styles.bannerPrice}>
            ${Number(item.price).toFixed(2)}
          </Text>
        ) : null}
        {item.description ? (
          <Text style={styles.bannerDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        {item.button_text ? (
          <TouchableOpacity
            style={styles.bannerButton}
            onPress={() => handleBannerPress(item)}
          >
            <Text style={styles.bannerButtonText}>{item.button_text}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  // ─── Product Card ───
  const renderProductCard = ({ item: product, index }) => {
    const borderColor = borderColors[index % borderColors.length];
    const isFavorite = favorites.includes(product.id);

    return (
      <TouchableOpacity
        key={`product-${product.id || index}`}
        style={[
          styles.productCard,
          {
            width: productCardWidth,
            backgroundColor: theme.colors.surface,
            borderColor,
          },
        ]}
        onPress={() => navigation.navigate('ProductDetail', { product })}
        activeOpacity={0.8}
      >
        <View style={styles.productImageContainer}>
          <Image
            source={{
              uri:
                product.images && product.images.length > 0
                  ? product.images[0]
                  : product.image,
            }}
            style={[styles.productImage, { height: productImageHeight }]}
            resizeMode="cover"
          />
          {/* Price tag */}
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>
              ${Number(product.price).toFixed(2)}
            </Text>
          </View>
          {/* Featured badge */}
          {product.is_featured ? (
            <View style={styles.featuredBadge}>
              <Ionicons name="star" size={14} color="#FFC107" />
            </View>
          ) : null}
          {/* Favorite */}
          <TouchableOpacity
            style={styles.heartButton}
            onPress={() => toggleFavorite(product.id)}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={18}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.productInfo}>
          <Text
            style={[styles.productName, { color: theme.colors.text }]}
            numberOfLines={2}
          >
            {product.name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ─── Search Bar ─── */}
      <View style={[styles.searchWrapper, { paddingHorizontal: contentPadding }]}>
        <View
          style={[
            styles.searchContainer,
            {
              borderColor: '#22D3EE',
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <Ionicons name="search" size={22} color="#22D3EE" style={{ marginRight: 10 }} />
          <TextInput
            placeholder="Busca productos, marcas..."
            placeholderTextColor="#9CA3AF"
            style={[styles.searchInput, { color: theme.colors.text }]}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* ─── Banner Carousel ─── */}
      <View style={styles.bannerSection}>
        {bannersLoading ? (
          <View style={[styles.bannerSlide, styles.bannerLoading, { width: bannerWidth, height: bannerHeight }]}>
            <ActivityIndicator size="large" color="#22D3EE" />
          </View>
        ) : (
          <View>
            <FlatList
              ref={bannerFlatListRef}
              data={banners}
              renderItem={renderBannerItem}
              keyExtractor={(item, index) => `banner-${item.id || index}`}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToInterval={bannerWidth}
              snapToAlignment="start"
              decelerationRate="fast"
              onMomentumScrollEnd={onBannerScroll}
            />

            {/* Pagination Dots — overlaid on banner */}
            {banners.length > 1 && (
              <View style={styles.dotsContainer}>
                {banners.map((_, index) => (
                  <View
                    key={`dot-${index}`}
                    style={[
                      styles.dot,
                      currentBannerIndex === index
                        ? styles.dotActive
                        : styles.dotInactive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      {/* ─── Featured Products - Horizontal Scroll ─── */}
      <View style={[styles.sectionHeader, { paddingHorizontal: contentPadding }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Productos Destacados
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Categorias')}
          style={styles.viewAllButton}
        >
          <Text style={styles.viewAllText}>Ver Todos</Text>
          <Ionicons name="chevron-forward" size={16} color="#22D3EE" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.productsLoading}>
          <ActivityIndicator size="large" color="#22D3EE" />
        </View>
      ) : filteredProducts.length > 0 ? (
        isWeb ? (
          // Web: single horizontal row with arrow to scroll
          <View style={{ paddingHorizontal: contentPadding }}>
            <View style={styles.productsRow}>
              <ScrollView
                ref={productScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 16, paddingRight: 8 }}
                onScroll={(e) => setProductScrollX(e.nativeEvent.contentOffset.x)}
                scrollEventThrottle={16}
              >
                {filteredProducts.map((product, index) =>
                  renderProductCard({ item: product, index })
                )}
              </ScrollView>
              {/* Arrow to scroll right */}
              <TouchableOpacity
                style={styles.productArrowBtn}
                onPress={() => {
                  const scrollAmount = (productCardWidth + 16) * 4;
                  productScrollRef.current?.scrollTo({ x: productScrollX + scrollAmount, animated: true });
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-forward" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Mobile: horizontal scroll
          <FlatList
            data={filteredProducts}
            renderItem={renderProductCard}
            keyExtractor={(item, index) => `product-${item.id || index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: contentPadding,
              paddingBottom: 8,
            }}
            ItemSeparatorComponent={() => <View style={{ width: 14 }} />}
          />
        )
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="cube-outline" size={48} color="#4B5563" />
          <Text style={[styles.emptyText, { color: '#9CA3AF' }]}>
            {searchText
              ? 'No se encontraron productos'
              : 'No hay productos destacados'}
          </Text>
        </View>
      )}

      {/* ─── Quick Actions ─── */}
      <View style={styles.quickActionsSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text, paddingHorizontal: contentPadding }]}>
          Acceso Rápido
        </Text>
        <View style={[styles.quickActionsRow, { paddingHorizontal: contentPadding }]}>
          <TouchableOpacity
            style={[styles.quickActionCard, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.navigate('Categorias')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(34, 211, 238, 0.15)' }]}>
              <Ionicons name="grid-outline" size={24} color="#22D3EE" />
            </View>
            <Text style={[styles.quickActionText, { color: theme.colors.text }]}>Categorías</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionCard, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.navigate('Subscription')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(251, 146, 60, 0.15)' }]}>
              <Ionicons name="card-outline" size={24} color="#FB923C" />
            </View>
            <Text style={[styles.quickActionText, { color: theme.colors.text }]}>Suscripción</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionCard, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.navigate('Cart')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(167, 139, 250, 0.15)' }]}>
              <Ionicons name="cart-outline" size={24} color="#A78BFA" />
            </View>
            <Text style={[styles.quickActionText, { color: theme.colors.text }]}>Carrito</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // ─── Search ───
  searchWrapper: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1.5,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },

  // ─── Banner Carousel ───
  bannerSection: {
    marginBottom: 24,
  },
  bannerSlide: {
    overflow: 'hidden',
  },
  bannerLoading: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  bannerGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.40)',
  },
  bannerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 28,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    fontStyle: 'italic',
    marginBottom: 6,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  bannerPrice: {
    color: '#FB923C',
    fontSize: 38,
    fontWeight: '900',
    marginBottom: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  bannerDescription: {
    color: '#E2E8F0',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bannerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22D3EE',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  bannerButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
  },

  // ─── Dots (overlaid on banner) ───
  dotsContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    borderRadius: 6,
  },
  dotActive: {
    width: 10,
    height: 10,
    backgroundColor: '#22D3EE',
    borderRadius: 5,
  },
  dotInactive: {
    width: 10,
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 5,
  },

  // ─── Section Header ───
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    color: '#22D3EE',
    fontSize: 14,
    fontWeight: '600',
  },

  // ─── Products Horizontal ───
  productsLoading: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productArrowBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(34,211,238,0.2)',
    borderWidth: 1,
    borderColor: '#22D3EE40',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    shadowColor: '#22D3EE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  productCard: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    flexShrink: 0,
  },
  productImageContainer: {
    position: 'relative',
    width: '100%',
  },
  productImage: {
    width: '100%',
    backgroundColor: '#1F2937',
  },
  priceTag: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: '#FB923C',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  priceText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 13,
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#22D3EE',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  productInfo: {
    padding: 10,
    paddingTop: 8,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
  },

  // ─── Empty ───
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
  },

  // ─── Quick Actions ───
  quickActionsSection: {
    marginTop: 24,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  quickActionCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
}); 