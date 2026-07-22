import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import ConfirmModal from '../components/ConfirmModal';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Loader2, 
  CreditCard, 
  Sparkles, 
  Pencil, 
  Trash2, 
  X 
} from 'lucide-react';
import '../components/Layout.css';

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, plan: null });
  
  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('monthly');
  const [featuresText, setFeaturesText] = useState('');
  const [icon, setIcon] = useState('barbell-outline');
  const [color, setColor] = useState('#22D3EE');
  const [isBestValue, setIsBestValue] = useState(false);
  const [status, setStatus] = useState('active');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchPlans = () => {
    setLoading(true);
    apiFetch('/admin/subscription-plans')
      .then(d => setPlans(Array.isArray(d) ? d : (d?.data || [])))
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // Reset pagination when loading new plans
  useEffect(() => {
    setCurrentPage(1);
  }, [plans.length]);

  const handleOpenAdd = () => {
    setEditId(null);
    setName('');
    setDescription('');
    setPrice('');
    setDuration('monthly');
    setFeaturesText('');
    setIcon('barbell-outline');
    setColor('#22D3EE');
    setIsBestValue(false);
    setStatus('active');
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditId(p.id);
    setName(p.name || '');
    setDescription(p.description || '');
    setPrice(p.price || '');
    setDuration(p.duration || 'monthly');
    
    let featStr = '';
    if (Array.isArray(p.features)) {
      featStr = p.features.join('\n');
    } else if (typeof p.features === 'string') {
      try {
        const parsed = JSON.parse(p.features);
        featStr = Array.isArray(parsed) ? parsed.join('\n') : p.features;
      } catch {
        featStr = p.features;
      }
    }
    
    setFeaturesText(featStr);
    setIcon(p.icon || 'barbell-outline');
    setColor(p.color || '#22D3EE');
    setIsBestValue(!!p.is_best_value);
    setStatus(p.status || 'active');
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !price) {
      setError('Nombre y precio son requeridos');
      return;
    }

    const feats = featuresText
      .split('\n')
      .map(x => x.trim())
      .filter(x => x.length > 0);

    const body = {
      name,
      description,
      price: parseFloat(price) || 0,
      duration,
      features: feats,
      icon,
      color,
      is_best_value: isBestValue,
      status,
    };

    setError(''); setSuccess('');

    try {
      if (editId) {
        await apiFetch(`/admin/subscription-plans/${editId}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        setSuccess('Plan actualizado con éxito');
      } else {
        await apiFetch('/admin/subscription-plans', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        setSuccess('Plan creado con éxito');
      }
      setModalOpen(false);
      fetchPlans();
    } catch (err) {
      setError(err.message || 'Error al guardar el plan');
    }
  };

  const handleOpenDelete = (p) => {
    setDeleteConfirm({ isOpen: true, plan: p });
  };

  const handleConfirmDelete = async () => {
    const p = deleteConfirm.plan;
    if (!p) return;
    setError(''); setSuccess('');
    try {
      await apiFetch(`/admin/subscription-plans/${p.id}`, { method: 'DELETE' });
      setSuccess('Plan eliminado correctamente');
      fetchPlans();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el plan');
    }
  };

  // Calculate paginated slice
  const totalPages = Math.ceil(plans.length / itemsPerPage);
  const paginatedPlans = plans.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  // Sort plans by price for card view
  const sortedPlans = [...plans].sort((a, b) => parseFloat(a.price || 0) - parseFloat(b.price || 0));

  return (
    <div>
      {error && <div className="alert alert--error"><AlertTriangle size={16} /> <span>{error}</span></div>}
      {success && <div className="alert alert--success"><CheckCircle2 size={16} /> <span>{success}</span></div>}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Planes de Suscripción</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            Gestiona los planes que ven los usuarios clientes en la app móvil.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* View Toggle */}
          <div style={{ display: 'inline-flex', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 3, border: '1px solid var(--border)' }}>
            <button 
              className={`btn ${viewMode === 'cards' ? 'btn--primary' : 'btn--ghost'}`}
              style={{ padding: '6px 12px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
              onClick={() => setViewMode('cards')}
            >
              <span>Tarjetas</span>
            </button>
            <button 
              className={`btn ${viewMode === 'table' ? 'btn--primary' : 'btn--ghost'}`}
              style={{ padding: '6px 12px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
              onClick={() => setViewMode('table')}
            >
              <span>Tabla</span>
            </button>
          </div>

          <button className="btn btn--primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={handleOpenAdd}>
            <Plus size={16} />
            <span>Nuevo Plan</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state"><Loader2 className="spin" size={24} /> <span>Cargando planes...</span></div>
      ) : plans.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><CreditCard size={40} /></div>
          <p>No hay planes de suscripción registrados</p>
        </div>
      ) : viewMode === 'cards' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 24, margin: '20px 0' }}>
          {sortedPlans.map(plan => {
            let category = 'ESTÁNDAR';
            const nameLower = (plan.name || '').toLowerCase();
            if (nameLower.includes('estudiantil') || nameLower.includes('flex')) category = 'FLEXIBILIDAD';
            else if (nameLower.includes('elite') || nameLower.includes('premium')) category = 'EXPERIENCIA PREMIUM';

            let featuresList = [];
            if (Array.isArray(plan.features)) {
              featuresList = plan.features;
            } else if (typeof plan.features === 'string') {
              try {
                const parsed = JSON.parse(plan.features);
                featuresList = Array.isArray(parsed) ? parsed : [plan.features];
              } catch (e) {
                featuresList = [plan.features];
              }
            }

            const accentColor = plan.color || (category === 'FLEXIBILIDAD' ? '#00C2FF' : category === 'EXPERIENCIA PREMIUM' ? '#5B3DF5' : '#F97316');
            const isBest = plan.is_best_value;
            const isPremium = category === 'EXPERIENCIA PREMIUM';

            return (
              <div 
                key={plan.id} 
                style={{
                  position: 'relative',
                  backgroundColor: '#111827',
                  borderRadius: 20,
                  border: isBest ? `2px solid ${accentColor}` : isPremium ? `2px solid ${accentColor}` : '1px solid rgba(255,255,255,0.08)',
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isBest ? `0 8px 30px ${accentColor}25` : '0 4px 20px rgba(0,0,0,0.2)'
                }}
              >
                {isBest && (
                  <div style={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: accentColor,
                    color: '#FFF',
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '4px 14px',
                    borderRadius: 20,
                    letterSpacing: 0.8,
                    boxShadow: `0 4px 12px ${accentColor}50`
                  }}>
                    MÁS POPULAR
                  </div>
                )}

                {isPremium && !isBest && (
                  <div style={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: accentColor,
                    color: '#FFF',
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '4px 14px',
                    borderRadius: 20,
                    letterSpacing: 0.8
                  }}>
                    ★ PREMIUM
                  </div>
                )}

                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, color: accentColor, marginBottom: 8 }}>
                    {category}
                  </div>

                  <h3 style={{ fontSize: 24, fontWeight: 800, color: '#F3F4F6', margin: '0 0 8px 0' }}>
                    {plan.name}
                  </h3>

                  <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.5, minHeight: 40, margin: '0 0 20px 0' }}>
                    {plan.description || 'Sin descripción disponible.'}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 24 }}>
                    <span style={{ fontSize: 38, fontWeight: 900, color: '#FFFFFF' }}>
                      ${Number(plan.price).toFixed(0)}
                    </span>
                    <span style={{ fontSize: 14, color: '#9CA3AF' }}>
                      /{plan.duration === 'monthly' ? 'mes' : plan.duration}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                    {featuresList.map((feat, fIdx) => (
                      <div key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: '#E5E7EB' }}>
                        <CheckCircle2 size={16} color="#22C55E" style={{ flexShrink: 0 }} />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <button 
                    className="btn btn--primary" 
                    style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: accentColor, borderColor: accentColor }}
                    onClick={() => handleOpenEdit(plan)}
                  >
                    <Pencil size={14} />
                    <span>Editar Plan</span>
                  </button>
                  <button 
                    className="btn btn--danger" 
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px 14px' }}
                    onClick={() => handleOpenDelete(plan)}
                    title="Eliminar Plan"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Precio</th>
                  <th>Duración</th>
                  <th>Estado</th>
                  <th>Destacado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPlans.map(plan => (
                  <tr key={plan.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span 
                          style={{ 
                            width: 12, 
                            height: 12, 
                            borderRadius: '50%', 
                            backgroundColor: plan.color || '#22D3EE', 
                            display: 'inline-block' 
                          }} 
                        />
                        <span style={{ fontWeight: 600, color: 'var(--text)' }}>{plan.name}</span>
                      </div>
                      {plan.description && (
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                          {plan.description}
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                      ${Number(plan.price).toFixed(2)}
                    </td>
                    <td>{plan.duration === 'monthly' ? 'Mensual' : plan.duration === 'weekly' ? 'Semanal' : plan.duration === 'yearly' ? 'Anual' : plan.duration}</td>
                    <td>
                      <span className={`badge badge--${plan.status === 'active' ? 'green' : 'gray'}`}>
                        {plan.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      {plan.is_best_value ? (
                        <span className="badge badge--yellow" style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                          <Sparkles size={10} />
                          <span>Sí</span>
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>No</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn--ghost" style={{ padding: '6px 12px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={() => handleOpenEdit(plan)}>
                          <Pencil size={12} />
                          <span>Editar</span>
                        </button>
                        <button className="btn btn--danger" style={{ padding: '6px 12px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={() => handleOpenDelete(plan)}>
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
          {plans.length > 0 && (
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
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>{editId ? 'Editar Plan de Suscripción' : 'Nuevo Plan de Suscripción'}</h3>
              <button className="btn btn--ghost" style={{ padding: 6, borderRadius: '50%' }} onClick={() => setModalOpen(false)}><X size={16} /></button>
            </div>
            <form className="modal-form" onSubmit={handleSave}>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Nombre del Plan</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ej. Plan Estudiantil, Plan Pro"
                    required
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label>Precio ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="Ej. 25.00"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe brevemente lo que ofrece el plan..."
                  rows={2}
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Duración</label>
                  <select value={duration} onChange={e => setDuration(e.target.value)}>
                    <option value="monthly">Mensual</option>
                    <option value="weekly">Semanal</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <select value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Nombre Icono (Ionicons)</label>
                  <input
                    type="text"
                    value={icon}
                    onChange={e => setIcon(e.target.value)}
                    placeholder="Ej. barbell-outline, school-outline"
                  />
                </div>
                <div className="form-group">
                  <label>Color Identificador</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="color"
                      value={color}
                      onChange={e => setColor(e.target.value)}
                      style={{ width: '100%', height: 38, padding: '2px', cursor: 'pointer', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'transparent' }}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Características / Servicios (uno por línea)</label>
                <textarea
                  value={featuresText}
                  onChange={e => setFeaturesText(e.target.value)}
                  placeholder="Ej:&#10;Acceso total al gimnasio&#10;Uso de máquinas y pesas&#10;Soporte de entrenadores"
                  rows={4}
                />
              </div>

              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, display: 'flex', marginTop: 4 }}>
                <input
                  type="checkbox"
                  id="isBestValue"
                  checked={isBestValue}
                  onChange={e => setIsBestValue(e.target.checked)}
                  style={{ width: 'auto', cursor: 'pointer' }}
                />
                <label htmlFor="isBestValue" style={{ margin: 0, cursor: 'pointer', userSelect: 'none', color: 'var(--text)' }}>
                  Destacar plan como el de "Mejor Valor" (Best Value)
                </label>
              </div>

              <div className="modal-actions" style={{ marginTop: 12 }}>
                <button type="button" className="btn btn--ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn--primary">Guardar Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Eliminar Plan"
        message={`¿Estás seguro de que deseas eliminar el plan "${deleteConfirm.plan?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar Plan"
        cancelText="Cancelar"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteConfirm({ isOpen: false, plan: null })}
      />
    </div>
  );
}
