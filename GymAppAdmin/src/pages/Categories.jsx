import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import '../components/Layout.css';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const handleDelete = async (c) => {
    if (!window.confirm(`¿Estás seguro de eliminar la categoría "${c.name}"?`)) return;
    setError(''); setSuccess('');
    try {
      await apiFetch(`/admin/categories/${c.id}`, { method: 'DELETE' });
      setSuccess('Categoría eliminada');
      fetchCategories();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la categoría');
    }
  };

  return (
    <div>
      {error && <div className="alert alert--error">⚠️ {error}</div>}
      {success && <div className="alert alert--success">✅ {success}</div>}

      <div className="page-header">
        <h2>Categorías de Productos</h2>
        <button className="btn btn--primary" onClick={handleOpenAdd}>
          ➕ Nueva Categoría
        </button>
      </div>

      {loading ? (
        <div className="loading-state"><span className="spin">⏳</span> Cargando categorías...</div>
      ) : categories.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📂</div><p>No hay categorías registradas</p></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Productos Asignados</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(c => (
                <tr key={c.id}>
                  <td style={{ color: '#475569' }}>{c.id}</td>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td>{c.products?.length ?? 0}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn--ghost" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => handleOpenEdit(c)}>
                        ✏️ Editar
                      </button>
                      <button className="btn btn--danger" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => handleDelete(c)}>
                        🗑️ Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editId ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
            <form className="modal-form" onSubmit={handleSave}>
              <div className="form-group">
                <label>Nombre de la Categoría</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej. Suplementos, Accesorios..."
                  autoFocus
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
    </div>
  );
}
