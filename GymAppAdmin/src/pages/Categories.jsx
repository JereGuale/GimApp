import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import ConfirmModal from '../components/ConfirmModal';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Loader2, 
  FolderOpen, 
  Pencil, 
  Trash2, 
  X 
} from 'lucide-react';
import '../components/Layout.css';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, category: null });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchCategories = () => {
    setLoading(true);
    apiFetch('/admin/categories')
      .then(d => setCategories(Array.isArray(d) ? d : (d?.data || [])))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Reset pagination when categories list size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [categories.length]);

  const handleOpenAdd = () => {
    setEditId(null);
    setName('');
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditId(c.id);
    setName(c.name || '');
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('El nombre es requerido'); return; }
    setError(''); setSuccess('');
    try {
      if (editId) {
        await apiFetch(`/admin/categories/${editId}`, {
          method: 'PUT',
          body: JSON.stringify({ name }),
        });
        setSuccess('Categoría actualizada');
      } else {
        await apiFetch('/admin/categories', {
          method: 'POST',
          body: JSON.stringify({ name }),
        });
        setSuccess('Categoría creada');
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      setError(err.message || 'Error al guardar la categoría');
    }
  };

  const handleOpenDelete = (c) => {
    setDeleteConfirm({ isOpen: true, category: c });
  };

  const handleConfirmDelete = async () => {
    const c = deleteConfirm.category;
    if (!c) return;
    setError(''); setSuccess('');
    try {
      await apiFetch(`/admin/categories/${c.id}`, { method: 'DELETE' });
      setSuccess('Categoría eliminada');
      fetchCategories();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la categoría');
    }
  };

  // Calculate paginated slice
  const totalPages = Math.ceil(categories.length / itemsPerPage);
  const paginatedCategories = categories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div>
      {error && <div className="alert alert--error"><AlertTriangle size={16} /> <span>{error}</span></div>}
      {success && <div className="alert alert--success"><CheckCircle2 size={16} /> <span>{success}</span></div>}

      <div className="page-header">
        <h2>Categorías de Productos</h2>
        <button className="btn btn--primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={handleOpenAdd}>
          <Plus size={16} />
          <span>Nueva Categoría</span>
        </button>
      </div>

      {loading ? (
        <div className="loading-state"><Loader2 className="spin" size={24} /> <span>Cargando categorías...</span></div>
      ) : categories.length === 0 ? (
        <div className="empty-state"><div className="empty-icon"><FolderOpen size={40} /></div><p>No hay categorías registradas</p></div>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Productos Asignados</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCategories.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text)' }}>{c.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{c.products?.length ?? 0} productos</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn--ghost" style={{ padding: '6px 12px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={() => handleOpenEdit(c)}>
                          <Pencil size={12} />
                          <span>Editar</span>
                        </button>
                        <button className="btn btn--danger" style={{ padding: '6px 12px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={() => handleOpenDelete(c)}>
                          <Trash2 size={12} />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {categories.length > 0 && (
            <div className="pagination">
              <button 
                className="btn btn--secondary" 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </button>
              <span className="pagination-info">Página {currentPage} de {totalPages || 1}</span>
              <button 
                className="btn btn--secondary" 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>{editId ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
              <button className="btn btn--ghost" style={{ padding: 6, borderRadius: '50%' }} onClick={() => setModalOpen(false)}><X size={16} /></button>
            </div>
            <form className="modal-form" onSubmit={handleSave}>
              <div className="form-group">
                <label>Nombre de la Categoría</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej. Suplementos, Accesorios..."
                  autoFocus
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn--ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn--primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Eliminar Categoría"
        message={`¿Estás seguro de que deseas eliminar la categoría "${deleteConfirm.category?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar Categoría"
        cancelText="Cancelar"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteConfirm({ isOpen: false, category: null })}
      />
    </div>
  );
}
