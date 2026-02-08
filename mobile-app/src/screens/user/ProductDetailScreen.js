import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');
const imageMaxHeight = Math.min(width, height * 0.6);

export default function ProductDetailScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const product = route.params?.product;

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
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>Producto no disponible</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="share-outline" size={22} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Main Image Gallery */}
        <View style={[styles.mediaCard, { maxHeight: imageMaxHeight }]}>
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri:
                  activeImage ||
                  images[0] ||
                  'https://images.unsplash.com/photo-1517832207067-4db24a2ae47c?q=80&w=1200&auto=format&fit=crop'
              }}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Thumbnail Gallery */}
        {images.length > 1 && (
          <View style={styles.gallerySectionContainer}>
            <Text style={styles.galleryLabel}>Más imágenes</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbRow}>
              {images.map((uri, idx) => (
                <TouchableOpacity key={`${uri}-${idx}`} onPress={() => setActiveImage(uri)}>
                  <Image
                    source={{ uri }}
                    style={[styles.thumbImage, activeImage === uri && styles.thumbActive]}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={[styles.name, { color: theme.colors.text }]}>{product.name}</Text>
          <Text style={styles.price}>${Number(product.price).toFixed(2)}</Text>
          {product.description ? (
            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>{product.description}</Text>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.buyButton}>
          <Text style={styles.buyText}>Comprar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 120 },
  header: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(17, 24, 39, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)'
  },
  mediaCard: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(34, 211, 238, 0.1)'
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  heroImage: { width: '100%', height: '100%' },
  gallerySectionContainer: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(34, 211, 238, 0.1)' },
  galleryLabel: { color: '#9CA3AF', fontSize: 12, fontWeight: '600', paddingHorizontal: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  thumbRow: { paddingHorizontal: 16, gap: 8 },
  thumbImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(34, 211, 238, 0.2)'
  },
  thumbActive: { borderColor: '#22D3EE', shadowColor: '#22D3EE', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 5 },
  infoSection: { paddingHorizontal: 16, paddingTop: 16 },
  name: { fontSize: 24, fontWeight: '700', marginBottom: 8, color: '#FFFFFF' },
  price: { fontSize: 32, fontWeight: '800', color: '#22D3EE', marginBottom: 12 },
  description: { fontSize: 14, lineHeight: 22, color: '#D1D5DB', marginBottom: 16 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: '#0B0F14',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)'
  },
  buyButton: {
    backgroundColor: '#22D3EE',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(34, 211, 238, 0.3)'
  },
  buyText: { color: '#000000', fontSize: 16, fontWeight: '700' },
  emptyText: { marginTop: 100, textAlign: 'center', fontSize: 14 }
});
