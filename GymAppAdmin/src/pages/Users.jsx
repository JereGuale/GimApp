import { useEffect, useState, useCallback, useRef } from 'react';
import { apiFetch, API_BASE_URL } from '../api/client';
import {
  Loader2, AlertTriangle, CheckCircle2, ShieldAlert,
  Search, X, Mail, Phone, Eye,
  UserCheck, Users as UsersIcon,
  UserCircle, Calendar, Lock, ShieldOff, UserX, ShieldCheck,
  ChevronDown, ChevronUp, CreditCard, ShoppingBag,
  ZoomIn, ZoomOut, RotateCw, ExternalLink
} from 'lucide-react';
import '../components/Layout.css';
import './Users.css';

const MODAL = { VIEW: 'view', STATUS: 'status' };

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
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  // Global success/error (shown at page level after modal closes)
  const [pageError, setPageError] = useState('');
  const [pageSuccess, setPageSuccess] = useState('');

  // Modal
  const [modalType, setModalType] = useState(null);
  const [targetUser, setTargetUser] = useState(null);

  // User History (orders and subscriptions per user)
  const [userOrders, setUserOrders] = useState([]);
  const [userSubs, setUserSubs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [ordersExpanded, setOrdersExpanded] = useState(false);
  const [subsExpanded, setSubsExpanded] = useState(false);
  const userHistoryCacheRef = useRef({});

  // Receipt Preview Modal
  const [receiptModal, setReceiptModal] = useState(null); // { type: 'sub' | 'order', data: Object, url: string }
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Intra-modal feedback
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  // Suspension form
  const [suspensionType, setSuspensionType] = useState('none');
  const [suspensionDuration, setSuspensionDuration] = useState('1d');
  const [customDate, setCustomDate] = useState('');

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
    const colors = ['rgba(239,68,68,0.08)', 'rgba(249,115,22,0.08)', 'rgba(139,92,246,0.08)', 'rgba(236,72,153,0.08)', 'rgba(59,130,246,0.08)', 'rgba(16,185,129,0.08)'];
    let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
  };

  const getAvatarTextColor = (name) => {
    if (!name) return '#64748b';
    const colors = ['#ef4444', '#f97316', '#8b5cf6', '#ec4899', '#3b82f6', '#10b981'];
    let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
  };

  const getRoleLabel = (role) => ({ admin: 'Admin', super_admin: 'Super Admin', trainer: 'Entrenador', entrenador: 'Entrenador' }[role] || 'Cliente');
  const getRoleClass = (role) => ({ admin: 'badge-role--admin', super_admin: 'badge-role--super_admin', trainer: 'badge-role--entrenador', entrenador: 'badge-role--entrenador' }[role] || 'badge-role--cliente');

  const isUserActive = (u) => u.is_active !== 0 && u.is_active !== false && (!u.suspended_until || new Date(u.suspended_until) <= new Date());
  const isUserTempSusp = (u) => u.suspended_until && new Date(u.suspended_until) > new Date();

  // ── data ─────────────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(() => {
    setLoading(true);
    const query = search.trim();
    const endpoint = query
      ? `/admin/users?all=true&search=${encodeURIComponent(query)}`
      : '/admin/users?all=true';
    apiFetch(endpoint)
      .then(d => setUsers(Array.isArray(d) ? d : (d?.data || [])))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setCurrentPage(1); }, [search]);

  // Auto-hide page alerts after 5s
  useEffect(() => {
    if (pageSuccess) { const t = setTimeout(() => setPageSuccess(''), 5000); return () => clearTimeout(t); }
  }, [pageSuccess]);
  useEffect(() => {
    if (pageError) { const t = setTimeout(() => setPageError(''), 6000); return () => clearTimeout(t); }
  }, [pageError]);

  const getReceiptUrl = (item) => {
    if (!item) return null;
    const path = item.payment_receipt || item.receipt_url || item.receipt_path || item.payment_proof;
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL.replace('/api', '')}/storage/${path}`;
  };

  // ── modal helpers ─────────────────────────────────────────────────────────────
  const openModal = (type, u) => {
    setTargetUser(u);
    setModalType(type);
    setModalError(''); setModalSuccess('');
    setConfirmStep(null);

    if (type === MODAL.VIEW) {
      const cached = userHistoryCacheRef.current[u.id];
      if (cached) {
        setUserOrders(cached.orders);
        setUserSubs(cached.subs);
        setHistoryLoading(false);
      } else {
        setUserOrders([]);
        setUserSubs([]);
        setHistoryLoading(true);
      }
      setOrdersExpanded(false);
      setSubsExpanded(false);

      Promise.all([
        apiFetch(`/admin/orders?user_id=${u.id}`).catch(() => []),
        apiFetch(`/trainer/subscriptions?user_id=${u.id}`).catch(() => [])
      ]).then(([ordersRes, subsRes]) => {
        const orders = Array.isArray(ordersRes) ? ordersRes : (ordersRes?.data || []);
        const subs = Array.isArray(subsRes) ? subsRes : (subsRes?.data || []);
        userHistoryCacheRef.current[u.id] = { orders, subs };
        setUserOrders(orders);
        setUserSubs(subs);
      }).finally(() => {
        setHistoryLoading(false);
      });
    }

    if (type === MODAL.STATUS) {
      const active = u.is_active === 1 || u.is_active === true || u.is_active === undefined;
      const until = u.suspended_until;
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
    setReceiptModal(null);
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
    // Optimistic update
    const prev = users;
    setUsers(u => u.map(x => x.id === targetUser.id
      ? { ...x, is_active: finalIsActive, suspended_until: finalSuspendedUntil?.toISOString() || null }
      : x
    ));
    closeModal();
    try {
      await apiFetch(`/admin/users/${targetUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: finalIsActive, suspended_until: finalSuspendedUntil?.toISOString() || null }),
      });
      const msg = suspensionType === 'none'
        ? `Cuenta de ${targetUser.name} activada correctamente`
        : `Cuenta de ${targetUser.name} suspendida correctamente`;
      setPageSuccess(msg);
      fetchUsers(); // silent background refresh
    } catch (err) {
      setUsers(prev); // revert
      setPageError(err.message || 'Error al actualizar el estado. Verifica tus permisos.');
      setConfirmStep(null);
    } finally { setSaving(false); }
  };



  // ── filter + pagination ───────────────────────────────────────────────────────
  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.toLowerCase().includes(search.toLowerCase()) ||
    u.billing_id_number?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // ── Avatar component ──────────────────────────────────────────────────────────
  const Avatar = ({ user, size = 40 }) => {
    const url = getUserAvatarUrl(user);
    return url ? (
      <img src={url} key={url} alt={user.name} className="user-avatar" style={{ width: size, height: size }} />
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
      {pageError && <div className="alert alert--error">  <AlertTriangle size={16} /> <span>{pageError}</span></div>}
      {pageSuccess && <div className="alert alert--success"><CheckCircle2 size={16} /> <span>{pageSuccess}</span></div>}

      {/* Header */}
      <div className="users-page-header">
        <div className="users-title-group">
          <h2>Usuarios Registrados</h2>
          <p>Gestiona los accesos y el estado de los usuarios del sistema.</p>
        </div>
        <div className="search-input-container">
          <Search className="search-icon-left" size={16} />
          <input
            className="search-input-premium"
            placeholder="Buscar por nombre, cédula o teléfono..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="search-clear-btn" onClick={() => setSearch('')}><X size={15} /></button>}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-state"><Loader2 className="spin" size={24} /> <span>Cargando usuarios...</span></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-icon"><UsersIcon size={40} /></div><p>No se encontraron usuarios</p></div>
      ) : (
        <>
          <div className="users-table-card">
            <div className="users-table-wrap">
              <table className="users-table">
                <colgroup>
                  <col style={{ width: '22%' }} />
                  <col style={{ width: '30%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '10%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Teléfono</th>
                    <th style={{ textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((u, index) => {
                    const isLastRow = index >= paginatedItems.length - 2;
                    const active = isUserActive(u);
                    const tempSusp = isUserTempSusp(u);
                    return (
                      <tr key={u.id}>
                        <td>
                          <div className="user-profile-cell">
                            <div className="user-avatar-wrapper"><Avatar user={u} size={40} /></div>
                            <div className="user-names-group">
                              <span className="user-display-name">{u.name}</span>
                              {u.username && <span className="user-username-handle">@{u.username}</span>}
                            </div>
                          </div>
                        </td>
                        <td><span className="user-email-cell"><Mail size={13} />{u.email}</span></td>
                        <td><span className={`badge-role ${getRoleClass(u.role)}`}>{getRoleLabel(u.role)}</span></td>
                        <td>
                          {active ? (
                            <span className="badge-status badge-status--activo"><span className="badge-status-dot" /> Activo</span>
                          ) : tempSusp ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <span className="badge-status badge-status--suspendido"><span className="badge-status-dot" /> Suspendido</span>
                              <div style={{ fontSize: '10.5px', color: '#ef4444', fontWeight: 500 }}>
                                Hasta: {new Date(u.suspended_until).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          ) : (
                            <span className="badge-status badge-status--suspendido"><span className="badge-status-dot" /> Suspendido</span>
                          )}
                        </td>
                        <td>
                          {u.phone
                            ? <span className="user-phone-cell"><Phone size={13} />{u.phone}</span>
                            : <span className="phone-unregistered">No registrado</span>
                          }
                        </td>
                        <td className="actions-inline-cell">
                          <div className="actions-inline-group">
                            {/* Ver perfil */}
                            <div className="action-btn-wrapper">
                              <button
                                className="action-btn action-btn--view"
                                onClick={() => openModal(MODAL.VIEW, u)}
                                aria-label="Ver perfil"
                              >
                                <Eye size={15} />
                              </button>
                              <span className="action-btn-tooltip">Ver perfil</span>
                            </div>

                            {/* Activar / Suspender */}
                            <div className="action-btn-wrapper">
                              <button
                                className={`action-btn ${!active && !tempSusp ? 'action-btn--activate' : 'action-btn--suspend'}`}
                                onClick={() => openModal(MODAL.STATUS, u)}
                                aria-label={!active && !tempSusp ? 'Activar cuenta' : 'Suspender / Bloquear'}
                              >
                                {!active && !tempSusp ? <ShieldCheck size={15} /> : <UserX size={15} />}
                              </button>
                              <span className="action-btn-tooltip">
                                {!active && !tempSusp ? 'Activar cuenta' : 'Suspender'}
                              </span>
                            </div>

                          </div>
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
              <button className="modal-close-btn" onClick={closeModal}><X size={18} /></button>
            </div>
            <div className="profile-modal-hero">
              <Avatar user={targetUser} size={68} />
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
                <span className="profile-info-label"><Mail size={13} /> Email</span>
                <span className="profile-info-value">{targetUser.email}</span>
              </div>
              {targetUser.phone && (
                <div className="profile-info-item">
                  <span className="profile-info-label"><Phone size={13} /> Teléfono</span>
                  <span className="profile-info-value">{targetUser.phone}</span>
                </div>
              )}
              <div className="profile-info-item">
                <span className="profile-info-label"><UserCircle size={13} /> Estado</span>
                <span className="profile-info-value">
                  {isUserActive(targetUser) ? '✅ Activo' : isUserTempSusp(targetUser) ? '⏸ Suspendido temporalmente' : '🔒 Suspendido'}
                </span>
              </div>
              {targetUser.created_at && (
                <div className="profile-info-item">
                  <span className="profile-info-label"><Calendar size={13} /> Registrado</span>
                  <span className="profile-info-value">
                    {new Date(targetUser.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              )}
              {targetUser.suspended_until && isUserTempSusp(targetUser) && (
                <div className="profile-info-item">
                  <span className="profile-info-label"><Lock size={13} /> Suspendido hasta</span>
                  <span className="profile-info-value">
                    {new Date(targetUser.suspended_until).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>

            {/* ─── Historiales (Membresías y Compras) ─── */}
            <div className="user-history-section">
              {historyLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', gap: '8px', color: 'var(--text-secondary)', fontSize: 13 }}>
                  <Loader2 className="spin" size={16} />
                  <span>Cargando historiales del usuario...</span>
                </div>
              ) : (
                <>
                  {/* Acordeón: Historial de Membresías */}
                  {userSubs.length > 0 && (
                    <div className="user-history-accordion-card">
                      <button
                        type="button"
                        className="user-history-accordion-header"
                        onClick={() => setSubsExpanded(v => !v)}
                      >
                        <div className="user-history-header-left">
                          <div className="user-history-header-icon user-history-header-icon--sub">
                            <CreditCard size={16} />
                          </div>
                          <div>
                            <span className="user-history-header-title">Historial de Membresías</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="user-history-header-count">{userSubs.length}</span>
                          {subsExpanded ? <ChevronUp size={16} color="var(--text-secondary)" /> : <ChevronDown size={16} color="var(--text-secondary)" />}
                        </div>
                      </button>

                      {subsExpanded && (
                        <div className="user-history-accordion-body">
                          {userSubs.map((sub) => {
                            const STATUS_SUB = {
                              active: { label: 'Activa', cls: 'user-history-badge--active' },
                              approved: { label: 'Activa', cls: 'user-history-badge--active' },
                              pending: { label: 'Pendiente', cls: 'user-history-badge--pending' },
                              expired: { label: 'Vencida', cls: 'user-history-badge--expired' },
                              rejected: { label: 'Rechazada', cls: 'user-history-badge--rejected' },
                              cancelled: { label: 'Cancelada', cls: 'user-history-badge--cancelled' },
                            };
                            const st = STATUS_SUB[sub.status] || { label: sub.status, cls: 'user-history-badge--expired' };
                            const startDate = sub.starts_at
                              ? new Date(sub.starts_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
                              : (sub.created_at ? new Date(sub.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
                            const endDate = sub.ends_at
                              ? new Date(sub.ends_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
                              : '—';
                            const receiptUrl = getReceiptUrl(sub);

                            return (
                              <div key={sub.id} className="user-history-item">
                                <div className="user-history-item-main">
                                  <div className="user-history-item-title">{sub.plan?.name || 'Membresía Gym'}</div>
                                  <div className="user-history-item-sub">{startDate} → {endDate}</div>
                                </div>
                                <div className="user-history-item-right">
                                  <span className="user-history-price">${Number(sub.price || sub.plan?.price || 0).toFixed(2)}</span>
                                  <span className={`user-history-badge ${st.cls}`}>{st.label}</span>
                                  {receiptUrl && (
                                    <button
                                      type="button"
                                      className="btn-action-icon btn-eye-action"
                                      onClick={() => {
                                        setZoom(1);
                                        setRotation(0);
                                        setReceiptModal({ type: 'sub', data: sub, url: receiptUrl });
                                      }}
                                      title="Ver comprobante"
                                      aria-label="Ver comprobante"
                                    >
                                      <Eye size={13} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Acordeón: Historial de Compras */}
                  {userOrders.length > 0 && (
                    <div className="user-history-accordion-card">
                      <button
                        type="button"
                        className="user-history-accordion-header"
                        onClick={() => setOrdersExpanded(v => !v)}
                      >
                        <div className="user-history-header-left">
                          <div className="user-history-header-icon user-history-header-icon--order">
                            <ShoppingBag size={16} />
                          </div>
                          <div>
                            <span className="user-history-header-title">Historial de Compras</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="user-history-header-count">{userOrders.length}</span>
                          {ordersExpanded ? <ChevronUp size={16} color="var(--text-secondary)" /> : <ChevronDown size={16} color="var(--text-secondary)" />}
                        </div>
                      </button>

                      {ordersExpanded && (
                        <div className="user-history-accordion-body">
                          {userOrders.map((ord) => {
                            const STATUS_ORDER = {
                              pending: { label: 'Pendiente', cls: 'user-history-badge--pending' },
                              approved: { label: 'Listo p/ retirar', cls: 'user-history-badge--approved' },
                              processing: { label: 'Listo p/ retirar', cls: 'user-history-badge--approved' },
                              shipped: { label: 'Listo p/ retirar', cls: 'user-history-badge--approved' },
                              completed: { label: 'Retirado', cls: 'user-history-badge--completed' },
                              rejected: { label: 'Rechazado', cls: 'user-history-badge--rejected' },
                            };
                            const st = STATUS_ORDER[ord.status] || { label: ord.status, cls: 'user-history-badge--expired' };
                            const ordDate = ord.created_at
                              ? new Date(ord.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
                              : '—';
                            const itemsSummary = Array.isArray(ord.items) && ord.items.length > 0
                              ? (ord.items.length === 1 ? ord.items[0].name : `${ord.items[0].name} +${ord.items.length - 1} más`)
                              : `Pedido #${ord.id}`;
                            const receiptUrl = getReceiptUrl(ord);

                            return (
                              <div key={ord.id} className="user-history-item">
                                <div className="user-history-item-main">
                                  <div className="user-history-item-title">{itemsSummary}</div>
                                  <div className="user-history-item-sub">{ordDate} · #{ord.id}</div>
                                </div>
                                <div className="user-history-item-right">
                                  <span className="user-history-price">${Number(ord.total || 0).toFixed(2)}</span>
                                  <span className={`user-history-badge ${st.cls}`}>{st.label}</span>
                                  {receiptUrl && (
                                    <button
                                      type="button"
                                      className="btn-action-icon btn-eye-action"
                                      onClick={() => {
                                        setZoom(1);
                                        setRotation(0);
                                        setReceiptModal({ type: 'order', data: ord, url: receiptUrl });
                                      }}
                                      title="Ver comprobante"
                                      aria-label="Ver comprobante"
                                    >
                                      <Eye size={13} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {userSubs.length === 0 && userOrders.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '16px 8px', color: 'var(--text-secondary)', fontSize: 12.5 }}>
                      No se registran compras ni membresías para este usuario.
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button className="btn btn--ghost" onClick={closeModal}>Cerrar</button>
              <button className="btn btn--primary" onClick={() => { closeModal(); setTimeout(() => openModal(MODAL.STATUS, targetUser), 50); }}>
                <UserCheck size={14} /> Gestionar estado
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
              <button className="modal-close-btn" onClick={closeModal}><X size={18} /></button>
            </div>

            <div className="modal-user-badge">
              <Avatar user={targetUser} size={36} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{targetUser.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{targetUser.email}</div>
              </div>
            </div>

            {modalError && (
              <div className="alert alert--error" style={{ marginBottom: 14 }}>
                <AlertTriangle size={15} /> <span>{modalError}</span>
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
                        <input type="datetime-local" value={customDate} onChange={e => setCustomDate(e.target.value)} required />
                      </div>
                    )}
                  </>
                )}

                {/* Preview of what will happen */}
                {suspensionType !== 'none' && (
                  <div className="users-action-preview users-action-preview--warning">
                    <AlertTriangle size={14} />
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


      {/* Modal de Comprobante (dentro de Users) */}
      {receiptModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => setReceiptModal(null)}>
          <div
            className="modal"
            style={{ maxWidth: 560, width: '95%', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16 }}>
                  Comprobante de {receiptModal.type === 'sub' ? 'Membresía' : 'Compra'}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                  {receiptModal.type === 'sub'
                    ? (receiptModal.data.plan?.name || 'Membresía')
                    : `Pedido #${receiptModal.data.id}`} · ${Number(receiptModal.type === 'sub' ? (receiptModal.data.price || receiptModal.data.plan?.price || 0) : (receiptModal.data.total || 0)).toFixed(2)}
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setReceiptModal(null)}><X size={18} /></button>
            </div>

            {/* Viewer Pane */}
            <div style={{
              background: '#0f172a',
              position: 'relative',
              height: 360,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              <img
                src={receiptModal.url}
                alt="Comprobante"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: 'transform 0.15s ease'
                }}
              />

              <div style={{
                position: 'absolute',
                bottom: 12,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(8px)',
                borderRadius: 999,
                padding: '4px 10px',
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4, display: 'flex' }}
                  onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                  title="Alejar"
                >
                  <ZoomOut size={16} />
                </button>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4, display: 'flex' }}
                  onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                  title="Acercar"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4, display: 'flex' }}
                  onClick={() => setRotation(r => (r + 90) % 360)}
                  title="Rotar"
                >
                  <RotateCw size={16} />
                </button>
                <a
                  href={receiptModal.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4, display: 'flex' }}
                  title="Abrir en pestaña nueva"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>

            <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', background: 'var(--surface)' }}>
              <button className="btn btn--secondary" onClick={() => setReceiptModal(null)}>Cerrar comprobante</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
