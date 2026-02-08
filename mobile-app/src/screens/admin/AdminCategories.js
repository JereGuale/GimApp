
import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, RefreshControl, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { CategoryService } from '../../services/adminApi';

const CATEGORY_ICONS = [
  'nutrition-outline', 'shirt-outline', 'barbell-outline', 'basketball-outline',
  'bicycle-outline', 'body-outline', 'fitness-outline', 'footsteps-outline',
  'heart-outline', 'leaf-outline', 'medal-outline', 'water-outline',
];

const CATEGORY_COLORS = ['#FB923C', '#22D3EE', '#A78BFA', '#34D399', '#F472B6', '#60A5FA', '#FBBF24', '#F87171'];

export default function AdminCategories() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const loadCategories = async () => {
    if (!token) return;
    try {
      const data = await CategoryService.getAll(token);
      const list = Array.isArray(data) ? data : (data?.data || []);
      setItems(list);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [token])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCategories();
    setRefreshing(false);
  };

  const handleSave = async () => {
    const value = draft.trim();
    if (!value) return;
    try {
      if (editingId) {
        await CategoryService.update(token, editingId, { name: value });
        setEditingId(null);
      } else {
        await CategoryService.create(token, { name: value });
      }
      setDraft('');
      setShowForm(false);
      loadCategories();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la categoría');
      console.error('Error saving category:', error);
    }
  };

  const handleEdit = (item) => {
    setDraft(item.name || '');
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setDraft('');
    setEditingId(null);
    setShowForm(false);
  };

  const handleDelete = (item) => {
    Alert.alert(
      'Eliminar Categoría',
      `¿Estás seguro que deseas eliminar "${item.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await CategoryService.remove(token, item.id);
              if (editingId === item.id) {
                setEditingId(null);
                setDraft('');
              }
              loadCategories();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la categoría');
            }
          }
        }
      ]
    );
  };

  const getCategoryColor = (index) => CATEGORY_COLORS[index % CATEGORY_COLORS.length];
  const getCategoryIcon = (index) => CATEGORY_ICONS[index % CATEGORY_ICONS.length];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FB923C" />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header row */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: theme.colors.text }]}>Categorías</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {items.length} categoría{items.length !== 1 ? 's' : ''} registrada{items.length !== 1 ? 's' : ''}
          </Text>
        </View>
        {!showForm && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowForm(true)}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addBtnText}>Nueva</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Add / Edit form */}
      {showForm && (
        <View style={[styles.formCard, { backgroundColor: theme.colors.surface, borderColor: editingId ? '#22D3EE' : '#FB923C' }]}>
          <View style={styles.formHeader}>
            <View style={styles.formTitleRow}>
              <View style={[styles.formIconCircle, { backgroundColor: editingId ? 'rgba(34,211,238,0.15)' : 'rgba(251,146,60,0.15)' }]}>
                <Ionicons name={editingId ? 'create-outline' : 'add-circle-outline'} size={20} color={editingId ? '#22D3EE' : '#FB923C'} />
              </View>
              <Text style={[styles.formTitle, { color: theme.colors.text }]}>
                {editingId ? 'Editar Categoría' : 'Nueva Categoría'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleCancelEdit} style={styles.closeFormBtn}>
              <Ionicons name="close" size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Nombre</Text>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Ej: Suplementos, Ropa Deportiva..."
            placeholderTextColor={theme.isDark ? '#6B7280' : '#9CA3AF'}
            style={[styles.input, {
              backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              borderColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              color: theme.colors.text
            }]}
            autoFocus
          />

          <View style={styles.formBtns}>
            <TouchableOpacity style={[styles.cancelBtn, { borderColor: theme.colors.border }]} onPress={handleCancelEdit}>
              <Text style={[styles.cancelBtnText, { color: theme.colors.textSecondary }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: editingId ? '#22D3EE' : '#FB923C', opacity: draft.trim() ? 1 : 0.5 }]}
              onPress={handleSave}
              disabled={!draft.trim()}
            >
              <Ionicons name={editingId ? 'checkmark' : 'add'} size={18} color="#fff" />
              <Text style={styles.saveBtnText}>{editingId ? 'Guardar' : 'Agregar'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Category cards list */}
      {items.length === 0 ? (
        <View style={[styles.emptyContainer, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.emptyIcon, { backgroundColor: 'rgba(251,146,60,0.12)' }]}>
            <Ionicons name="folder-open-outline" size={48} color="#FB923C" />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Sin categorías</Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
            Agrega tu primera categoría para organizar tus productos
          </Text>
        </View>
      ) : (
        <View style={styles.cardList}>
          {items.map((item, index) => {
            const color = getCategoryColor(index);
            const icon = getCategoryIcon(index);

            return (
              <View
                key={item.id}
                style={[styles.categoryCard, {
                  backgroundColor: theme.colors.surface,
                  borderLeftColor: color,
                  shadowColor: theme.isDark ? '#000' : '#999',
                }]}
              >
                <View style={styles.cardContent}>
                  <View style={[styles.iconCircle, { backgroundColor: color + '18' }]}>
                    <Ionicons name={icon} size={24} color={color} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.categoryName, { color: theme.colors.text }]}>{item.name}</Text>
                    <Text style={[styles.categoryMeta, { color: theme.colors.textSecondary }]}>
                      {item.products_count !== undefined ? `${item.products_count} producto${item.products_count !== 1 ? 's' : ''}` : 'Categoría'}
                    </Text>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={[styles.iconBtn, {
                        backgroundColor: theme.isDark ? 'rgba(34,211,238,0.1)' : 'rgba(34,211,238,0.08)',
                        borderColor: 'rgba(34,211,238,0.3)',
                      }]}
                      onPress={() => handleEdit(item)}
                    >
                      <Ionicons name="pencil" size={16} color="#22D3EE" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.iconBtn, {
                        backgroundColor: theme.isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.08)',
                        borderColor: 'rgba(239,68,68,0.3)',
                      }]}
                      onPress={() => handleDelete(item)}
                    >
                      <Ionicons name="trash" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },

  /* Header */
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: 0.3 },
  subtitle: { fontSize: 13, fontWeight: '500', marginTop: 3 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FB923C', paddingHorizontal: 16,
    paddingVertical: 10, borderRadius: 12,
    shadowColor: '#FB923C', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 4,
  },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  /* Form */
  formCard: {
    borderRadius: 16, padding: 18, marginBottom: 20,
    borderWidth: 1.5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  formHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  formTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  formIconCircle: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  formTitle: { fontSize: 17, fontWeight: '700' },
  closeFormBtn: { padding: 4 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 14, height: 48,
    fontSize: 15, fontWeight: '500', marginBottom: 16,
  },
  formBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1.5, alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '700' },
  saveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6, paddingVertical: 12,
    borderRadius: 12, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  /* Empty */
  emptyContainer: {
    borderRadius: 20, padding: 40, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  emptyIcon: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },

  /* Cards */
  cardList: { gap: 12 },
  categoryCard: {
    borderRadius: 16, borderLeftWidth: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  cardContent: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, gap: 14,
  },
  iconCircle: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  categoryName: { fontSize: 16, fontWeight: '700', marginBottom: 3 },
  categoryMeta: { fontSize: 12, fontWeight: '500' },
  cardActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
});
