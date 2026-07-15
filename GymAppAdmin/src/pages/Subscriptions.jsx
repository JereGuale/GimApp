import { useEffect, useState } from 'react';
import { apiFetch, API_BASE_URL } from '../api/client';
import { 
  Check, 
  Trash2, 
  Eye, 
  ExternalLink, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2,
  CreditCard,
  Building,
  X,
  User,
  Tag,
  Layers,
  Calendar
} from 'lucide-react';
import '../components/Layout.css';
import './Subscriptions.css';

const STATUS_LABELS = { active: 'Activa', pending: 'Pendiente', cancelled: 'Cancelada', expired: 'Expirada' };
const STATUS_BADGE = { active: 'active', pending: 'pending', cancelled: 'cancelled', expired: 'expired' };

export default function Subscriptions() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [receiptModal, setReceiptModal] = useState(null); // stores the entire sub object
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState(null);

  const getUserAvatarUrl = (user) => {
    if (!user) return null;
    const photo = user.profile_photo_url || user.profile_photo;
    if (!photo) return null;
    if (photo.startsWith('http')) return photo;
    return `${API_BASE_URL.replace('/api', '')}/storage/${photo}`;
  };

  const getUserInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  const getAvatarBgColor = (name) => {
    if (!name) return '#64748b';
    const colors = [
      '#ef4444',
      '#f97316',
      '#8b5cf6',
      '#ec4899',
      '#3b82f6',
      '#10b981',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const renderUserCell = (user) => {
    if (!user) return <span style={{ color: 'var(--text-secondary)' }}>—</span>;
    const avatarUrl = getUserAvatarUrl(user);
    const initials = getUserInitials(user.name);
    const bgColor = getAvatarBgColor(user.name);
    
    return (
      <div className="user-avatar-wrapper">
        <div className="avatar-circle" style={!avatarUrl ? { backgroundColor: bgColor } : {}}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={user.name} className="avatar-img" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div className="user-text-details">
          <span className="user-name">{user.name}</span>
          <span className="user-email">{user.email}</span>
        </div>
      </div>
    );
  };


  const fetchSubs = () => {
    setLoading(true);
    apiFetch('/trainer/subscriptions')
      .then(d => setSubs(Array.isArray(d) ? d : []))
      .catch(() => setSubs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSubs(); }, []);

  // Reset pagination when searching or filtering
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  const filtered = subs.filter(s => {
    const matchFilter = filter === 'all' || s.status === filter;
    const matchSearch = !search ||
      s.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.user?.email?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  // Calculate paginated slice
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedItems = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleApprove = (id) => {
    setConfirmModal({
      title: '¿Aprobar Suscripción?',
      message: '¿Estás seguro de que deseas aprobar esta suscripción? Esto activará la membresía del usuario.',
      type: 'success',
      onConfirm: () => executeApprove(id)
    });
  };

  const executeApprove = async (id) => {
    setActionLoading(id + '_approve');
    setError(''); setSuccess('');
    try {
      await apiFetch(`/trainer/subscriptions/${id}/approve`, { method: 'POST' });
      setSuccess('Suscripción aprobada exitosamente');
      fetchSubs();
    } catch (e) { setError(e.message); }
    finally { setActionLoading(null); }
  };

  const handleReject = (id) => {
    setConfirmModal({
      title: '¿Rechazar Suscripción?',
      message: '¿Estás seguro de que deseas rechazar y eliminar esta solicitud de membresía? Esta acción es irreversible.',
      type: 'danger',
      onConfirm: () => executeReject(id)
    });
  };

  const executeReject = async (id) => {
    setActionLoading(id + '_reject');
    setError(''); setSuccess('');
    try {
      await apiFetch(`/trainer/subscriptions/${id}/reject`, { method: 'POST' });
      setSuccess('Suscripción rechazada');
      fetchSubs();
    } catch (e) { setError(e.message); }
    finally { setActionLoading(null); }
  };

  const getReceiptUrl = (sub) => {
    if (!sub) return null;
    const path = sub.payment_receipt || sub.receipt_path || sub.payment_proof;
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL.replace('/api', '')}/storage/${path}`;
  };

  return (
    <div>
      {error && <div className="alert alert--error"><AlertTriangle size={16} /> <span>{error}</span></div>}
      {success && <div className="alert alert--success"><CheckCircle2 size={16} /> <span>{success}</span></div>}

      <div className="page-header">
        <h2>Gestión de Suscripciones</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <input className="search-input" placeholder="Buscar usuario…" value={search} onChange={e => setSearch(e.target.value)} />
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="active">Activas</option>
            <option value="cancelled">Canceladas</option>
            <option value="expired">Expiradas</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-state"><Loader2 className="spin" size={24} /> <span>Cargando…</span></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-icon"><CreditCard size={40} /></div><p>No hay suscripciones<        <>
          {/* Desktop Table View */}
          <div className="subs-desktop-view">
            <div className="subs-table-container">
              <table className="subs-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Usuario</th>
                    <th>Plan</th>
                    <th>Estado</th>
                    <th>Método</th>
                    <th>Comprobante</th>
                    <th>Fecha</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map(s => (
                    <tr key={s.id}>
                      <td style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{s.id}</td>
                      <td>{renderUserCell(s.user)}</td>
                      <td style={{ fontWeight: 600 }}>{s.plan?.name || s.plan_id || '—'}</td>
                      <td>
                        <span className={`badge-status badge-status--${s.status}`}>
                          <span className={`badge-status-dot badge-status-dot--${s.status}`} />
                          {STATUS_LABELS[s.status] || s.status}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge--blue" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, margin: 0 }}>
                          {s.payment_method === 'transfer' ? (
                            <>
                              <Building size={12} />
                              <span>Transferencia</span>
                            </>
                          ) : s.payment_method || '—'}
                        </span>
                      </td>
                      <td>
                        {getReceiptUrl(s) ? (
                          <button 
                            type="button"
                            className="btn btn--secondary" 
                            style={{ padding: '6px 12px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4, minHeight: 'auto' }}
                            onClick={() => setReceiptModal(s)}
                          >
                            <Eye size={12} />
                            <span>Ver comprobante</span>
                          </button>
                        ) : <span style={{ color: 'var(--text-secondary)' }}>—</span>}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                        {s.created_at ? new Date(s.created_at).toLocaleDateString('es-MX') : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {s.status === 'pending' ? (
                          <div style={{ display: 'inline-flex', gap: 8 }}>
                            <button
                              type="button"
                              className="btn btn--success"
                              style={{ padding: '8px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 34 }}
                              disabled={actionLoading === s.id + '_approve'}
                              onClick={() => handleApprove(s.id)}
                              title="Aprobar Suscripción"
                            >
                              {actionLoading === s.id + '_approve' ? <Loader2 className="spin" size={14} /> : <Check size={14} />}
                            </button>
                            <button
                              type="button"
                              className="btn btn--danger"
                              style={{ padding: '8px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 34 }}
                              disabled={actionLoading === s.id + '_reject'}
                              onClick={() => handleReject(s.id)}
                              title="Rechazar y Eliminar"
                            >
                              {actionLoading === s.id + '_reject' ? <Loader2 className="spin" size={14} /> : <Trash2 size={14} />}
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View */}
          <div className="subs-mobile-view">
            <div className="mobile-subs-grid">
              {paginatedItems.map(s => (
                <div className="sub-mobile-card" key={s.id}>
                  {/* Card Header with User Profile */}
                  <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                    {renderUserCell(s.user)}
                  </div>

                  {/* Card details */}
                  <div className="sub-mobile-card-details">
                    <div className="sub-mobile-card-row">
                      <span className="sub-mobile-card-label">
                        <Tag size={13} style={{ opacity: 0.7 }} />
                        <span>Suscripción ID</span>
                      </span>
                      <span className="sub-mobile-card-val" style={{ color: 'var(--text-secondary)' }}>
                        #{s.id}
                      </span>
                    </div>

                    <div className="sub-mobile-card-row">
                      <span className="sub-mobile-card-label">
                        <Layers size={13} style={{ opacity: 0.7 }} />
                        <span>Plan</span>
                      </span>
                      <span className="sub-mobile-card-val">
                        {s.plan?.name || s.plan_id || '—'}
                      </span>
                    </div>

                    <div className="sub-mobile-card-row">
                      <span className="sub-mobile-card-label">
                        <Building size={13} style={{ opacity: 0.7 }} />
                        <span>Método</span>
                      </span>
                      <span className="sub-mobile-card-val" style={{ fontSize: '12px' }}>
                        {s.payment_method === 'transfer' ? 'Transferencia' : s.payment_method || '—'}
                      </span>
                    </div>

                    <div className="sub-mobile-card-row">
                      <span className="sub-mobile-card-label">
                        <Calendar size={13} style={{ opacity: 0.7 }} />
                        <span>Fecha</span>
                      </span>
                      <span className="sub-mobile-card-val">
                        {s.created_at ? new Date(s.created_at).toLocaleDateString('es-MX') : '—'}
                      </span>
                    </div>

                    <div className="sub-mobile-card-row">
                      <span className="sub-mobile-card-label">
                        <CheckCircle2 size={13} style={{ opacity: 0.7 }} />
                        <span>Estado</span>
                      </span>
                      <span className="sub-mobile-card-val">
                        <span className={`badge-status badge-status--${s.status}`}>
                          <span className={`badge-status-dot badge-status-dot--${s.status}`} />
                          {STATUS_LABELS[s.status] || s.status}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Receipt & Validation actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {getReceiptUrl(s) && (
                      <button 
                        type="button"
                        className="btn btn--secondary" 
                        style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 38 }}
                        onClick={() => setReceiptModal(s)}
                      >
                        <Eye size={14} />
                        <span>Ver comprobante</span>
                      </button>
                    )}

                    {s.status === 'pending' && (
                      <div className="sub-mobile-card-actions">
                        <button
                          type="button"
                          className="btn-sub-mobile btn-sub-mobile--approve"
                          disabled={actionLoading === s.id + '_approve'}
                          onClick={() => handleApprove(s.id)}
                        >
                          {actionLoading === s.id + '_approve' ? <Loader2 className="spin" size={14} /> : <Check size={14} />}
                          <span>Aprobar</span>
                        </button>
                        <button
                          type="button"
                          className="btn-sub-mobile btn-sub-mobile--reject"
                          disabled={actionLoading === s.id + '_reject'}
                          onClick={() => handleReject(s.id)}
                        >
                          {actionLoading === s.id + '_reject' ? <Loader2 className="spin" size={14} /> : <Trash2 size={14} />}
                          <span>Rechazar</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Controls */}
          {filtered.length > 0 && (
            <div className="pagination">
              <button 
                type="button"
                className="btn btn--secondary" 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </button>
              <span className="pagination-info">Página {currentPage} de {totalPages || 1}</span>
              <button 
                type="button"
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

      {/* Receipt Modal (Split View) */}
      {receiptModal && (
        <div className="modal-overlay" onClick={() => setReceiptModal(null)}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, maxWidth: '850px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: 'var(--text)' }}>Verificación de Suscripción</h3>
              <button className="btn btn--ghost" style={{ padding: 6, borderRadius: '50%' }} onClick={() => setReceiptModal(null)}><X size={16} /></button>
            </div>
            
            <div className="modal-split-container">
              {/* Left Pane: Preview */}
              <div className="modal-split-preview">
                {getReceiptUrl(receiptModal) ? (
                  <img
                    src={getReceiptUrl(receiptModal)}
                    alt="Comprobante"
                    onError={e => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-secondary)', gap: 12 }}>
                    <AlertTriangle size={48} />
                    <p style={{ margin: 0 }}>No hay comprobante disponible</p>
                  </div>
                )}
                <div style={{ display: 'none', flexDirection: 'column', alignItems: 'center', padding: 40, color: 'var(--text-secondary)', gap: 12 }}>
                  <AlertTriangle size={48} />
                  <p style={{ margin: 0, fontSize: 14 }}>No se pudo cargar el comprobante</p>
                </div>
              </div>

              {/* Right Pane: Details & Validation Actions */}
              <div className="modal-split-details">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* User info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
                    {renderUserCell(receiptModal.user)}
                  </div>

                  {/* Bubble Note */}
                  <div className="chat-bubble-alert">
                    Verifica que el importe y la fecha del comprobante coincidan con el plan seleccionado antes de tomar una acción.
                  </div>

                  {/* Summary Card */}
                  <div className="verification-info-card">
                    <div className="info-row">
                      <span className="info-label">Plan Solicitado</span>
                      <span className="info-value" style={{ color: 'var(--primary)', fontWeight: 700 }}>{receiptModal.plan?.name || '—'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Precio</span>
                      <span className="info-value" style={{ color: 'var(--success)', fontWeight: 700 }}>${Number(receiptModal.price || receiptModal.plan?.price || 0).toFixed(2)}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Método Pago</span>
                      <span className="info-value" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {receiptModal.payment_method === 'transfer' ? (
                          <>
                            <Building size={12} />
                            <span>Transferencia</span>
                          </>
                        ) : receiptModal.payment_method || '—'}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Fecha Solicitud</span>
                      <span className="info-value">{receiptModal.created_at ? new Date(receiptModal.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Estado</span>
                      <span className={`badge-status badge-status--${receiptModal.status}`} style={{ margin: 0 }}>
                        <span className={`badge-status-dot badge-status-dot--${receiptModal.status}`} />
                        {STATUS_LABELS[receiptModal.status] || receiptModal.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Validation Actions */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  {receiptModal.status === 'pending' ? (
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button
                        className="btn btn--success"
                        style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 40 }}
                        disabled={actionLoading === receiptModal.id + '_approve'}
                        onClick={() => {
                          handleApprove(receiptModal.id);
                          setReceiptModal(null);
                        }}
                      >
                        {actionLoading === receiptModal.id + '_approve' ? <Loader2 className="spin" size={16} /> : <Check size={16} />}
                        <span>Aprobar Pago</span>
                      </button>
                      
                      <button
                        className="btn btn--danger"
                        style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 40 }}
                        disabled={actionLoading === receiptModal.id + '_reject'}
                        onClick={() => {
                          handleReject(receiptModal.id);
                          setReceiptModal(null);
                        }}
                      >
                        {actionLoading === receiptModal.id + '_reject' ? <Loader2 className="spin" size={16} /> : <Trash2 size={16} />}
                        <span>Rechazar</span>
                      </button>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>
                      Este comprobante ya fue verificado y procesado.
                    </div>
                  )}

                  {getReceiptUrl(receiptModal) && (
                    <a href={getReceiptUrl(receiptModal)} target="_blank" rel="noreferrer" className="btn btn--ghost" style={{ marginTop: 12, width: '100%', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, height: 36 }}>
                      <ExternalLink size={12} />
                      <span>Ver imagen completa en pestaña</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
            
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
              backgroundColor: confirmModal.type === 'danger' ? 'var(--danger-light)' : 'var(--success-light)',
              color: confirmModal.type === 'danger' ? 'var(--danger-text)' : 'var(--success)',
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
                className={`btn btn--${confirmModal.type === 'danger' ? 'danger' : 'success'}`} 
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
