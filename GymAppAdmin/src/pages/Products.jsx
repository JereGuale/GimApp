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
  X
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
  const itemsPerPage = 8;

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

  // Reset pagination when loading new products
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

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !price || !categoryId) {
      setError('Nombre, precio y categoría son requeridos');
      return;
    }

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

  const handleDelete = async (p) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${p.name}"?`)) return;
    setError(''); setSuccess('');
    try {
      await apiFetch(`/admin/products/${p.id}`, { method: 'DELETE' });
      setSuccess('Producto eliminado');
      loadData();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el producto');
    }
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
          <span>Agregar producto</span>
        </button>
      </div>

      {loading ? (
        <div className="loading-state"><Loader2 className="spin" size={24} /> <span>Cargando productos...</span></div>
      ) : products.length === 0 ? (
        <div className="empty-state"><div className="empty-icon"><Package size={40} /></div><p>No hay productos en inventario</p></div>
      ) : (
        <>
          <div className="product-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px',
            marginTop: '20px'
          }}>
            {paginatedProducts.map(p => (
              <div key={p.id} style={{
                background: 'var(--card)',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.2s ease'
              }}>
                {/* Featured Badge (Top Left of Image) */}
                {p.is_featured && (
                  <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 2 }}>
                    <span style={{ background: '#d97706', color: '#fff', fontWeight: 'bold', fontSize: '11px', padding: '4px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                      <Star size={10} fill="#fff" />
                      <span>Destacado</span>
                    </span>
                  </div>
                )}

                {/* Stock Badge (Top Right of Image) */}
                <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 2 }}>
                  {p.stock !== null && p.stock !== undefined ? (
                    <span style={{ 
                      background: p.stock > 0 ? '#10b981' : '#ef4444', 
                      color: '#fff', 
                      fontWeight: 'bold', 
                      fontSize: '11px', 
                      padding: '4px 8px', 
                      borderRadius: '6px' 
                    }}>
                      {p.stock} Uds
                    </span>
                  ) : (
                    <span style={{ 
                      background: '#3b82f6', 
                      color: '#fff', 
                      fontWeight: 'bold', 
                      fontSize: '11px', 
                      padding: '4px 8px', 
                      borderRadius: '6px' 
                    }}>
                      Ilimitado
                    </span>
                  )}
                </div>

                {/* Image Container */}
                <div style={{ height: '220px', background: '#f8fafc', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border)' }}>
                  {getProductImage(p) ? (
                    <img src={getProductImage(p)} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>
                      <Package size={48} />
                    </div>
                  )}
                </div>

                {/* Body Content */}
                <div style={{ padding: '16px 20px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {categories.find(c => c.id === p.category_id)?.name || 'Sin Categoría'}
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text)', margin: '4px 0 0 0', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4', height: '40px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: '4px 0 0 0' }}>
                    {p.description || 'Sin descripción disponible.'}
                  </p>
                  
                  <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text)', margin: '8px 0 0 0' }}>
                    ${Number(p.price).toFixed(2)}
                  </div>

                  {/* Card Actions (Editar / Eliminar) */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button className="btn btn--secondary" style={{ flex: 1, padding: '8px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 500 }} onClick={() => handleOpenEdit(p)}>
                      <Pencil size={13} />
                      <span>Editar</span>
                    </button>
                    <button className="btn btn--danger" style={{ flex: 1, padding: '8px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 500 }} onClick={() => handleDelete(p)}>
                      <Trash2 size={13} />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="btn btn--secondary" 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </button>
              <span className="pagination-info">Página {currentPage} de {totalPages}</span>
              <button 
                className="btn btn--secondary" 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
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
    </div>
  );
}
