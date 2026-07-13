import { useEffect, useState } from 'react';
import { apiFetch, API_BASE_URL } from '../api/client';
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

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchOrders();
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('¿Seguro que deseas aprobar este pedido? Esto descontará el stock correspondiente.')) return;
    setActionLoading(id + '_approve');
    setError(''); setSuccess('');
    try {
      await apiFetch(`/admin/orders/${id}/approve`, { method: 'POST' });
      setSuccess('Pedido aprobado exitosamente');
      fetchOrders();
    } catch (e) { setError(e.message); }
    finally { setActionLoading(null); }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Introduce el motivo del rechazo:');
    if (reason === null) return; // Cancelado
    setActionLoading(id + '_reject');
    setError(''); setSuccess('');
    try {
      await apiFetch(`/admin/orders/${id}/reject`, { 
        method: 'POST',
        body: JSON.stringify({ reason: reason || 'Comprobante no válido o stock insuficiente' })
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

  return (
    <div>
      {error && <div className="alert alert--error">⚠️ {error}</div>}
      {success && <div className="alert alert--success">✅ {success}</div>}

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
        <div className="loading-state"><span className="spin">⏳</span> Cargando…</div>
      ) : orders.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📦</div><p>No hay pedidos registrados</p></div>
      ) : (
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
              {orders.map(o => (
                <tr key={o.id}>
                  <td style={{ color: '#475569' }}>{o.id}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{o.user?.name || '—'}</div>
                    <div style={{ fontSize: 12, color: '#475569' }}>{o.user?.email}</div>
                  </td>
                  <td>
                    <div style={{ maxHeight: 80, overflowY: 'auto', fontSize: 13, color: '#94a3b8' }}>
                      {Array.isArray(o.items) ? o.items.map((item, idx) => (
                        <div key={idx} style={{ marginBottom: 4 }}>
                          • <strong>{item.name}</strong> x{item.quantity} (${Number(item.price).toFixed(2)})
                        </div>
                      )) : '—'}
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, color: '#34d399' }}>
                    ${Number(o.total).toFixed(2)}
                  </td>
                  <td>
                    <span className={`badge badge--${STATUS_BADGE[o.status] || 'gray'}`}>
                      {STATUS_LABELS[o.status] || o.status}
                    </span>
                    {o.status === 'rejected' && o.rejection_reason && (
                      <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4, maxWidth: 150 }}>
                        Motivo: {o.rejection_reason}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="badge badge--blue">
                      {o.payment_method === 'transfer' ? '🏦 Transferencia' : '💳 Tarjeta'}
                    </span>
                  </td>
                  <td>
                    {getReceiptUrl(o) ? (
                      <button className="btn btn--ghost" style={{ padding: '6px 12px', fontSize: 12 }}
                        onClick={() => setReceiptModal(getReceiptUrl(o))}>
                        Ver 🖼️
                      </button>
                    ) : <span style={{ color: '#475569' }}>—</span>}
                  </td>
                  <td style={{ color: '#64748b', fontSize: 13 }}>
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
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn--success"
                          style={{ padding: '6px 12px', fontSize: 12 }}
                          disabled={actionLoading === o.id + '_approve'}
                          onClick={() => handleApprove(o.id)}
                        >
                          {actionLoading === o.id + '_approve' ? '…' : '✅ Aprobar'}
                        </button>
                        <button
                          className="btn btn--danger"
                          style={{ padding: '6px 12px', fontSize: 12 }}
                          disabled={actionLoading === o.id + '_reject'}
                          onClick={() => handleReject(o.id)}
                        >
                          {actionLoading === o.id + '_reject' ? '…' : '❌ Rechazar'}
                        </button>
                      </div>
                    )}
                    {o.status !== 'pending' && <span style={{ color: '#334155', fontSize: 12 }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptModal && (
        <div className="modal-overlay" onClick={() => setReceiptModal(null)}>
          <div style={{ background: '#0f172a', borderRadius: 16, padding: 24, maxWidth: '90vw', maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: '#f1f5f9' }}>Comprobante de Pago</h3>
              <button className="btn btn--ghost" onClick={() => setReceiptModal(null)}>✕</button>
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
            <div style={{ display: 'none', flexDirection: 'column', alignItems: 'center', padding: 40, color: '#94a3b8', gap: 12 }}>
              <span style={{ fontSize: 48 }}>🖼️</span>
              <p style={{ margin: 0, fontSize: 14 }}>No se pudo cargar el comprobante</p>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>El archivo puede haber sido eliminado o la URL es incorrecta</p>
            </div>
            <a href={receiptModal} target="_blank" rel="noreferrer" className="btn btn--primary" style={{ marginTop: 16, textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}>
              📥 Abrir en nueva pestaña
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
