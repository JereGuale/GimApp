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
  Trash2,
  MoreVertical,
  Search,
  ShoppingBag,
  Clock,
  DollarSign,
  ZoomIn,
  ZoomOut,
  RotateCw
} from 'lucide-react';
import '../components/Layout.css';
import './Orders.css';

const STATUS_LABELS = { pending: 'Pendiente', approved: 'Aprobado', rejected: 'Rechazado', completed: 'Completado' };
const STATUS_BADGE = { pending: 'pending', approved: 'approved', rejected: 'rejected', completed: 'completed' };

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [receiptModal, setReceiptModal] = useState(null); // stores the entire order object
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Custom Prompt/Confirmation States
  const [confirmModal, setConfirmModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null); // stores order ID to reject
  const [rejectionReason, setRejectionReason] = useState('');

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

  const fetchOrders = () => {
    setLoading(true);
    // Fetch all orders from backend first, then filter frontend-side to get clean stats badges
    apiFetch(`/admin/orders`)
      .then(d => setOrders(Array.isArray(d) ? d : []))
      .catch((e) => {
        setError(e.message);
        setOrders([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Reset pagination when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  // Close active dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (activeDropdown === null) return;
      if (!e.target.closest('.actions-dropdown-wrapper')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [activeDropdown]);

  const handleApprove = (id) => {
    setConfirmModal({
      title: '¿Aprobar Pedido?',
      message: '¿Estás seguro de que deseas aprobar este pedido? Esto descontará los artículos del inventario de stock y registrará el pago.',
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
    if (e) e.preventDefault();
    const id = rejectModal;
    setRejectModal(null);
    setActionLoading(id + '_reject');
    setError(''); setSuccess('');
    try {
      await apiFetch(`/admin/orders/${id}/reject`, { 
        method: 'POST',
        body: JSON.stringify({ reason: rejectionReason || 'Comprobante no válido o stock insuficiente' })
      });
      setSuccess('Pedido rechazado correctamente');
      fetchOrders();
    } catch (e) { setError(e.message); }
    finally { setActionLoading(null); }
  };

  const getReceiptUrl = (order) => {
    if (!order) return null;
    const path = order.payment_receipt;
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL.replace('/api', '')}/storage/${path}`;
  };

  const handleOpenReceiptModal = (order) => {
    setZoom(1);
    setRotation(0);
    setReceiptModal(order);
  };

  // Filter and search computation
  const filtered = orders.filter(o => {
    const matchFilter = filter === 'all' || o.status === filter;
    const matchSearch = !search ||
      o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
      String(o.id).includes(search);
    return matchFilter && matchSearch;
  });

  // Calculate paginated slice
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedOrders = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Dynamic metrics calculation
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const approvedOrdersCount = orders.filter(o => o.status === 'approved' || o.status === 'completed').length;
  const totalShopEarnings = orders
    .filter(o => o.status === 'approved' || o.status === 'completed')
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  return (
    <div>
      {error && <div className="alert alert--error"><AlertTriangle size={16} /> <span>{error}</span></div>}
      {success && <div className="alert alert--success"><CheckCircle2 size={16} /> <span>{success}</span></div>}

      {/* Modern Statistics Grid */}
      <div className="orders-stats-grid">
        <div className="orders-stat-card">
          <div className="orders-stat-card-header">
            <span className="orders-stat-label">Total Pedidos</span>
            <div className="orders-stat-icon-wrapper blue">
              <ShoppingBag size={18} />
            </div>
          </div>
          <span className="orders-stat-value">{totalOrdersCount}</span>
          <span className="orders-stat-sub">Registrados en la tienda</span>
        </div>

        <div className="orders-stat-card">
          <div className="orders-stat-card-header">
            <span className="orders-stat-label">Pendientes</span>
            <div className="orders-stat-icon-wrapper pending">
              <Clock size={18} />
            </div>
          </div>
          <span className="orders-stat-value">{pendingOrdersCount}</span>
          <span className="orders-stat-sub">Requieren validación manual</span>
        </div>

        <div className="orders-stat-card">
          <div className="orders-stat-card-header">
            <span className="orders-stat-label">Completados / Aprobados</span>
            <div className="orders-stat-icon-wrapper success">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <span className="orders-stat-value">{approvedOrdersCount}</span>
          <span className="orders-stat-sub">Listos para entrega</span>
        </div>

        <div className="orders-stat-card">
          <div className="orders-stat-card-header">
            <span className="orders-stat-label">Ingresos de Tienda</span>
            <div className="orders-stat-icon-wrapper purple">
              <DollarSign size={18} />
            </div>
          </div>
          <span className="orders-stat-value">${totalShopEarnings.toFixed(2)}</span>
          <span className="orders-stat-sub">De pedidos aprobados</span>
        </div>
      </div>

      {/* Premium Toolbar */}
      <div className="orders-toolbar">
        <div className="orders-search-wrapper">
          <Search className="orders-search-icon" size={16} />
          <input 
            className="orders-search-input-premium" 
            placeholder="Buscar por cliente o ID de pedido..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        
        <div className="orders-filter-tabs">
          <button 
            type="button"
            className={`orders-filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            <span>Todos</span>
            <span className="orders-tab-count">{orders.length}</span>
          </button>
          <button 
            type="button"
            className={`orders-filter-tab ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            <span>Pendientes</span>
            <span className="orders-tab-count pending">{orders.filter(o => o.status === 'pending').length}</span>
          </button>
          <button 
            type="button"
            className={`orders-filter-tab ${filter === 'approved' ? 'active' : ''}`}
            onClick={() => setFilter('approved')}
          >
            <span>Aprobados</span>
            <span className="orders-tab-count approved">{orders.filter(o => o.status === 'approved').length}</span>
          </button>
          <button 
            type="button"
            className={`orders-filter-tab ${filter === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilter('rejected')}
          >
            <span>Rechazados</span>
            <span className="orders-tab-count rejected">{orders.filter(o => o.status === 'rejected').length}</span>
          </button>
          <button 
            type="button"
            className={`orders-filter-tab ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            <span>Completados</span>
            <span className="orders-tab-count completed">{orders.filter(o => o.status === 'completed').length}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state"><Loader2 className="spin" size={24} /> <span>Cargando pedidos…</span></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Package size={40} /></div>
          <p>No se encontraron pedidos con los filtros aplicados</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="orders-desktop-view">
            <div className="subs-table-container">
              <table className="subs-table">
                <thead>
                  <tr>
                    <th># ID</th>
                    <th>Usuario</th>
                    <th>Productos</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Método</th>
                    <th>Comprobante</th>
                    <th>Fecha</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map(o => (
                    <tr key={o.id}>
                      <td style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>#{o.id}</td>
                      <td>{renderUserCell(o.user)}</td>
                      <td>
                        <div style={{ maxHeight: 110, overflowY: 'auto', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {Array.isArray(o.items) ? o.items.map((item, idx) => (
                            <div key={idx} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', display: 'flex', justifyContent: 'space-between', gap: 10, maxWidth: 300 }}>
                              <span style={{ fontWeight: 600, color: 'var(--text)' }}>{item.name} <span style={{ opacity: 0.6, fontSize: 11 }}>x{item.quantity}</span></span>
                              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>${Number(item.price).toFixed(2)}</span>
                            </div>
                          )) : '—'}
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 14 }}>
                        ${Number(o.total).toFixed(2)}
                      </td>
                      <td>
                        <span className={`badge-status badge-status--${STATUS_BADGE[o.status] || 'expired'}`}>
                          <span className={`badge-status-dot badge-status-dot--${STATUS_BADGE[o.status] || 'expired'}`} />
                          {STATUS_LABELS[o.status] || o.status}
                        </span>
                        {o.status === 'rejected' && o.rejection_reason && (
                          <div style={{ fontSize: 11, color: 'var(--danger-text)', marginTop: 4, maxWidth: 160, whiteSpace: 'normal', lineHeight: 1.3 }}>
                            Motivo: {o.rejection_reason}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="badge badge--blue" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, margin: 0 }}>
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
                          <div className="order-thumbnail-wrapper">
                            <img 
                              src={getReceiptUrl(o)} 
                              alt="Mini comprobante" 
                              className="order-thumbnail"
                              onClick={() => handleOpenReceiptModal(o)}
                            />
                            <button 
                              type="button"
                              className="order-zoom-btn"
                              onClick={() => handleOpenReceiptModal(o)}
                              title="Ampliar comprobante"
                            >
                              <Eye size={10} />
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)' }}>—</span>
                        )}
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
                      <td style={{ textAlign: 'right' }}>
                        {o.status === 'pending' ? (
                          <div style={{ display: 'inline-flex', gap: 8 }}>
                            <button
                              type="button"
                              className="btn btn--success"
                              style={{ padding: '8px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 34 }}
                              disabled={actionLoading === o.id + '_approve'}
                              onClick={() => handleApprove(o.id)}
                              title="Aprobar Pedido"
                            >
                              {actionLoading === o.id + '_approve' ? <Loader2 className="spin" size={14} /> : <Check size={14} />}
                            </button>
                            <button
                              type="button"
                              className="btn btn--danger"
                              style={{ padding: '8px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 34 }}
                              disabled={actionLoading === o.id + '_reject'}
                              onClick={() => handleRejectClick(o.id)}
                              title="Rechazar Pedido"
                            >
                              {actionLoading === o.id + '_reject' ? <Loader2 className="spin" size={14} /> : <X size={14} />}
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

          {/* Mobile Card Grid View */}
          <div className="orders-mobile-view">
            <div className="order-mobile-grid">
              {paginatedOrders.map(o => (
                <div className="order-mobile-card" key={o.id}>
                  <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {renderUserCell(o.user)}
                    
                    <div className="actions-dropdown-wrapper">
                      <button 
                        type="button"
                        className={`actions-dropdown-trigger ${activeDropdown === o.id ? 'active' : ''}`}
                        onClick={() => setActiveDropdown(activeDropdown === o.id ? null : o.id)}
                        title="Acciones"
                      >
                        <MoreVertical size={18} />
                      </button>
                      {activeDropdown === o.id && (
                        <div className="actions-dropdown-menu">
                          {o.status === 'pending' && (
                            <>
                              <button 
                                type="button"
                                className="actions-dropdown-item"
                                onClick={() => {
                                  handleApprove(o.id);
                                  setActiveDropdown(null);
                                }}
                              >
                                <Check size={14} style={{ color: '#16a34a' }} />
                                <span style={{ color: '#16a34a', fontWeight: 600 }}>Aprobar pedido</span>
                              </button>
                              
                              <button 
                                type="button"
                                className="actions-dropdown-item"
                                onClick={() => {
                                  handleRejectClick(o.id);
                                  setActiveDropdown(null);
                                }}
                              >
                                <X size={14} style={{ color: '#dc2626' }} />
                                <span style={{ color: '#dc2626', fontWeight: 600 }}>Rechazar pedido</span>
                              </button>
                            </>
                          )}
                          
                          {getReceiptUrl(o) && (
                            <button 
                              type="button"
                              className="actions-dropdown-item"
                              onClick={() => {
                                handleOpenReceiptModal(o);
                                setActiveDropdown(null);
                              }}
                            >
                              <Eye size={14} />
                              <span>Ver comprobante</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Details */}
                  <div className="order-mobile-card-details">
                    <div className="order-mobile-card-row">
                      <span className="order-mobile-card-label">ID de Pedido</span>
                      <span className="order-mobile-card-val" style={{ color: 'var(--text-secondary)' }}>#{o.id}</span>
                    </div>

                    <div className="order-mobile-card-row">
                      <span className="order-mobile-card-label">Productos</span>
                      <span className="order-mobile-card-val" style={{ fontSize: '11px', textAlign: 'right', opacity: 0.8 }}>
                        {Array.isArray(o.items) ? o.items.map(item => `${item.name} (x${item.quantity})`).join(', ') : '—'}
                      </span>
                    </div>

                    <div className="order-mobile-card-row">
                      <span className="order-mobile-card-label">Total</span>
                      <span className="order-mobile-card-val" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                        ${Number(o.total).toFixed(2)}
                      </span>
                    </div>

                    <div className="order-mobile-card-row">
                      <span className="order-mobile-card-label">Método</span>
                      <span className="order-mobile-card-val" style={{ fontSize: '12px' }}>
                        {o.payment_method === 'transfer' ? 'Transferencia' : 'Tarjeta'}
                      </span>
                    </div>

                    <div className="order-mobile-card-row">
                      <span className="order-mobile-card-label">Estado</span>
                      <span className="order-mobile-card-val">
                        <span className={`badge-status badge-status--${STATUS_BADGE[o.status] || 'expired'}`}>
                          <span className={`badge-status-dot badge-status-dot--${STATUS_BADGE[o.status] || 'expired'}`} />
                          {STATUS_LABELS[o.status] || o.status}
                        </span>
                      </span>
                    </div>
                  </div>

                  {getReceiptUrl(o) && (
                    <button 
                      type="button"
                      className="btn btn--secondary" 
                      style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 38 }}
                      onClick={() => handleOpenReceiptModal(o)}
                    >
                      <Eye size={14} />
                      <span>Ver comprobante</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
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

      {/* Premium Split View Receipt Visualizer Modal */}
      {receiptModal && (
        <div className="modal-overlay" onClick={() => setReceiptModal(null)}>
          <div className="premium-order-modal" onClick={e => e.stopPropagation()}>
            <div className="premium-order-modal-header">
              <div>
                <h3 className="order-receipt-modal-title">Validación de Pago</h3>
                <p className="order-receipt-modal-subtitle">Pedido #{receiptModal.id} • Cliente: {receiptModal.user?.name || 'Cliente'}</p>
              </div>
              <button className="btn btn--ghost" style={{ padding: 6, borderRadius: '50%' }} onClick={() => setReceiptModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="premium-order-modal-body-split">
              {/* Left Pane (Interactive receipt preview canvas) */}
              <div className="order-receipt-viewer-pane">
                <img 
                  src={getReceiptUrl(receiptModal)} 
                  alt="Comprobante de Pago" 
                  className="order-receipt-canvas"
                  style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
                />
                
                {/* Control toolbar */}
                <div className="order-receipt-controls-overlay">
                  <button 
                    type="button" 
                    className="order-receipt-control-btn" 
                    onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))} 
                    title="Reducir"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <button 
                    type="button" 
                    className="order-receipt-control-btn" 
                    onClick={() => setZoom(z => Math.min(z + 0.25, 3))} 
                    title="Ampliar"
                  >
                    <ZoomIn size={16} />
                  </button>
                  <button 
                    type="button" 
                    className="order-receipt-control-btn" 
                    onClick={() => setRotation(r => r + 90)} 
                    title="Rotar 90°"
                  >
                    <RotateCw size={16} />
                  </button>
                  <button 
                    type="button" 
                    className="order-receipt-control-btn" 
                    onClick={() => { setZoom(1); setRotation(0); }} 
                    title="Restablecer"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>

              {/* Right Pane (Verification details and visual action gates) */}
              <div className="order-verification-details-pane">
                <div>
                  <div className="order-verification-section-title">Detalles del Cliente</div>
                  {renderUserCell(receiptModal.user)}
                </div>

                <div>
                  <div className="order-verification-section-title">Información del Pedido</div>
                  <div className="order-verification-info-row">
                    <span className="order-verification-info-label">Método de Pago</span>
                    <span className="order-verification-info-value" style={{ textTransform: 'capitalize' }}>
                      {receiptModal.payment_method === 'transfer' ? 'Transferencia Bancaria' : 'Tarjeta'}
                    </span>
                  </div>
                  <div className="order-verification-info-row">
                    <span className="order-verification-info-label">Estado actual</span>
                    <span className="order-verification-info-value" style={{ textTransform: 'capitalize' }}>
                      {STATUS_LABELS[receiptModal.status] || receiptModal.status}
                    </span>
                  </div>
                  <div className="order-verification-info-row" style={{ borderBottom: 'none' }}>
                    <span className="order-verification-info-label">Total a validar</span>
                    <span className="order-verification-info-value" style={{ color: 'var(--primary)', fontSize: 16, fontWeight: 700 }}>
                      ${Number(receiptModal.total).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="order-verification-section-title">Productos en Pedido</div>
                  <div className="order-verification-items-list">
                    {Array.isArray(receiptModal.items) ? receiptModal.items.map((item, idx) => (
                      <div className="order-verification-item" key={idx}>
                        <span className="order-verification-item-left">
                          {item.name}
                          <span className="order-verification-item-qty">x{item.quantity}</span>
                        </span>
                        <span className="order-verification-item-right">${Number(item.price).toFixed(2)}</span>
                      </div>
                    )) : '—'}
                  </div>
                </div>

                {receiptModal.status === 'pending' && (
                  <div className="order-verification-actions">
                    <button 
                      type="button" 
                      className="btn btn--danger" 
                      style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                      onClick={() => {
                        handleRejectClick(receiptModal.id);
                        setReceiptModal(null);
                      }}
                    >
                      <X size={16} />
                      <span>Rechazar</span>
                    </button>
                    <button 
                      type="button" 
                      className="btn btn--success" 
                      style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                      onClick={() => {
                        handleApprove(receiptModal.id);
                        setReceiptModal(null);
                      }}
                    >
                      <Check size={16} />
                      <span>Aprobar</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
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

// Inline fallback icon for RefreshCw since we need to rotate/reset image preview inside the canvas
function RefreshCw(props) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={props.size || 24} 
      height={props.size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={props.className}
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}
