
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { CategoryService } from '../../services/adminApi';

export default function AdminCategories() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState(null);

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

  useEffect(() => {
    loadCategories();
  }, [token]);

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
      loadCategories();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la categoría');
      console.error('Error saving category:', error);
    }
  };

  const handleEdit = (item) => {
    setDraft(item.name || '');
    setEditingId(item.id);
  };

  const handleDelete = async (item) => {
    try {
      await CategoryService.remove(token, item.id);
      if (editingId === item.id) {
        setEditingId(null);
        setDraft('');
      }
      loadCategories();
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar la categoría');
      console.error('Error deleting category:', error);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Categorias</Text>

      <View style={styles.formCard}>
        <Text style={styles.label}>Nombre de categoria</Text>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Ej: Suplementos"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
        />
        <TouchableOpacity style={styles.btn} onPress={handleSave}>
          <Text style={styles.btnText}>{editingId ? 'Guardar cambios' : 'Agregar categoria'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listCard}>
        {items.length === 0 ? (
          <View style={styles.listRow}>
            <Text style={styles.itemText}>No hay categorías</Text>
          </View>
        ) : (
          items.map((item) => (
            <View key={item.id} style={styles.listRow}>
              <Text style={styles.itemText}>{item.name}</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(item)}>
                  <Text style={styles.actionText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item)}>
                  <Text style={styles.actionText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F14' },
  content: { padding: 16, paddingBottom: 28 },
  title: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginBottom: 16 },
  formCard: { backgroundColor: '#111827', borderRadius: 14, padding: 14, marginBottom: 16 },
  label: { color: '#9CA3AF', fontSize: 12, marginBottom: 8 },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    color: '#FFFFFF',
    marginBottom: 12
  },
  btn: { backgroundColor: '#2563EB', paddingVertical: 12, borderRadius: 10 },
  btnText: { color: '#FFFFFF', textAlign: 'center', fontWeight: '700', fontSize: 13 },
  listCard: { backgroundColor: '#111827', borderRadius: 14, overflow: 'hidden' },
  listRow: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937'
  },
  itemText: { color: '#E5E7EB', fontSize: 13, marginBottom: 10 },
  actionRow: { flexDirection: 'row', gap: 10 },
  editButton: { backgroundColor: '#2563EB', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8 },
  deleteButton: { backgroundColor: '#B91C1C', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8 },
  actionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' }
});
