import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import { Loader2, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import '../components/Layout.css';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [suspensionType, setSuspensionType] = useState('none');
  const [suspensionDuration, setSuspensionDuration] = useState('1d');
  const [customDate, setCustomDate] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchUsers = () => {
    setLoading(true);
    apiFetch('/admin/users')
      .then(d => {
        const usersArray = Array.isArray(d) ? d : (d?.data || []);
        setUsers(usersArray);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Reset pagination when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleEditClick = (u) => {
    setEditUser(u);
    
    const active = u.is_active === 1 || u.is_active === true || u.is_active === undefined;
    const until = u.suspended_until;
    
    if (!active) {
      setSuspensionType('indefinite');
    } else if (until && new Date(until) > new Date()) {
      setSuspensionType('temporary');
      const dateObj = new Date(until);
      const tzOffset = dateObj.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(dateObj.getTime() - tzOffset)).toISOString().slice(0, 16);
      setCustomDate(localISOTime);
      setSuspensionDuration('custom');
    } else {
      setSuspensionType('none');
    }
    
    setError('');
    setSuccess('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    
    let finalIsActive = true;
    let finalSuspendedUntil = null;
    
    if (suspensionType === 'indefinite') {
      finalIsActive = false;
    } else if (suspensionType === 'temporary') {
      const now = new Date();
      if (suspensionDuration === '1d') {
        finalSuspendedUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      } else if (suspensionDuration === '3d') {
        finalSuspendedUntil = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      } else if (suspensionDuration === '1w') {
        finalSuspendedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else if (suspensionDuration === '2w') {
        finalSuspendedUntil = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      } else if (suspensionDuration === '1m') {
        finalSuspendedUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      } else if (suspensionDuration === 'custom') {
        if (!customDate) {
          setError('Debe seleccionar una fecha de finalización para la suspensión');
          return;
        }
        finalSuspendedUntil = new Date(customDate);
        if (finalSuspendedUntil <= now) {
          setError('La fecha de suspensión debe ser en el futuro');
          return;
        }
      }
    }
    
    try {
      await apiFetch(`/admin/users/${editUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          is_active: finalIsActive, 
          suspended_until: finalSuspendedUntil ? finalSuspendedUntil.toISOString() : null 
        }),
      });
      setSuccess('Estado de la cuenta actualizado correctamente');
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Error al actualizar usuario');
    }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate paginated slice
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedItems = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div>
      {error && <div className="alert alert--error"><AlertTriangle size={16} /> <span>{error}</span></div>}
      {success && <div className="alert alert--success"><CheckCircle2 size={16} /> <span>{success}</span></div>}

      <div className="page-header">
        <h2>Usuarios Registrados</h2>
        <input
          className="search-input"
          placeholder="Buscar por nombre, email o usuario..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading-state"><Loader2 className="spin" size={24} /> <span>Cargando usuarios...</span></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-icon"><Users size={40} /></div><p>No se encontraron usuarios</p></div>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Teléfono</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map(u => (
                  <tr key={u.id}>
                    <td style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{u.id}</td>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td>{u.username ? `@${u.username}` : '—'}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge badge--${u.role === 'admin' || u.role === 'super_admin' ? 'red' : 'gray'}`}>
                        {u.role === 'admin' ? 'Admin' : u.role === 'super_admin' ? 'Super Admin' : 'Cliente'}
                      </span>
                    </td>
                    <td>
                      {u.is_active === 0 || u.is_active === false ? (
                        <span className="badge badge--red">Suspendido Indefinido</span>
                      ) : u.suspended_until && new Date(u.suspended_until) > new Date() ? (
                        <div>
                          <span className="badge badge--yellow" style={{ display: 'inline-block' }}>Susp. Temporal</span>
                          <div style={{ fontSize: '11px', color: 'var(--warning-text)', marginTop: '4px', fontWeight: 500 }}>
                            Hasta: {new Date(u.suspended_until).toLocaleString('es-MX', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      ) : (
                        <span className="badge badge--green">Activo</span>
                      )}
                    </td>
                    <td>{u.phone || '—'}</td>
                    <td>
                      <button className="btn btn--ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => handleEditClick(u)}>
                        <ShieldAlert size={14} />
                        <span>Gestionar</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filtered.length > 0 && (
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

      {editUser && (
        <div className="modal-overlay" onClick={() => setEditUser(null)}>
          <div className="modal" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
            <h3>Gestionar Cuenta de Usuario</h3>
            <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Usuario a gestionar:</div>
              <div style={{ fontWeight: 'bold', color: 'var(--text)', fontSize: '15px' }}>{editUser.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{editUser.email}</div>
            </div>
            
            <form className="modal-form" onSubmit={handleSave}>
              <div className="form-group">
                <label>Estado/Acción de la Cuenta</label>
                <select value={suspensionType} onChange={e => setSuspensionType(e.target.value)}>
                  <option value="none">Activa (Sin suspensión)</option>
                  <option value="temporary">Suspensión Temporal (Establecer Duración)</option>
                  <option value="indefinite">Suspensión Indefinida / Bloqueo Total</option>
                </select>
              </div>

              {suspensionType === 'temporary' && (
                <>
                  <div className="form-group">
                    <label>Duración Predeterminada</label>
                    <select value={suspensionDuration} onChange={e => setSuspensionDuration(e.target.value)}>
                      <option value="1d">1 Día</option>
                      <option value="3d">3 Días</option>
                      <option value="1w">1 Semana</option>
                      <option value="2w">2 Semanas</option>
                      <option value="1m">1 Mes</option>
                      <option value="custom">Fecha y Hora Personalizada</option>
                    </select>
                  </div>

                  {suspensionDuration === 'custom' && (
                    <div className="form-group">
                      <label>Finaliza el (Fecha y Hora)</label>
                      <input 
                        type="datetime-local" 
                        value={customDate} 
                        onChange={e => setCustomDate(e.target.value)} 
                        required
                      />
                    </div>
                  )}
                </>
              )}

              <div className="modal-actions" style={{ marginTop: '24px' }}>
                <button type="button" className="btn btn--ghost" onClick={() => setEditUser(null)}>Cancelar</button>
                <button type="submit" className="btn btn--primary">Guardar Configuración</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
