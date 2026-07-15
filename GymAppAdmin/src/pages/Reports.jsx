import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  CreditCard, 
  BarChart3, 
  DollarSign, 
  Users,
  Plus,
  Trash2,
  X,
  Check,
  Calendar
} from 'lucide-react';
import '../components/Layout.css';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('suscripciones');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Custom Confirmation Modal
  const [confirmModal, setConfirmModal] = useState(null);

  // ── Monthly Report State ──
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

  // ── Manual Membership Registration State ──
  const [manualSubModalOpen, setManualSubModalOpen] = useState(false);
  const [userType, setUserType] = useState('existente'); // 'existente' | 'nuevo'
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  
  // Offline client form state
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  const [manualSubError, setManualSubError] = useState('');
  const [manualSubSuccess, setManualSubSuccess] = useState('');
  const [submittingManualSub, setSubmittingManualSub] = useState(false);

  // ── Daily Attendance State ──
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDailyDate, setSelectedDailyDate] = useState(todayStr);
  const [dailyIncomes, setDailyIncomes] = useState([]);
  const [dailyTotal, setDailyTotal] = useState(0);

  // Form for daily visits
  const [dailyModalOpen, setDailyModalOpen] = useState(false);
  const [dailyClientName, setDailyClientName] = useState('');
  const [dailyAmount, setDailyAmount] = useState('2.00'); // default gym entrance price set to $2.00
  const [dailyEntryDate, setDailyEntryDate] = useState(todayStr);
  const [dailyError, setDailyError] = useState('');
  const [dailySuccess, setDailySuccess] = useState('');
  const [dailySubmitting, setDailySubmitting] = useState(false);

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

  // Load Daily Attendance/Visits Report
  const fetchDailyReport = async (date) => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/admin/reports/daily?date=${date}`);
      setDailyIncomes(res.data || []);
      setDailyTotal(res.total || 0);
    } catch (err) {
      setError(err.message || 'Error al obtener reporte diario');
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
    } else if (activeTab === 'asistencias') {
      fetchDailyReport(selectedDailyDate);
    } else if (activeTab === 'tendencias') {
      fetchMetrics();
    }
  }, [activeTab, selectedMonth, selectedYear, selectedDailyDate]);

  // Reset page when search or date changes
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

  // Open manual membership modal and pre-load lists
  const handleOpenManualSub = async () => {
    setUserType('existente');
    setNewClientName('');
    setNewClientEmail('');
    setNewClientPhone('');
    setManualSubError('');
    setManualSubSuccess('');
    setSelectedUserId('');
    setSelectedPlanId('');
    setManualSubModalOpen(true);
    
    try {
      const [usersData, plansData] = await Promise.all([
        apiFetch('/admin/users'),
        apiFetch('/admin/subscription-plans')
      ]);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setPlans(Array.isArray(plansData) ? plansData : []);
      if (usersData && usersData.length > 0) setSelectedUserId(usersData[0].id);
      if (plansData && plansData.length > 0) setSelectedPlanId(plansData[0].id);
    } catch (e) {
      setManualSubError('Error al cargar datos: ' + e.message);
    }
  };

  // Submit manual membership
  const handleSaveManualSub = async (e) => {
    e.preventDefault();
    if (userType === 'existente' && !selectedUserId) {
      setManualSubError('Debes seleccionar un usuario.');
      return;
    }
    if (userType === 'nuevo' && !newClientName.trim()) {
      setManualSubError('Debes ingresar el nombre del cliente.');
      return;
    }
    if (!selectedPlanId) {
      setManualSubError('Debes seleccionar un plan de suscripción.');
      return;
    }

    setSubmittingManualSub(true);
    setManualSubError('');
    setManualSubSuccess('');

    try {
      let finalUserId = selectedUserId;

      if (userType === 'nuevo') {
        // Generate credentials to satisfy backend registration validations
        const tempId = Date.now();
        const randomNum = Math.floor(Math.random() * 1000);
        const generatedUsername = `user_${tempId}_${randomNum}`;
        const generatedEmail = newClientEmail.trim() || `cliente_${tempId}_${randomNum}@gimnasio.com`;
        
        // Register the client profile in the backend database
        const regRes = await apiFetch('/register', {
          method: 'POST',
          body: JSON.stringify({
            name: newClientName.trim(),
            username: generatedUsername,
            email: generatedEmail,
            password: 'gym12345678',
            password_confirmation: 'gym12345678',
            phone: newClientPhone.trim() || null
          })
        });

        if (!regRes || !regRes.user || !regRes.user.id) {
          throw new Error('No se pudo registrar el nuevo cliente en el sistema.');
        }

        finalUserId = regRes.user.id;
      }

      await apiFetch('/trainer/subscriptions/create', {
        method: 'POST',
        body: JSON.stringify({
          user_id: parseInt(finalUserId),
          subscription_plan_id: parseInt(selectedPlanId)
        })
      });

      setManualSubSuccess('Membresía creada y activada exitosamente');
      setTimeout(() => {
        setManualSubModalOpen(false);
        fetchMonthlyReport(selectedMonth, selectedYear);
      }, 1200);
    } catch (err) {
      setManualSubError(err.message || 'El usuario ya tiene una membresía activa.');
    } finally {
      setSubmittingManualSub(false);
    }
  };

  // Open daily attendance modal
  const handleOpenDailyModal = () => {
    setDailyClientName('');
    setDailyAmount('2.00'); // default gym entrance price is now $2.00
    setDailyEntryDate(selectedDailyDate);
    setDailyError('');
    setDailySuccess('');
    setDailyModalOpen(true);
  };

  // Submit daily visitor attendance
  const handleSaveDaily = async (e) => {
    e.preventDefault();
    if (!dailyClientName.trim() || dailyAmount === '') {
      setDailyError('El nombre del cliente y el monto son requeridos.');
      return;
    }

    setDailySubmitting(true);
    setDailyError('');
    setDailySuccess('');

    try {
      await apiFetch('/admin/reports/daily', {
        method: 'POST',
        body: JSON.stringify({
          client_name: dailyClientName,
          amount: parseFloat(dailyAmount) || 0,
          entry_date: dailyEntryDate
        })
      });
      setDailySuccess('Asistencia de cliente registrada exitosamente.');
      setTimeout(() => {
        setDailyModalOpen(false);
        fetchDailyReport(selectedDailyDate);
      }, 1000);
    } catch (err) {
      setDailyError(err.message || 'Error al registrar asistencia');
    } finally {
      setDailySubmitting(false);
    }
  };

  // Delete log entry of attendance
  const handleDeleteDaily = (income) => {
    setConfirmModal({
      title: '¿Eliminar Asistencia?',
      message: `¿Estás seguro de que deseas eliminar el registro de asistencia diaria de "${income.client_name}"?`,
      type: 'danger',
      onConfirm: async () => {
        setError(''); setSuccess('');
        try {
          await apiFetch(`/admin/reports/daily/${income.id}`, { method: 'DELETE' });
          setSuccess('Asistencia eliminada correctamente');
          fetchDailyReport(selectedDailyDate);
        } catch (err) {
          setError(err.message || 'No se pudo eliminar el registro');
        }
      }
    });
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <h2>Reportes y Analíticas</h2>
        {activeTab === 'suscripciones' && (
          <button className="btn btn--primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={handleOpenManualSub}>
            <Plus size={16} />
            <span>Registrar Membresía</span>
          </button>
        )}
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
          onClick={() => setActiveTab('asistencias')}
          className={`tab-btn ${activeTab === 'asistencias' ? 'tab-btn--active' : ''}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Users size={14} />
          <span>Asistencia Diaria</span>
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
                    {filteredSubs.length > 0 && (
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
              </div>
            </div>
          )}

          {/* TAB 2: ASISTENCIA DIARIA (NUEVO PANEL) */}
          {activeTab === 'asistencias' && (
            <div>
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16 }}>Control de Asistencia Diaria</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>Filtra por día para ver y registrar quién asistió al gimnasio.</p>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--card)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 8 }}>
                      <Calendar size={14} style={{ color: 'var(--text-secondary)' }} />
                      <input 
                        type="date" 
                        value={selectedDailyDate} 
                        onChange={e => setSelectedDailyDate(e.target.value)} 
                        style={{ border: 'none', background: 'transparent', outline: 'none', padding: 0, color: 'var(--text)', fontSize: 14 }}
                      />
                    </div>
                    <button className="btn btn--primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={handleOpenDailyModal}>
                      <Plus size={16} />
                      <span>Registrar Asistencia</span>
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginTop: 20 }}>
                {/* Attendance list table */}
                <div className="card" style={{ marginTop: 0 }}>
                  <div className="page-header" style={{ marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: 16 }}>Clientes Registrados el Día</h3>
                    <span className="badge badge--blue">{dailyIncomes.length} asistencias</span>
                  </div>

                  {dailyIncomes.length === 0 ? (
                    <div className="empty-state" style={{ padding: 40 }}>
                      <div className="empty-icon"><Users size={32} /></div>
                      <p>No hay asistencias registradas para esta fecha.</p>
                    </div>
                  ) : (
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Cliente</th>
                            <th>Monto de Entrada</th>
                            <th>Fecha Registro</th>
                            <th style={{ textAlign: 'right' }}>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dailyIncomes.map((item) => (
                            <tr key={item.id}>
                              <td style={{ fontWeight: 600, color: 'var(--text)' }}>
                                {item.client_name || 'Invitado anónimo'}
                              </td>
                              <td style={{ fontWeight: 700, color: item.amount > 0 ? 'var(--success)' : 'var(--text)' }}>
                                ${Number(item.amount).toFixed(2)}
                              </td>
                              <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                                {item.entry_date ? new Date(item.entry_date).toLocaleString('es-MX', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : '—'}
                              </td>
                              <td>
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                  <button 
                                    className="btn-action-circle btn-action-circle--danger" 
                                    onClick={() => handleDeleteDaily(item)}
                                    title="Eliminar Registro de Asistencia"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Summary Card */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="card" style={{ marginTop: 0 }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>Resumen del Día</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Total Personas:</span>
                        <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{dailyIncomes.length}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Ingresos Diario:</span>
                        <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--success)' }}>${Number(dailyTotal).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="card" style={{ background: 'var(--primary-light)', borderLeft: '4px solid var(--primary)', color: 'var(--text)' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: 14 }}>¿Para qué sirve este panel?</h4>
                    <p style={{ margin: 0, fontSize: 12, lineHeight: 1.4, color: 'var(--text-secondary)' }}>
                      Permite registrar la asistencia y los pagos en efectivo de clientes que ingresan por el día, o llevar la cuenta de visitas rápidas de forma manual.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: ESTADÍSTICAS Y TENDENCIAS */}
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

      {/* MODAL 1: REGISTRAR MEMBRESÍA MANUAL */}
      {manualSubModalOpen && (
        <div className="modal-overlay" onClick={() => setManualSubModalOpen(false)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Registrar Membresía Manual</h3>
              <button className="btn btn--ghost" style={{ padding: 6, borderRadius: '50%' }} onClick={() => setManualSubModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            {manualSubError && <div className="alert alert--error" style={{ marginBottom: 16 }}><AlertTriangle size={14} /> <span>{manualSubError}</span></div>}
            {manualSubSuccess && <div className="alert alert--success" style={{ marginBottom: 16 }}><CheckCircle2 size={14} /> <span>{manualSubSuccess}</span></div>}

            <form onSubmit={handleSaveManualSub} className="modal-form">
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6 }}>Tipo de Cliente</label>
                <div style={{ display: 'flex', gap: 20 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'var(--text)', fontSize: 13 }}>
                    <input 
                      type="radio" 
                      name="userType" 
                      checked={userType === 'existente'} 
                      onChange={() => setUserType('existente')} 
                      style={{ width: 'auto', margin: 0 }}
                    />
                    <span>Usuario Registrado</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'var(--text)', fontSize: 13 }}>
                    <input 
                      type="radio" 
                      name="userType" 
                      checked={userType === 'nuevo'} 
                      onChange={() => setUserType('nuevo')} 
                      style={{ width: 'auto', margin: 0 }}
                    />
                    <span>Nuevo Cliente (Sin App)</span>
                  </label>
                </div>
              </div>

              {userType === 'existente' ? (
                <div className="form-group">
                  <label>Seleccionar Usuario Registrado *</label>
                  <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} required={userType === 'existente'}>
                    <option value="">Selecciona un usuario...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
                  <div className="form-group">
                    <label>Nombre Completo del Cliente *</label>
                    <input 
                      type="text" 
                      value={newClientName} 
                      onChange={e => setNewClientName(e.target.value)} 
                      placeholder="Ej. Juan Pérez" 
                      required={userType === 'nuevo'} 
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group">
                      <label>Correo Electrónico (Opcional)</label>
                      <input 
                        type="email" 
                        value={newClientEmail} 
                        onChange={e => setNewClientEmail(e.target.value)} 
                        placeholder="Ej. juan@gmail.com" 
                      />
                    </div>
                    <div className="form-group">
                      <label>Teléfono (Opcional)</label>
                      <input 
                        type="text" 
                        value={newClientPhone} 
                        onChange={e => setNewClientPhone(e.target.value)} 
                        placeholder="Ej. 0987654321" 
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Plan de Suscripción *</label>
                <select value={selectedPlanId} onChange={e => setSelectedPlanId(e.target.value)} required>
                  <option value="">Selecciona un plan...</option>
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - ${Number(p.price).toFixed(2)}</option>
                  ))}
                </select>
              </div>

              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20 }}>
                💡 <strong>Nota:</strong> Al registrar la membresía manualmente, se creará inmediatamente en estado <strong>Activo</strong> con una vigencia de 30 días, simulando que el usuario pagó con dinero en efectivo o de forma directa.
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn--ghost" onClick={() => setManualSubModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn--primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} disabled={submittingManualSub}>
                  {submittingManualSub ? <Loader2 className="spin" size={14} /> : <Check size={14} />}
                  <span>Registrar Membresía</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTRAR ASISTENCIA DIARIA */}
      {dailyModalOpen && (
        <div className="modal-overlay" onClick={() => setDailyModalOpen(false)}>
          <div className="modal" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Registrar Asistencia</h3>
              <button className="btn btn--ghost" style={{ padding: 6, borderRadius: '50%' }} onClick={() => setDailyModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            {dailyError && <div className="alert alert--error" style={{ marginBottom: 16 }}><AlertTriangle size={14} /> <span>{dailyError}</span></div>}
            {dailySuccess && <div className="alert alert--success" style={{ marginBottom: 16 }}><CheckCircle2 size={14} /> <span>{dailySuccess}</span></div>}

            <form onSubmit={handleSaveDaily} className="modal-form">
              <div className="form-group">
                <label>Nombre del Cliente / Visitante *</label>
                <input 
                  type="text" 
                  value={dailyClientName} 
                  onChange={e => setDailyClientName(e.target.value)} 
                  placeholder="Ej. Juan Pérez" 
                  required 
                />
              </div>

              <div className="form-group">
                <label>Monto de Entrada (USD) *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={dailyAmount} 
                  onChange={e => setDailyAmount(e.target.value)} 
                  placeholder="Ej. 2.00 (ingresa 0 si es gratis o cortesía)" 
                  required 
                />
              </div>

              <div className="form-group">
                <label>Fecha de Entrada</label>
                <input 
                  type="date" 
                  value={dailyEntryDate} 
                  onChange={e => setDailyEntryDate(e.target.value)} 
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn--ghost" onClick={() => setDailyModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn--primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} disabled={dailySubmitting}>
                  {dailySubmitting ? <Loader2 className="spin" size={14} /> : <Check size={14} />}
                  <span>Guardar Asistencia</span>
                </button>
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
