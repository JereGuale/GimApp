import { useEffect, useState } from 'react';
import { apiFetch, API_BASE_URL } from '../api/client';
import '../components/Layout.css';

const STATUS_LABELS = { active: 'Activa', pending: 'Pendiente', cancelled: 'Cancelada', expired: 'Expirada' };
const STATUS_BADGE = { active: 'green', pending: 'yellow', cancelled: 'red', expired: 'gray' };

export default function Subscriptions() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [receiptModal, setReceiptModal] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSubs = () => {
    setLoading(true);
    apiFetch('/trainer/subscriptions')
      .then(d => setSubs(Array.isArray(d) ? d : []))
      .catch(() => setSubs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSubs(); }, []);

  const filtered = subs.filter(s => {
    const matchFilter = filter === 'all' || s.status === filter;
    const matchSearch = !search ||
      s.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.user?.email?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const handleApprove = async (id) => {
    setActionLoading(id + '_approve');
    setError(''); setSuccess('');
    try {
      await apiFetch(`/trainer/subscriptions/${id}/approve`, { method: 'POST' });
      setSuccess('Suscripción aprobada exitosamente');
      fetchSubs();
    } catch (e) { setError(e.message); }
    finally { setActionLoading(null); }
  };

  const handleReject = async (id) => {
    if (!window.confirm('¿Seguro que deseas rechazar esta suscripción?')) return;
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
    const path = sub.payment_receipt || sub.receipt_path || sub.payment_proof;
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL.replace('/api', '')}/storage/${path}`;
  };

  return (
    <div>
      {error && <div className="alert alert--error">⚠️ {error}</div>}
      {success && <div className="alert alert--success">✅ {success}</div>}

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
        <div className="loading-state"><span className="spin">⏳</span> Cargando…</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">💳</div><p>No hay suscripciones</p></div>
      ) : (
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
              {filtered.map(s => (
                <tr key={s.id}>
                  <td style={{ color: '#475569' }}>{s.id}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{s.user?.name || '—'}</div>
                    <div style={{ fontSize: 12, color: '#475569' }}>{s.user?.email}</div>
                  </td>
                  <td>{s.plan?.name || s.plan_id || '—'}</td>
                  <td>
                    <span className={`badge badge--${STATUS_BADGE[s.status] || 'gray'}`}>
                      {STATUS_LABELS[s.status] || s.status}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge--blue">
                      {s.payment_method === 'transfer' ? '🏦 Transferencia' : s.payment_method || '—'}
                    </span>
                  </td>
                  <td>
                    {getReceiptUrl(s) ? (
                      <button className="btn btn--ghost" style={{ padding: '6px 12px', fontSize: 12 }}
                        onClick={() => setReceiptModal(getReceiptUrl(s))}>
                        Ver 🖼️
                      </button>
                    ) : <span style={{ color: '#475569' }}>—</span>}
                  </td>
                  <td style={{ color: '#64748b', fontSize: 13 }}>
                    {s.created_at ? new Date(s.created_at).toLocaleDateString('es-MX') : '—'}
                  </td>
                  <td>
                    {s.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn--success"
                          style={{ padding: '6px 12px', fontSize: 12 }}
                          disabled={actionLoading === s.id + '_approve'}
                          onClick={() => handleApprove(s.id)}
                        >
                          {actionLoading === s.id + '_approve' ? '…' : '✅ Aprobar'}
                        </button>
                        <button
                          className="btn btn--danger"
                          style={{ padding: '6px 12px', fontSize: 12 }}
                          disabled={actionLoading === s.id + '_reject'}
                          onClick={() => handleReject(s.id)}
                        >
                          {actionLoading === s.id + '_reject' ? '…' : '❌ Rechazar'}
                        </button>
                      </div>
                    )}
                    {s.status !== 'pending' && <span style={{ color: '#334155', fontSize: 12 }}>—</span>}
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
            <a href={receiptModal} target="_blank" rel="noreferrer" className="btn btn--primary" style={{ marginTop: 16, textDecoration: 'none' }}>
              📥 Abrir en nueva pestaña
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
