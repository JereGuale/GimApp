import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
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
      // /trainer/subscriptions returns direct array
      const list = Array.isArray(subsData) ? subsData : [];
      setRecentSubs(list.slice(0, 5));
      setPendingCount(list.filter(s => s.status === 'pending').length);
    }).finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Pendientes de Aprobar', value: pendingCount, icon: '⚠️', color: '#ef4444' },
    { label: 'Total Usuarios', value: stats?.total_users ?? '—', icon: '👥', color: '#22d3ee' },
    { label: 'Suscripciones Activas', value: stats?.active_subscriptions ?? '—', icon: '✅', color: '#34d399' },
    { label: 'Próximas a Vencer', value: stats?.expiring_subscriptions ?? '—', icon: '⏳', color: '#fbbf24' },
    { label: 'Total Productos', value: stats?.products_count ?? '—', icon: '📦', color: '#a78bfa' },
    { label: 'Ingresos Mensuales', value: stats?.monthly_income ? `$${Number(stats.monthly_income).toFixed(2)}` : '—', icon: '💰', color: '#fb923c' },
  ];

  if (loading) {
    return (
      <div className="loading-state">
        <span className="spin">⏳</span> Cargando panel…
      </div>
    );
  }

  return (
    <div>
      <div className="stat-grid">
        {statCards.map(s => (
          <div className="stat-card" key={s.label} style={{ borderLeft: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 28 }}>{s.icon}</div>
            <div className="stat-value" style={{ fontSize: 28, color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="page-header" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 17 }}>Últimas Suscripciones</h2>
        </div>
        {recentSubs.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">💳</div><p>No hay suscripciones recientes</p></div>
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
                    <td>{s.user?.name || s.user_id}</td>
                    <td>{s.plan?.name || s.plan_id}</td>
                    <td>
                      <span className={`badge badge--${s.status === 'active' ? 'green' : s.status === 'pending' ? 'yellow' : 'gray'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td>{s.created_at ? new Date(s.created_at).toLocaleDateString('es-MX') : '—'}</td>
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

