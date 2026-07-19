import { useEffect, useState, useCallback } from 'react';
import { apiFetch, API_BASE_URL } from '../api/client';
import {
  Loader2, AlertTriangle, CheckCircle2, ShieldAlert,
  Search, X, Mail, Phone, MoreVertical, Eye,
  UserCheck, Trash2, Users as UsersIcon,
  UserCircle, Calendar, Lock, ShieldOff
} from 'lucide-react';
import '../components/Layout.css';
import './Users.css';

const MODAL = { VIEW: 'view', STATUS: 'status', DELETE: 'delete' };

// ─── Confirmation Alert Step ─────────────────────────────────────────────────
// type: 'danger' | 'warning'
function ConfirmAlert({ icon: Icon, color, title, message, onConfirm, onCancel, confirmLabel, cancelLabel = 'Cancelar', saving }) {
  return (
    <div className="users-confirm-alert" data-type={color}>
      <div className="users-confirm-alert-icon" data-type={color}>
        <Icon size={28} />
      </div>
      <h4 className="users-confirm-alert-title">{title}</h4>
      <p className="users-confirm-alert-msg">{message}</p>
      <div className="users-confirm-alert-actions">
        <button className="btn btn--ghost" onClick={onCancel} disabled={saving}>{cancelLabel}</button>
        <button
          className={`btn ${color === 'danger' ? 'btn--danger' : 'btn--warning'}`}
          onClick={onConfirm}
          disabled={saving}
        >
          {saving ? <><Loader2 size={13} className="spin" /> Procesando...</> : confirmLabel}
        </button>
      </div>
    </div>
  );
}

