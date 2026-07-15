import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
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

  const handleDelete = async (p) => {
    if (!window.confirm(`¿Estás seguro de eliminar el plan "${p.name}"?`)) return;
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

  return (
    <div>
      {error && <div className="alert alert--error"><AlertTriangle size={16} /> <span>{error}</span></div>}
      {success && <div className="alert alert--success"><CheckCircle2 size={16} /> <span>{success}</span></div>}

      <div className="page-header">
        <h2>Planes de Suscripción</h2>
        <button className="btn btn--primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={handleOpenAdd}>
          <Plus size={16} />
          <span>Nuevo Plan</span>
        </button>
      </div>

      {loading ? (
        <div className="loading-state"><Loader2 className="spin" size={24} /> <span>Cargando planes...</span></div>
      ) : plans.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><CreditCard size={40} /></div>
          <p>No hay planes de suscripción registrados</p>
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
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
                    <td style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{plan.id}</td>
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
                        <button className="btn btn--danger" style={{ padding: '6px 12px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={() => handleDelete(plan)}>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
    </div>
  );
}
