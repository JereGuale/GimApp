import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Image, Alert, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { SuperAdminService, CategoryService } from '../../services/adminApi';

export default function SuperAdminDashboard() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const [metrics, setMetrics] = useState({
    revenue_by_month: [],
    registrations_by_month: [],
    peak_hours: []
  });
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  
  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [mainImageUrl, setMainImageUrl] = useState('');

  useEffect(() => {
    let isMounted = true;
    const loadMetrics = async () => {
      try {
        const data = await SuperAdminService.getMetrics(token);
        if (isMounted) setMetrics(data);
      } catch (error) {
        console.error('Error loading metrics:', error);
      }
    };

    if (token) loadMetrics();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const loadCategories = async () => {
    try {
      const data = await CategoryService.getAll(token);
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await CategoryService.getAll(token);
      const allProducts = data.flatMap(cat => cat.products || []);
      setProducts(allProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  useEffect(() => {
    if (token) {
      loadCategories();
      loadProducts();
    }
  }, [token]);

  const handleAddCategory = async () => {
    if (!categoryName.trim()) {
      Alert.alert('Error', 'Por favor ingresa el nombre de la categoría');
      return;
    }
    try {
      await SuperAdminService.createCategory(token, { name: categoryName });
      setCategoryName('');
      setShowCategoryModal(false);
      loadCategories();
      Alert.alert('Éxito', 'Categoría creada correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear la categoría');
      console.error('Error:', error);
    }
  };

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

  const removeImage = (id) => {
    setSelectedImages(selectedImages.filter(img => img.id !== id));
  };

  const handleAddProduct = async () => {
    if (!productName.trim() || !productPrice.trim() || !selectedCategory) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }
    try {
      const images = selectedImages.length > 0 
        ? selectedImages.map(img => img.uri)
        : mainImageUrl ? [mainImageUrl] : [];

      await SuperAdminService.createProduct(token, {
        name: productName,
        price: parseFloat(productPrice),
        description: productDesc,
        category_id: selectedCategory,
        is_featured: true,
        images: images,
        image: images[0] || mainImageUrl || null
      });
      setProductName('');
      setProductPrice('');
      setProductDesc('');
      setSelectedCategory(null);
      setSelectedImages([]);
      setMainImageUrl('');
      setShowProductModal(false);
      loadProducts();
      Alert.alert('Éxito', 'Producto creado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear el producto');
      console.error('Error:', error);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Dashboard Super Admin</Text>

      {/* Métricas */}
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Ingresos Mensuales</Text>
        {metrics.revenue_by_month.length === 0 ? (
          <Text style={styles.emptyText}>Sin datos</Text>
        ) : (
          metrics.revenue_by_month.map((item) => (
            <View key={item.month} style={styles.row}>
              <Text style={[styles.rowLabel, { color: theme.colors.textSecondary }]}>{item.month}</Text>
              <Text style={[styles.rowValue, { color: theme.colors.text }]}>${Number(item.total).toFixed(2)}</Text>
            </View>
          ))
        )}
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Nuevos Registros</Text>
        {metrics.registrations_by_month.length === 0 ? (
          <Text style={styles.emptyText}>Sin datos</Text>
        ) : (
          metrics.registrations_by_month.map((item) => (
            <View key={item.month} style={styles.row}>
              <Text style={[styles.rowLabel, { color: theme.colors.textSecondary }]}>{item.month}</Text>
              <Text style={[styles.rowValue, { color: theme.colors.text }]}>{item.total}</Text>
            </View>
          ))
        )}
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Horas Pico</Text>
        {metrics.peak_hours.length === 0 ? (
          <Text style={styles.emptyText}>Sin datos</Text>
        ) : (
          metrics.peak_hours.map((item) => (
            <View key={item.hour} style={styles.row}>
              <Text style={[styles.rowLabel, { color: theme.colors.textSecondary }]}>{`${item.hour}:00`}</Text>
              <Text style={[styles.rowValue, { color: theme.colors.text }]}>{item.total}</Text>
            </View>
          ))
        )}
      </View>

      {/* Categorías */}
      <View style={[styles.section]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Categorías</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowCategoryModal(true)}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Agregar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.categoriesGrid}>
          {categories.map((cat) => (
            <View key={cat.id} style={[styles.categoryCard, { backgroundColor: theme.colors.surface, borderColor: '#22D3EE' }]}>
              <Ionicons name="folder" size={32} color="#22D3EE" />
              <Text style={[styles.categoryName, { color: theme.colors.text }]}>{cat.name}</Text>
              <Text style={[styles.categoryCount, { color: theme.colors.textSecondary }]}>
                {cat.products?.length || 0} productos
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Productos */}
      <View style={[styles.section]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Productos</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowProductModal(true)}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Agregar</Text>
          </TouchableOpacity>
        </View>

        {products.length === 0 ? (
          <Text style={[styles.emptyText]}>Sin productos</Text>
        ) : (
          products.map((product) => (
            <View key={product.id} style={[styles.productCard, { backgroundColor: theme.colors.surface }]}>
              {product.image && <Image source={{ uri: product.image }} style={styles.productImage} />}
              <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: theme.colors.text }]}>{product.name}</Text>
                <Text style={[styles.productPrice, { color: '#22D3EE' }]}>${Number(product.price).toFixed(2)}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Modal Agregar Categoría */}
      <Modal visible={showCategoryModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Nueva Categoría</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: '#22D3EE' }]}
              placeholder="Nombre de la categoría"
              placeholderTextColor={theme.colors.textSecondary}
              value={categoryName}
              onChangeText={setCategoryName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowCategoryModal(false); setCategoryName(''); }}>
                <Text style={styles.btnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleAddCategory}>
                <Text style={styles.btnText}>Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Agregar Producto */}
      <Modal visible={showProductModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Nuevo Producto</Text>

            <TouchableOpacity style={[styles.imagePickerBtn, { backgroundColor: '#22D3EE' }]} onPress={pickImages}>
              <Ionicons name="image-outline" size={24} color="#fff" />
              <Text style={styles.imagePickerText}>
                Seleccionar Imágenes ({selectedImages.length})
              </Text>
            </TouchableOpacity>

            {selectedImages.length > 0 && (
              <View style={styles.imagePreviewContainer}>
                <Text style={[styles.imagePreviewTitle, { color: theme.colors.text }]}>
                  {selectedImages.length} imagen(es) seleccionada(s)
                </Text>
                <FlatList
                  horizontal
                  data={selectedImages}
                  renderItem={({ item }) => (
                    <View style={styles.imagePreviewWrapper}>
                      <Image source={{ uri: item.uri }} style={styles.imagePreview} />
                      <TouchableOpacity
                        style={styles.removeImageBtn}
                        onPress={() => removeImage(item.id)}
                      >
                        <Ionicons name="close-circle" size={24} color="#ff3333" />
                      </TouchableOpacity>
                    </View>
                  )}
                  keyExtractor={item => item.id}
                  scrollEnabled={true}
                  showsHorizontalScrollIndicator={false}
                />
              </View>
            )}
            
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: '#22D3EE' }]}
              placeholder="Nombre del producto"
              placeholderTextColor={theme.colors.textSecondary}
              value={productName}
              onChangeText={setProductName}
            />

            {categories.length > 0 && (
              <View style={styles.categorySelector}>
                <Text style={[styles.selectorLabel, { color: theme.colors.text }]}>Categoría:</Text>
                <View style={styles.categoryOptions}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryOption,
                        selectedCategory === cat.id && styles.categoryOptionSelected
                      ]}
                      onPress={() => setSelectedCategory(cat.id)}
                    >
                      <Text style={[styles.categoryOptionText, selectedCategory === cat.id && { color: '#000' }]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: '#22D3EE' }]}
              placeholder="Precio"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="decimal-pad"
              value={productPrice}
              onChangeText={setProductPrice}
            />

            <TextInput
              style={[styles.input, styles.inputMultiline, { color: theme.colors.text, borderColor: '#22D3EE' }]}
              placeholder="Descripción (opcional)"
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={3}
              value={productDesc}
              onChangeText={setProductDesc}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => {
                  setShowProductModal(false);
                  setProductName('');
                  setProductPrice('');
                  setProductDesc('');
                  setSelectedCategory(null);
                  setSelectedImages([]);
                  setMainImageUrl('');
                }}
              >
                <Text style={styles.btnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleAddProduct}>
                <Text style={styles.btnText}>Crear</Text>
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
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)'
  },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  rowLabel: { fontSize: 13 },
  rowValue: { fontSize: 13, fontWeight: '600' },
  emptyText: { color: '#9CA3AF', fontSize: 12 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22D3EE',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4
  },
  addButtonText: { color: '#000', fontWeight: '600', fontSize: 12 },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  categoryCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  categoryName: { fontSize: 14, fontWeight: '600', marginTop: 8, textAlign: 'center' },
  categoryCount: { fontSize: 12, marginTop: 4 },
  productCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)'
  },
  productImage: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '600' },
  productPrice: { fontSize: 14, fontWeight: '700', marginTop: 4, color: '#22D3EE' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    width: '85%',
    padding: 20,
    borderRadius: 16,
    maxHeight: '90%'
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  input: {
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 14
  },
  inputMultiline: { textAlignVertical: 'top' },
  categorySelector: { marginBottom: 12 },
  selectorLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  categoryOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(34, 211, 238, 0.2)',
    borderWidth: 2,
    borderColor: '#22D3EE'
  },
  categoryOptionSelected: {
    backgroundColor: '#22D3EE',
    borderColor: '#22D3EE'
  },
  categoryOptionText: { color: '#22D3EE', fontSize: 12, fontWeight: '600' },
  modalButtons: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, backgroundColor: '#666', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  submitBtn: { flex: 1, backgroundColor: '#22D3EE', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#000', fontWeight: '700', fontSize: 14 },
  imagePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8
  },
  imagePickerText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14
  },
  imagePreviewContainer: {
    marginBottom: 16,
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    borderRadius: 8,
    padding: 10
  },
  imagePreviewTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8
  },
  imagePreviewWrapper: {
    position: 'relative',
    marginRight: 12
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#333'
  },
  removeImageBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12
  }
});