export default function Users() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [search, setSearch]   = useState('');
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  // Global success/error (shown at page level after modal closes)
  const [pageError, setPageError]     = useState('');
  const [pageSuccess, setPageSuccess] = useState('');

  // Modal
  const [modalType, setModalType]   = useState(null);
  const [targetUser, setTargetUser] = useState(null);

  // Intra-modal feedback
  const [modalError, setModalError]     = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  // Suspension form
  const [suspensionType, setSuspensionType]         = useState('none');
  const [suspensionDuration, setSuspensionDuration] = useState('1d');
  const [customDate, setCustomDate]                 = useState('');

  // Confirmation step inside modal (null | 'confirm1' | 'confirm2')
  const [confirmStep, setConfirmStep] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ── helpers ──────────────────────────────────────────────────────────────────
  const getUserAvatarUrl = useCallback((user) => {
    if (!user) return null;
    const photo = user.profile_photo_url || user.profile_photo;
    if (!photo) return null;
    if (photo.startsWith('http')) return photo;
    return `${API_BASE_URL.replace('/api', '')}/storage/${photo}`;
  }, []);

  const getUserInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0][0].toUpperCase();
  };

  const getAvatarBgColor = (name) => {
    if (!name) return '#64748b';
    const colors = ['rgba(239,68,68,0.08)','rgba(249,115,22,0.08)','rgba(139,92,246,0.08)','rgba(236,72,153,0.08)','rgba(59,130,246,0.08)','rgba(16,185,129,0.08)'];
    let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
  };

  const getAvatarTextColor = (name) => {
    if (!name) return '#64748b';
    const colors = ['#ef4444','#f97316','#8b5cf6','#ec4899','#3b82f6','#10b981'];
    let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
  };

  const getRoleLabel = (role) => ({ admin: 'Admin', super_admin: 'Super Admin', trainer: 'Entrenador', entrenador: 'Entrenador' }[role] || 'Cliente');
  const getRoleClass = (role) => ({ admin: 'badge-role--admin', super_admin: 'badge-role--super_admin', trainer: 'badge-role--entrenador', entrenador: 'badge-role--entrenador' }[role] || 'badge-role--cliente');

  const isUserActive   = (u) => u.is_active !== 0 && u.is_active !== false && (!u.suspended_until || new Date(u.suspended_until) <= new Date());
  const isUserTempSusp = (u) => u.suspended_until && new Date(u.suspended_until) > new Date();

  // ── data ─────────────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(() => {
    setLoading(true);
    apiFetch('/admin/users')
      .then(d => setUsers(Array.isArray(d) ? d : (d?.data || [])))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setCurrentPage(1); }, [search]);
  useEffect(() => {
    const close = () => setActiveDropdownId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  // Auto-hide page alerts after 5s
  useEffect(() => {
    if (pageSuccess) { const t = setTimeout(() => setPageSuccess(''), 5000); return () => clearTimeout(t); }
  }, [pageSuccess]);
  useEffect(() => {
    if (pageError) { const t = setTimeout(() => setPageError(''), 6000); return () => clearTimeout(t); }
  }, [pageError]);

  // ── modal helpers ─────────────────────────────────────────────────────────────
  const openModal = (type, u) => {
    setTargetUser(u);
    setModalType(type);
    setModalError(''); setModalSuccess('');
    setConfirmStep(null);
    setActiveDropdownId(null);

    if (type === MODAL.STATUS) {
      const active = u.is_active === 1 || u.is_active === true || u.is_active === undefined;
      const until  = u.suspended_until;
      if (!active) {
        setSuspensionType('indefinite');
      } else if (until && new Date(until) > new Date()) {
        setSuspensionType('temporary');
        const d = new Date(until);
        setCustomDate((new Date(d.getTime() - d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16));
        setSuspensionDuration('custom');
      } else {
        setSuspensionType('none');
      }
    }
  };

  const closeModal = () => {
    setModalType(null); setTargetUser(null);
    setModalError(''); setModalSuccess('');
    setConfirmStep(null);
  };

  // ── API calls ─────────────────────────────────────────────────────────────────
  const doStatusSave = async () => {
    let finalIsActive = true;
    let finalSuspendedUntil = null;

    if (suspensionType === 'indefinite') {
      finalIsActive = false;
    } else if (suspensionType === 'temporary') {
      const now = new Date();
      const durations = { '1d': 1, '3d': 3, '1w': 7, '2w': 14, '1m': 30 };
      if (suspensionDuration === 'custom') {
        if (!customDate) { setModalError('Seleccione una fecha de finalización'); return; }
        finalSuspendedUntil = new Date(customDate);
        if (finalSuspendedUntil <= now) { setModalError('La fecha debe ser futura'); return; }
      } else {
        finalSuspendedUntil = new Date(now.getTime() + (durations[suspensionDuration] || 1) * 86400000);
      }
    }

    setSaving(true); setModalError('');
    try {
      await apiFetch(`/admin/users/${targetUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: finalIsActive, suspended_until: finalSuspendedUntil?.toISOString() || null }),
      });
      const msg = suspensionType === 'none'
        ? `Cuenta de ${targetUser.name} activada correctamente`
        : `Cuenta de ${targetUser.name} suspendida correctamente`;
      setPageSuccess(msg);
      fetchUsers();
      closeModal();
    } catch (err) {
      setModalError(err.message || 'Error al actualizar el estado. Verifica tus permisos.');
      setConfirmStep(null);
    } finally { setSaving(false); }
  };

  const doDelete = async () => {
    setSaving(true); setModalError('');
    try {
      await apiFetch(`/admin/users/${targetUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: false }),
      });
      setPageSuccess(`Cuenta de "${targetUser.name}" desactivada permanentemente`);
      fetchUsers();
      closeModal();
    } catch (err) {
      setModalError(err.message || 'Error al desactivar la cuenta. Verifica tus permisos.');
      setConfirmStep(null);
    } finally { setSaving(false); }
  };

  // ── filter + pagination ───────────────────────────────────────────────────────
  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages     = Math.ceil(filtered.length / itemsPerPage);
  const paginatedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // ── Avatar component ──────────────────────────────────────────────────────────
  const Avatar = ({ user, size = 40 }) => {
    const url = getUserAvatarUrl(user);
    return url ? (
      <img src={url} alt={user.name} className="user-avatar" style={{ width: size, height: size }} />
    ) : (
      <div
        className="user-avatar-fallback"
        style={{ width: size, height: size, backgroundColor: getAvatarBgColor(user.name), color: getAvatarTextColor(user.name), fontSize: size * 0.35 }}
      >
        {getUserInitials(user.name)}
      </div>
    );
  };

  // ── render ────────────────────────────────────────────────────────────────────
  return (
    <div className="users-page-container">
      {/* Page-level alerts (persist after modal closes) */}
      {pageError   && <div className="alert alert--error">  <AlertTriangle size={16}/> <span>{pageError}</span></div>}
      {pageSuccess && <div className="alert alert--success"><CheckCircle2 size={16}/> <span>{pageSuccess}</span></div>}

      {/* Header */}
      <div className="users-page-header">
        <div className="users-title-group">
          <h2>Usuarios Registrados</h2>
          <p>Gestiona los accesos y el estado de los usuarios del sistema.</p>
        </div>
        <div className="search-input-container">
          <Search className="search-icon-left" size={16}/>
          <input
            className="search-input-premium"
            placeholder="Buscar por nombre o usuario..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="search-clear-btn" onClick={() => setSearch('')}><X size={15}/></button>}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-state"><Loader2 className="spin" size={24}/> <span>Cargando usuarios...</span></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-icon"><UsersIcon size={40}/></div><p>No se encontraron usuarios</p></div>
      ) : (
        <>
          <div className="users-table-card">
            <div className="users-table-wrap">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Teléfono</th>
                    <th style={{ width: 80, textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((u, index) => {
                    const isLastRow = index >= paginatedItems.length - 2;
                    const active   = isUserActive(u);
                    const tempSusp = isUserTempSusp(u);
                    return (
                      <tr key={u.id}>
                        <td>
                          <div className="user-profile-cell">
                            <div className="user-avatar-wrapper"><Avatar user={u} size={40}/></div>
                            <div className="user-names-group">
                              <span className="user-display-name">{u.name}</span>
                              {u.username && <span className="user-username-handle">@{u.username}</span>}
                            </div>
                          </div>
                        </td>
                        <td><span className="user-email-cell"><Mail size={13}/>{u.email}</span></td>
                        <td><span className={`badge-role ${getRoleClass(u.role)}`}>{getRoleLabel(u.role)}</span></td>
                        <td>
                          {active ? (
                            <span className="badge-status badge-status--activo"><span className="badge-status-dot"/> Activo</span>
                          ) : tempSusp ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <span className="badge-status badge-status--suspendido"><span className="badge-status-dot"/> Suspendido</span>
                              <div style={{ fontSize: '10.5px', color: '#ef4444', fontWeight: 500 }}>
                                Hasta: {new Date(u.suspended_until).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          ) : (
                            <span className="badge-status badge-status--suspendido"><span className="badge-status-dot"/> Suspendido</span>
                          )}
                        </td>
                        <td>
                          {u.phone
                            ? <span className="user-phone-cell"><Phone size={13}/>{u.phone}</span>
                            : <span className="phone-unregistered">No registrado</span>
                          }
                        </td>
                        <td className="actions-dropdown-cell">
                          <button
                            className={`btn-actions-trigger ${activeDropdownId === u.id ? 'active' : ''}`}
                            onClick={e => { e.stopPropagation(); setActiveDropdownId(activeDropdownId === u.id ? null : u.id); }}
                            title="Opciones"
                          >
                            <MoreVertical size={16}/>
                          </button>
                          {activeDropdownId === u.id && (
                            <>
                              <div className="actions-dropdown-overlay" onClick={() => setActiveDropdownId(null)}/>
                              <div className={`actions-dropdown-menu ${isLastRow ? 'open-up' : ''}`} onClick={e => e.stopPropagation()}>
                                <button className="actions-dropdown-item" onClick={() => openModal(MODAL.VIEW, u)}>
                                  <Eye size={14}/> Ver perfil
                                </button>
                                <button className="actions-dropdown-item" onClick={() => openModal(MODAL.STATUS, u)}>
                                  <UserCheck size={14}/>
                                  {!active && !tempSusp ? 'Activar cuenta' : 'Suspender / Bloquear'}
                                </button>
                                <div className="actions-dropdown-divider"/>
                                <button className="actions-dropdown-item actions-dropdown-item--danger" onClick={() => openModal(MODAL.DELETE, u)}>
                                  <Trash2 size={14}/> Eliminar cuenta
                                </button>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {filtered.length > 0 && (
            <div className="pagination">
              <button className="btn btn--secondary" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Anterior</button>
              <span className="pagination-info">Página {currentPage} de {totalPages || 1}</span>
              <button className="btn btn--secondary" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0}>Siguiente</button>
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════
          MODAL: VER PERFIL
      ════════════════════════════════════════════════════════ */}
      {modalType === MODAL.VIEW && targetUser && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal modal--profile" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Perfil de Usuario</h3>
              <button className="modal-close-btn" onClick={closeModal}><X size={18}/></button>
            </div>
            <div className="profile-modal-hero">
              <Avatar user={targetUser} size={68}/>
              <div>
                <div className="profile-modal-name">{targetUser.name}</div>
                {targetUser.username && <div className="profile-modal-handle">@{targetUser.username}</div>}
                <span className={`badge-role ${getRoleClass(targetUser.role)}`} style={{ marginTop: 8, display: 'inline-block' }}>
                  {getRoleLabel(targetUser.role)}
                </span>
              </div>
            </div>
            <div className="profile-info-grid">
              <div className="profile-info-item">
                <span className="profile-info-label"><Mail size={13}/> Email</span>
                <span className="profile-info-value">{targetUser.email}</span>
              </div>
              {targetUser.phone && (
                <div className="profile-info-item">
                  <span className="profile-info-label"><Phone size={13}/> Teléfono</span>
                  <span className="profile-info-value">{targetUser.phone}</span>
                </div>
              )}
              <div className="profile-info-item">
                <span className="profile-info-label"><UserCircle size={13}/> Estado</span>
                <span className="profile-info-value">
                  {isUserActive(targetUser) ? '✅ Activo' : isUserTempSusp(targetUser) ? '⏸ Suspendido temporalmente' : '🔒 Suspendido'}
                </span>
              </div>
              {targetUser.created_at && (
                <div className="profile-info-item">
                  <span className="profile-info-label"><Calendar size={13}/> Registrado</span>
                  <span className="profile-info-value">
                    {new Date(targetUser.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              )}
              {targetUser.suspended_until && isUserTempSusp(targetUser) && (
                <div className="profile-info-item">
                  <span className="profile-info-label"><Lock size={13}/> Suspendido hasta</span>
                  <span className="profile-info-value">
                    {new Date(targetUser.suspended_until).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>
            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button className="btn btn--ghost" onClick={closeModal}>Cerrar</button>
              <button className="btn btn--primary" onClick={() => { closeModal(); setTimeout(() => openModal(MODAL.STATUS, targetUser), 50); }}>
                <UserCheck size={14}/> Gestionar estado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          MODAL: SUSPENDER / BLOQUEAR / ACTIVAR
      ════════════════════════════════════════════════════════ */}
      {modalType === MODAL.STATUS && targetUser && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{!isUserActive(targetUser) && !isUserTempSusp(targetUser) ? 'Activar Cuenta' : 'Suspender / Bloquear'}</h3>
              <button className="modal-close-btn" onClick={closeModal}><X size={18}/></button>
            </div>

            <div className="modal-user-badge">
              <Avatar user={targetUser} size={36}/>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{targetUser.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{targetUser.email}</div>
              </div>
            </div>

            {modalError && (
              <div className="alert alert--error" style={{ marginBottom: 14 }}>
                <AlertTriangle size={15}/> <span>{modalError}</span>
              </div>
            )}

            {/* ── Step 1: choose action ── */}
            {confirmStep === null && (
              <form onSubmit={e => { e.preventDefault(); setConfirmStep('confirm1'); }} className="modal-form">
                <div className="form-group">
                  <label>Estado de la Cuenta</label>
                  <select value={suspensionType} onChange={e => setSuspensionType(e.target.value)}>
                    <option value="none">✅ Activa (sin restricciones)</option>
                    <option value="temporary">⏸ Suspensión Temporal</option>
                    <option value="indefinite">🔒 Bloqueo Total / Indefinido</option>
                  </select>
                </div>

                {suspensionType === 'temporary' && (
                  <>
                    <div className="form-group">
                      <label>Duración</label>
                      <select value={suspensionDuration} onChange={e => setSuspensionDuration(e.target.value)}>
                        <option value="1d">1 Día</option>
                        <option value="3d">3 Días</option>
                        <option value="1w">1 Semana</option>
                        <option value="2w">2 Semanas</option>
                        <option value="1m">1 Mes</option>
                        <option value="custom">Fecha personalizada</option>
                      </select>
                    </div>
                    {suspensionDuration === 'custom' && (
                      <div className="form-group">
                        <label>Finaliza el</label>
                        <input type="datetime-local" value={customDate} onChange={e => setCustomDate(e.target.value)} required/>
                      </div>
                    )}
                  </>
                )}

                {/* Preview of what will happen */}
                {suspensionType !== 'none' && (
                  <div className="users-action-preview users-action-preview--warning">
                    <AlertTriangle size={14}/>
                    <span>
                      {suspensionType === 'indefinite'
                        ? 'El usuario no podrá iniciar sesión hasta que se reactive manualmente.'
                        : 'El usuario no podrá iniciar sesión durante el periodo indicado.'}
                    </span>
                  </div>
                )}

                <div className="modal-actions" style={{ marginTop: 20 }}>
                  <button type="button" className="btn btn--ghost" onClick={closeModal}>Cancelar</button>
                  <button type="submit" className={`btn ${suspensionType === 'none' ? 'btn--primary' : 'btn--warning'}`}>
                    Continuar →
                  </button>
                </div>
              </form>
            )}

            {/* ── Step 2: first confirmation alert ── */}
            {confirmStep === 'confirm1' && (
              <ConfirmAlert
                icon={suspensionType === 'indefinite' ? ShieldOff : suspensionType === 'temporary' ? UserCheck : UserCheck}
                color={suspensionType === 'none' ? 'warning' : 'danger'}
                title={suspensionType === 'none'
                  ? `¿Activar la cuenta de ${targetUser.name}?`
                  : suspensionType === 'indefinite'
                  ? `¿Bloquear indefinidamente a ${targetUser.name}?`
                  : `¿Suspender temporalmente a ${targetUser.name}?`
                }
                message={suspensionType === 'none'
                  ? 'El usuario recuperará acceso completo a la aplicación.'
                  : suspensionType === 'indefinite'
                  ? 'El usuario perderá acceso inmediatamente y no podrá ingresar hasta que lo reactives. Su suscripción NO se cancelará automáticamente.'
                  : 'El usuario no podrá iniciar sesión durante el periodo seleccionado. Su suscripción NO se cancelará automáticamente.'
                }
                confirmLabel="Sí, confirmar acción"
                onCancel={() => setConfirmStep(null)}
                onConfirm={doStatusSave}
                saving={saving}
              />
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          MODAL: ELIMINAR CUENTA (3 alertas de confirmación)
      ════════════════════════════════════════════════════════ */}
      {modalType === MODAL.DELETE && targetUser && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Eliminar / Desactivar Cuenta</h3>
              <button className="modal-close-btn" onClick={closeModal}><X size={18}/></button>
            </div>

            <div className="modal-user-badge">
              <Avatar user={targetUser} size={36}/>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{targetUser.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{targetUser.email}</div>
              </div>
            </div>

            {modalError && (
              <div className="alert alert--error" style={{ marginBottom: 14 }}>
                <AlertTriangle size={15}/> <span>{modalError}</span>
              </div>
            )}

            {/* Step 1: initial warning */}
            {confirmStep === null && (
              <>
                <div className="users-action-preview users-action-preview--danger">
                  <AlertTriangle size={15}/>
                  <span>
                    Estás a punto de <strong>desactivar permanentemente</strong> la cuenta de <strong>{targetUser.name}</strong>.
                    El usuario no podrá iniciar sesión. <strong>Su suscripción NO se eliminará automáticamente.</strong>
                  </span>
                </div>
                <div className="modal-actions" style={{ marginTop: 20 }}>
                  <button className="btn btn--ghost" onClick={closeModal}>Cancelar</button>
                  <button className="btn btn--danger" onClick={() => setConfirmStep('confirm1')}>
                    Continuar →
                  </button>
                </div>
              </>
            )}

            {/* Step 2: Are you sure? */}
            {confirmStep === 'confirm1' && (
              <ConfirmAlert
                icon={ShieldAlert}
                color="danger"
                title="¿Estás completamente seguro?"
                message={`Esta acción desactivará la cuenta de "${targetUser.name}". Podrás revertirlo usando "Suspender / Bloquear → Activa". La suscripción activa del usuario NO será cancelada.`}
                confirmLabel="Sí, desactivar cuenta"
                onCancel={() => setConfirmStep(null)}
                onConfirm={doDelete}
                saving={saving}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
