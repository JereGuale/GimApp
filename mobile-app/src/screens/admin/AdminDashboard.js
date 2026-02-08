
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuth();

  const categories = [
    { id: 1, name: 'Suplementos', icon: 'help-circle-outline', color: '#22D3EE' },
    { id: 2, name: 'Ropa Deportiva', icon: 'shirt-outline', color: '#FB923C' },
    { id: 3, name: 'Otros', icon: 'barbell', color: '#8B5CF6' },
  ];

  const products = [
    { id: 1, name: 'Creatina Monohidratada', price: 30.00, category: 'Suplementos' },
    { id: 2, name: 'Proteína Whey', price: 25.00, category: 'Suplementos' },
    { id: 3, name: 'Camiseta Deportiva', price: 20.00, category: 'Ropa Deportiva' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <Text style={[styles.mainTitle, { color: theme.colors.text }]}>Fitness Hub</Text>

      {/* Categorías */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Categorías</Text>
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>Agregar Categoría</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.categoriesGrid}>
          {categories.map((cat) => (
            <View key={cat.id} style={[styles.categoryCard, { backgroundColor: theme.colors.surface, borderColor: cat.color }]}>
              {cat.icon === 'barbell' ? (
                <MaterialCommunityIcons name="dumbbell" size={40} color={cat.color} />
              ) : (
                <Ionicons name={cat.icon} size={40} color={cat.color} />
              )}
              <Text style={[styles.categoryName, { color: theme.colors.text }]}>{cat.name}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Productos */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Listado de Productos</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('Productos', { openModal: true })}
          >
            <Text style={styles.addButtonText}>Agregar Producto</Text>
          </TouchableOpacity>
        </View>
        {products.map((product) => (
          <View key={product.id} style={[styles.productCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.productImagePlaceholder}>
              <Ionicons name="image-outline" size={32} color="#666" />
            </View>
            <View style={styles.productInfo}>
              <Text style={[styles.productName, { color: theme.colors.text }]}>{product.name}</Text>
              <Text style={[styles.productCategory, { color: theme.colors.textSecondary }]}>{product.category}</Text>
              <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
            </View>
            <View style={styles.productActions}>
              <TouchableOpacity style={[styles.actionBtn, styles.editBtn]}>
                <Ionicons name="create-outline" size={22} color="#22D3EE" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]}>
                <Ionicons name="trash-outline" size={22} color="#ff3333" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  mainTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  section: { marginBottom: 28 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    flex: 1,
    minWidth: '30%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#22D3EE',
    marginBottom: 12,
  },
  productImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 14,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: { flex: 1 },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 13,
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FB923C',
  },
  productActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  editBtn: {
    backgroundColor: 'rgba(34, 211, 238, 0.15)',
  },
  deleteBtn: {
    backgroundColor: 'rgba(255, 51, 51, 0.15)',
  },
});
