import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ImageBackground, TextInput, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { CategoryService } from '../../services/api';
import axios from 'axios';

const { width: screenWidth } = Dimensions.get('window');
const API_URL = 'http://10.0.2.2:8000/api'; // Android emulator
// const API_URL = 'http://localhost:8000/api'; // iOS simulator

// Responsive grid
const getGridConfig = () => {
  if (screenWidth > 1200) return { columns: 4, gap: 16, maxWidth: 1200 };
  if (screenWidth > 768) return { columns: 3, gap: 14, maxWidth: 900 };
  return { columns: 2, gap: 12, maxWidth: 600 };
};

const gridConfig = getGridConfig();
const containerPadding = 16;
const maxContentWidth = gridConfig.maxWidth;
const effectiveWidth = Math.min(screenWidth - (containerPadding * 2), maxContentWidth - (containerPadding * 2));
const cardWidth = (effectiveWidth - (gridConfig.gap * (gridConfig.columns - 1))) / gridConfig.columns;
const imageHeight = cardWidth * 1.0;

export default function HomeScreen() {
  const { theme } = useTheme();
  const { token } = useAuth();
  const navigation = useNavigation();

  // Banner state
  const [banner, setBanner] = useState(null);
  const [bannerLoading, setBannerLoading] = useState(true);

  // Products state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);

  const borderColors = ['#22D3EE', '#FB923C', '#A78BFA', '#22D3EE'];

  const fallbackProducts = [
    {
      id: 'fallback-1',
      name: 'Proteina Whey',
      price: 30.0,
      image: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?q=80&w=800&auto=format&fit=crop',
      is_featured: true
    },
    {
      id: 'fallback-2',
      name: 'Camiseta Deportiva',
      price: 18.0,
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop',
      is_featured: true
    },
    {
      id: 'fallback-3',
      name: 'Creatina Monohidratada',
      price: 25.0,
      image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?q=80&w=800&auto=format&fit=crop',
      is_featured: true
    },
    {
      id: 'fallback-4',
      name: 'Botella Termica',
      price: 15.0,
      image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=800&auto=format&fit=crop',
      is_featured: true
    }
  ];

  // Fetch promotional banner from API
  useEffect(() => {
    const fetchBanner = async () => {
      try {
        setBannerLoading(true);
        const response = await axios.get(`${API_URL}/banner/active`);

        if (response.data.success && response.data.data) {
          setBanner(response.data.data);
        } else {
          // Use fallback banner data
          setBanner({
            title: 'Oferta Mes de Carnaval!',
            description: '¡Aprovecha esta oferta especial!',
            price: 25.00,
            image_url: null,
            button_text: 'Comprar Ahora',
            button_action: 'subscription'
          });
        }
      } catch (error) {
        console.log('Banner fetch error:', error);
        // Use fallback
        setBanner({
          title: 'Oferta Mes de Carnaval!',
          description: '¡Aprovecha esta oferta especial!',
          price: 25.00,
          image_url: null,
          button_text: 'Comprar Ahora',
          button_action: 'subscription'
        });
      } finally {
        setBannerLoading(false);
      }
    };

    fetchBanner();
  }, []);

  // Fetch products
  useEffect(() => {
    let isMounted = true;
    const loadProducts = async () => {
      try {
        setLoading(true);
        const categories = await CategoryService.getAll(token);

        if (!isMounted) return;

        const featuredProds = [];
        categories.forEach(cat => {
          if (cat.products && Array.isArray(cat.products)) {
            cat.products.forEach(prod => {
              if (prod.is_featured) featuredProds.push(prod);
            });
          }
        });

        if (featuredProds.length > 0) {
          setProducts(featuredProds);
        } else {
          setProducts(fallbackProducts.map(item => ({
            ...item,
            images: item.image ? [item.image] : []
          })));
        }
      } catch (error) {
        if (!isMounted) return;
        setProducts(fallbackProducts.map((item) => ({
          ...item,
          images: item.image ? [item.image] : []
        })));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (token) {
      loadProducts();
    } else {
      setProducts(fallbackProducts.map((item) => ({
        ...item,
        images: item.image ? [item.image] : []
      })));
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [token]);

  const toggleFavorite = (productId) => {
    setFavorites(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleBannerPress = () => {
    if (banner?.button_action === 'subscription') {
      navigation.navigate('Subscription');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.scrollContent}>
      <View style={[styles.content, { maxWidth: maxContentWidth }]}>
        {/* Search Bar */}
        <View style={[styles.searchContainer, { borderColor: '#22D3EE', backgroundColor: theme.colors.surface }]}>
          <Ionicons name="search" size={24} color="#22D3EE" style={styles.searchIcon} />
          <TextInput
            placeholder="Busca productos, marcas..."
            placeholderTextColor="#9CA3AF"
            style={[styles.searchInput, { color: theme.colors.text }]}
          />
        </View>

        {/* Dynamic Promotional Banner */}
        {!bannerLoading && banner && (
          <TouchableOpacity
            style={styles.bannerWrapper}
            onPress={handleBannerPress}
            activeOpacity={0.9}
          >
            <View style={styles.bannerContainer}>
              {/* Clean Decorative Background Image - NO TEXT */}
              {banner.image_url ? (
                <Image
                  source={{ uri: banner.image_url }}
                  style={styles.bannerImage}
                  resizeMode="cover"
                />
              ) : (
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop' }}
                  style={styles.bannerImage}
                  resizeMode="cover"
                />
              )}

              {/* Light Gradient Overlay for Better Text Readability */}
              <View style={styles.bannerGradient} />

              {/* Content Overlay */}
              <View style={styles.bannerOverlay}>
                <Text style={styles.bannerTitle}>{banner.title}</Text>
                {banner.price && (
                  <Text style={styles.bannerPrice}>
                    ${Number(banner.price).toFixed(2)}
                  </Text>
                )}
                {banner.description && (
                  <Text style={styles.bannerSubtitle}>{banner.description}</Text>
                )}
                <TouchableOpacity
                  style={styles.bannerButton}
                  onPress={handleBannerPress}
                >
                  <Text style={styles.bannerButtonText}>{banner.button_text || 'Ver Más'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Products Section */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Productos Destacados
        </Text>

        <View style={styles.productsGrid}>
          {products.map((product, index) => {
            const borderColor = borderColors[index % borderColors.length];
            const isFavorite = favorites.includes(product.id);

            return (
              <TouchableOpacity
                key={product.id || `product-${index}`}
                style={[
                  styles.productCard,
                  {
                    backgroundColor: theme.colors.surface,
                    width: cardWidth,
                    borderColor: borderColor
                  }
                ]}
                onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
                activeOpacity={0.8}
              >
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: product.images && product.images.length > 0 ? product.images[0] : product.image }}
                    style={[styles.productImage, { height: imageHeight }]}
                    resizeMode="cover"
                  />

                  <View style={styles.priceTag}>
                    <Text style={styles.priceText}>${Number(product.price).toFixed(2)}</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.heartButton, { backgroundColor: '#22D3EE' }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleFavorite(product.id);
                    }}
                  >
                    <Ionicons
                      name={isFavorite ? "heart" : "heart-outline"}
                      size={18}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.productInfo}>
                  <Text style={[styles.productName, { color: theme.colors.text }]} numberOfLines={1}>
                    {product.name}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 20 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scrollContent: {
    alignItems: 'center',
    width: '100%'
  },
  content: {
    width: '100%',
    padding: 16,
    alignSelf: 'center'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 2,
    marginBottom: 16
  },
  searchIcon: {
    marginRight: 10
  },
  searchInput: {
    flex: 1,
    fontSize: 15
  },
  bannerWrapper: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#22D3EE',
    overflow: 'hidden',
    marginBottom: 20,
    width: '100%'
  },
  bannerContainer: {
    width: '100%',
    aspectRatio: 3 / 1, // More panoramic for less height
    position: 'relative',
    backgroundColor: '#1a1a2e',
    overflow: 'hidden'
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute'
  },
  bannerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.35)'
  },
  bannerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 2
  },
  bannerTitle: {
    color: '#60A5FA',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6
  },
  bannerPrice: {
    color: '#FB923C',
    fontSize: 42,
    fontWeight: '900',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6
  },
  bannerSubtitle: {
    color: '#E2E8F0',
    fontSize: 15,
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5
  },
  bannerButton: {
    backgroundColor: '#22D3EE',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6
  },
  bannerButtonText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: gridConfig.gap,
    justifyContent: 'flex-start'
  },
  productCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 2
  },
  imageContainer: {
    position: 'relative',
    width: '100%'
  },
  productImage: {
    width: '100%',
    backgroundColor: '#F1F5F9'
  },
  priceTag: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: '#FB923C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  priceText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 14
  },
  heartButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  productInfo: {
    padding: 12,
    paddingTop: 8,
    paddingBottom: 10
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'left'
  }
});
