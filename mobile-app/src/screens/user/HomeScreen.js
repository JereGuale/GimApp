import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  FlatList,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { CategoryService, BannerService, API_URL } from '../../services/api';
import { useResponsive } from '../../hooks/useResponsive';

import { Alert } from 'react-native';

const MAX_CONTENT_WIDTH = 1100; // max width for content sections on web
const AUTO_SCROLL_INTERVAL = 4000;

const BASE_URL = API_URL.replace('/api', '');

export default function HomeScreen() {
  const { theme } = useTheme();
  const { token } = useAuth();
  const navigation = useNavigation();
  const { width: winWidth, isSmallScreen } = useResponsive();

  // Responsive sizing
  const isDesktop = !isSmallScreen;

  // Banner: full width on all platforms
  const bannerWidth = winWidth;
  const bannerHeight = isDesktop ? Math.min(winWidth * 0.3, 380) : winWidth * 0.52;
  // Content padding: center within max width
  const innerWidth = Math.min(winWidth, MAX_CONTENT_WIDTH);
  const contentPadding = isDesktop ? Math.max((winWidth - MAX_CONTENT_WIDTH) / 2, 20) : 16;
  // Products: responsive card count
  const PRODUCTS_PER_PAGE = isDesktop ? 4 : 2;
  const productGap = isDesktop ? 16 : 12;
  const productCardWidth = isDesktop
    ? Math.min((innerWidth - productGap * 5) / 4, 270)
    : (winWidth - 40) / 2; // More fluid width for mobile (2 cards with 20px margins and 12px gap)
  const productImageHeight = productCardWidth * 1.1;

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

  const borderColors = [theme.colors.primary, theme.colors.primary, theme.colors.primary, theme.colors.primary];

  // Fallback banners when no API data
  const fallbackBanners = [
    {
      id: 'fallback-1',
      title: 'Oferta Del Mes !',
      description: '¡Aprovecha esta oferta especial!',
      price: 25.00,
      image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=60&w=800&auto=format&fit=crop',
      button_text: 'Comprar Ahora',
      button_action: 'subscription',
    },
    {
      id: 'fallback-2',
      title: 'Plan Student',
      description: '¡Acceso ilimitado a todas las áreas!',
      price: 20.00,
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

        const catsArray = Array.isArray(categories) ? categories : (categories?.data || []);
        console.log('[HomeScreen] fetched categories count:', catsArray.length);

        const allProds = [];
        catsArray.forEach((cat) => {
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
        console.error('[HomeScreen] Error loading products:', error);
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
        contentFit="cover"
        transition={300}
        cachePolicy="memory-disk"
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

    const imageRaw = product.images && product.images.length > 0 ? product.images[0] : product.image;

    let imageUri = null;
    if (imageRaw) {
      if (imageRaw.match(/^http:\/\/(192\.168\.\d+\.\d+|localhost|127\.0\.0\.1):\d+/)) {
        const pathPart = imageRaw.split('/storage/')[1];
        if (pathPart) {
          imageUri = `${BASE_URL}/storage/${pathPart}`;
        } else {
          imageUri = imageRaw;
        }
      } else if (!imageRaw.startsWith('http')) {
        imageUri = `${BASE_URL}/storage/${imageRaw}`;
      } else {
        imageUri = imageRaw;
      }
    }

    return (
      <TouchableOpacity
        key={`product-${product.id || index}`}
        style={[
          styles.productCard,
          {
            width: productCardWidth,
            backgroundColor: theme.colors.surface,
          },
        ]}
        onPress={() => navigation.navigate('ProductDetail', { product })}
        activeOpacity={0.8}
      >
        <View style={styles.productImageContainer}>
          <Image
            source={{ uri: imageUri }}
            style={[styles.productImage, { height: productImageHeight }]}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
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
              color="#000000"
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
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <Ionicons name="search" size={22} color={theme.colors.text} style={{ marginRight: 10 }} />
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
            <ActivityIndicator size="large" color={theme.colors.primary} />
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
                        ? { ...styles.dotActive, backgroundColor: theme.colors.primary }
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
          <Text style={[styles.viewAllText, { color: theme.colors.text }]}>Ver Todos</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.productsLoading}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : filteredProducts.length > 0 ? (
        isDesktop ? (
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

      {/* ─── Motivational Section ─── */}
      <View style={[styles.motivationalContainer, { paddingHorizontal: contentPadding }]}>
        <View style={[styles.motivationalCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.motivationalContent}>
            <Text style={[styles.motivationalSubtitle, { color: theme.colors.primary }]}>
              MANTENTE EN MOVIMIENTO
            </Text>
            <Text style={[styles.motivationalTitle, { color: theme.colors.text }]}>
              Tu mejor versión{'\n'}empieza hoy
            </Text>
            <Text style={[styles.motivationalDescription, { color: theme.colors.textSecondary || '#9CA3AF' }]}>
              Equipa tu entrenamiento con productos pensados para durar, rendir y motivarte cada día.
            </Text>
          </View>
          <Image
            source={require('../../../assets/images/professional_gym_model.png')}
            style={styles.motivationalImage}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
          />
        </View>
      </View>

      {/* ─── Ubicación ─── */}
      <View style={[styles.locationContainer, { paddingHorizontal: contentPadding }]}>
        <View style={styles.locationHeader}>
          <Text style={[styles.locationSubtitle, { color: theme.colors.primary }]}>
            UBICACIÓN
          </Text>
          <Text style={[styles.locationTitle, { color: theme.colors.text }]}>
            Tu gimnasio en el punto clave de Manta
          </Text>
          <Text style={[styles.locationDescription, { color: theme.colors.textSecondary || '#9CA3AF' }]}>
            Fácil acceso, estacionamiento cercano y una zona segura para que entrenar sea parte natural de tu rutina.
          </Text>
        </View>

        <View style={[styles.locationCard, { backgroundColor: theme.colors.surface }]}>
          <Image
            source={require('../../../assets/images/map_location_placeholder.png')}
            style={styles.locationImage}
            resizeMode="contain"
          />
          <View style={styles.locationInfoRow}>
            <View style={styles.locationTextContent}>
              <Text style={[styles.locationGymName, { color: theme.colors.text }]}>
                Gigafit Gim
              </Text>
              <Text style={[styles.locationAddress, { color: theme.colors.textSecondary || '#9CA3AF' }]}>
                Zona "Costa Azul" • Fácil estacionamiento • Acceso 24/7
              </Text>
            </View>
            <TouchableOpacity
              style={styles.locationButton}
              onPress={() => Linking.openURL('https://www.google.com/maps?q=-0.9674838,-80.6790125&z=17&hl=es')}
            >
              <Text style={styles.locationButtonText}>Ver en mapa</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    paddingTop: 16,
    paddingBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
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
    backgroundColor: '#FFFFFF', // Botón blanco como referencia
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
    color: '#000000', // Texto negro para contraste
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
    marginBottom: 18,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  productCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 0,
    flexShrink: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
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
    bottom: 12,
    left: 12,
    backgroundColor: '#FB923C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  priceText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  productInfo: {
    padding: 14,
    paddingTop: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
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

  // ─── Suscripciones ───
  plansWebRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: -12,
  },
  plansMobileCol: {
    flexDirection: 'column',
  },
  homePlanCard: {
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
  planBadge: {
    position: 'absolute',
    top: -14,
    right: 32,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10,
  },
  planBadgeText: {
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
  homePlanName: {
    fontSize: 20,
    fontWeight: '800',
  },
  homePlanPrice: {
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
  planFeatures: {
    gap: 16,
    flex: 1,
    paddingVertical: 10,
  },
  planFeatureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  planFeatureText: {
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

  // ─── Motivational Section ───
  motivationalContainer: {
    marginBottom: 16,
    marginTop: 8,
  },
  motivationalCard: {
    flexDirection: !isSmallScreen ? 'row' : 'column-reverse',
    borderRadius: 20,
    overflow: 'hidden',
    padding: !isSmallScreen ? 48 : 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 32,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  motivationalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  motivationalSubtitle: {
    fontSize: isSmallScreen ? 10 : 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  motivationalTitle: {
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
    marginBottom: 12,
  },
  motivationalDescription: {
    fontSize: 14,
    lineHeight: 22,
  },
  motivationalImage: {
    width: !isSmallScreen ? 320 : '100%',
    height: !isSmallScreen ? 320 : 220,
    borderRadius: 20,
  },

  // ─── Ubicación Section ───
  locationContainer: {
    marginTop: 16,
    marginBottom: 32,
  },
  locationHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  locationSubtitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  locationTitle: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
  },
  locationDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  locationCard: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 16,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  locationImage: {
    width: '100%',
    height: !isSmallScreen ? 350 : winWidth * 0.6,
    borderRadius: 16,
    marginBottom: 16,
  },
  locationInfoRow: {
    flexDirection: !isSmallScreen ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: !isSmallScreen ? 'center' : 'flex-start',
    gap: 16,
  },
  locationTextContent: {
    flex: 1,
  },
  locationGymName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 13,
  },
  locationButton: {
    backgroundColor: '#D95C2B', // Naranja oscuro como en la imagen
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: !isSmallScreen ? 'center' : 'stretch',
    alignItems: 'center',
  },
  locationButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});