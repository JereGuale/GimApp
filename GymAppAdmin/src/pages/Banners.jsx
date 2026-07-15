import { useEffect, useState } from 'react';
import { apiFetch, API_BASE_URL } from '../api/client';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Loader2, 
  Image as ImageIcon, 
  Pencil, 
  Trash2, 
  X 
} from 'lucide-react';
import '../components/Layout.css';

export default function Banners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [editId, setEditId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [buttonAction, setButtonAction] = useState('subscription');
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [imageFile, setImageFile] = useState(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchBanners = () => {
    setLoading(true);
    apiFetch('/admin/banners')
      .then(d => setBanners(Array.isArray(d) ? d : (d?.data || [])))
      .catch(() => setBanners([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Reset pagination when loading new banners
  useEffect(() => {
    setCurrentPage(1);
  }, [banners.length]);

  const handleOpenAdd = () => {
    setEditId(null);
    setTitle('');
    setDescription('');
    setPrice('');
    setButtonText('');
    setButtonAction('subscription');
    setIsActive(true);
    setDisplayOrder(0);
    setImageFile(null);
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const handleOpenEdit = (b) => {
    setEditId(b.id);
    setTitle(b.title || '');
    setDescription(b.description || '');
    setPrice(b.price || '');
    setButtonText(b.button_text || '');
    setButtonAction(b.button_action || 'subscription');
    setIsActive(!!b.is_active);
    setDisplayOrder(b.display_order || 0);
    setImageFile(null);
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editId && !imageFile) {
      setError('Debes seleccionar una imagen para el nuevo banner');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('button_text', buttonText);
    formData.append('button_action', buttonAction);
    formData.append('is_active', isActive ? 'true' : 'false');
    formData.append('display_order', displayOrder);

    if (imageFile) {
      formData.append('image', imageFile);
    }

    setError(''); setSuccess('');
    
    try {
      if (editId) {
        await apiFetch(`/admin/banners/${editId}`, {
          method: 'PUT',
          body: JSON.stringify({
            title, description, price, button_text: buttonText, button_action: buttonAction, is_active: isActive, display_order: displayOrder
          }),
        });

        if (imageFile) {
          const imgFormData = new FormData();
          imgFormData.append('image', imageFile);
          await apiFetch(`/admin/banners/${editId}/image`, {
            method: 'POST',
            body: imgFormData
          });
        }
        setSuccess('Banner actualizado');
      } else {
        await apiFetch('/admin/banners', {
          method: 'POST',
          body: formData,
        });
        setSuccess('Banner creado');
      }
      setModalOpen(false);
      fetchBanners();
    } catch (err) {
      setError(err.message || 'Error al guardar el banner');
    }
  };

  const handleDelete = async (b) => {
    if (!window.confirm('¿Estás seguro de eliminar este banner?')) return;
    setError(''); setSuccess('');
    try {
      await apiFetch(`/admin/banners/${b.id}`, { method: 'DELETE' });
      setSuccess('Banner eliminado');
      fetchBanners();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el banner');
    }
  };

  const getBannerImage = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL.replace('/api', '')}/storage/${url}`;
  };

  // Calculate paginated slice
  const totalPages = Math.ceil(banners.length / itemsPerPage);
  const paginatedBanners = banners.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div>
      {error && <div className="alert alert--error"><AlertTriangle size={16} /> <span>{error}</span></div>}
      {success && <div className="alert alert--success"><CheckCircle2 size={16} /> <span>{success}</span></div>}

      <div className="page-header">
        <h2>Gestión de Banners</h2>
        <button className="btn btn--primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={handleOpenAdd}>
          <Plus size={16} />
          <span>Nuevo Banner</span>
        </button>
      </div>

      {loading ? (
        <div className="loading-state"><Loader2 className="spin" size={24} /> <span>Cargando banners...</span></div>
      ) : banners.length === 0 ? (
        <div className="empty-state"><div className="empty-icon"><ImageIcon size={40} /></div><p>No hay banners registrados</p></div>
      ) : (
        <>
          <div className="banner-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px',
            marginTop: '20px'
          }}>
            {paginatedBanners.map(b => (
              <div key={b.id} style={{
                background: 'var(--card)',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.2s ease'
              }}>
                {/* Badges */}
                <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '8px', zIndex: 1 }}>
                  <span style={{ background: 'var(--primary)', color: '#fff', fontWeight: 'bold', fontSize: '11px', padding: '4px 8px', borderRadius: '6px' }}>Orden: #{b.display_order}</span>
                  <span style={{ background: b.is_active ? 'var(--success)' : '#4b5563', color: '#fff', fontWeight: 'bold', fontSize: '11px', padding: '4px 8px', borderRadius: '6px' }}>
                    {b.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                {/* Image Container */}
                <div style={{ height: '160px', background: 'var(--bg)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border)' }}>
                  {getBannerImage(b.image_url) ? (
                    <img src={getBannerImage(b.image_url)} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>
                      <ImageIcon size={40} />
                    </div>
                  )}
                </div>

                {/* Body Content */}
                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Acción: {b.button_action}
                    </div>
                    <h3 style={{ fontSize: '17px', fontWeight: 'bold', color: 'var(--text)', margin: '4px 0 8px 0', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {b.title || 'Sin Título'}
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', height: '40px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>
                      {b.description || 'Sin descripción disponible.'}
                    </p>
                  </div>

                  {/* Price and Button Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Precio Mostrado</span>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: b.price ? 'var(--success)' : 'var(--text-secondary)' }}>
                        {b.price ? `$${Number(b.price).toFixed(2)}` : '—'}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Botón</span>
                      <span className="badge badge--blue" style={{ display: 'inline-block', margin: 0 }}>
                        {b.button_text || 'Comprar'}
                      </span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button className="btn btn--ghost" style={{ flex: 1, padding: '8px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }} onClick={() => handleOpenEdit(b)}>
                      <Pencil size={12} />
                      <span>Editar</span>
                    </button>
                    <button className="btn btn--danger" style={{ flex: 1, padding: '8px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }} onClick={() => handleDelete(b)}>
                      <Trash2 size={12} />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {banners.length > 0 && (
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
              <h3 style={{ margin: 0 }}>{editId ? 'Editar Banner' : 'Nuevo Banner'}</h3>
              <button className="btn btn--ghost" style={{ padding: 6, borderRadius: '50%' }} onClick={() => setModalOpen(false)}><X size={16} /></button>
            </div>
            <form className="modal-form" onSubmit={handleSave}>
              
              <div className="form-group">
                <label>Título (opcional)</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej. ¡Promo Verano!" />
              </div>

              <div className="form-group">
                <label>Descripción (opcional)</label>
                <textarea rows="2" value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalles de la promoción..."></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Precio a mostrar ($)</label>
                  <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="Opcional" />
                </div>
                <div className="form-group">
                  <label>Orden de visualización</label>
                  <input type="number" value={displayOrder} onChange={e => setDisplayOrder(parseInt(e.target.value) || 0)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Texto del botón</label>
                  <input type="text" value={buttonText} onChange={e => setButtonText(e.target.value)} placeholder="Ej. Ver más" />
                </div>
                <div className="form-group">
                  <label>Acción del botón</label>
                  <select value={buttonAction} onChange={e => setButtonAction(e.target.value)}>
                    <option value="subscription">Suscripciones</option>
                    <option value="store">Tienda</option>
                    <option value="profile">Perfil</option>
                    <option value="external">Enlace Externo</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'center' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--text)' }}>
                    <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                    <span>Banner Activo</span>
                  </label>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Subir Imagen</label>
                  <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} />
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: 24 }}>
                <button type="button" className="btn btn--ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn--primary">Guardar Banner</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
