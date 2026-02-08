
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Image, FlatList, Alert, Switch } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { SuperAdminService, CategoryService } from '../../services/adminApi';

export default function AdminProducts({ route }) {
  const { token } = useAuth();
  const { theme } = useTheme();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [isFeatured, setIsFeatured] = useState(false);

  const loadCategories = async () => {
    try {
      // Use getAll which handles the admin endpoint correctly
      const data = await CategoryService.getAll(token);
      console.log('[AdminProducts] Categories loaded:', data?.length);

      if (Array.isArray(data)) {
        setCategories(data);
      } else if (data?.data && Array.isArray(data.data)) {
        setCategories(data.data);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Error', 'No se pudieron cargar las categorías');
      setCategories([]);
    }
  };

  const loadProducts = async () => {
    try {
      console.log('[AdminProducts] Loading products...');
      // We can use CategoryService.getAll because it includes products nested in categories
      // OR use SuperAdminService.getProducts if that endpoint returns a flat list
      // Let's stick to SuperAdminService.getProducts but handle the response better
      const data = await SuperAdminService.getProducts(token);
      console.log('[AdminProducts] Products loaded raw:', typeof data);

      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data?.data && Array.isArray(data.data)) {
        list = data.data;
      } else if (data?.products && Array.isArray(data.products)) {
        list = data.products;
      }

      console.log('[AdminProducts] Processed products list length:', list.length);
      setProducts(list);
    } catch (error) {
      console.error('[AdminProducts] Error loading products:', error);
      // Don't alert on simple load error to avoid spamming user if network is flaky
    }
  };

  useEffect(() => {
    if (token) {
      loadCategories();
      loadProducts();
    }
  }, [token]);

  useEffect(() => {
    if (route?.params?.openModal) {
      setShowProductModal(true);
    }
  }, [route?.params?.openModal]);

  useEffect(() => {
    if (route?.params?.editProduct) {
      openEditProduct(route.params.editProduct);
    }
  }, [route?.params?.editProduct]);

  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultiple: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        const newImages = result.assets.map(asset => ({
          uri: asset.uri,
          id: Math.random().toString()
        }));
        setSelectedImages([...selectedImages, ...newImages]);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar las imágenes');
      console.error('Error picking images:', error);
    }
  };

  const getCategoryIcon = (categoryName) => {
    const name = categoryName?.toLowerCase() || '';
    if (name.includes('supplement') || name.includes('suplemento')) {
      return 'pill';
    } else if (name.includes('ropa') || name.includes('cloth') || name.includes('wear')) {
      return 'tshirt-crew';
    } else if (name.includes('equip') || name.includes('equipment')) {
      return 'dumbbell';
    }
    return 'storefront';
  };

  const removeImage = (id) => {
    setSelectedImages(selectedImages.filter(img => img.id !== id));
  };

  const handleDeleteProduct = (productId, productName) => {
    console.log('[AdminProducts] Delete button pressed for product:', { productId, productName });
    setDeleteConfirmation({ productId, productName });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;

    const { productId, productName } = deleteConfirmation;
    console.log('[AdminProducts] Confirming deletion:', { productId, productName });

    try {
      await SuperAdminService.deleteProduct(token, productId);
      console.log('[AdminProducts] Product deleted successfully');

      // Refresh the list
      const updatedList = await SuperAdminService.getProducts(token);
      const list = Array.isArray(updatedList) ? updatedList : (updatedList?.data || []);
      setProducts(list);

      setDeleteConfirmation(null);
      Alert.alert('Éxito', 'Producto eliminado correctamente');
    } catch (error) {
      console.error('[AdminProducts] Delete error:', error);
      Alert.alert('Error', `No se pudo eliminar el producto: ${error.message}`);
      setDeleteConfirmation(null);
    }
  };

  const handleSaveProduct = async () => {
    console.log('[AdminProducts] publish validate', {
      name: productName,
      price: productPrice,
      category_id: selectedCategory
    });
    if (!productName.trim() || !productPrice.trim() || !selectedCategory) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos');
      return;
    }
    try {
      console.log('[AdminProducts] publish start', {
        name: productName,
        price: productPrice,
        category_id: selectedCategory,
        imagesCount: selectedImages.length
      });

      const images = selectedImages.length > 0
        ? selectedImages.map(img => img.uri)
        : [];

      if (editingProduct) {
        await SuperAdminService.updateProduct(token, editingProduct.id, {
          name: productName,
          price: parseFloat(productPrice),
          description: productDesc,
          category_id: selectedCategory,
          is_featured: isFeatured,
          images: images
        });
      } else {
        await SuperAdminService.createProduct(token, {
          name: productName,
          price: parseFloat(productPrice),
          description: productDesc,
          category_id: selectedCategory,
          is_featured: isFeatured,
          condition: 'nuevo',
          images: images
        });
      }

      setProductName('');
      setProductPrice('');
      setProductDesc('');
      setSelectedCategory(null);
      setSelectedImages([]);
      setEditingProduct(null);
      setIsFeatured(false);
      setShowProductModal(false);
      loadProducts();
      Alert.alert('Éxito', editingProduct ? 'Producto actualizado correctamente' : 'Producto publicado correctamente');
    } catch (error) {
      const message = error?.message || 'No se pudo publicar el producto';
      Alert.alert('Error', message);
      console.error('[AdminProducts] publish error:', error);
    }
  };

  const openEditProduct = (product) => {
    setEditingProduct(product);
    setProductName(product.name || '');
    setProductPrice(product.price ? String(product.price) : '');
    setProductDesc(product.description || '');
    setSelectedCategory(product.category_id || product.category?.id || null);
    setIsFeatured(!!product.is_featured);
    // Pre-load ALL existing images
    const existingImages = [];
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      product.images.forEach((uri, idx) => {
        existingImages.push({ uri, id: `existing_${idx}` });
      });
    } else if (product.image) {
      existingImages.push({ uri: product.image, id: 'existing_main' });
    }
    setSelectedImages(existingImages);
    setShowProductModal(true);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Productos</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => setShowProductModal(true)}>
          <Text style={styles.primaryButtonText}>+ Nuevo producto</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.productsList}>
        {products.map((product) => (
          <View key={product.id} style={[styles.productCard, { backgroundColor: theme.colors.surface }]}>
            {product.image ? (
              <Image source={{ uri: product.image }} style={styles.productImage} />
            ) : (
              <View style={[styles.productImage, styles.productImagePlaceholder]}>
                <Ionicons name="image-outline" size={24} color="#9CA3AF" />
              </View>
            )}
            <View style={styles.productInfo}>
              <View style={styles.productNameRow}>
                <Text style={[styles.productName, { color: theme.colors.text }]}>{product.name}</Text>
                {product.is_featured ? (
                  <Ionicons name="star" size={16} color="#FFC107" style={{ marginLeft: 6 }} />
                ) : null}
              </View>
              <Text style={[styles.productCategory, { color: theme.colors.textSecondary }]}>{product.category?.name}</Text>
              <Text style={styles.productPrice}>${Number(product.price || 0).toFixed(2)}</Text>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.editButton}
                activeOpacity={0.7}
                onPress={() => {
                  console.log('[AdminProducts] Edit button pressed');
                  openEditProduct(product);
                }}
              >
                <Ionicons name="create-outline" size={18} color="#22D3EE" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                activeOpacity={0.7}
                onPress={() => {
                  console.log('[AdminProducts] Delete button pressed for product:', product.id);
                  handleDeleteProduct(product.id, product.name);
                }}
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <Modal visible={showProductModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => {
                    setShowProductModal(false);
                    setProductName('');
                    setProductPrice('');
                    setProductDesc('');
                    setSelectedCategory(null);
                    setSelectedImages([]);
                    setEditingProduct(null);
                    setIsFeatured(false);
                  }}
                >
                  <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                  {editingProduct ? 'Editar Producto' : 'Añadir Nuevo Producto'}
                </Text>
              </View>

              {/* ── Two-column layout ── */}
              <View style={styles.formRow}>
                {/* Left Column: Fotos */}
                <View style={styles.formColLeft}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>Fotos</Text>

                  {selectedImages.length === 0 ? (
                    /* No images yet — show picker box */
                    <TouchableOpacity
                      style={[styles.imagePickerBox, { borderColor: theme.colors.border, backgroundColor: theme.isDark ? '#111827' : '#F3F4F6' }]}
                      onPress={pickImages}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="camera" size={36} color={theme.colors.textSecondary} />
                      <Text style={[styles.imagePickerLabel, { color: theme.colors.textSecondary }]}>Añadir Imágenes</Text>
                      <Text style={[styles.imagePickerSub, { color: theme.colors.textSecondary }]}>Toca para seleccionar</Text>
                    </TouchableOpacity>
                  ) : (
                    /* Has images — show main image + thumbnails + add button */
                    <View>
                      {/* Main image preview */}
                      <View style={[styles.mainImageBox, { backgroundColor: theme.isDark ? '#111827' : '#F3F4F6', borderColor: theme.colors.border }]}> 
                        <Image source={{ uri: selectedImages[0].uri }} style={styles.mainImagePreview} />
                        <TouchableOpacity
                          style={styles.removeMainImageBtn}
                          onPress={() => removeImage(selectedImages[0].id)}
                        >
                          <Ionicons name="close-circle" size={24} color="#EF4444" />
                        </TouchableOpacity>
                      </View>

                      {/* Thumbnail row + add more button */}
                      <View style={styles.thumbRow}>
                        {selectedImages.slice(1).map((item) => (
                          <View key={item.id} style={styles.imagePreviewWrapper}>
                            <Image source={{ uri: item.uri }} style={[styles.imagePreview, { borderColor: theme.colors.border }]} />
                            <TouchableOpacity
                              style={styles.removeImageBtn}
                              onPress={() => removeImage(item.id)}
                            >
                              <Ionicons name="close-circle" size={20} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        ))}
                        <TouchableOpacity
                          style={[styles.addMoreImageBtn, { borderColor: theme.colors.border, backgroundColor: theme.isDark ? '#111827' : '#F3F4F6' }]}
                          onPress={pickImages}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="add" size={28} color="#FB923C" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>

                {/* Right Column: Name, Category, Description */}
                <View style={styles.formColRight}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>Nombre del producto</Text>
                  <TextInput
                    style={[styles.formInput, { color: theme.colors.text, backgroundColor: theme.isDark ? '#111827' : '#F3F4F6', borderColor: theme.colors.border }]}
                    placeholder="Nombre del producto"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={productName}
                    onChangeText={setProductName}
                  />

                  <Text style={[styles.label, { color: theme.colors.text }]}>Categoría</Text>
                  {categories.length === 0 ? (
                    <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                      No hay categorías disponibles
                    </Text>
                  ) : (
                    <View style={styles.categoryButtons}>
                      {categories.map((cat) => {
                        const categoryId = cat.id ?? cat.category_id;
                        const isSelected = selectedCategory === categoryId;
                        return (
                          <TouchableOpacity
                            key={categoryId ?? cat.name}
                            style={[
                              styles.categoryButton,
                              { borderColor: theme.colors.border, backgroundColor: theme.isDark ? '#111827' : '#F3F4F6' },
                              isSelected && styles.categoryButtonSelected
                            ]}
                            onPress={() => setSelectedCategory(categoryId)}
                            activeOpacity={0.7}
                          >
                            <MaterialCommunityIcons
                              name={getCategoryIcon(cat.name)}
                              size={18}
                              color={isSelected ? '#fff' : '#FB923C'}
                            />
                            <Text style={[
                              styles.categoryButtonText,
                              { color: theme.colors.text },
                              isSelected && styles.categoryButtonTextSelected
                            ]}>
                              {cat.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  <Text style={[styles.label, { color: theme.colors.text }]}>Descripción</Text>
                  <TextInput
                    style={[styles.formInput, styles.textArea, { color: theme.colors.text, backgroundColor: theme.isDark ? '#111827' : '#F3F4F6', borderColor: theme.colors.border }]}
                    placeholder="Descripción del producto..."
                    placeholderTextColor={theme.colors.textSecondary}
                    multiline
                    numberOfLines={4}
                    value={productDesc}
                    onChangeText={setProductDesc}
                    textAlignVertical="top"
                  />
                </View>
              </View>

              {/* Precio - full width */}
              <Text style={[styles.label, { color: theme.colors.text }]}>Precio</Text>
              <View style={[styles.priceInputContainer, { backgroundColor: theme.isDark ? '#111827' : '#F3F4F6', borderColor: theme.colors.border }]}>
                <Text style={[styles.currencySymbol, { color: theme.colors.textSecondary }]}>$</Text>
                <TextInput
                  style={[styles.priceInput, { color: theme.colors.text }]}
                  placeholder="0.00"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="decimal-pad"
                  value={productPrice}
                  onChangeText={setProductPrice}
                />
              </View>

              {/* Featured Toggle */}
              <View style={[styles.featuredRow, { borderColor: theme.colors.border }]}>
                <View style={styles.featuredLabelRow}>
                  <Ionicons name="star" size={20} color="#FFC107" />
                  <Text style={[styles.featuredLabel, { color: theme.colors.text }]}>Producto Destacado</Text>
                </View>
                <Switch
                  value={isFeatured}
                  onValueChange={setIsFeatured}
                  trackColor={{ false: '#374151', true: '#22D3EE55' }}
                  thumbColor={isFeatured ? '#22D3EE' : '#9CA3AF'}
                />
              </View>

              {/* Publish Button */}
              <TouchableOpacity
                style={styles.publishButton}
                onPress={() => {
                  console.log('[AdminProducts] publish button pressed');
                  handleSaveProduct();
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.publishButtonText}>
                  {editingProduct ? 'Guardar Cambios' : 'Publicar Producto'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={!!deleteConfirmation} transparent animationType="fade">
        <View style={styles.deleteModalOverlay}>
          <View style={[styles.deleteModalContent, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.deleteModalTitle, { color: theme.colors.text }]}>
              Eliminar Producto
            </Text>
            <Text style={[styles.deleteModalMessage, { color: theme.colors.textSecondary }]}>
              ¿Deseas eliminar "{deleteConfirmation?.productName}"? Esta acción no se puede deshacer.
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.cancelButton]}
                onPress={() => setDeleteConfirmation(null)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.deleteButtonConfirm]}
                onPress={confirmDelete}
              >
                <Text style={styles.deleteButtonConfirmText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 28 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  title: { fontSize: 22, fontWeight: '700' },
  primaryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12
  },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  productsList: { gap: 12 },
  productCard: {
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  productImage: { width: 70, height: 70, borderRadius: 10, marginRight: 12 },
  productImagePlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  productInfo: { flex: 1 },
  productNameRow: { flexDirection: 'row', alignItems: 'center' },
  productName: { fontSize: 14, fontWeight: '600' },
  productCategory: { fontSize: 12, marginTop: 4 },
  productPrice: { fontSize: 14, fontWeight: '700', marginTop: 6, color: '#22D3EE' },
  actionButtons: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 10,
  },
  deleteButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    position: 'relative',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    padding: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  formColLeft: {
    flex: 1,
  },
  formColRight: {
    flex: 1.2,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 4,
  },
  imagePickerBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    marginBottom: 12,
  },
  imagePickerLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  imagePickerSub: {
    fontSize: 11,
    marginTop: 2,
  },
  mainImageBox: {
    borderWidth: 1.5,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
    position: 'relative',
  },
  mainImagePreview: {
    width: '100%',
    height: 160,
    borderRadius: 12,
  },
  removeMainImageBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  thumbRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  addMoreImageBtn: {
    width: 64,
    height: 64,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreviewContainer: {
    marginBottom: 12,
    maxHeight: 90,
  },
  imagePreviewWrapper: {
    position: 'relative',
  },
  imagePreview: {
    width: 64,
    height: 64,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#1a1a1a',
    borderRadius: 11,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 13,
    marginBottom: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 10,
  },
  categoryButtonSelected: {
    backgroundColor: '#FB923C',
    borderColor: '#FB923C',
  },
  categoryButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryButtonTextSelected: {
    color: '#fff',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 6,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    fontWeight: '600',
  },
  featuredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  featuredLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featuredLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  publishButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FB923C',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 30,
    shadowColor: '#FB923C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  publishButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deleteModalContent: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  deleteModalMessage: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    borderWidth: 2,
    borderColor: '#22D3EE',
  },
  cancelButtonText: {
    color: '#22D3EE',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButtonConfirm: {
    backgroundColor: '#EF4444',
  },
  deleteButtonConfirmText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
