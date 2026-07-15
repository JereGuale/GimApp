import { useEffect, useState } from 'react';
import { apiFetch, API_BASE_URL } from '../api/client';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Loader2, 
  Package, 
  Star, 
  Pencil, 
  Trash2,
  X,
  Check
} from 'lucide-react';
import '../components/Layout.css';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [condition, setCondition] = useState('nuevo');
  const [stock, setStock] = useState('');
  const [imageFile, setImageFile] = useState(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, prods] = await Promise.all([
        apiFetch('/admin/categories'),
        apiFetch('/admin/products'),
      ]);
      setCategories(Array.isArray(cats) ? cats : (cats?.data || []));
      setProducts(prods || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Reset pagination when products list size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [products.length]);

  const handleOpenAdd = () => {
    setEditId(null);
    setName('');
    setPrice('');
    setDescription('');
    setCategoryId(categories[0]?.id || '');
    setIsFeatured(false);
    setCondition('nuevo');
    setStock('');
    setImageFile(null);
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditId(p.id);
    setName(p.name || '');
    setPrice(p.price || '');
    setDescription(p.description || '');
    setCategoryId(p.category_id || '');
    setIsFeatured(!!p.is_featured);
    setCondition(p.condition || 'nuevo');
    setStock(p.stock !== null && p.stock !== undefined ? String(p.stock) : '');
    setImageFile(null);
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim() || !price || !categoryId) {
      setError('Nombre, precio y categoría son requeridos');
      return;
    }

    // Trigger professional save confirmation
    setConfirmModal({
      title: editId ? '¿Guardar Cambios?' : '¿Crear Producto?',
      message: editId 
        ? `¿Estás seguro de que deseas guardar los cambios realizados en "${name}"?`
        : `¿Estás seguro de que deseas agregar el nuevo producto "${name}" al inventario?`,
      type: 'primary',
      onConfirm: () => executeSave()
    });
  };

  const executeSave = async () => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', price);
    formData.append('description', description);
    formData.append('category_id', categoryId);
    formData.append('is_featured', isFeatured ? '1' : '0');
    formData.append('condition', condition);
    if (stock !== '') {
      formData.append('stock', parseInt(stock) || 0);
    }

    if (imageFile) {
      formData.append('images[]', imageFile);
    }

    setError(''); setSuccess('');
    const token = localStorage.getItem('admin_token');

    try {
      let url = `${API_BASE_URL}/admin/products`;
      let options = {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: formData,
      };

      if (editId) {
        formData.append('_method', 'PUT');
        url = `${API_BASE_URL}/admin/products/${editId}`;
      }

      const res = await fetch(url, options);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || 'Error al guardar producto');
      }

      setSuccess(editId ? 'Producto actualizado' : 'Producto creado');
      setModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Error al procesar la solicitud');
    }
  };

  const handleDelete = (p) => {
    // Trigger professional delete confirmation
    setConfirmModal({
      title: '¿Eliminar Producto?',
      message: `¿Estás seguro de que deseas eliminar el producto "${p.name}"? Esta acción removerá el producto permanentemente y no se puede deshacer.`,
      type: 'danger',
      onConfirm: async () => {
        setError(''); setSuccess('');
        try {
          await apiFetch(`/admin/products/${p.id}`, { method: 'DELETE' });
          setSuccess('Producto eliminado');
          loadData();
        } catch (err) {
          setError(err.message || 'No se pudo eliminar el producto');
        }
      }
    });
  };

  const getProductImage = (p) => {
    if (p.images && p.images.length > 0) {
      const img = p.images[0];
      const url = img.image_url || img.image_path || img;
      if (url.startsWith('http')) return url;
      return `${API_BASE_URL.replace('/api', '')}/storage/${url}`;
    }
    return null;
  };

  // Calculate paginated slice
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const paginatedProducts = products.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div>
      {error && <div className="alert alert--error"><AlertTriangle size={16} /> <span>{error}</span></div>}
      {success && <div className="alert alert--success"><CheckCircle2 size={16} /> <span>{success}</span></div>}

      <div className="page-header">
        <div>
          <h2 style={{ margin: 0 }}>Productos</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>Gestiona tu catálogo de productos</p>
        </div>
        <button className="btn btn--primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={handleOpenAdd}>
          <Plus size={16} />
          <span>Agregar</span>
        </button>
      </div>

      {loading ? (
        <div className="loading-state"><Loader2 className="spin" size={24} /> <span>Cargando productos...</span></div>
      ) : products.length === 0 ? (
        <div className="empty-state"><div className="empty-icon"><Package size={40} /></div><p>No hay productos en inventario</p></div>
      ) : (
        <>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>PRODUCTO</th>
                    <th style={{ textAlign: 'right' }}>PRECIO</th>
                    <th style={{ textAlign: 'right' }}>STOCK</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div className="product-info-cell">
                          <div className="product-thumbnail-wrapper">
                            {getProductImage(p) ? (
                              <img src={getProductImage(p)} alt={p.name} className="product-thumbnail" />
                            ) : (
                              <div className="product-thumbnail" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', opacity: 0.5 }}>
                                <Package size={20} />
                              </div>
                            )}
                            {p.is_featured ? (
                              <div className="featured-star-badge" title="Producto Destacado">
                                <Star size={9} fill="#fff" color="#fff" />
                              </div>
                            ) : null}
                          </div>
                          <div className="product-text-details">
                            <span className="product-category">
                              {categories.find(c => c.id === p.category_id)?.name || 'Sin Categoría'}
                            </span>
                            <span className="product-name">{p.name}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text)', fontSize: '15px' }}>
                        ${Number(p.price).toFixed(2)}
                      </td>
                      <td>
                        <div className="product-actions-cell">
                          {p.stock !== null && p.stock !== undefined ? (
                            <span className={`badge badge--${p.stock > 0 ? 'green' : 'red'}`} style={{ display: 'inline-block', margin: 0, padding: '4px 8px' }}>
                              {p.stock} Uds
                            </span>
                          ) : (
                            <span className="badge badge--blue" style={{ display: 'inline-block', margin: 0, padding: '4px 8px' }}>
                              Ilimitado
                            </span>
                          )}
                          
                          <button className="btn-action-circle" onClick={() => handleOpenEdit(p)} title="Editar Producto">
                            <Pencil size={13} />
                          </button>
                          <button className="btn-action-circle btn-action-circle--danger" onClick={() => handleDelete(p)} title="Eliminar Producto">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {products.length > 0 && (
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
          <div className="modal" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>{editId ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              <button className="btn btn--ghost" style={{ padding: 6, borderRadius: '50%' }} onClick={() => setModalOpen(false)}><X size={16} /></button>
            </div>
            <form className="modal-form" onSubmit={handleSave}>
              <div className="form-group">
                <label>Nombre del Producto</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Proteína Isolate 1kg" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Precio ($)</label>
                  <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="Ej. 29.99" required />
                </div>
                <div className="form-group">
                  <label>Categoría</label>
                  <select value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
                    <option value="">Selecciona...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea rows="3" value={description} onChange={e => setDescription(e.target.value)} placeholder="Escribe detalles del producto..."></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Condición</label>
                  <select value={condition} onChange={e => setCondition(e.target.value)}>
                    <option value="nuevo">Nuevo</option>
                    <option value="usado">Usado</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Stock (unidades)</label>
                  <input type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} placeholder="Ej. 50 (vacío = ilimitado)" />
                </div>
              </div>

              <div className="form-group" style={{ justifyContent: 'center', display: 'flex', flexDirection: 'column' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, cursor: 'pointer', color: 'var(--text)' }}>
                  <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} />
                  <span>Destacar producto</span>
                </label>
              </div>

              <div className="form-group">
                <label>Imagen del Producto</label>
                <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} />
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Formatos soportados: JPG, PNG, WEBP. Máx: 5MB</span>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn--ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn--primary">Guardar Producto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Professional Confirmation Modal */}
      {confirmModal && (
        <div className="modal-overlay" onClick={() => setConfirmModal(null)}>
          <div className="modal" style={{ maxWidth: 400, textAlign: 'center', padding: '32px 24px' }} onClick={e => e.stopPropagation()}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: confirmModal.type === 'danger' ? 'var(--danger-light)' : 'var(--primary-light)',
              color: confirmModal.type === 'danger' ? 'var(--danger-text)' : 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              {confirmModal.type === 'danger' ? <Trash2 size={24} /> : <Check size={24} />}
            </div>
            
            <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
              {confirmModal.title}
            </h3>
            
            <p style={{ margin: '0 0 24px 0', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {confirmModal.message}
            </p>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn--ghost" style={{ flex: 1 }} onClick={() => setConfirmModal(null)}>
                Cancelar
              </button>
              <button 
                className={`btn btn--${confirmModal.type === 'danger' ? 'danger' : 'primary'}`} 
                style={{ flex: 1 }} 
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
