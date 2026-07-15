import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
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

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentSubs, setRecentSubs] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

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
          <div className="table-wrap">
            <table>
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
                    <td style={{ fontWeight: 500 }}>{s.user?.name || s.user_id}</td>
                    <td>{s.plan?.name || s.plan_id}</td>
                    <td>
                      <span className={`badge badge--${s.status === 'active' || s.status === 'approved' ? 'green' : s.status === 'pending' ? 'yellow' : 'gray'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
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
