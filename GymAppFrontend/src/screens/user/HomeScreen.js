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
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { CategoryService, BannerService, API_URL } from '../../services/api';
import { useResponsive } from '../../hooks/useResponsive';
import { LinearGradient } from 'expo-linear-gradient';

const MAX_CONTENT_WIDTH = 1600; // max width for content sections on web
const AUTO_SCROLL_INTERVAL = 4000;
const BASE_URL = API_URL.replace('/api', '');

export default function HomeScreen() {
  const { theme } = useTheme();
  const { token } = useAuth();
  const navigation = useNavigation();
  const { width: winWidth, isSmallScreen } = useResponsive();

  // Responsive sizing
  const isDesktop = !isSmallScreen;
  const bannerWidth = winWidth;
  const bannerHeight = isDesktop ? Math.min(winWidth * 0.3, 380) : winWidth * 0.52;
  const innerWidth = Math.min(winWidth, MAX_CONTENT_WIDTH);
  const contentPadding = isDesktop ? Math.max((winWidth - MAX_CONTENT_WIDTH) / 2, 20) : 16;
  
  const productGap = isDesktop ? 16 : 12;
  const productCardWidth = isDesktop
    ? Math.min((innerWidth - productGap * 5) / 4, 285)
    : (winWidth - 44) / 2; // Exact 2-column layout width
  const productImageHeight = productCardWidth * 1.1;

  // Banner carousel state
  const [banners, setBanners] = useState([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const bannerFlatListRef = useRef(null);
  const autoScrollTimer = useRef(null);

  // Products & Categories states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]); // Saved category state
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [searchText, setSearchText] = useState('');

  // ── Catalog Integrated Filter States ──
  const [showFullCatalog, setShowFullCatalog] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('default'); // 'default' | 'price_asc' | 'price_desc'
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const borderColors = [theme.colors.primary, theme.colors.primary, theme.colors.primary, theme.colors.primary];

  // Fallback banners
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
  ];

  // Fetch banners
  useEffect(() => {
    let isMounted = true;
    const loadBanners = async () => {
      try {
        setBannersLoading(true);
        const response = await BannerService.getActiveBanners(token);
        if (!isMounted) return;

        const bannerData = response?.data || response || [];
        if (Array.isArray(bannerData) && bannerData.length > 0) {
          const fixedBanners = bannerData.map(b => ({
            ...b,
            image_url: b.image_url
              ? (b.image_url.startsWith('http')
                ? b.image_url
                : `${BASE_URL}/storage/${b.image_url}`)
              : null,
          }));
          setBanners(fixedBanners);
        } else {
          setBanners(fallbackBanners);
        }
      } catch (error) {
        if (!isMounted) return;
        setBanners(fallbackBanners);
      } finally {
        if (isMounted) setBannersLoading(false);
      }
    };

    loadBanners();
    return () => { isMounted = false; };
  }, [token]);

  // Auto-scroll banners
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
  }, [bannerWidth]);

  // Fetch products and populate categories
  useEffect(() => {
    let isMounted = true;
    const loadProducts = async () => {
      try {
        setLoading(true);
        const categoriesData = await CategoryService.getAll(token);
        if (!isMounted) return;

        const catsArray = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.data || []);
        setCategories(catsArray);

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
        setProducts([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProducts();
    return () => { isMounted = false; };
  }, []);

  const toggleFavorite = (productId) => {
    setFavorites((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleBannerPress = (banner) => {
    if (banner?.button_action === 'subscription') {
      navigation.navigate('Suscripción');
    } else if (banner?.button_action === 'explore') {
      setShowFullCatalog(true);
    }
  };

  const toggleCategoryFilter = (catId) => {
    setSelectedCategories(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  // Filter and Sort logic
  const filteredProducts = products.filter((product) => {
    const matchSearch = !searchText || product.name?.toLowerCase().includes(searchText.toLowerCase());
    const matchCategory = selectedCategories.length === 0 || selectedCategories.includes(product.category_id);
    const priceNum = parseFloat(product.price) || 0;
    const matchMinPrice = minPrice === '' || priceNum >= parseFloat(minPrice);
    const matchMaxPrice = maxPrice === '' || priceNum <= parseFloat(maxPrice);
    
    return matchSearch && matchCategory && matchMinPrice && matchMaxPrice;
  });

  const sortedProducts = [...filteredProducts];
  if (sortBy === 'price_asc') {
    sortedProducts.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
  } else if (sortBy === 'price_desc') {
    sortedProducts.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
  }

  // Render Banner Slide
  const renderBannerItem = ({ item }) => (
    <View style={[styles.bannerSlide, { width: bannerWidth, height: bannerHeight }]}>
      <Image
        source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=60&w=800&auto=format&fit=crop' }}
        style={styles.bannerImage}
        contentFit="cover"
        transition={300}
        cachePolicy="memory-disk"
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.65)']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.bannerContent}>
        {item.title ? <Text style={styles.bannerTitle} numberOfLines={2}>{item.title}</Text> : null}
        {item.price ? <Text style={styles.bannerPrice}>${Number(item.price).toFixed(2)}</Text> : null}
        {item.description ? <Text style={styles.bannerDescription} numberOfLines={2}>{item.description}</Text> : null}
        {item.button_text ? (
          <TouchableOpacity style={styles.bannerButton} onPress={() => handleBannerPress(item)} activeOpacity={0.8}>
            <Text style={styles.bannerButtonText}>{item.button_text}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  // Render Product Card
  const renderProductCard = ({ item: product, index }) => {
    const isFavorite = favorites.includes(product.id);
    const imageRaw = product.images && product.images.length > 0 ? product.images[0] : product.image;

    let imageUri = null;
    if (imageRaw) {
      if (imageRaw.match(/^http:\/\/(192\.168\.\d+\.\d+|localhost|127\.0\.0\.1):\d+/)) {
        const pathPart = imageRaw.split('/storage/')[1];
        imageUri = pathPart ? `${BASE_URL}/storage/${pathPart}` : imageRaw;
      } else if (!imageRaw.startsWith('http')) {
        imageUri = `${BASE_URL}/storage/${imageRaw}`;
      } else {
        imageUri = imageRaw;
      }
    }

    return (
      <View
        key={`product-${product.id || index}`}
        style={[
          styles.productCard,
          {
            width: productCardWidth,
            backgroundColor: theme.colors.surface,
            position: 'relative',
            marginBottom: 12
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate('ProductDetail', { product })}
          activeOpacity={0.8}
          style={{ width: '100%' }}
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

        {/* Favorite */}
        <TouchableOpacity
          style={[styles.heartButton, { top: productImageHeight - 48 }]}
          onPress={() => toggleFavorite(product.id)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={18}
            color="#000000"
          />
        </TouchableOpacity>
      </View>
    );
  };

  // ── FULL INTEGRATED CATALOG VIEW ──
  if (showFullCatalog) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        
        {/* Catalog Navigation Header */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          paddingHorizontal: contentPadding, 
          paddingVertical: 16, 
          borderBottomWidth: 1, 
          borderBottomColor: theme.colors.border,
          backgroundColor: theme.colors.surface
        }}>
          <TouchableOpacity 
            onPress={() => { setShowFullCatalog(false); setSearchText(''); }} 
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
            <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '700' }}>Volver</Text>
          </TouchableOpacity>
          <Text style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: theme.colors.text, marginRight: 60 }}>
            Catálogo Completo
          </Text>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchWrapper, { paddingHorizontal: contentPadding, marginTop: 12 }]}>
          <View style={[styles.searchContainer, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
            <Ionicons name="search" size={22} color={theme.colors.text} style={{ marginRight: 10 }} />
            <TextInput
              placeholder="Buscar en el catálogo..."
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

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          
          {isDesktop ? (
            /* ── WEB SPLIT GRID LAYOUT ── */
            <View style={{ flexDirection: 'row', paddingHorizontal: contentPadding, marginTop: 16, alignItems: 'flex-start' }}>
              
              {/* Sidebar Filters */}
              <View style={{ width: 240, marginRight: 28, backgroundColor: theme.colors.surface, borderRadius: 16, borderHeight: 1, borderColor: theme.colors.border, padding: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: theme.colors.text, marginBottom: 16 }}>Filtros</Text>
                
                {/* Price range */}
                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.text, marginBottom: 8 }}>Rango de Precio (USD)</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                  <TextInput 
                    style={{ flex: 1, height: 36, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, paddingHorizontal: 8, fontSize: 12, color: theme.colors.text }}
                    keyboardType="numeric"
                    placeholder="Min ($)"
                    value={minPrice}
                    onChangeText={setMinPrice}
                  />
                  <TextInput 
                    style={{ flex: 1, height: 36, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, paddingHorizontal: 8, fontSize: 12, color: theme.colors.text }}
                    keyboardType="numeric"
                    placeholder="Max ($)"
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                  />
                </View>

                {/* Categories Checkbox List */}
                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.text, marginBottom: 10 }}>Categorías</Text>
                <View style={{ gap: 8 }}>
                  {categories.map((cat) => (
                    <TouchableOpacity 
                      key={cat.id} 
                      onPress={() => toggleCategoryFilter(cat.id)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                    >
                      <Ionicons 
                        name={selectedCategories.includes(cat.id) ? "checkbox" : "square-outline"} 
                        size={18} 
                        color={selectedCategories.includes(cat.id) ? '#FF6A1A' : theme.colors.text} 
                      />
                      <Text style={{ fontSize: 13, color: theme.colors.textSecondary }}>{cat.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Products Side */}
              <View style={{ flex: 1 }}>
                
                {/* Result header & Sort */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ fontSize: 14, color: theme.colors.textSecondary, fontWeight: '500' }}>
                    Mostrando {sortedProducts.length} de {products.length} resultados
                  </Text>
                  
                  {/* Sorting pills */}
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity onPress={() => setSortBy('default')} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: sortBy === 'default' ? '#FF6A1A' : theme.colors.surface }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: sortBy === 'default' ? '#FFF' : theme.colors.text }}>Defecto</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setSortBy('price_asc')} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: sortBy === 'price_asc' ? '#FF6A1A' : theme.colors.surface }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: sortBy === 'price_asc' ? '#FFF' : theme.colors.text }}>Precio ↑</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setSortBy('price_desc')} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: sortBy === 'price_desc' ? '#FF6A1A' : theme.colors.surface }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: sortBy === 'price_desc' ? '#FFF' : theme.colors.text }}>Precio ↓</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Grid */}
                {sortedProducts.length === 0 ? (
                  <View style={[styles.emptyState, { marginTop: 40 }]}>
                    <Ionicons name="cube-outline" size={48} color="#4B5563" />
                    <Text style={{ color: '#9CA3AF', fontSize: 15 }}>No se encontraron productos coincidentes.</Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
                    {sortedProducts.map((product, index) => renderProductCard({ item: product, index }))}
                  </View>
                )}

              </View>

            </View>
          ) : (
            /* ── MOBILE COLLAPSIBLE FILTER LAYOUT ── */
            <View style={{ paddingHorizontal: contentPadding, marginTop: 12 }}>
              
              {/* Header row: counts, sort, filter drawer toggle */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 13, color: theme.colors.textSecondary, fontWeight: '600' }}>
                  {sortedProducts.length} productos
                </Text>
                
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {/* Collapsible drawer button */}
                  <TouchableOpacity 
                    onPress={() => setFilterDrawerOpen(!filterDrawerOpen)}
                    style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      gap: 4, 
                      paddingHorizontal: 12, 
                      paddingVertical: 6, 
                      borderRadius: 14, 
                      backgroundColor: filterDrawerOpen ? '#FF6A1A' : theme.colors.surface,
                      borderWidth: 1,
                      borderColor: theme.colors.border
                    }}
                  >
                    <Ionicons name="funnel-outline" size={12} color={filterDrawerOpen ? '#FFF' : theme.colors.text} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: filterDrawerOpen ? '#FFF' : theme.colors.text }}>Filtros</Text>
                  </TouchableOpacity>

                  {/* Quick Sort Toggle */}
                  <TouchableOpacity 
                    onPress={() => setSortBy(prev => prev === 'default' ? 'price_asc' : prev === 'price_asc' ? 'price_desc' : 'default')}
                    style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      gap: 4, 
                      paddingHorizontal: 12, 
                      paddingVertical: 6, 
                      borderRadius: 14, 
                      backgroundColor: sortBy !== 'default' ? '#FF6A1A' : theme.colors.surface,
                      borderWidth: 1,
                      borderColor: theme.colors.border
                    }}
                  >
                    <Ionicons name="swap-vertical-outline" size={12} color={sortBy !== 'default' ? '#FFF' : theme.colors.text} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: sortBy !== 'default' ? '#FFF' : theme.colors.text }}>
                      {sortBy === 'default' ? 'Ordenar' : sortBy === 'price_asc' ? 'Precio ↑' : 'Precio ↓'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Mobile Filter Drawer */}
              {filterDrawerOpen && (
                <View style={{ backgroundColor: theme.colors.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderHeight: 1, borderColor: theme.colors.border }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: theme.colors.text, marginBottom: 8 }}>Rango de Precio</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                    <TextInput 
                      style={{ flex: 1, height: 36, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, paddingHorizontal: 8, fontSize: 12, color: theme.colors.text, backgroundColor: theme.colors.background }}
                      keyboardType="numeric"
                      placeholder="Min ($)"
                      placeholderTextColor="#9CA3AF"
                      value={minPrice}
                      onChangeText={setMinPrice}
                    />
                    <TextInput 
                      style={{ flex: 1, height: 36, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, paddingHorizontal: 8, fontSize: 12, color: theme.colors.text, backgroundColor: theme.colors.background }}
                      keyboardType="numeric"
                      placeholder="Max ($)"
                      placeholderTextColor="#9CA3AF"
                      value={maxPrice}
                      onChangeText={setMaxPrice}
                    />
                  </View>

                  <Text style={{ fontSize: 13, fontWeight: '800', color: theme.colors.text, marginBottom: 8 }}>Filtrar por Categoría</Text>
                  <View style={{ gap: 8 }}>
                    {categories.map((cat) => (
                      <TouchableOpacity 
                        key={cat.id} 
                        onPress={() => toggleCategoryFilter(cat.id)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                      >
                        <Ionicons 
                          name={selectedCategories.includes(cat.id) ? "checkbox" : "square-outline"} 
                          size={18} 
                          color={selectedCategories.includes(cat.id) ? '#FF6A1A' : theme.colors.text} 
                        />
                        <Text style={{ fontSize: 13, color: theme.colors.textSecondary }}>{cat.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Grid List */}
              {sortedProducts.length === 0 ? (
                <View style={[styles.emptyState, { marginTop: 40 }]}>
                  <Ionicons name="cube-outline" size={48} color="#4B5563" />
                  <Text style={{ color: '#9CA3AF', fontSize: 15 }}>No hay productos coincidentes.</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}>
                  {sortedProducts.map((product, index) => renderProductCard({ item: product, index }))}
                </View>
              )}

            </View>
          )}

        </ScrollView>
      </View>
    );
  }

  // ── LANDING PAGE VIEW ──
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Search Bar */}
      <View style={[styles.searchWrapper, { paddingHorizontal: contentPadding }]}>
        <View style={[styles.searchContainer, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          <Ionicons name="search" size={22} color={theme.colors.text} style={{ marginRight: 10 }} />
          <TextInput
            placeholder="Busca productos, marcas..."
            placeholderTextColor="#9CA3AF"
            style={[styles.searchInput, { color: theme.colors.text }]}
            value={searchText}
            onChangeText={(text) => {
              setSearchText(text);
              if (text) {
                setShowFullCatalog(true); // Open catalog immediately on type
              }
            }}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Banner Carousel */}
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

            {/* Pagination Dots */}
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

      {/* Featured Products */}
      <View style={[styles.featuredProductsHeader, { paddingHorizontal: contentPadding }]}>
        <Text style={[styles.featuredProductsSubtitle, { color: '#FF6A1A' }]}>
          LO MEJOR PARA TI
        </Text>
        <Text style={[styles.featuredProductsTitle, { color: theme.colors.text }]}>
          Productos Destacados
        </Text>
      </View>

      {loading ? (
        <View style={styles.productsLoading}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : filteredProducts.length > 0 ? (
        <View style={{ paddingHorizontal: contentPadding, gap: 16 }}>
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: isDesktop ? 'center' : 'space-between',
            gap: isDesktop ? 16 : 12
          }}>
            {filteredProducts.slice(0, isDesktop ? 8 : 4).map((product, index) =>
              renderProductCard({ item: product, index })
            )}
          </View>

          <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 8 }}>
            <TouchableOpacity
              onPress={() => setShowFullCatalog(true)}
              style={{
                backgroundColor: '#FF6A1A',
                paddingVertical: 12,
                paddingHorizontal: 32,
                borderRadius: 24,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                shadowColor: '#FF6A1A',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 6,
                elevation: 4
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '700', letterSpacing: 0.5 }}>
                Ver todo el catálogo
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
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

      {/* Motivational Section */}
      <View style={[styles.motivationalContainer, { paddingHorizontal: contentPadding }]}>
        <View style={[
          styles.motivationalCard,
          {
            backgroundColor: theme.colors.surface,
            flexDirection: isDesktop ? 'row' : 'column-reverse',
            padding: isDesktop ? 48 : 20,
          }
        ]}>
          <View style={styles.motivationalContent}>
            <Text style={[styles.motivationalSubtitle, { color: theme.colors.primary, fontSize: isSmallScreen ? 10 : 12 }]}>
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
            style={[
              styles.motivationalImage,
              { width: isDesktop ? 320 : '100%', height: isDesktop ? 320 : 220 }
            ]}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
          />
        </View>
      </View>

      {/* Ubicación */}
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
            style={[styles.locationImage, { height: isDesktop ? 350 : winWidth * 0.6 }]}
            resizeMode="contain"
          />
          <View style={[
            styles.locationInfoRow,
            {
              flexDirection: isDesktop ? 'row' : 'column',
              alignItems: isDesktop ? 'center' : 'flex-start'
            }
          ]}>
            <View style={styles.locationTextContent}>
              <Text style={[styles.locationGymName, { color: theme.colors.text }]}>Fitness Club Gym</Text>
              <Text style={[styles.locationAddress, { color: theme.colors.textSecondary || '#9CA3AF' }]}>Calle 15 y Av. 24, Barrio Córdoba, Manta, Ecuador</Text>
            </View>
            <TouchableOpacity
              onPress={() => Linking.openURL('https://maps.google.com/?q=Calle+15+y+Av.+24,+Manta,+Ecuador')}
              style={styles.locationButton}
              activeOpacity={0.8}
            >
              <Text style={styles.locationButtonText}>Cómo Llegar</Text>
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
    paddingBottom: 24,
  },
  
  // ─── Search Bar ───
  searchWrapper: {
    marginTop: 16,
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    padding: 0,
  },

  // ─── Banner Carousel ───
  bannerSection: {
    marginBottom: 20,
  },
  bannerSlide: {
    position: 'relative',
    justifyContent: 'center',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bannerContent: {
    position: 'absolute',
    left: 40,
    right: 40,
    top: 40,
    bottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    textAlign: 'center',
  },
  bannerPrice: {
    color: '#FF6A1A',
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 10,
    textAlign: 'center',
  },
  bannerDescription: {
    color: '#E5E7EB',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    textAlign: 'center',
    maxWidth: 600,
  },
  bannerButton: {
    backgroundColor: '#FF6A1A',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 24,
  },
  bannerButtonText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },

  bannerLoading: {
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 20,
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },

  // ─── Headers ───
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  featuredProductsHeader: {
    marginTop: 28,
    marginBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredProductsSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  featuredProductsTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
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
    borderRadius: 20,
    overflow: 'hidden',
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
    borderRadius: 16,
    marginBottom: 16,
  },
  locationInfoRow: {
    justifyContent: 'space-between',
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
    backgroundColor: '#D95C2B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  locationButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});