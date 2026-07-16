import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, API_BASE_URL } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  AlertTriangle, 
  Users, 
  CheckCircle2, 
  CalendarClock, 
  Package, 
  DollarSign, 
  Loader2, 
  CreditCard,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Activity,
  ShoppingBag,
  Tags,
  TrendingUp,
  HelpCircle
} from 'lucide-react';
import '../components/Layout.css';
import './Subscriptions.css';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState(null);
  const [recentSubs, setRecentSubs] = useState([]);
  const [pendingSubsCount, setPendingSubsCount] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    Promise.all([
      apiFetch('/admin/metrics').catch((e) => {
        console.error('Metrics fetch error:', e);
        return null;
      }),
      apiFetch('/trainer/subscriptions').catch((e) => {
        console.error('Subscriptions fetch error:', e);
        return [];
      }),
      apiFetch('/admin/orders').catch((e) => {
        console.error('Orders fetch error:', e);
        return [];
      }),
    ]).then(([metricsData, subsData, ordersData]) => {
      setStats(metricsData);
      
      const subsList = Array.isArray(subsData) ? subsData : [];
      setRecentSubs(subsList.slice(0, 5));
      setPendingSubsCount(subsList.filter(s => s.status === 'pending').length);
      
      const ordersList = Array.isArray(ordersData) ? ordersData : [];
      setPendingOrdersCount(ordersList.filter(o => o.status === 'pending').length);
    }).finally(() => setLoading(false));
  }, []);

  const statCards = [
    { 
      label: 'Usuarios Registrados', 
      value: stats?.total_users ?? '0', 
      icon: Users, 
      color: '#3B82F6', 
      sub: 'Clientes con cuenta en la app' 
    },
    { 
      label: 'Suscripciones Activas', 
      value: stats?.active_subscriptions ?? '0', 
      icon: CheckCircle2, 
      color: '#10B981', 
      sub: 'Membresías vigentes hoy' 
    },
    { 
      label: 'Planes por Vencer', 
      value: stats?.expiring_subscriptions ?? '0', 
      icon: CalendarClock, 
      color: '#F59E0B', 
      sub: 'Expiran en los siguientes 7 días' 
    },
    { 
      label: 'Ingresos Mensuales', 
      value: stats?.monthly_income ? `$${Number(stats.monthly_income).toFixed(2)}` : '$0.00', 
      icon: DollarSign, 
      color: '#8B5CF6', 
      sub: 'Ingresos de tienda y planes' 
    },
  ];

  const quickActions = [
    {
      title: 'Activar Clientes',
      desc: 'Aprueba las transferencias de membresía pendientes.',
      icon: CreditCard,
      color: '#3B82F6',
      path: '/suscripciones'
    },
    {
      title: 'Despachar Tienda',
      desc: 'Revisa y entrega los pedidos de productos comprados.',
      icon: ShoppingBag,
      color: '#10B981',
      path: '/pedidos'
    },
    {
      title: 'Reportes y Caja',
      desc: 'Monitorea las ventas diarias, semanales y mensuales.',
      icon: TrendingUp,
      color: '#8B5CF6',
      path: '/reportes'
    },
    {
      title: 'Planes y Precios',
      desc: 'Modifica o crea los planes de membresía del gimnasio.',
      icon: Tags,
      color: '#F59E0B',
      path: '/planes'
    }
  ];

  if (loading) {
    return (
      <div className="loading-state">
        <Loader2 className="spin" size={24} /> <span>Cargando panel de administración…</span>
      </div>
    );
  }

  const hasUrgentAlerts = pendingSubsCount > 0 || pendingOrdersCount > 0;

  return (
    <div className="dashboard-container">
      {/* 1. Banner de Bienvenida Premium */}
      <div className="dashboard-welcome-banner">
        <div className="welcome-text">
          <span className="welcome-badge">
            <Sparkles size={14} /> Panel Operativo
          </span>
          <h1 style={{ marginTop: '12px' }}>¡Hola de nuevo, {user?.name || 'Administrador'}! 👋</h1>
          <p>
            Este es tu panel general de control. Aquí puedes ver el rendimiento del gimnasio y atender las solicitudes de tus clientes de forma simple.
          </p>
        </div>
        <div className="welcome-stats" style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 13, opacity: 0.8 }}>Estado de hoy</span>
          <span style={{ fontSize: 20, fontWeight: 900, color: hasUrgentAlerts ? '#F87171' : '#4ADE80' }}>
            {hasUrgentAlerts ? 'Revisión Pendiente' : 'Operación al Día'}
          </span>
        </div>
      </div>

      {/* 2. Sección de Alertas Urgentes (Onboarding Visual) */}
      {hasUrgentAlerts && (
        <div className="dashboard-alerts-container">
          {pendingSubsCount > 0 && (
            <div className="alert-panel danger">
              <div className="alert-icon-wrapper">
                <ShieldAlert size={20} />
              </div>
              <div className="alert-content">
                <h3 className="alert-title">Membresías por Aprobar</h3>
                <p className="alert-desc">
                  Tienes <strong>{pendingSubsCount}</strong> solicitud{pendingSubsCount !== 1 ? 'es' : ''} de membresía pendiente{pendingSubsCount !== 1 ? 's' : ''} de validar comprobante.
                </p>
                <button className="alert-btn" onClick={() => navigate('/suscripciones')}>
                  <span>Ir a Aprobar</span> <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {pendingOrdersCount > 0 && (
            <div className="alert-panel warning">
              <div className="alert-icon-wrapper">
                <AlertTriangle size={20} />
              </div>
              <div className="alert-content">
                <h3 className="alert-title">Pedidos por Procesar</h3>
                <p className="alert-desc">
                  Hay <strong>{pendingOrdersCount}</strong> compra{pendingOrdersCount !== 1 ? 's' : ''} de la tienda en espera de verificación y entrega.
                </p>
                <button className="alert-btn" onClick={() => navigate('/pedidos')}>
                  <span>Ver Pedidos</span> <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Acciones Rápidas (Menú Intuitivo) */}
      <div className="quick-actions-section">
        <div className="section-title-wrapper">
          <h2 className="section-title">Accesos Directos Recomendados</h2>
          <p className="section-subtitle">Realiza las tareas más comunes del día con un solo clic</p>
        </div>
        <div className="quick-actions-grid">
          {quickActions.map(action => {
            const Icon = action.icon;
            return (
              <div 
                className="quick-action-card" 
                key={action.title} 
                onClick={() => navigate(action.path)}
              >
                <div className="action-icon-box" style={{ backgroundColor: `${action.color}15`, color: action.color }}>
                  <Icon size={20} />
                </div>
                <h3 className="action-title">{action.title}</h3>
                <p className="action-desc">{action.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Layout Dividido: Estadísticas & Últimas Suscripciones */}
      <div className="dashboard-grid-layout">
        {/* Lado Izquierdo: Métricas Generales */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="section-title-wrapper">
            <h2 className="section-title" style={{ fontSize: 16 }}>Resumen de Métricas</h2>
            <p className="section-subtitle">Estado general del gimnasio en tiempo real</p>
          </div>
          
          <div className="stat-grid" style={{ margin: 0, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {statCards.map(s => {
              const Icon = s.icon;
              return (
                <div className="stat-card" key={s.label}>
                  <div className="stat-card-header">
                    <span className="stat-label">{s.label}</span>
                    <div className="stat-icon-wrapper" style={{ backgroundColor: `${s.color}15`, color: s.color }}>
                      <Icon size={18} />
                    </div>
                  </div>
                  <div className="stat-value-container">
                    <span className="stat-value" style={{ fontSize: 22 }}>{s.value}</span>
                  </div>
                  <div className="stat-sub">{s.sub}</div>
                </div>
              );
            })}
          </div>

          {/* Tabla de suscripciones recientes */}
          <div className="card" style={{ padding: '20px', margin: 0 }}>
            <div className="page-header" style={{ marginBottom: 16, borderBottom: 'none', padding: 0, minHeight: 'auto' }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>Membresías Recientes</h2>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Últimas personas en suscribirse al gimnasio</p>
              </div>
            </div>
            
            {recentSubs.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <div className="empty-icon">
                  <CreditCard size={32} />
                </div>
                <p>No hay suscripciones recientes registradas.</p>
              </div>
            ) : (
              <>
                <div className="dashboard-subs-desktop-view">
                  <div className="subs-table-container" style={{ margin: 0 }}>
                    <table className="subs-table">
                      <thead>
                        <tr>
                          <th>Usuario</th>
                          <th>Plan</th>
                          <th>Estado</th>
                          <th>Fecha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentSubs.map(s => (
                          <tr key={s.id}>
                            <td>{renderUserCell(s.user)}</td>
                            <td style={{ fontWeight: 600 }}>{s.plan?.name || s.plan_id || '—'}</td>
                            <td>
                              <span className={`badge-status badge-status--${s.status === 'approved' ? 'active' : s.status}`}>
                                <span className={`badge-status-dot badge-status-dot--${s.status === 'approved' ? 'active' : s.status}`} />
                                {s.status === 'active' || s.status === 'approved' 
                                  ? 'Activa' 
                                  : s.status === 'pending' 
                                    ? 'Pendiente' 
                                    : s.status === 'cancelled' 
                                      ? 'Cancelada' 
                                      : 'Expirada'}
                              </span>
                            </td>
                            <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                              {s.created_at ? new Date(s.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="dashboard-subs-mobile-view">
                  <div className="dashboard-recent-subs-list">
                    {recentSubs.map(s => (
                      <div className="dashboard-recent-sub-item" key={s.id}>
                        <div className="dashboard-recent-sub-left">
                          {renderUserCell(s.user)}
                        </div>
                        <div className="dashboard-recent-sub-right">
                          <span className="recent-sub-plan">{s.plan?.name || 'Plan'}</span>
                          <span className={`badge-status badge-status--${s.status === 'approved' ? 'active' : s.status}`}>
                            <span className={`badge-status-dot badge-status-dot--${s.status === 'approved' ? 'active' : s.status}`} />
                            {s.status === 'active' || s.status === 'approved' ? 'Activa' : 'Pendiente'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Lado Derecho: Guía de Uso del Administrador */}
        <div className="operation-guide-section">
          <div className="section-title-wrapper" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <HelpCircle size={18} style={{ color: 'var(--primary)' }} />
              <h2 className="section-title" style={{ margin: 0 }}>Guía de Operación</h2>
            </div>
            <p className="section-subtitle">¿Cómo administrar tu gimnasio diariamente?</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="guide-item">
              <div className="guide-step-num">1</div>
              <div className="guide-item-content">
                <h4>Revisar Pagos Pendientes</h4>
                <p>Si la alerta roja se enciende, haz clic en "Activar Clientes" para verificar sus comprobantes bancarios.</p>
              </div>
            </div>

            <div className="guide-item">
              <div className="guide-step-num">2</div>
              <div className="guide-item-content">
                <h4>Despachar Productos</h4>
                <p>Ve a "Pedidos" para verificar y entregar suplementos o mercancía comprada por los clientes.</p>
              </div>
            </div>

            <div className="guide-item">
              <div className="guide-step-num">3</div>
              <div className="guide-item-content">
                <h4>Revisar Expiraciones</h4>
                <p>Monitorea la tarjeta de "Planes por Vencer" para contactar a los clientes que deban renovar esta semana.</p>
              </div>
            </div>

            <div className="guide-item">
              <div className="guide-step-num">4</div>
              <div className="guide-item-content">
                <h4>Controlar Caja</h4>
                <p>Entra a "Reportes" para cuadrar el balance de ingresos diarios e históricos de forma automática.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
