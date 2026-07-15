import { useEffect, useState } from 'react';
import { apiFetch, API_BASE_URL } from '../api/client';
import { 
  AlertTriangle, 
  Users, 
  CheckCircle2, 
  CalendarClock, 
  Package, 
  DollarSign, 
  Loader2, 
  CreditCard
} from 'lucide-react';
import '../components/Layout.css';
import './Subscriptions.css';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentSubs, setRecentSubs] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
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
    ]).then(([metricsData, subsData]) => {
      setStats(metricsData);
      const list = Array.isArray(subsData) ? subsData : [];
      setRecentSubs(list.slice(0, 5));
      setPendingCount(list.filter(s => s.status === 'pending').length);
    }).finally(() => setLoading(false));
  }, []);

  const statCards = [
    { 
      label: 'Pendientes de Aprobar', 
      value: pendingCount, 
      icon: AlertTriangle, 
      color: '#EF4444', 
      growth: pendingCount > 0 ? `${pendingCount} nuevos` : 'Al día', 
      growthType: pendingCount > 0 ? 'down' : 'neutral',
      sub: 'Requieren revisión urgente' 
    },
    { 
      label: 'Total Usuarios', 
      value: stats?.total_users ?? '—', 
      icon: Users, 
      color: '#2563EB', 
      growth: '+12%', 
      growthType: 'up', 
      sub: 'Respecto al mes pasado' 
    },
    { 
      label: 'Suscripciones Activas', 
      value: stats?.active_subscriptions ?? '—', 
      icon: CheckCircle2, 
      color: '#22C55E', 
      growth: '+8%', 
      growthType: 'up', 
      sub: 'En el periodo actual' 
    },
    { 
      label: 'Próximas a Vencer', 
      value: stats?.expiring_subscriptions ?? '—', 
      icon: CalendarClock, 
      color: '#F59E0B', 
      growth: 'Renovación', 
      growthType: 'neutral', 
      sub: 'Vencen en los próximos 7 días' 
    },
    { 
      label: 'Total Productos', 
      value: stats?.products_count ?? '—', 
      icon: Package, 
      color: '#8B5CF6', 
      growth: 'Tienda', 
      growthType: 'neutral', 
      sub: 'Suplementos y ropa deportiva' 
    },
    { 
      label: 'Ingresos Mensuales', 
      value: stats?.monthly_income ? `$${Number(stats.monthly_income).toFixed(2)}` : '—', 
      icon: DollarSign, 
      color: '#10B981', 
      growth: '+18.4%', 
      growthType: 'up', 
      sub: 'Ingresos brutos acumulados' 
    },
  ];

  if (loading) {
    return (
      <div className="loading-state">
        <Loader2 className="spin" size={24} /> <span>Cargando panel…</span>
      </div>
    );
  }

  return (
    <div>
      <div className="stat-grid">
        {statCards.map(s => {
          const IconComponent = s.icon;
          return (
            <div className="stat-card" key={s.label}>
              <div className="stat-card-header">
                <span className="stat-label">{s.label}</span>
                <div className="stat-icon-wrapper" style={{ backgroundColor: `${s.color}15`, color: s.color }}>
                  <IconComponent size={20} />
                </div>
              </div>
              <div className="stat-value-container">
                <span className="stat-value">{s.value}</span>
                {s.growth && (
                  <span className={`stat-growth stat-growth--${s.growthType === 'up' ? 'up' : s.growthType === 'down' ? 'down' : 'neutral'}`}
                        style={s.growthType === 'neutral' ? { backgroundColor: 'rgba(100, 116, 139, 0.08)', color: 'var(--text-secondary)' } : {}}>
                    {s.growth}
                  </span>
                )}
              </div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="page-header" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Últimas Suscripciones</h2>
        </div>
        {recentSubs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <CreditCard size={40} />
            </div>
            <p>No hay suscripciones recientes</p>
          </div>
        ) : (
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
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      {s.created_at ? new Date(s.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
