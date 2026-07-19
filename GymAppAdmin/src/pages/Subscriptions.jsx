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
  Calendar,
  Search,
  Users,
  Clock,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  MoreVertical,
  XCircle,
  AlertCircle
} from 'lucide-react';
import '../components/Layout.css';
import './Subscriptions.css';

const STATUS_LABELS = { active: 'Activa', pending: 'Pendiente', cancelled: 'Cancelada', expired: 'Expirada', rejected: 'Rechazado' };
const STATUS_BADGE = { active: 'active', pending: 'pending', cancelled: 'cancelled', expired: 'expired', rejected: 'rejected' };

export default function Subscriptions() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [receiptModal, setReceiptModal] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Standard Confirmation Modal (approve/reject/renew)
  const [confirmModal, setConfirmModal] = useState(null);
  
  // Custom Rejection Reason Modal
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Multi-step Delete Modal
  const [deleteModal, setDeleteModal] = useState(null); // { sub, step: 1|2|3, typed: '' }
  const DELETE_CONFIRM_WORD = 'ELIMINAR';

  const handleOpenReceiptModal = (sub) => {
    setZoom(1);
    setRotation(0);
    setReceiptModal(sub);
  };

  const getRemainingDaysText = (endsAtStr) => {
    if (!endsAtStr) return '';
    const endsAt = new Date(endsAtStr);
    const today = new Date();
    endsAt.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = endsAt - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expirado';
    if (diffDays === 0) return 'Vence hoy';
    if (diffDays === 1) return 'Queda 1 día';
    return `${diffDays} días restantes`;
  };

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

  const renderStatusCell = (s) => {
    let IconComponent = Clock;
    if (s.status === 'active') {
      IconComponent = CheckCircle2;
    } else if (s.status === 'cancelled' || s.status === 'expired') {
      IconComponent = XCircle;
    }

    return (
      <div className="status-pill-container">
        <span className={`status-pill status-pill--${STATUS_BADGE[s.status] || 'expired'}`}>
          <IconComponent size={14} className="status-pill-icon" />
          <span>{STATUS_LABELS[s.status] || s.status}</span>
        </span>
        {s.status === 'rejected' && s.rejection_reason && (
          <div className="status-rejection-info">
            <AlertCircle size={12} className="status-rejection-info-icon" />
            <span className="rejection-text-truncated">Motivo: {s.rejection_reason}</span>
            <div className="tooltip-bubble">
              <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>Motivo del Rechazo</div>
              <div>{s.rejection_reason}</div>
            </div>
          </div>
        )}
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
      await apiFetch(`/trainer/subscriptions/${id}/reject`, { 
        method: 'POST',
        body: JSON.stringify({ reason: rejectionReason || 'Comprobante no válido' })
      });
      setSuccess('Suscripción rechazada');
      fetchSubs();
    } catch (e) { setError(e.message); }
    finally { setActionLoading(null); }
  };

  // Open the multi-step delete modal
  const handleDelete = (sub) => {
    setDeleteModal({ sub, step: 1, typed: '' });
    setActiveDropdown(null);
  };

  const executeDelete = async (id) => {
    setActionLoading(id + '_delete');
    setError(''); setSuccess('');
    try {
      await apiFetch(`/trainer/subscriptions/${id}`, { method: 'DELETE' });
      setSuccess('Suscripción eliminada exitosamente');
      setDeleteModal(null);
      fetchSubs();
    } catch (e) { 
      setError(e.message || 'Error al eliminar la suscripción'); 
    } finally { 
      setActionLoading(null); 
    }
  };

  const handleRenew = (id) => {
    setConfirmModal({
      title: '¿Renovar Suscripción?',
      message: '¿Estás seguro de que deseas renovar esta suscripción? Esto activará y extenderá su vigencia en base a la duración de su plan.',
      type: 'success',
      onConfirm: () => executeRenew(id)
    });
  };

  const executeRenew = async (id) => {
    setActionLoading(id + '_renew');
    setError(''); setSuccess('');
    try {
      await apiFetch(`/trainer/subscriptions/${id}/renew`, { method: 'POST' });
      setSuccess('Suscripción renovada exitosamente');
      fetchSubs();
    } catch (e) { 
      setError(e.message || 'Error al renovar la suscripción'); 
    } finally { 
      setActionLoading(null); 
    }
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
        <div>
          <h2 style={{ margin: 0 }}>Suscripciones</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>Controla los ingresos y membresías de los clientes</p>
        </div>
      </div>

      {/* SaaS Stats Grid */}
      <div className="subscriptions-stats-grid">
        <div className="sub-stat-card">
          <div className="sub-stat-icon-wrapper active">
            <Users size={20} />
          </div>
          <div className="sub-stat-content">
            <span className="sub-stat-label">Total Suscriptores</span>
            <span className="sub-stat-value">{subs.length}</span>
          </div>
        </div>
        
        <div className="sub-stat-card">
          <div className="sub-stat-icon-wrapper pending">
            <Clock size={20} />
          </div>
          <div className="sub-stat-content">
            <span className="sub-stat-label">Pendientes de Pago</span>
            <span className="sub-stat-value">{subs.filter(s => s.status === 'pending').length}</span>
          </div>
        </div>

        <div className="sub-stat-card">
          <div className="sub-stat-icon-wrapper success">
            <CheckCircle2 size={20} />
          </div>
          <div className="sub-stat-content">
            <span className="sub-stat-label">Suscripciones Activas</span>
            <span className="sub-stat-value">{subs.filter(s => s.status === 'active').length}</span>
          </div>
        </div>

        <div className="sub-stat-card">
          <div className="sub-stat-icon-wrapper danger">
            <X size={20} />
          </div>
          <div className="sub-stat-content">
            <span className="sub-stat-label">Expiradas / Canceladas</span>
            <span className="sub-stat-value">{subs.filter(s => s.status === 'expired' || s.status === 'cancelled').length}</span>
          </div>
        </div>
      </div>

      {/* Toolbar with Search and Segmented Filters */}
      <div className="subscriptions-toolbar">
        <div className="search-wrapper">
          <Search size={16} className="search-icon" />
          <input 
            className="search-input-premium" 
            placeholder="Buscar por cliente o email..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        
        <div className="filter-tabs">
          <button 
            type="button"
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            <span>Todos</span>
            <span className="tab-count">{subs.length}</span>
          </button>
          <button 
            type="button"
            className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            <span>Pendientes</span>
            <span className="tab-count pending">{subs.filter(s => s.status === 'pending').length}</span>
          </button>
          <button 
            type="button"
            className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            <span>Activas</span>
            <span className="tab-count active">{subs.filter(s => s.status === 'active').length}</span>
          </button>
          <button 
            type="button"
            className={`filter-tab ${filter === 'cancelled' ? 'active' : ''}`}
            onClick={() => setFilter('cancelled')}
          >
            <span>Canceladas</span>
            <span className="tab-count cancelled">{subs.filter(s => s.status === 'cancelled').length}</span>
          </button>
          <button 
            type="button"
            className={`filter-tab ${filter === 'expired' ? 'active' : ''}`}
            onClick={() => setFilter('expired')}
          >
            <span>Expiradas</span>
            <span className="tab-count expired">{subs.filter(s => s.status === 'expired').length}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state"><Loader2 className="spin" size={24} /> <span>Cargando…</span></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-icon"><CreditCard size={40} /></div><p>No hay suscripciones que coincidan con los filtros</p></div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="subs-desktop-view">
            <div className="subs-table-container">
              <table className="subs-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 200 }}>Usuario</th>
                    <th>Plan</th>
                    <th>Estado</th>
                    <th>Método</th>
                    <th>Vigencia</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((s, index) => {
                    const isLastRows = index >= paginatedItems.length - 2;
                    return (
                      <tr key={s.id}>
                      <td style={{ minWidth: 200 }}>{renderUserCell(s.user)}</td>
                      <td style={{ fontWeight: 600 }}>{s.plan?.name || s.plan_id || '—'}</td>
                      <td>
                        {renderStatusCell(s)}
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
                      <td style={{ fontSize: 13 }}>
                        {s.starts_at && s.ends_at ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Inicio: {new Date(s.starts_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span>
                            <span style={{ fontWeight: 600 }}>Vence: {new Date(s.ends_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            {s.status === 'active' && (
                              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', marginTop: 2 }}>
                                {getRemainingDaysText(s.ends_at)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Creada: {s.created_at ? new Date(s.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : '—'}</span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Sin vigencia activa</span>
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', width: '100%' }}>
                          {/* Eye icon slot */}
                          <div style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {getReceiptUrl(s) && (
                              <button
                                type="button"
                                className="btn-eye-action"
                                onClick={() => handleOpenReceiptModal(s)}
                                title="Ver comprobante"
                              >
                                <Eye size={16} />
                              </button>
                            )}
                          </div>

                          {/* Actions dropdown slot */}
                          <div style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div className="actions-dropdown-wrapper">
                              <button 
                                type="button"
                                className={`actions-dropdown-trigger ${activeDropdown === s.id ? 'active' : ''}`}
                                onClick={() => setActiveDropdown(activeDropdown === s.id ? null : s.id)}
                                title="Acciones"
                                disabled={actionLoading === s.id + '_approve' || actionLoading === s.id + '_reject' || actionLoading === s.id + '_renew' || actionLoading === s.id + '_delete'}
                              >
                                {actionLoading === s.id + '_approve' || actionLoading === s.id + '_reject' || actionLoading === s.id + '_renew' || actionLoading === s.id + '_delete' ? (
                                  <Loader2 className="spin" size={16} />
                                ) : (
                                  <MoreVertical size={18} />
                                )}
                              </button>
                              {activeDropdown === s.id && (
                                <div className={`actions-dropdown-menu ${isLastRows ? 'open-up' : ''}`}>
                                  {s.status === 'pending' ? (
                                    <>
                                      <button 
                                        type="button"
                                        className="actions-dropdown-item"
                                        onClick={() => {
                                          handleApprove(s.id);
                                          setActiveDropdown(null);
                                        }}
                                      >
                                        <Check size={14} style={{ color: '#16a34a' }} />
                                        <span style={{ color: '#16a34a', fontWeight: 600 }}>Aprobar pago</span>
                                      </button>
                                      <button 
                                        type="button"
                                        className="actions-dropdown-item actions-dropdown-item--danger"
                                        onClick={() => {
                                          handleReject(s.id);
                                          setActiveDropdown(null);
                                        }}
                                      >
                                        <X size={14} style={{ color: '#dc2626' }} />
                                        <span style={{ color: '#dc2626', fontWeight: 600 }}>Rechazar pago</span>
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button 
                                        type="button"
                                        className="actions-dropdown-item"
                                        onClick={() => {
                                          handleRenew(s.id);
                                          setActiveDropdown(null);
                                        }}
                                      >
                                        <RefreshCw size={14} style={{ color: '#16a34a' }} />
                                        <span style={{ color: '#16a34a', fontWeight: 600 }}>Renovar suscripción</span>
                                      </button>
                                      <button 
                                        type="button"
                                        className="actions-dropdown-item actions-dropdown-item--danger"
                                        onClick={() => handleDelete(s)}
                                      >
                                        <Trash2 size={14} />
                                        <span>Eliminar suscripción</span>
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
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

          {/* Mobile Cards View */}
          <div className="subs-mobile-view">
            <div className="mobile-subs-grid">
              {paginatedItems.map(s => (
                <div className="sub-mobile-card" key={s.id}>
                  {/* Card Header with User Profile */}
                  <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {renderUserCell(s.user)}
                    
                    {/* Compact actions button on mobile cards */}
                    <div className="actions-dropdown-wrapper">
                      <button 
                        type="button"
                        className={`actions-dropdown-trigger ${activeDropdown === s.id ? 'active' : ''}`}
                        onClick={() => setActiveDropdown(activeDropdown === s.id ? null : s.id)}
                        title="Acciones"
                      >
                        <MoreVertical size={18} />
                      </button>
                      {activeDropdown === s.id && (
                        <div className="actions-dropdown-menu">
                          {s.status === 'pending' ? (
                            <>
                              <button 
                                type="button"
                                className="actions-dropdown-item"
                                onClick={() => {
                                  handleApprove(s.id);
                                  setActiveDropdown(null);
                                }}
                              >
                                <Check size={14} style={{ color: '#16a34a' }} />
                                <span style={{ color: '#16a34a', fontWeight: 600 }}>Aprobar pago</span>
                              </button>
                              
                              <button 
                                type="button"
                                className="actions-dropdown-item actions-dropdown-item--danger"
                                onClick={() => {
                                  handleReject(s.id);
                                  setActiveDropdown(null);
                                }}
                              >
                                <X size={14} style={{ color: '#dc2626' }} />
                                <span style={{ color: '#dc2626', fontWeight: 600 }}>Rechazar pago</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                type="button"
                                className="actions-dropdown-item"
                                onClick={() => {
                                  handleRenew(s.id);
                                  setActiveDropdown(null);
                                }}
                              >
                                <RefreshCw size={14} style={{ color: '#16a34a' }} />
                                <span style={{ color: '#16a34a', fontWeight: 600 }}>Renovar suscripción</span>
                              </button>
                              <button 
                                type="button"
                                className="actions-dropdown-item actions-dropdown-item--danger"
                                onClick={() => handleDelete(s)}
                              >
                                <Trash2 size={14} />
                                <span>Eliminar suscripción</span>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
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

                    <div className="sub-mobile-card-row" style={{ alignItems: 'flex-start' }}>
                      <span className="sub-mobile-card-label" style={{ marginTop: '2px' }}>
                        <Calendar size={13} style={{ opacity: 0.7 }} />
                        <span>Vigencia</span>
                      </span>
                      <span className="sub-mobile-card-val" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right', fontSize: '12px' }}>
                        {s.starts_at && s.ends_at ? (
                          <>
                            <span style={{ opacity: 0.8 }}>Inicio: {new Date(s.starts_at).toLocaleDateString('es-MX')}</span>
                            <span>Vence: {new Date(s.ends_at).toLocaleDateString('es-MX')}</span>
                            {s.status === 'active' && (
                              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', marginTop: '3px' }}>
                                {getRemainingDaysText(s.ends_at)}
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <span style={{ opacity: 0.8 }}>Creada: {s.created_at ? new Date(s.created_at).toLocaleDateString('es-MX') : '—'}</span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Sin vigencia activa</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="sub-mobile-card-row" style={{ alignItems: 'flex-start' }}>
                      <span className="sub-mobile-card-label" style={{ marginTop: '2px' }}>
                        <CheckCircle2 size={13} style={{ opacity: 0.7 }} />
                        <span>Estado</span>
                      </span>
                      <span className="sub-mobile-card-val">
                        {renderStatusCell(s)}
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
                        onClick={() => handleOpenReceiptModal(s)}
                      >
                        <Eye size={14} />
                        <span>Ver comprobante</span>
                      </button>
                    )}

                    {/* Inline actions removed, handled by the 3-dots dropdown menu */}
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

      {/* Receipt Modal (Split View with controls) */}
      {receiptModal && (
        <div className="modal-overlay" onClick={() => setReceiptModal(null)}>
          <div className="premium-receipt-modal" onClick={e => e.stopPropagation()}>
            
            <div className="premium-modal-header">
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div className="modal-header-icon">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text)', fontSize: '18px', fontWeight: 700 }}>Verificación de Pago</h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>Valida el comprobante para activar la membresía</p>
                </div>
              </div>
              <button className="btn btn--ghost" style={{ padding: 6, borderRadius: '50%' }} onClick={() => setReceiptModal(null)}><X size={16} /></button>
            </div>
            
            <div className="modal-split-container">
              {/* Left Pane: Preview */}
              <div className="modal-split-preview">
                <div className="modal-preview-header">
                  <span className="modal-preview-title">Visualización del Comprobante</span>
                  <div className="modal-zoom-controls">
                    <button 
                      type="button" 
                      onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.5))} 
                      title="Zoom Out"
                    >
                      <ZoomOut size={15} />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => { setZoom(1); setRotation(0); }} 
                      title="Restablecer"
                      className="zoom-reset-btn"
                    >
                      100%
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setZoom(prev => Math.min(prev + 0.2, 3))} 
                      title="Zoom In"
                    >
                      <ZoomIn size={15} />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setRotation(prev => prev + 90)} 
                      title="Rotar 90°"
                    >
                      <RotateCw size={15} />
                    </button>
                  </div>
                </div>
                <div className="modal-image-viewport">
                  {getReceiptUrl(receiptModal) ? (
                    <img
                      src={getReceiptUrl(receiptModal)}
                      alt="Comprobante"
                      style={{
                        transform: `scale(${zoom}) rotate(${rotation}deg)`,
                        transition: 'transform 0.2s ease-out'
                      }}
                      onError={e => {
                        e.target.style.display = 'none';
                        e.target.parentNode.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-secondary)', gap: 12 }}>
                      <AlertTriangle size={48} />
                      <p style={{ margin: 0 }}>No hay comprobante disponible</p>
                    </div>
                  )}
                </div>
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

                  {/* Billing Details & WhatsApp Trigger */}
                  <div className="verification-info-card" style={{ borderLeft: '3px solid #10b981', background: 'rgba(16, 185, 129, 0.03)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>DATOS DE FACTURACIÓN</span>
                      <button
                        type="button"
                        onClick={() => {
                          const clientPhone = receiptModal.billing_phone || receiptModal.user?.phone || '';
                          const clientName = receiptModal.billing_name || receiptModal.user?.name || '';
                          const planName = receiptModal.plan?.name || 'Membresía';
                          const message = `Hola ${clientName}, tu solicitud de membresía para el plan ${planName} en Fitness Club Gym fue recibida y está en proceso de validación. ¡Pronto te confirmaremos la activación! 💪`;
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
                          padding: '6px 12px',
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
                    <div className="info-row">
                      <span className="info-label">Nombre</span>
                      <span className="info-value">{receiptModal.billing_name || receiptModal.user?.name || '—'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Cédula</span>
                      <span className="info-value">{receiptModal.billing_id_number || receiptModal.user?.billing_id_number || '—'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Email</span>
                      <span className="info-value">{receiptModal.billing_email || receiptModal.user?.email || '—'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Teléfono</span>
                      <span className="info-value">{receiptModal.billing_phone || receiptModal.user?.phone || '—'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Ciudad</span>
                      <span className="info-value">{receiptModal.billing_city || receiptModal.user?.billing_city || '—'}</span>
                    </div>
                    <div className="info-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                      <span className="info-label">Dirección</span>
                      <span className="info-value" style={{ width: '100%', whiteSpace: 'normal', wordBreak: 'break-all', textAlign: 'left', marginTop: 4 }}>
                        {receiptModal.billing_address || receiptModal.user?.billing_address || '—'}
                      </span>
                    </div>
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

      {/* Custom Prompt Modal for Rejecting Subscriptions */}
      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="modal" style={{ maxWidth: 420, padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Rechazar Suscripción</h3>
              <button className="btn btn--ghost" style={{ padding: 6, borderRadius: '50%' }} onClick={() => setRejectModal(null)}><X size={16} /></button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px 0', lineHeight: 1.4 }}>
              Ingresa el motivo del rechazo para notificar al usuario. Este se mostrará en su perfil de la aplicación móvil:
            </p>
            
            <form onSubmit={executeReject}>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <textarea 
                  value={rejectionReason}
                  onChange={e => {
                    const val = e.target.value;
                    const words = val.trim() === '' ? [] : val.trim().split(/\s+/);
                    if (words.length <= 100 || val.length < rejectionReason.length) {
                      setRejectionReason(val);
                    }
                  }}
                  placeholder="Ej. Comprobante de pago ilegible, los datos no coinciden, etc."
                  rows={3}
                  className="rejection-textarea"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                  required
                  autoFocus
                />
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontSize: '11px', 
                  color: 'var(--text-secondary)',
                  marginTop: '4px' 
                }}>
                  <span>Máximo 100 palabras</span>
                  <span style={{ 
                    fontWeight: 'bold',
                    color: (rejectionReason.trim() === '' ? 0 : rejectionReason.trim().split(/\s+/).length) >= 100 ? '#ef4444' : 'var(--text-secondary)'
                  }}>
                    {rejectionReason.trim() === '' ? 0 : rejectionReason.trim().split(/\s+/).length} / 100
                  </span>
                </div>
              </div>
              <div className="modal-actions" style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="btn btn--ghost" style={{ flex: 1 }} onClick={() => setRejectModal(null)}>Cancelar</button>
                <button 
                  type="submit" 
                  className="btn btn--danger" 
                  style={{ flex: 1 }}
                  disabled={rejectionReason.trim().length < 3 || (rejectionReason.trim() === '' ? 0 : rejectionReason.trim().split(/\s+/).length) > 100}
                >
                  Rechazar Suscripción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Standard Confirmation Modal (approve / reject / renew) */}
      {confirmModal && (
        <div className="modal-overlay" onClick={() => setConfirmModal(null)}>
          <div className="modal" style={{ maxWidth: 400, textAlign: 'center', padding: '32px 24px' }} onClick={e => e.stopPropagation()}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              backgroundColor: confirmModal.type === 'danger' ? 'var(--danger-light)' : 'var(--success-light)',
              color: confirmModal.type === 'danger' ? 'var(--danger-text)' : 'var(--success)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto'
            }}>
              {confirmModal.type === 'danger' ? <Trash2 size={24} /> : <Check size={24} />}
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{confirmModal.title}</h3>
            <p style={{ margin: '0 0 24px 0', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{confirmModal.message}</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn--ghost" style={{ flex: 1 }} onClick={() => setConfirmModal(null)}>Cancelar</button>
              <button className={`btn btn--${confirmModal.type === 'danger' ? 'danger' : 'success'}`} style={{ flex: 1 }}
                onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MULTI-STEP DELETE MODAL — 3 pantallas de seguridad
      ══════════════════════════════════════════════════════ */}
      {deleteModal && (
        <div className="modal-overlay" onClick={() => setDeleteModal(null)}>
          <div className="modal delete-modal" onClick={e => e.stopPropagation()}>

            {/* ── Step indicator ── */}
            <div className="delete-modal-steps">
              {[1, 2, 3].map(n => (
                <div key={n} className={`delete-step-dot ${deleteModal.step >= n ? 'active' : ''} ${deleteModal.step > n ? 'done' : ''}`}/>
              ))}
            </div>

            {/* ── STEP 1: Resumen de lo que se va a eliminar ── */}
            {deleteModal.step === 1 && (
              <>
                <div className="delete-modal-icon">
                  <Trash2 size={32}/>
                </div>
                <h3 className="delete-modal-title">Eliminar Suscripción</h3>
                <p className="delete-modal-subtitle">Estás a punto de eliminar permanentemente la siguiente suscripción:</p>

                {/* Subscription summary card */}
                <div className="delete-summary-card">
                  <div className="delete-summary-row">
                    <span className="delete-summary-label">Usuario</span>
                    <span className="delete-summary-value">{deleteModal.sub.user?.name || '—'}</span>
                  </div>
                  <div className="delete-summary-row">
                    <span className="delete-summary-label">Email</span>
                    <span className="delete-summary-value" style={{ fontSize: 12 }}>{deleteModal.sub.user?.email || '—'}</span>
                  </div>
                  <div className="delete-summary-row">
                    <span className="delete-summary-label">Plan</span>
                    <span className="delete-summary-value">{deleteModal.sub.plan?.name || deleteModal.sub.plan_id || '—'}</span>
                  </div>
                  <div className="delete-summary-row">
                    <span className="delete-summary-label">Estado</span>
                    <span className="delete-summary-value">{STATUS_LABELS[deleteModal.sub.status] || deleteModal.sub.status}</span>
                  </div>
                  <div className="delete-summary-row" style={{ borderBottom: 'none' }}>
                    <span className="delete-summary-label">ID</span>
                    <span className="delete-summary-value">#{deleteModal.sub.id}</span>
                  </div>
                </div>

                {/* Warning 1 */}
                <div className="delete-warning-box delete-warning-box--red">
                  <AlertTriangle size={16}/>
                  <span>Esta acción <strong>eliminará permanentemente</strong> el registro de la base de datos. No se puede deshacer.</span>
                </div>

                <div className="delete-modal-actions">
                  <button className="btn btn--ghost" onClick={() => setDeleteModal(null)}>Cancelar</button>
                  <button className="btn btn--danger" onClick={() => setDeleteModal(d => ({ ...d, step: 2 }))}>
                    Continuar <span style={{ fontSize: 12, opacity: 0.8 }}>(1/3)</span>
                  </button>
                </div>
              </>
            )}

            {/* ── STEP 2: Segunda advertencia + confirmación escrita ── */}
            {deleteModal.step === 2 && (
              <>
                <div className="delete-modal-icon delete-modal-icon--orange">
                  <AlertTriangle size={32}/>
                </div>
                <h3 className="delete-modal-title">¿Estás completamente seguro?</h3>
                <p className="delete-modal-subtitle">Esta operación <strong>no tiene vuelta atrás</strong>. El historial de esta suscripción desaparecerá del sistema.</p>

                {/* Warning 2 */}
                <div className="delete-warning-box delete-warning-box--orange">
                  <AlertCircle size={16}/>
                  <span>Si el usuario tenía acceso activo, <strong>perderá su membresía</strong> de inmediato y no recibirá reembolso automático.</span>
                </div>

                {/* Typed confirmation */}
                <div className="delete-type-confirm">
                  <label className="delete-type-label">
                    Para confirmar, escribe <strong>{DELETE_CONFIRM_WORD}</strong> en el campo:
                  </label>
                  <input
                    type="text"
                    className={`delete-type-input ${deleteModal.typed === DELETE_CONFIRM_WORD ? 'valid' : deleteModal.typed ? 'invalid' : ''}`}
                    placeholder={DELETE_CONFIRM_WORD}
                    value={deleteModal.typed}
                    onChange={e => setDeleteModal(d => ({ ...d, typed: e.target.value.toUpperCase() }))}
                    autoFocus
                  />
                </div>

                <div className="delete-modal-actions">
                  <button className="btn btn--ghost" onClick={() => setDeleteModal(d => ({ ...d, step: 1, typed: '' }))}>← Atrás</button>
                  <button
                    className="btn btn--danger"
                    disabled={deleteModal.typed !== DELETE_CONFIRM_WORD}
                    onClick={() => setDeleteModal(d => ({ ...d, step: 3 }))}
                  >
                    Continuar <span style={{ fontSize: 12, opacity: 0.8 }}>(2/3)</span>
                  </button>
                </div>
              </>
            )}

            {/* ── STEP 3: Confirmación final ── */}
            {deleteModal.step === 3 && (
              <>
                <div className="delete-modal-icon delete-modal-icon--final">
                  <ShieldAlert size={32}/>
                </div>
                <h3 className="delete-modal-title" style={{ color: '#dc2626' }}>Última oportunidad</h3>
                <p className="delete-modal-subtitle">Al presionar <strong>"Sí, eliminar ahora"</strong> el registro será borrado de forma permanente e irreversible del servidor.</p>

                {/* Final warning */}
                <div className="delete-warning-box delete-warning-box--red" style={{ marginBottom: 20 }}>
                  <AlertTriangle size={16}/>
                  <span>Suscripción de <strong>{deleteModal.sub.user?.name}</strong> · Plan <strong>{deleteModal.sub.plan?.name || '—'}</strong> · ID #{deleteModal.sub.id}</span>
                </div>

                <div className="delete-modal-actions">
                  <button className="btn btn--ghost" onClick={() => setDeleteModal(null)} disabled={actionLoading === deleteModal.sub.id + '_delete'}>Cancelar todo</button>
                  <button
                    className="btn btn--danger"
                    disabled={actionLoading === deleteModal.sub.id + '_delete'}
                    onClick={() => executeDelete(deleteModal.sub.id)}
                  >
                    {actionLoading === deleteModal.sub.id + '_delete'
                      ? <><Loader2 size={14} className="spin"/> Eliminando...</>
                      : <><Trash2 size={14}/> Sí, eliminar ahora</>
                    }
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
