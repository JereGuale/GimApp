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
  RotateCw,
  XCircle,
  AlertCircle
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

  const renderStatusCell = (o) => {
    let IconComponent = Clock;
    if (o.status === 'approved' || o.status === 'completed') {
      IconComponent = CheckCircle2;
    } else if (o.status === 'rejected') {
      IconComponent = XCircle;
    }

    return (
      <div className="status-pill-container">
        <span className={`status-pill status-pill--${STATUS_BADGE[o.status] || 'expired'}`}>
          <IconComponent size={14} className="status-pill-icon" />
          <span>{STATUS_LABELS[o.status] || o.status}</span>
        </span>
        {o.status === 'rejected' && o.rejection_reason && (
          <div className="status-rejection-info">
            <AlertCircle size={12} className="status-rejection-info-icon" />
            <span>Motivo: {o.rejection_reason}</span>
          </div>
        )}
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

  const handleDeleteClick = (id) => {
    setConfirmModal({
      title: '¿Eliminar Pedido?',
      message: '¿Estás seguro de que deseas eliminar este pedido permanentemente? Esta acción no se puede deshacer y liberará los registros.',
      type: 'danger',
      onConfirm: () => executeDelete(id)
    });
  };

  const executeDelete = async (id) => {
    setActionLoading(id + '_delete');
    setError(''); setSuccess('');
    try {
      await apiFetch(`/admin/orders/${id}`, { method: 'DELETE' });
      setSuccess('Pedido eliminado correctamente');
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
                    <th>Fecha</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map((o, index) => {
                    const isLastRows = index >= paginatedOrders.length - 2;
                    return (
                      <tr key={o.id}>
                      <td style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>#{o.id}</td>
                      <td>{renderUserCell(o.user)}</td>
                      <td>
                        <div style={{ maxHeight: 110, overflowY: 'auto', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {Array.isArray(o.items) ? o.items.map((item, idx) => {
                            const itemImage = item.image;
                            const imageUrl = itemImage
                              ? (itemImage.startsWith('http') ? itemImage : `${API_BASE_URL.replace('/api', '')}/storage/${itemImage}`)
                              : null;
                            return (
                              <div key={idx} style={{ 
                                background: 'var(--bg)', 
                                border: '1px solid var(--border)', 
                                borderRadius: '8px', 
                                padding: '6px 10px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 10, 
                                maxWidth: 300 
                              }}>
                                <div style={{ 
                                  width: 32, 
                                  height: 32, 
                                  borderRadius: 6, 
                                  overflow: 'hidden', 
                                  border: '1px solid var(--border)', 
                                  backgroundColor: 'var(--card)', 
                                  flexShrink: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  {imageUrl ? (
                                    <img 
                                      src={imageUrl} 
                                      alt={item.name} 
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                    />
                                  ) : (
                                    <Package size={16} style={{ color: 'var(--text-secondary)' }} />
                                  )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                                  <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.name}>
                                    {item.name}
                                  </span>
                                  <span style={{ opacity: 0.6, fontSize: 10, fontWeight: 500, color: 'var(--text-secondary)' }}>
                                    x{item.quantity} · ${Number(item.price).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            );
                          }) : '—'}
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 14 }}>
                        ${Number(o.total).toFixed(2)}
                      </td>
                      <td>
                        {renderStatusCell(o)}
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
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', width: '100%' }}>
                          {/* Eye icon slot */}
                          <div style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {getReceiptUrl(o) && (
                              <button
                                type="button"
                                className="btn-eye-action"
                                onClick={() => handleOpenReceiptModal(o)}
                                title="Ver comprobante"
                              >
                                <Eye size={16} />
                              </button>
                            )}
                          </div>
                          
                          {/* Actions dropdown slot */}
                          <div style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {(o.status === 'pending' || o.status === 'rejected') && (
                              <div className="actions-dropdown-wrapper">
                                <button 
                                  type="button"
                                  className={`actions-dropdown-trigger ${activeDropdown === o.id ? 'active' : ''}`}
                                  onClick={() => setActiveDropdown(activeDropdown === o.id ? null : o.id)}
                                  title="Acciones"
                                  disabled={actionLoading === o.id + '_approve' || actionLoading === o.id + '_reject' || actionLoading === o.id + '_delete'}
                                >
                                  {actionLoading === o.id + '_approve' || actionLoading === o.id + '_reject' || actionLoading === o.id + '_delete' ? (
                                    <Loader2 className="spin" size={16} />
                                  ) : (
                                    <MoreVertical size={18} />
                                  )}
                                </button>
                                {activeDropdown === o.id && (
                                  <div className={`actions-dropdown-menu ${isLastRows ? 'open-up' : ''}`}>
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
                                    {o.status === 'rejected' && (
                                      <button 
                                        type="button"
                                        className="actions-dropdown-item actions-dropdown-item--danger"
                                        onClick={() => {
                                          handleDeleteClick(o.id);
                                          setActiveDropdown(null);
                                        }}
                                      >
                                        <Trash2 size={14} />
                                        <span>Eliminar registro</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
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
                          
                          {o.status === 'rejected' && (
                            <button 
                              type="button"
                              className="actions-dropdown-item actions-dropdown-item--danger"
                              onClick={() => {
                                handleDeleteClick(o.id);
                                setActiveDropdown(null);
                              }}
                            >
                              <Trash2 size={14} />
                              <span>Eliminar registro</span>
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

                    <div className="order-mobile-card-row" style={{ alignItems: 'flex-start' }}>
                      <span className="order-mobile-card-label">Estado</span>
                      <span className="order-mobile-card-val">
                        {renderStatusCell(o)}
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

                {/* Billing Details & WhatsApp Trigger */}
                <div>
                  <div className="order-verification-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Datos de Facturación</span>
                    <button
                      type="button"
                      onClick={() => {
                        const clientPhone = receiptModal.billing_phone || receiptModal.user?.phone || '';
                        const clientName = receiptModal.billing_name || receiptModal.user?.name || '';
                        const orderId = receiptModal.id;
                        const message = `Hola ${clientName}, tu pedido #${orderId} en Fitness Club Gym fue recibido y está en proceso de validación. ¡Pronto nos contactaremos contigo para la entrega! 🛍️`;
                        let formattedPhone = clientPhone.replace(/\s+/g, '').replace(/[+\-]/g, '');
                        if (formattedPhone.startsWith('0')) {
                          formattedPhone = '593' + formattedPhone.substring(1);
                        } else if (!formattedPhone.startsWith('593') && formattedPhone.length === 9) {
                          formattedPhone = '593' + formattedPhone;
                        }
                        window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
                      }}
                      style={{
                        backgroundColor: '#25D366',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.863-9.73.001-2.597-1.006-5.038-2.836-6.87C16.634 2.16 14.204.975 11.623.975c-5.442 0-9.866 4.372-9.87 9.737-.002 1.84.482 3.636 1.4 5.2l-.37 1.353 1.385-.363zm10.963-7.53c-.313-.157-1.854-.915-2.14-1.018-.287-.105-.497-.157-.707.157-.21.314-.813 1.018-.996 1.228-.183.21-.366.236-.679.079-.313-.157-1.32-.486-2.515-1.553-.93-.83-1.558-1.855-1.74-2.17-.183-.313-.02-.482.137-.638.14-.14.313-.367.47-.55.157-.185.21-.315.314-.525.105-.21.053-.394-.026-.55-.08-.158-.708-1.703-.97-2.336-.255-.618-.516-.534-.707-.544-.183-.01-.393-.01-.602-.01-.21 0-.55.08-.838.393-.288.315-1.1 1.077-1.1 2.628 0 1.552 1.127 3.042 1.284 3.253.158.21 2.217 3.385 5.372 4.747.75.324 1.336.518 1.794.662.753.24 1.438.207 1.98.127.604-.09 1.853-.758 2.115-1.454.26-.697.26-1.295.183-1.42-.077-.125-.287-.203-.6-.36z"/>
                      </svg>
                      <span>WhatsApp</span>
                    </button>
                  </div>
                  <div style={{ padding: 12, backgroundColor: 'rgba(16, 185, 129, 0.03)', border: '1px solid var(--border)', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Nombre:</span><span style={{ fontWeight: 600 }}>{receiptModal.billing_name || receiptModal.user?.name || '—'}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Cédula:</span><span style={{ fontWeight: 600 }}>{receiptModal.billing_id_number || receiptModal.user?.billing_id_number || '—'}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Email:</span><span style={{ fontWeight: 600 }}>{receiptModal.billing_email || receiptModal.user?.email || '—'}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Teléfono:</span><span style={{ fontWeight: 600 }}>{receiptModal.billing_phone || receiptModal.user?.phone || '—'}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Ciudad:</span><span style={{ fontWeight: 600 }}>{receiptModal.billing_city || receiptModal.user?.billing_city || '—'}</span></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><span style={{ color: 'var(--text-secondary)' }}>Dirección:</span><span style={{ fontWeight: 600, wordBreak: 'break-all', marginTop: 4 }}>{receiptModal.billing_address || receiptModal.user?.billing_address || '—'}</span></div>
                  </div>
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
