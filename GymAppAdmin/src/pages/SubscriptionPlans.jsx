import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
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

  const handleOpenEdit = (plan) => {
    setEditId(plan.id);
    setName(plan.name || '');
    setDescription(plan.description || '');
    setPrice(plan.price || '');
    setDuration(plan.duration || 'monthly');
    
    // Parse features to text (one per line)
    if (Array.isArray(plan.features)) {
      setFeaturesText(plan.features.join('\n'));
    } else if (typeof plan.features === 'string') {
      try {
        const parsed = JSON.parse(plan.features);
        setFeaturesText(Array.isArray(parsed) ? parsed.join('\n') : '');
      } catch {
        setFeaturesText(plan.features || '');
      }
    } else {
      setFeaturesText('');
    }

    setIcon(plan.icon || 'barbell-outline');
    setColor(plan.color || '#22D3EE');
    setIsBestValue(!!plan.is_best_value);
    setStatus(plan.status || 'active');
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('El nombre es requerido'); return; }
    if (!price || isNaN(price) || parseFloat(price) < 0) { setError('El precio debe ser un número válido'); return; }
    
    setError(''); 
    setSuccess('');
    
    // Convert features text to array
    const features = featuresText
      .split('\n')
      .map(item => item.trim())
      .filter(Boolean);

    const payload = {
      name,
      description,
      price: parseFloat(price),
      duration,
      features,
      icon,
      color,
      is_best_value: isBestValue,
      status
    };

    try {
      if (editId) {
        await apiFetch(`/admin/subscription-plans/${editId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setSuccess('Plan de suscripción actualizado');
      } else {
        await apiFetch('/admin/subscription-plans', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setSuccess('Plan de suscripción creado');
      }
      setModalOpen(false);
      fetchPlans();
    } catch (err) {
      setError(err.message || 'Error al guardar el plan');
    }
  };

  const handleDelete = async (plan) => {
    if (!window.confirm(`¿Estás seguro de eliminar el plan "${plan.name}"?`)) return;
    setError(''); 
    setSuccess('');
    try {
      await apiFetch(`/admin/subscription-plans/${plan.id}`, { method: 'DELETE' });
      setSuccess('Plan de suscripción eliminado');
      fetchPlans();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el plan');
    }
  };

  return (
    <div>
      {error && <div className="alert alert--error">⚠️ {error}</div>}
      {success && <div className="alert alert--success">✅ {success}</div>}

      <div className="page-header">
        <h2>Planes de Suscripción</h2>
        <button className="btn btn--primary" onClick={handleOpenAdd}>
          ➕ Nuevo Plan
        </button>
      </div>

      {loading ? (
        <div className="loading-state"><span className="spin">⏳</span> Cargando planes...</div>
      ) : plans.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💳</div>
          <p>No hay planes de suscripción registrados</p>
        </div>
      ) : (
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
              {plans.map(plan => (
                <tr key={plan.id}>
                  <td style={{ color: '#475569' }}>{plan.id}</td>
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
                      <span style={{ fontWeight: 600 }}>{plan.name}</span>
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
                  <td>{plan.duration === 'monthly' ? 'Mensual' : plan.duration}</td>
                  <td>
                    <span className={`badge badge--${plan.status === 'active' ? 'green' : 'gray'}`}>
                      {plan.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    {plan.is_best_value ? (
                      <span className="badge badge--yellow">✨ Sí</span>
                    ) : (
                      <span style={{ color: '#475569' }}>No</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn--ghost" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => handleOpenEdit(plan)}>
                        ✏️ Editar
                      </button>
                      <button className="btn btn--danger" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => handleDelete(plan)}>
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
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <h3>{editId ? 'Editar Plan de Suscripción' : 'Nuevo Plan de Suscripción'}</h3>
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
                      style={{ width: '100%', height: 38, padding: '2px', cursor: 'pointer', border: '1px solid #334155', borderRadius: '6px', backgroundColor: 'transparent' }}
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
                <label htmlFor="isBestValue" style={{ margin: 0, cursor: 'pointer', userSelect: 'none' }}>
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
