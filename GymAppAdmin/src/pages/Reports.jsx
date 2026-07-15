import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  CreditCard, 
  BarChart3, 
  DollarSign, 
  Users 
} from 'lucide-react';
import '../components/Layout.css';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('suscripciones');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Monthly Report State
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [monthlySubs, setMonthlySubs] = useState([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [monthlySearch, setMonthlySearch] = useState('');

  // Pagination State for monthly memberships
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // General Metrics State (Trends)
  const [metrics, setMetrics] = useState(null);

  // Load Monthly Report
  const fetchMonthlyReport = async (month, year) => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/admin/reports/monthly?month=${month}&year=${year}`);
      setMonthlySubs(res.data || []);
      setMonthlyTotal(res.total || 0);
    } catch (err) {
      setError(err.message || 'Error al obtener reporte mensual');
    } finally {
      setLoading(false);
    }
  };

  // Load Metrics/Trends
  const fetchMetrics = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/admin/metrics?months=6');
      setMetrics(res);
    } catch (err) {
      setError(err.message || 'Error al obtener métricas');
    } finally {
      setLoading(false);
    }
  };

  // Trigger loads based on active tab
  useEffect(() => {
    if (activeTab === 'suscripciones') {
      fetchMonthlyReport(selectedMonth, selectedYear);
    } else if (activeTab === 'tendencias') {
      fetchMetrics();
    }
  }, [activeTab, selectedMonth, selectedYear]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [monthlySearch, selectedMonth, selectedYear]);

  // Filter monthly subscriptions list by search input
  const filteredSubs = monthlySubs.filter((sub) => {
    const term = monthlySearch.toLowerCase();
    const userName = (sub.user?.name || '').toLowerCase();
    const planName = (sub.plan?.name || '').toLowerCase();
    return userName.includes(term) || planName.includes(term);
  });

  // Calculate paginated slice
  const totalPages = Math.ceil(filteredSubs.length / itemsPerPage);
  const paginatedSubs = filteredSubs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Render Helper for Charts
  const getMaxVal = (arr, key) => {
    if (!arr || arr.length === 0) return 1;
    return Math.max(...arr.map((item) => parseFloat(item[key] || 0))) || 1;
  };

  return (
    <div>
      <div className="page-header">
        <h2>Reportes y Analíticas</h2>
      </div>

      {/* Tabs Menu */}
      <div className="tabs-container">
        <button
          onClick={() => setActiveTab('suscripciones')}
          className={`tab-btn ${activeTab === 'suscripciones' ? 'tab-btn--active' : ''}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <CreditCard size={14} />
          <span>Membresías del Mes</span>
        </button>
        <button
          onClick={() => setActiveTab('tendencias')}
          className={`tab-btn ${activeTab === 'tendencias' ? 'tab-btn--active' : ''}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <BarChart3 size={14} />
          <span>Métricas y Tendencias</span>
        </button>
      </div>

      {/* Status Messages */}
      {error && <div className="alert alert--error"><AlertTriangle size={16} /> <span>{error}</span></div>}
      {success && <div className="alert alert--success"><CheckCircle2 size={16} /> <span>{success}</span></div>}

      {/* Loading state indicator */}
      {loading && (
        <div className="loading-state">
          <Loader2 className="spin" size={24} /> <span>Cargando información...</span>
        </div>
      )}

      {!loading && (
        <>
          {/* TAB 1: MEMBRESÍAS DEL MES */}
          {activeTab === 'suscripciones' && (
            <div>
              <div className="card">
                <div className="page-header" style={{ marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontSize: 16 }}>Filtros de Reporte</h3>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>
                    Ingreso Membresías: ${Number(monthlyTotal).toFixed(2)}
                  </div>
                </div>
                <div className="inline-form">
                  <div className="form-group" style={{ flex: 1, minWidth: 150 }}>
                    <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Mes</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    >
                      <option value={1}>Enero</option>
                      <option value={2}>Febrero</option>
                      <option value={3}>Marzo</option>
                      <option value={4}>Abril</option>
                      <option value={5}>Mayo</option>
                      <option value={6}>Junio</option>
                      <option value={7}>Julio</option>
                      <option value={8}>Agosto</option>
                      <option value={9}>Septiembre</option>
                      <option value={10}>Octubre</option>
                      <option value={11}>Noviembre</option>
                      <option value={12}>Diciembre</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1, minWidth: 150 }}>
                    <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Año</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    >
                      <option value={currentYear}>{currentYear}</option>
                      <option value={currentYear - 1}>{currentYear - 1}</option>
                      <option value={currentYear - 2}>{currentYear - 2}</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 2, minWidth: 200 }}>
                    <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Buscar</label>
                    <input
                      type="text"
                      placeholder="Buscar por usuario o plan..."
                      value={monthlySearch}
                      onChange={(e) => setMonthlySearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="page-header" style={{ marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontSize: 16 }}>Membresías Vendidas</h3>
                  <span className="badge badge--blue">{filteredSubs.length} suscripciones</span>
                </div>

                {filteredSubs.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon"><CreditCard size={40} /></div>
                    <p>No se encontraron registros de suscripción.</p>
                  </div>
                ) : (
                  <>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Usuario</th>
                            <th>Plan</th>
                            <th>Precio</th>
                            <th>Inicio</th>
                            <th>Vencimiento</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedSubs.map((sub) => (
                            <tr key={sub.id}>
                              <td style={{ fontWeight: 600, color: 'var(--text)' }}>{sub.user?.name || sub.user_id}</td>
                              <td>{sub.plan?.name || sub.plan_id}</td>
                              <td style={{ fontWeight: 700, color: 'var(--success)' }}>${Number(sub.price || 0).toFixed(2)}</td>
                              <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{sub.starts_at ? new Date(sub.starts_at).toLocaleDateString('es-MX') : '—'}</td>
                              <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{sub.ends_at ? new Date(sub.ends_at).toLocaleDateString('es-MX') : '—'}</td>
                              <td>
                                <span
                                  className={`badge badge--${
                                    sub.status === 'active'
                                      ? 'green'
                                      : sub.status === 'pending'
                                      ? 'yellow'
                                      : 'gray'
                                  }`}
                                >
                                  {sub.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="pagination">
                        <button 
                          className="btn btn--secondary" 
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                        >
                          Anterior
                        </button>
                        <span className="pagination-info">Página {currentPage} de {totalPages}</span>
                        <button 
                          className="btn btn--secondary" 
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                        >
                          Siguiente
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ESTADÍSTICAS Y TENDENCIAS */}
          {activeTab === 'tendencias' && metrics && (
            <div className="charts-grid">
              
              {/* Chart 1: Revenue Trend */}
              <div className="chart-card">
                <div className="chart-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <DollarSign size={16} />
                  <span>Tendencia de Ingresos Mensuales</span>
                </div>
                <div className="bar-chart-container">
                  {(metrics.revenue_by_month || []).map((item) => {
                    const maxVal = getMaxVal(metrics.revenue_by_month, 'total');
                    const heightPercent = Math.min(100, Math.max(5, (item.total / maxVal) * 100));
                    return (
                      <div className="chart-bar-wrapper" key={item.month}>
                        <div
                          className="chart-bar"
                          style={{ height: `${heightPercent}%` }}
                        >
                          <div className="chart-bar-tooltip">
                            ${Number(item.total).toFixed(2)}
                          </div>
                        </div>
                        <div className="chart-bar-label">
                          {item.month}
                        </div>
                      </div>
                    );
                  })}
                  {(!metrics.revenue_by_month || metrics.revenue_by_month.length === 0) && (
                    <p style={{ margin: 'auto', color: 'var(--text-secondary)' }}>Sin datos históricos</p>
                  )}
                </div>
              </div>

              {/* Chart 2: Registrations Trend */}
              <div className="chart-card">
                <div className="chart-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Users size={16} />
                  <span>Nuevos Registros de Usuarios</span>
                </div>
                <div className="bar-chart-container">
                  {(metrics.registrations_by_month || []).map((item) => {
                    const maxVal = getMaxVal(metrics.registrations_by_month, 'total');
                    const heightPercent = Math.min(100, Math.max(5, (item.total / maxVal) * 100));
                    return (
                      <div className="chart-bar-wrapper" key={item.month}>
                        <div
                          className="chart-bar"
                          style={{ height: `${heightPercent}%`, background: 'var(--primary)' }}
                        >
                          <div className="chart-bar-tooltip">
                            {item.total} usuarios
                          </div>
                        </div>
                        <div className="chart-bar-label">
                          {item.month}
                        </div>
                      </div>
                    );
                  })}
                  {(!metrics.registrations_by_month || metrics.registrations_by_month.length === 0) && (
                    <p style={{ margin: 'auto', color: 'var(--text-secondary)' }}>Sin datos históricos</p>
                  )}
                </div>
              </div>

            </div>
          )}
        </>
      )}
    </div>
  );
}
