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
  User
} from 'lucide-react';
import '../components/Layout.css';

const STATUS_LABELS = { active: 'Activa', pending: 'Pendiente', cancelled: 'Cancelada', expired: 'Expirada' };
const STATUS_BADGE = { active: 'green', pending: 'yellow', cancelled: 'red', expired: 'gray' };

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
        <div className="empty-state"><div className="empty-icon"><CreditCard size={40} /></div><p>No hay suscripciones</p></div>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Usuario</th>
                  <th>Plan</th>
                  <th>Estado</th>
                  <th>Método</th>
                  <th>Comprobante</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map(s => (
                  <tr key={s.id}>
                    <td style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{s.id}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{s.user?.name || '—'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.user?.email}</div>
                    </td>
                    <td>{s.plan?.name || s.plan_id || '—'}</td>
                    <td>
                      <span className={`badge badge--${STATUS_BADGE[s.status] || 'gray'}`}>
                        {STATUS_LABELS[s.status] || s.status}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge--blue" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
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
                        <button className="btn btn--ghost" style={{ padding: '6px 12px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          onClick={() => setReceiptModal(s)}>
                          <Eye size={12} />
                          <span>Ver</span>
                        </button>
                      ) : <span style={{ color: 'var(--text-secondary)' }}>—</span>}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      {s.created_at ? new Date(s.created_at).toLocaleDateString('es-MX') : '—'}
                    </td>
                    <td>
                      {s.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="btn btn--success"
                            style={{ padding: '8px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            disabled={actionLoading === s.id + '_approve'}
                            onClick={() => handleApprove(s.id)}
                            title="Aprobar Suscripción"
                          >
                            {actionLoading === s.id + '_approve' ? <Loader2 className="spin" size={14} /> : <Check size={14} />}
                          </button>
                          <button
                            className="btn btn--danger"
                            style={{ padding: '8px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            disabled={actionLoading === s.id + '_reject'}
                            onClick={() => handleReject(s.id)}
                            title="Rechazar y Eliminar"
                          >
                            {actionLoading === s.id + '_reject' ? <Loader2 className="spin" size={14} /> : <Trash2 size={14} />}
                          </button>
                        </div>
                      )}
                      {s.status !== 'pending' && <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>—</span>}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', flexShrink: 0 }}>
                      <User size={20} style={{ color: 'var(--primary)' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text)' }}>{receiptModal.user?.name || '—'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{receiptModal.user?.email}</div>
                    </div>
                  </div>

                  {/* Bubble Note */}
                  <div className="chat-bubble-alert">
                    Verifica que el importe y la fecha del comprobante coincidan con el plan seleccionado antes de tomar una acción.
                  </div>

                  {/* Summary Card */}
                  <div className="verification-info-card">
                    <div className="info-row">
                      <span className="info-label">Plan Solicitado</span>
                      <span className="info-value" style={{ color: 'var(--primary)' }}>{receiptModal.plan?.name || '—'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Precio</span>
                      <span className="info-value" style={{ color: 'var(--success)' }}>${Number(receiptModal.price || receiptModal.plan?.price || 0).toFixed(2)}</span>
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
                      <span className={`badge badge--${STATUS_BADGE[receiptModal.status] || 'gray'}`}>
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
