import { useEffect, useState } from 'react';
import { apiFetch, API_BASE_URL } from '../api/client';
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
        // Laravel PUT with multipart/form-data works best by spoofing method
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

  return (
    <div>
      {error && <div className="alert alert--error">⚠️ {error}</div>}
      {success && <div className="alert alert--success">✅ {success}</div>}

      <div className="page-header">
        <h2>Inventario de Productos</h2>
        <button className="btn btn--primary" onClick={handleOpenAdd}>
          ➕ Nuevo Producto
        </button>
      </div>

      {loading ? (
        <div className="loading-state"><span className="spin">⏳</span> Cargando productos...</div>
      ) : products.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📦</div><p>No hay productos en inventario</p></div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '24px',
          marginTop: '20px'
        }}>
          {products.map(p => (
            <div key={p.id} style={{
              background: '#111827',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid #1f2937',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}>
              {/* Badges */}
              <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '8px', zIndex: 1 }}>
                {p.is_featured ? (
                  <span style={{ background: '#eab308', color: '#111827', fontWeight: 'bold', fontSize: '11px', padding: '4px 8px', borderRadius: '6px' }}>⭐ Destacado</span>
                ) : null}
                <span style={{ background: p.condition === 'nuevo' ? '#10b981' : '#4b5563', color: '#fff', fontWeight: 'bold', fontSize: '11px', padding: '4px 8px', borderRadius: '6px', textTransform: 'capitalize' }}>{p.condition}</span>
              </div>

              {/* Image Container */}
              <div style={{ height: '200px', background: '#1f2937', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {getProductImage(p) ? (
                  <img src={getProductImage(p)} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ fontSize: '48px' }}>📦</div>
                )}
              </div>

              {/* Body Content */}
              <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {categories.find(c => c.id === p.category_id)?.name || 'Sin Categoría'}
                  </div>
                  <h3 style={{ fontSize: '17px', fontWeight: 'bold', color: '#f9fafb', margin: '4px 0 8px 0', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{p.name}</h3>
                  <p style={{ fontSize: '13px', color: '#9ca3af', lineHeight: '1.5', height: '60px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>
                    {p.description || 'Sin descripción disponible.'}
                  </p>
                </div>

                {/* Price and Stock Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid #1f2937', paddingTop: '12px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#6b7280', display: 'block' }}>Precio</span>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>${Number(p.price).toFixed(2)}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '2px' }}>Stock</span>
                    {p.stock !== null && p.stock !== undefined ? (
                      <span className={`badge badge--${p.stock > 0 ? 'green' : 'red'}`} style={{ display: 'inline-block', margin: 0 }}>
                        {p.stock} uds
                      </span>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '13px', fontWeight: 600 }}>Ilimitado</span>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button className="btn btn--ghost" style={{ flex: 1, padding: '8px', fontSize: '13px', justifyContent: 'center' }} onClick={() => handleOpenEdit(p)}>
                    ✏️ Editar
                  </button>
                  <button className="btn btn--danger" style={{ flex: 1, padding: '8px', fontSize: '13px', justifyContent: 'center' }} onClick={() => handleDelete(p)}>
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <h3>{editId ? 'Editar Producto' : 'Nuevo Producto'}</h3>
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
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, cursor: 'pointer' }}>
                    <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} />
                    Destacar producto ⭐
                  </label>
                </div>

              <div className="form-group">
                <label>Imagen del Producto</label>
                <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} />
                <span style={{ fontSize: 11, color: '#475569' }}>Formatos soportados: JPG, PNG, WEBP. Máx: 5MB</span>
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
