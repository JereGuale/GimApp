import { useEffect, useState } from 'react';
import { apiFetch, API_BASE_URL } from '../api/client';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  Building, 
  CreditCard, 
  Eye, 
  Check, 
  X, 
  ExternalLink,
  Package,
  Trash2
} from 'lucide-react';
import '../components/Layout.css';

const STATUS_LABELS = { pending: 'Pendiente', approved: 'Aprobado', rejected: 'Rechazado', completed: 'Completado' };
const STATUS_BADGE = { pending: 'yellow', approved: 'green', rejected: 'red', completed: 'blue' };

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [receiptModal, setReceiptModal] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Custom Prompt/Confirmation States
  const [confirmModal, setConfirmModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null); // stores order ID to reject
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchOrders = () => {
    setLoading(true);
    apiFetch(`/admin/orders?status=${filter}&search=${search}`)
      .then(d => setOrders(Array.isArray(d) ? d : []))
      .catch((e) => {
        setError(e.message);
        setOrders([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  // Reset pagination when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchOrders();
    }
  };

  const handleApprove = (id) => {
    setConfirmModal({
      title: '¿Aprobar Pedido?',
      message: '¿Estás seguro de que deseas aprobar este pedido? Esto descontará los artículos del inventario de stock.',
      type: 'success',
      onConfirm: () => executeApprove(id)
    });
  };

  const executeApprove = async (id) => {
    setActionLoading(id + '_approve');
    setError(''); setSuccess('');
    try {
      await apiFetch(`/admin/orders/${id}/approve`, { method: 'POST' });
      setSuccess('Pedido aprobado exitosamente');
      fetchOrders();
    } catch (e) { setError(e.message); }
    finally { setActionLoading(null); }
  };

  const handleRejectClick = (id) => {
    setRejectionReason('');
    setRejectModal(id);
  };

  const executeReject = async (e) => {
    e.preventDefault();
    const id = rejectModal;
    setRejectModal(null);
    setActionLoading(id + '_reject');
    setError(''); setSuccess('');
    try {
      await apiFetch(`/admin/orders/${id}/reject`, { 
        method: 'POST',
        body: JSON.stringify({ reason: rejectionReason || 'Comprobante no válido o stock insuficiente' })
      });
      setSuccess('Pedido rechazado');
      fetchOrders();
    } catch (e) { setError(e.message); }
    finally { setActionLoading(null); }
  };

  const getReceiptUrl = (order) => {
    const path = order.payment_receipt;
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL.replace('/api', '')}/storage/${path}`;
  };

  // Calculate paginated slice
  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const paginatedOrders = orders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div>
      {error && <div className="alert alert--error"><AlertTriangle size={16} /> <span>{error}</span></div>}
      {success && <div className="alert alert--success"><CheckCircle2 size={16} /> <span>{success}</span></div>}

      <div className="page-header">
        <h2>Gestión de Pedidos</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <input 
            className="search-input" 
            placeholder="Buscar usuario (Enter)…" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            onKeyPress={handleSearchKeyPress}
          />
          <button className="btn btn--primary" onClick={fetchOrders} style={{ padding: '8px 16px' }}>Buscar</button>
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="approved">Aprobados</option>
            <option value="rejected">Rechazados</option>
            <option value="completed">Completados</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-state"><Loader2 className="spin" size={24} /> <span>Cargando…</span></div>
      ) : orders.length === 0 ? (
        <div className="empty-state"><div className="empty-icon"><Package size={40} /></div><p>No hay pedidos registrados</p></div>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Usuario</th>
                  <th>Productos</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Método</th>
                  <th>Comprobante</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map(o => (
                  <tr key={o.id}>
                    <td style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{o.id}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{o.user?.name || '—'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{o.user?.email}</div>
                    </td>
                    <td>
                      <div style={{ maxHeight: 80, overflowY: 'auto', fontSize: 13, color: 'var(--text-secondary)' }}>
                        {Array.isArray(o.items) ? o.items.map((item, idx) => (
                          <div key={idx} style={{ marginBottom: 4 }}>
                            • <strong>{item.name}</strong> x{item.quantity} (${Number(item.price).toFixed(2)})
                          </div>
                        )) : '—'}
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>
                      ${Number(o.total).toFixed(2)}
                    </td>
                    <td>
                      <span className={`badge badge--${STATUS_BADGE[o.status] || 'gray'}`}>
                        {STATUS_LABELS[o.status] || o.status}
                      </span>
                      {o.status === 'rejected' && o.rejection_reason && (
                        <div style={{ fontSize: 11, color: 'var(--danger-text)', marginTop: 4, maxWidth: 150 }}>
                          Motivo: {o.rejection_reason}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge--blue" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {o.payment_method === 'transfer' ? (
                          <>
                            <Building size={12} />
                            <span>Transferencia</span>
                          </>
                        ) : (
                          <>
                            <CreditCard size={12} />
                            <span>Tarjeta</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td>
                      {getReceiptUrl(o) ? (
                        <button className="btn btn--ghost" style={{ padding: '6px 12px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          onClick={() => setReceiptModal(getReceiptUrl(o))}>
                          <Eye size={12} />
                          <span>Ver</span>
                        </button>
                      ) : <span style={{ color: 'var(--text-secondary)' }}>—</span>}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      {o.created_at ? new Date(o.created_at).toLocaleDateString('es-MX', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '—'}
                    </td>
                    <td>
                      {o.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="btn btn--success"
                            style={{ padding: '8px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            disabled={actionLoading === o.id + '_approve'}
                            onClick={() => handleApprove(o.id)}
                            title="Aprobar Pedido"
                          >
                            {actionLoading === o.id + '_approve' ? <Loader2 className="spin" size={14} /> : <Check size={14} />}
                          </button>
                          <button
                            className="btn btn--danger"
                            style={{ padding: '8px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            disabled={actionLoading === o.id + '_reject'}
                            onClick={() => handleRejectClick(o.id)}
                            title="Rechazar Pedido"
                          >
                            {actionLoading === o.id + '_reject' ? <Loader2 className="spin" size={14} /> : <X size={14} />}
                          </button>
                        </div>
                      )}
                      {o.status !== 'pending' && <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {orders.length > 0 && (
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

      {/* Receipt Modal */}
      {receiptModal && (
        <div className="modal-overlay" onClick={() => setReceiptModal(null)}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, maxWidth: '90vw', maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: 'var(--text)' }}>Comprobante de Pago</h3>
              <button className="btn btn--ghost" style={{ padding: 6, borderRadius: '50%' }} onClick={() => setReceiptModal(null)}><X size={16} /></button>
            </div>
            <img
              src={receiptModal}
              alt="Comprobante"
              style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 10, display: 'block' }}
              onError={e => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div style={{ display: 'none', flexDirection: 'column', alignItems: 'center', padding: 40, color: 'var(--text-secondary)', gap: 12 }}>
              <AlertTriangle size={48} />
              <p style={{ margin: 0, fontSize: 14 }}>No se pudo cargar el comprobante</p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', opacity: 0.8 }}>El archivo puede haber sido eliminado o la URL es incorrecta</p>
            </div>
            <a href={receiptModal} target="_blank" rel="noreferrer" className="btn btn--primary" style={{ marginTop: 16, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ExternalLink size={14} />
              <span>Abrir en nueva pestaña</span>
            </a>
          </div>
        </div>
      )}

      {/* Custom Prompt Modal for Rejecting Orders */}
      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="modal" style={{ maxWidth: 420, padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Rechazar Pedido</h3>
              <button className="btn btn--ghost" style={{ padding: 6, borderRadius: '50%' }} onClick={() => setRejectModal(null)}><X size={16} /></button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px 0', lineHeight: 1.4 }}>
              Ingresa el motivo del rechazo para notificar al usuario. Este se guardará en los registros del pedido:
            </p>
            
            <form onSubmit={executeReject}>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <textarea 
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Ej. Comprobante de pago borroso o stock de producto no disponible."
                  rows={3}
                  required
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn--ghost" style={{ flex: 1 }} onClick={() => setRejectModal(null)}>Cancelar</button>
                <button type="submit" className="btn btn--danger" style={{ flex: 1 }}>Rechazar Pedido</button>
              </div>
            </form>
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
