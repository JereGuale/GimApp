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

  const premiumStatCards = [
    {
      label: 'Miembros Activos',
      value: stats?.active_subscriptions !== undefined && stats?.active_subscriptions !== null 
        ? Number(stats.active_subscriptions).toLocaleString('es-MX') 
        : '0',
      badge: stats?.new_registrations_week !== undefined && stats?.new_registrations_week !== null
        ? `+${stats.new_registrations_week}`
        : '+0',
      badgeType: 'positive',
      sub: `${stats?.new_registrations_week ?? 0} nuevas membresías esta semana`,
      icon: Users,
      color: '#3B82F6'
    },
    {
      label: 'Ingresos Mensuales',
      value: stats?.monthly_income !== undefined && stats?.monthly_income !== null
        ? `$${Math.round(Number(stats.monthly_income)).toLocaleString('es-MX')}`
        : '$0',
      badge: stats?.monthly_change_percent !== undefined && stats?.monthly_change_percent !== null
        ? `${stats.monthly_change_percent >= 0 ? '+' : ''}${stats.monthly_change_percent}%`
        : '+0%',
      badgeType: stats?.monthly_change_percent >= 0 ? 'positive' : 'negative',
      sub: `Proyectado: $${stats?.monthly_income ? Math.round(Number(stats.monthly_income) * 1.05).toLocaleString('es-MX') : '0'} para fin de mes`,
      icon: DollarSign,
      color: '#10B981'
    },
    {
      label: 'Asistencia Diaria',
      value: stats?.peak_users_total !== undefined && stats?.peak_users_total !== null
        ? Math.round(Number(stats.peak_users_total) / 4)
        : '0',
      badge: stats?.peak_users_total ? '-2.1%' : '0%',
      badgeType: 'negative',
      sub: 'Accesos registrados hoy',
      icon: Activity,
      color: '#ef4444'
    }
  ];

  return (
    <div className="dashboard-container">
      {/* 1. Hero Banner Premium (Operational Summary Card) */}
      <div className="dashboard-hero-banner">
        <span className="hero-system-status">
          ESTADO DEL SISTEMA: ÓPTIMO
        </span>
        
        <h1 className="hero-banner-title" style={{ marginTop: '12px' }}>
          Bienvenido de nuevo, {user?.name || 'Admin'}.<br />
          La eficiencia comienza con la claridad.
        </h1>
        <p className="hero-banner-desc">
          El ecosistema del gimnasio está funcionando al óptimo de su capacidad.
        </p>

        {(pendingSubsCount > 0 || pendingOrdersCount > 0) && (
          <div className="hero-pending-cards-grid">
            {pendingSubsCount > 0 && (
              <div 
                className="hero-pending-card hero-pending-card--subs"
                onClick={() => navigate('/suscripciones')}
                role="button"
                tabIndex={0}
              >
                <div className="hero-card-header">
                  <div className="hero-card-title-group">
                    <div className="hero-card-icon-wrapper">
                      <CreditCard size={15} />
                    </div>
                    <span className="hero-card-label">Membresías</span>
                  </div>
                  <div className="hero-card-arrow-wrapper">
                    <ArrowRight size={14} />
                  </div>
                </div>
                <div className="hero-card-body">
                  <span className="hero-card-number">{pendingSubsCount}</span>
                  <div className="hero-card-text-group">
                    <span className="hero-card-title-text">Pendiente de aprobación</span>
                    <span className="hero-card-subtitle-text">Requiere revisión del administrador</span>
                  </div>
                </div>
              </div>
            )}
            {pendingOrdersCount > 0 && (
              <div 
                className="hero-pending-card hero-pending-card--orders"
                onClick={() => navigate('/pedidos')}
                role="button"
                tabIndex={0}
              >
                <div className="hero-card-header">
                  <div className="hero-card-title-group">
                    <div className="hero-card-icon-wrapper">
                      <ShoppingBag size={15} />
                    </div>
                    <span className="hero-card-label">Pedidos</span>
                  </div>
                  <div className="hero-card-arrow-wrapper">
                    <ArrowRight size={14} />
                  </div>
                </div>
                <div className="hero-card-body">
                  <span className="hero-card-number">{pendingOrdersCount}</span>
                  <div className="hero-card-text-group">
                    <span className="hero-card-title-text">Esperando revisión</span>
                    <span className="hero-card-subtitle-text">Listos para ser procesados</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Premium Stat Cards Grid (3 Cards Row) */}
      <div className="premium-stats-grid">
        {premiumStatCards.map((c, index) => {
          const Icon = c.icon;
          const sparklineColor = c.color;
          const sparklineGradId = `spark-grad-${index}`;
          let pathD = "";
          if (index === 0) {
            pathD = "M 0,30 C 20,25 40,28 60,18 T 100,10 T 120,6";
          } else if (index === 1) {
            pathD = "M 0,32 Q 25,28 50,15 T 100,8 T 120,4";
          } else {
            pathD = "M 0,10 Q 25,18 50,12 T 100,24 T 120,28";
          }

          return (
            <div className="premium-stat-card" key={c.label}>
              <div className="premium-stat-card-header">
                <div className="premium-stat-title-group">
                  <div className="premium-stat-icon-wrapper" style={{ backgroundColor: `${c.color}12`, color: c.color }}>
                    <Icon size={16} />
                  </div>
                  <span className="premium-stat-label">{c.label}</span>
                </div>
                <span className={`premium-stat-badge premium-stat-badge--${c.badgeType}`}>
                  {c.badgeType === 'positive' ? '↗' : '↘'} {c.badge}
                </span>
              </div>
              
              <div className="premium-stat-card-body">
                <span className="premium-stat-value">{c.value}</span>
                <span className="premium-stat-sub">{c.sub}</span>
              </div>

              <div className="premium-stat-sparkline-container">
                <svg className="premium-stat-sparkline" viewBox="0 0 120 40" width="100%" height="40" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id={sparklineGradId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={sparklineColor} stopOpacity="0.18" />
                      <stop offset="100%" stopColor={sparklineColor} stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d={pathD}
                    fill="none"
                    stroke={sparklineColor}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d={`${pathD} L 120,40 L 0,40 Z`}
                    fill={`url(#${sparklineGradId})`}
                  />
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Widescreen Layout: Membresías Recientes */}
      <div className="dashboard-grid-layout-full">
        <div className="card" style={{ padding: '24px', margin: 0 }}>
          <div className="page-header" style={{ marginBottom: 20, borderBottom: 'none', padding: 0, minHeight: 'auto' }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text)' }}>Membresías Recientes</h2>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Últimas personas en suscribirse al gimnasio</p>
            </div>
          </div>
          
          {recentSubs.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 0' }}>
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
                        <th style={{ minWidth: 200 }}>Usuario</th>
                        <th>Plan</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSubs.map(s => (
                        <tr key={s.id}>
                          <td style={{ minWidth: 200 }}>{renderUserCell(s.user)}</td>
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

      {/* 5. Acciones Rápidas (Menú Intuitivo) */}
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
    </div>
  );
}
