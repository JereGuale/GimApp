
import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Alert, RefreshControl, Modal, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { SuperAdminService, CategoryService } from '../../services/adminApi';

const { width } = Dimensions.get('window');

export default function AdminDashboard() {
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const { user, token } = useAuth();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [metrics, setMetrics] = useState({ totalUsers: 0, activeSubscriptions: 0, monthlyIncome: 0, expiringSoon: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Todos');
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

  const CATEGORY_COLORS = ['#FB923C', '#22D3EE', '#10B981', '#A78BFA', '#F472B6', '#FBBF24'];

  const getCategoryIcon = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('suplemento') || n.includes('supplement')) return { lib: 'mci', name: 'pill' };
    if (n.includes('ropa') || n.includes('cloth') || n.includes('wear')) return { lib: 'mci', name: 'tshirt-crew' };
    if (n.includes('equip') || n.includes('equipment')) return { lib: 'mci', name: 'dumbbell' };
    if (n.includes('plan') || n.includes('entrenamiento')) return { lib: 'ion', name: 'clipboard-outline' };
    return { lib: 'ion', name: 'cube-outline' };
  };

  const loadData = async () => {
    if (!token) return;
    try {
      const [catData, prodData] = await Promise.all([
        CategoryService.getAll(token).catch(() => []),
        SuperAdminService.getProducts(token).catch(() => []),
      ]);

      const catList = Array.isArray(catData) ? catData : (catData?.data || []);
      setCategories(catList);

      let prodList = [];
      if (Array.isArray(prodData)) prodList = prodData;
      else if (prodData?.data) prodList = prodData.data;
      else if (prodData?.products) prodList = prodData.products;
      setProducts(prodList);

      // Try to load metrics
      try {
        const metricsData = await SuperAdminService.getMetrics(token);
        if (metricsData) {
          setMetrics({
            totalUsers: metricsData.total_users || metricsData.totalUsers || 0,
            activeSubscriptions: metricsData.active_subscriptions || metricsData.activeSubscriptions || 0,
            monthlyIncome: metricsData.monthly_income || metricsData.monthlyIncome || 0,
            expiringSoon: metricsData.expiring_soon || metricsData.expiringSoon || 0,
          });
        }
      } catch (e) {
        console.log('[Dashboard] Metrics not available:', e.message);
      }
    } catch (error) {
      console.error('[Dashboard] Error loading data:', error);
    }
  };

  useEffect(() => { loadData(); }, [token]);

  useFocusEffect(useCallback(() => { loadData(); }, [token]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = !searchQuery ||
      (p.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'Todos' ||
      (p.category?.name || '') === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const handleEditProduct = (product) => {
    navigation.navigate('Productos', { editProduct: product });
  };

  const handleDeleteProduct = (productId, productName) => {
    setDeleteConfirmation({ productId, productName });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;
    try {
      await SuperAdminService.deleteProduct(token, deleteConfirmation.productId);
      setDeleteConfirmation(null);
      Alert.alert('Éxito', 'Producto eliminado correctamente');
      loadData();
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar el producto');
      setDeleteConfirmation(null);
    }
  };

  const filterOptions = ['Todos', ...categories.map(c => c.name)];

  // ─── Mini Sparkline SVG (simplified as dots) ───
  const MiniChart = ({ color, trend }) => {
    const points = trend === 'up'
      ? [8, 6, 7, 4, 5, 3, 2]
      : [3, 4, 2, 5, 6, 7, 8];
    const max = Math.max(...points);
    const h = 28;
    return (
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: h, gap: 2 }}>
        {points.map((v, i) => (
          <View key={i} style={{
            width: 3, borderRadius: 2,
            height: (v / max) * h,
            backgroundColor: color,
            opacity: 0.4 + (i / points.length) * 0.6,
          }} />
        ))}
      </View>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.orange} />}
      showsVerticalScrollIndicator={false}
    >
      {/* ═══ Resumen del Gimnasio ═══ */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Resumen del Gimnasio</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricsRow}>
          {/* Usuarios Totales */}
          <View style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
            <LinearGradient
              colors={isDark ? ['#1E3A8A', '#172554'] : ['#EFF6FF', '#DBEAFE']}
              style={styles.cardGradient}
            >
              <View style={styles.metricHeader}>
                <Text style={[styles.metricLabel, { color: isDark ? '#BFDBFE' : '#3B82F6' }]}>Usuarios Totales</Text>
                <View style={[styles.iconBadge, { backgroundColor: isDark ? 'rgba(59,130,246,0.2)' : '#BFDBFE' }]}>
                  <Ionicons name="people" size={16} color="#3B82F6" />
                </View>
              </View>
              <Text style={[styles.metricValue, { color: theme.colors.text }]}>{metrics.totalUsers}</Text>
              <View style={styles.metricTrend}>
                <Ionicons name="trending-up" size={14} color="#10B981" />
                <Text style={[styles.trendText, { color: '#10B981' }]}>this week</Text>
              </View>
              {/* Background Icon Decoration */}
              <Ionicons name="people" size={80} color={isDark ? 'rgba(255,255,255,0.03)' : 'rgba(59,130,246,0.05)'} style={styles.bgIcon} />
            </LinearGradient>
          </View>

          {/* Ingresos Totales del Mes */}
          <View style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
            <LinearGradient
              colors={isDark ? ['#064E3B', '#022C22'] : ['#ECFDF5', '#D1FAE5']}
              style={styles.cardGradient}
            >
              <View style={styles.metricHeader}>
                <Text style={[styles.metricLabel, { color: isDark ? '#A7F3D0' : '#10B981' }]}>Ingresos del Mes</Text>
                <View style={[styles.iconBadge, { backgroundColor: isDark ? 'rgba(16,185,129,0.2)' : '#A7F3D0' }]}>
                  <Ionicons name="cash" size={16} color="#10B981" />
                </View>
              </View>
              <Text style={[styles.metricValue, { color: theme.colors.text }]}>${metrics.monthlyIncome.toLocaleString()}</Text>
              <View style={styles.metricTrend}>
                <Ionicons name="trending-up" size={14} color="#10B981" />
                <Text style={[styles.trendText, { color: '#10B981' }]}>this month</Text>
              </View>
              <Ionicons name="wallet" size={80} color={isDark ? 'rgba(255,255,255,0.03)' : 'rgba(16,185,129,0.05)'} style={styles.bgIcon} />
            </LinearGradient>
          </View>

          {/* Ingresos Mensuales (Chart placeholder) */}
          <View style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
            <LinearGradient
              colors={isDark ? ['#7C2D12', '#451A03'] : ['#FFF7ED', '#FFEDD5']}
              style={styles.cardGradient}
            >
              <View style={styles.metricHeader}>
                <Text style={[styles.metricLabel, { color: isDark ? '#FDBA74' : '#F97316' }]}>Ingresos Anuales</Text>
                <View style={[styles.iconBadge, { backgroundColor: isDark ? 'rgba(249,115,22,0.2)' : '#FDBA74' }]}>
                  <Ionicons name="bar-chart" size={16} color="#F97316" />
                </View>
              </View>
              <Text style={[styles.metricValue, { color: theme.colors.text }]}>${(metrics.monthlyIncome * 12).toLocaleString()}</Text>
              <Ionicons name="bar-chart" size={80} color={isDark ? 'rgba(255,255,255,0.03)' : 'rgba(249,115,22,0.05)'} style={styles.bgIcon} />
            </LinearGradient>
          </View>
        </ScrollView>
      </View>

      {/* ═══ Estado de Membresías ═══ */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Estado de Membresías</Text>
        <View style={styles.membershipRow}>
          <View style={[styles.membershipCard, { backgroundColor: theme.colors.surface }]}>
            <LinearGradient
              colors={isDark ? ['#1E3A8A', '#172554'] : ['#EFF6FF', '#DBEAFE']}
              style={styles.cardGradient}
            >
              <View style={styles.metricHeader}>
                <Text style={[styles.membershipLabel, { color: isDark ? '#BFDBFE' : '#3B82F6' }]}>Activas Totales</Text>
                <View style={[styles.iconBadge, { backgroundColor: isDark ? 'rgba(59,130,246,0.2)' : '#BFDBFE' }]}>
                  <Ionicons name="card" size={16} color="#3B82F6" />
                </View>
              </View>
              <Text style={[styles.membershipValue, { color: theme.colors.text }]}>{metrics.activeSubscriptions}</Text>
              <View style={styles.metricTrend}>
                <Ionicons name="trending-up" size={14} color="#10B981" />
                <Text style={[styles.trendText, { color: '#10B981' }]}>5% this week</Text>
              </View>
              <Ionicons name="card" size={80} color={isDark ? 'rgba(255,255,255,0.03)' : 'rgba(59,130,246,0.05)'} style={styles.bgIcon} />
            </LinearGradient>
          </View>
          <View style={[styles.membershipCard, { backgroundColor: theme.colors.surface }]}>
            <LinearGradient
              colors={isDark ? ['#141821', '#141821'] : ['#FFFFFF', '#FEF2F2']}
              style={styles.cardGradient}
            >
              <View style={styles.metricHeader}>
                <Text style={[styles.membershipLabel, { color: isDark ? '#FCA5A5' : theme.colors.textSecondary }]}>Por Vencer (7 días)</Text>
                <Ionicons name="alert-circle" size={20} color="#EF4444" />
              </View>
              <Text style={[styles.membershipValue, { color: '#EF4444' }]}>{metrics.expiringSoon}</Text>
              <View style={styles.metricTrend}>
                <Ionicons name="trending-down" size={14} color="#EF4444" />
                <Text style={[styles.trendText, { color: '#EF4444' }]}>Action required</Text>
              </View>
            </LinearGradient>
          </View>
        </View>
      </View>

      {/* ═══ Categorías ═══ */}
      <View style={styles.section}>
        <View style={styles.categorySectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text, marginBottom: 0 }]}>Categorías</Text>
          <TouchableOpacity
            style={styles.addCategoryBtn}
            onPress={() => navigation.navigate('Categorias')}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={16} color="#fff" style={{ marginRight: 4 }} />
            <Text style={styles.addCategoryBtnText}>Añadir Categoría</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.categoriesRow}>
          {categories.map((cat, idx) => {
            const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
            const iconInfo = getCategoryIcon(cat.name);
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, { backgroundColor: theme.colors.surface }]}
                onPress={() => navigation.navigate('Categorias')}
                activeOpacity={0.8}
              >
                <View style={[styles.categoryIconBox, { backgroundColor: color + '25' }]}>
                  {iconInfo.lib === 'mci' ? (
                    <MaterialCommunityIcons name={iconInfo.name} size={24} color={color} />
                  ) : (
                    <Ionicons name={iconInfo.name} size={24} color={color} />
                  )}
                </View>
                <Text style={[styles.categoryChipText, { color: theme.colors.text }]} numberOfLines={1}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
          {categories.length === 0 && (
            <View style={[styles.emptyRow, { backgroundColor: theme.colors.surface, paddingVertical: 20, width: '100%' }]}>
              <Ionicons name="folder-open-outline" size={28} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary, marginTop: 6 }]}>Sin categorías</Text>
            </View>
          )}
        </View>
      </View>

      {/* ═══ Listado de Productos ═══ */}
      <View style={styles.section}>
        <View style={styles.productHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Listado de Productos</Text>
          <TouchableOpacity
            style={styles.addProductBtn}
            onPress={() => navigation.navigate('Productos', { openModal: true })}
            activeOpacity={0.8}
          >
            <Text style={styles.addProductBtnText}>Agregar Producto</Text>
          </TouchableOpacity>
        </View>

        {/* Search & Filter Bar */}
        <View style={styles.searchFilterRow}>
          <View style={[styles.searchBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Ionicons name="search-outline" size={18} color={isDark ? '#9CA3AF' : theme.colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Buscar..."
              placeholderTextColor={isDark ? '#9CA3AF' : theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {filterOptions.map((f) => (
              <TouchableOpacity
                key={f}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: selectedFilter === f ? (theme.colors.orange || '#FB923C') : theme.colors.surface,
                    borderColor: selectedFilter === f ? (theme.colors.orange || '#FB923C') : theme.colors.border
                  }
                ]}
                onPress={() => setSelectedFilter(f)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.filterChipText,
                  { color: selectedFilter === f ? '#fff' : (isDark ? '#E5E7EB' : theme.colors.textSecondary) }
                ]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Products Table Header */}
        <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ width: '100%' }}>
          <View style={{ minWidth: 700, width: '100%' }}>
            <View style={[styles.tableHeader, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.thCell, styles.thImage, { color: isDark ? '#FFFFFF' : theme.colors.textSecondary }]}>Imagen</Text>
              <Text style={[styles.thCell, styles.thName, { color: isDark ? '#FFFFFF' : theme.colors.textSecondary }]}>Nombre</Text>
              <Text style={[styles.thCell, styles.thCategory, { color: isDark ? '#FFFFFF' : theme.colors.textSecondary }]}>Categoría</Text>
              <Text style={[styles.thCell, styles.thPrice, { color: isDark ? '#FFFFFF' : theme.colors.textSecondary }]}>Precio</Text>
              <Text style={[styles.thCell, styles.thActions, { color: isDark ? '#FFFFFF' : theme.colors.textSecondary }]}>Acciones</Text>
            </View>

            {/* Products Rows */}
            {filteredProducts.length === 0 ? (
              <View style={[styles.emptyRow, { backgroundColor: theme.colors.surface }]}>
                <Ionicons name="cube-outline" size={32} color={theme.colors.textSecondary} style={{ marginBottom: 8 }} />
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  {searchQuery ? 'No se encontraron productos' : 'No hay productos aún'}
                </Text>
              </View>
            ) : (
              filteredProducts.map((product, index) => (
                <View
                  key={product.id}
                  style={[
                    styles.tableRow,
                    {
                      backgroundColor: index % 2 === 0 ? theme.colors.surface : (isDark ? '#0F1520' : '#F9FAFB'),
                      borderColor: theme.colors.border
                    }
                  ]}
                >
                  {/* Image */}
                  <View style={styles.tdImage}>
                    {product.image ? (
                      <Image source={{ uri: product.image }} style={styles.productThumb} />
                    ) : (
                      <View style={[styles.productThumb, styles.thumbPlaceholder, { backgroundColor: theme.isDark ? '#1F2937' : '#E5E7EB' }]}>
                        <Ionicons name="image-outline" size={16} color={theme.colors.textSecondary} />
                      </View>
                    )}
                  </View>

                  {/* Name */}
                  <View style={styles.tdName}>
                    <Text style={[styles.productName, { color: theme.colors.text }]} numberOfLines={1}>
                      {product.name}
                    </Text>
                  </View>

                  {/* Category */}
                  <View style={styles.tdCategory}>
                    <Text style={[styles.productCategory, { color: isDark ? '#D1D5DB' : theme.colors.textSecondary }]} numberOfLines={1}>
                      {product.category?.name || '-'}
                    </Text>
                  </View>

                  {/* Price */}
                  <View style={styles.tdPrice}>
                    <Text style={styles.productPrice}>${Number(product.price || 0).toFixed(2)}</Text>
                  </View>

                  {/* Actions */}
                  <View style={styles.tdActions}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.viewBtn]}
                      onPress={() => handleEditProduct(product)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="eye-outline" size={16} color="#3B82F6" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.editBtn]}
                      onPress={() => handleEditProduct(product)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="create-outline" size={16} color="#FB923C" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.deleteBtn]}
                      onPress={() => handleDeleteProduct(product.id, product.name)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* Product Count */}
        {filteredProducts.length > 0 && (
          <Text style={[styles.productCount, { color: isDark ? '#9CA3AF' : theme.colors.textSecondary }]}>
            {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''}
            {selectedFilter !== 'Todos' ? ` en ${selectedFilter}` : ''}
          </Text>
        )}
      </View>

      {/* ═══ Delete Confirmation Modal ═══ */}
      <Modal visible={!!deleteConfirmation} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmModal, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.confirmIconBox}>
              <Ionicons name="warning-outline" size={36} color="#EF4444" />
            </View>
            <Text style={[styles.confirmTitle, { color: theme.colors.text }]}>Eliminar Producto</Text>
            <Text style={[styles.confirmMsg, { color: theme.colors.textSecondary }]}>
              ¿Estás seguro de eliminar{'\n'}
              <Text style={{ fontWeight: '700', color: theme.colors.text }}>
                {deleteConfirmation?.productName}
              </Text>?{'\n'}Esta acción no se puede deshacer.
            </Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.cancelBtn, { borderColor: theme.colors.border }]}
                onPress={() => setDeleteConfirmation(null)}
              >
                <Text style={[styles.confirmBtnText, { color: theme.colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.deleteBtnConfirm]}
                onPress={confirmDelete}
              >
                <Ionicons name="trash-outline" size={16} color="#fff" style={{ marginRight: 4 }} />
                <Text style={[styles.confirmBtnText, { color: '#fff' }]}>Eliminar</Text>
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
  content: { padding: 16, paddingBottom: 40 },

  /* ── Section ── */
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12, letterSpacing: 0.2 },

  /* ── Metrics ── */
  metricsRow: { gap: 16, paddingRight: 16 },
  metricCard: {
    width: width * 0.65,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 20,
    width: '100%',
    height: '100%',
  },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, zIndex: 1 },
  metricLabel: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  iconBadge: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  metricValue: { fontSize: 36, fontWeight: '900', marginBottom: 6, zIndex: 1 },
  metricTrend: { flexDirection: 'row', alignItems: 'center', gap: 6, zIndex: 1 },
  trendText: { fontSize: 13, fontWeight: '700' },
  bgIcon: { position: 'absolute', right: -10, bottom: -10, transform: [{ rotate: '-15deg' }] },

  /* ── Membership ── */
  membershipRow: { flexDirection: 'row', gap: 12 },
  membershipCard: {
    flex: 1,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
  },
  membershipLabel: { fontSize: 13, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.3 },
  membershipValue: { fontSize: 36, fontWeight: '900', marginBottom: 6 },

  /* ── Categories ── */
  categorySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addCategoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FB923C',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    shadowColor: '#FB923C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  addCategoryBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  categoryIconBox: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  categoryChipText: { fontSize: 15, fontWeight: '700' },

  /* ── Products Header ── */
  productHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addProductBtn: {
    backgroundColor: '#FB923C',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    shadowColor: '#FB923C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addProductBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  /* ── Search & Filter ── */
  searchFilterRow: { marginBottom: 12 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, height: '100%' },
  filterScroll: { marginBottom: 4 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipText: { fontSize: 12, fontWeight: '600' },

  /* ═══ Table ═══ */
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 2,
  },
  thCell: { fontWeight: '800', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 },
  thImage: { width: 64 },
  thName: { flex: 1.5 },
  thCategory: { flex: 1, textAlign: 'center' },
  thPrice: { flex: 0.7, textAlign: 'right' },
  thActions: { flex: 1, textAlign: 'center' },

  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    minHeight: 72,
  },
  tdImage: { width: 64 },
  productThumb: { width: 52, height: 52, borderRadius: 12 },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  tdName: { flex: 1.5 },
  productName: { fontSize: 15, fontWeight: '700' },
  tdCategory: { flex: 1, alignItems: 'center' },
  productCategory: { fontSize: 14 },
  tdPrice: { flex: 0.7, alignItems: 'flex-end' },
  productPrice: { fontSize: 16, fontWeight: '800', color: '#10B981' },
  tdActions: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 10 },

  actionBtn: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  viewBtn: { backgroundColor: 'rgba(59, 130, 246, 0.12)' },
  editBtn: { backgroundColor: 'rgba(251, 146, 60, 0.12)' },
  deleteBtn: { backgroundColor: 'rgba(239, 68, 68, 0.12)' },

  emptyRow: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 40, borderRadius: 10, marginTop: 4,
  },
  emptyText: { fontSize: 14, fontWeight: '500' },

  productCount: { fontSize: 12, fontWeight: '500', marginTop: 8, textAlign: 'right' },

  /* ── Delete Modal ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  confirmModal: {
    width: '100%',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  confirmIconBox: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  confirmTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  confirmMsg: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  confirmBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  confirmBtn: {
    flex: 1, flexDirection: 'row',
    paddingVertical: 14, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelBtn: { borderWidth: 1.5 },
  deleteBtnConfirm: { backgroundColor: '#EF4444' },
  confirmBtnText: { fontSize: 15, fontWeight: '700' },
});
