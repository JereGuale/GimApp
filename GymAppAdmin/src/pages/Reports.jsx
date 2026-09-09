import { useEffect, useState } from 'react';
import { apiFetch, API_BASE_URL } from '../api/client';
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
  Calendar,
  ChevronLeft,
  ChevronRight,
  Layers,
  Clock,
  MoreVertical,
  Search,
  Download,
  MessageCircle,
  Copy,
  Send,
  ExternalLink,
  Phone,
  UserCheck,
  UserPlus
} from 'lucide-react';
import '../components/Layout.css';
import './Subscriptions.css';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('suscripciones');

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
      '#ef4444', '#f97316', '#f59e0b', '#10b981', 
      '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899'
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
      <div className="user-profile-cell-wrapper">
        <div className="avatar-circle" style={!avatarUrl ? { backgroundColor: bgColor } : {}}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={user.name} className="avatar-img" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div className="user-text-details">
          <span className="user-name">{user.name}</span>
          <span className="user-email">{user.email || 'Sin correo'}</span>
        </div>
      </div>
    );
  };

  const renderClientNameCell = (clientName) => {
    if (!clientName) return <span style={{ color: 'var(--text-secondary)' }}>—</span>;
    const initials = getUserInitials(clientName);
    const bgColor = getAvatarBgColor(clientName);
    
    return (
      <div className="user-profile-cell-wrapper">
        <div className="avatar-circle" style={{ backgroundColor: bgColor }}>
          <span>{initials}</span>
        </div>
        <div className="user-text-details">
          <span className="user-name">{clientName}</span>
          <span className="user-email">Cliente Externo</span>
        </div>
      </div>
    );
  };

  const getMembershipStatus = (sub) => {
    if (sub.status === 'pending') return { label: 'Pendiente', type: 'pending', color: '#f59e0b' };
    if (sub.status === 'cancelled') return { label: 'Cancelada', type: 'cancelled', color: '#64748b' };
    if (sub.status === 'rejected') return { label: 'Rechazada', type: 'rejected', color: '#ef4444' };
    if (sub.status === 'expired') return { label: 'Vencida', type: 'expired', color: '#ef4444' };
    
    if (sub.ends_at) {
      const endsAt = new Date(sub.ends_at);
      const today = new Date();
      endsAt.setHours(0,0,0,0);
      today.setHours(0,0,0,0);
      const diffTime = endsAt - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return { label: 'Vencida', type: 'expired', color: '#ef4444' };
      }
      if (diffDays <= 7) {
        return { label: diffDays === 0 ? 'Vence hoy' : `Vence en ${diffDays} días`, type: 'expiring', color: '#f97316', diffDays };
      }
    }
    
    return { label: 'Activa', type: 'active', color: '#10b981' };
  };

  const getPlanBadgeStyles = (planName) => {
    const name = String(planName || '').toLowerCase();
    if (name.includes('vip')) {
      return { bg: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', label: planName || 'VIP' };
    }
    if (name.includes('premium') || name.includes('oro') || name.includes('gold')) {
      return { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', label: planName || 'Premium' };
    }
    return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', label: planName || 'Básico' };
  };

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
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // General Metrics State (Trends)
  const [metrics, setMetrics] = useState(null);

  // ── Manual Membership Registration State ──
  const [manualSubModalOpen, setManualSubModalOpen] = useState(false);
  const [manualSubTab, setManualSubTab] = useState('registrado'); // 'registrado' | 'nuevo'
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  
  // New unregistered client inputs
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');

  const [manualSubError, setManualSubError] = useState('');
  const [manualSubSuccess, setManualSubSuccess] = useState('');
  const [submittingManualSub, setSubmittingManualSub] = useState(false);

  // WhatsApp Reminder State
  const [whatsappModal, setWhatsappModal] = useState({
    open: false,
    sub: null,
    phone: '',
    customMessage: '',
    copied: false
  });

  // Helper for real local date and time strings
  const getLocalDateString = (d = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getLocalTimeString = (d = new Date()) => {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // ── Daily Attendance State ──
  const todayStr = getLocalDateString();
  const [selectedDailyDate, setSelectedDailyDate] = useState(todayStr);
  const [dailyIncomes, setDailyIncomes] = useState([]);
  const [dailyTotal, setDailyTotal] = useState(0);

  // Form for daily visits
  const [dailyModalOpen, setDailyModalOpen] = useState(false);
  const [dailyClientName, setDailyClientName] = useState('');
  const [dailyAmount, setDailyAmount] = useState('2.00'); // default gym entrance price set to $2.00
  const [dailyEntryDate, setDailyEntryDate] = useState(todayStr);
  const [dailyEntryTime, setDailyEntryTime] = useState(getLocalTimeString());
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

  // Formatear fecha de vencimiento de suscripción de forma segura
  const formatEndDate = (dateVal) => {
    if (!dateVal) return '';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      return d.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return String(dateVal);
    }
  };

  // Búsqueda en vivo (debounced) de usuarios registrados en el backend solo al escribir
  useEffect(() => {
    if (!manualSubModalOpen || manualSubTab !== 'registrado') return;

    const query = userSearchQuery.trim();
    if (!query) {
      setFilteredUsers([]);
      setLoadingUsers(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingUsers(true);
      try {
        const res = await apiFetch(`/admin/users?all=true&search=${encodeURIComponent(query)}&limit=25`);
        const list = Array.isArray(res) ? res : (res?.data || []);
        setFilteredUsers(list);
      } catch (err) {
        setFilteredUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [userSearchQuery, manualSubModalOpen, manualSubTab]);

  // Descarga de reporte de mensualidades en Excel con diseño visual ejecutivo y colores
  const downloadMonthlyReport = () => {
    if (!monthlySubs || monthlySubs.length === 0) {
      alert('No hay membresías registradas para descargar en el mes seleccionado.');
      return;
    }

    const monthNames = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const monthName = monthNames[selectedMonth] || selectedMonth;
    const now = new Date();
    const emissionDate = now.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const emissionTime = now.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hour12: true });

    let rowsHtml = '';
    monthlySubs.forEach((sub, idx) => {
      const statusObj = getMembershipStatus(sub);
      const cleanName = sub.user?.name || sub.billing_name || 'Sin nombre';
      const cleanEmail = sub.user?.email || sub.billing_email || '—';
      const cleanPhone = sub.user?.phone || sub.billing_phone || '—';
      const cleanPlan = sub.plan?.name || sub.plan_id || 'Plan General';
      const price = Number(sub.price || 0).toFixed(2);
      const start = sub.starts_at ? new Date(sub.starts_at).toLocaleDateString('es-EC') : '—';
      const end = sub.ends_at ? new Date(sub.ends_at).toLocaleDateString('es-EC') : '—';

      // Estilos de badge según estado
      let badgeBg = '#dcfce7';
      let badgeColor = '#15803d';
      let badgeBorder = '#86efac';
      if (statusObj.type === 'expired' || statusObj.type === 'rejected') {
        badgeBg = '#fee2e2';
        badgeColor = '#b91c1c';
        badgeBorder = '#fca5a5';
      } else if (statusObj.type === 'expiring' || statusObj.type === 'pending') {
        badgeBg = '#fef3c7';
        badgeColor = '#b45309';
        badgeBorder = '#fde68a';
      }

      const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';

      rowsHtml += `
        <tr style="background-color: ${rowBg};">
          <td style="border: 1px solid #cbd5e1; padding: 7px 10px; text-align: center; font-size: 10pt; color: #64748b;">${idx + 1}</td>
          <td style="border: 1px solid #cbd5e1; padding: 7px 12px; font-weight: bold; font-size: 10pt; color: #0f172a;">${cleanName}</td>
          <td style="border: 1px solid #cbd5e1; padding: 7px 10px; font-size: 9.5pt; color: #334155;">${cleanEmail}</td>
          <td style="border: 1px solid #cbd5e1; padding: 7px 10px; text-align: center; font-size: 9.5pt; color: #334155;">${cleanPhone}</td>
          <td style="border: 1px solid #cbd5e1; padding: 7px 12px; text-align: center; font-weight: bold; font-size: 10pt; color: #1e40af; background-color: #eff6ff;">${cleanPlan}</td>
          <td style="border: 1px solid #cbd5e1; padding: 7px 12px; text-align: right; font-weight: bold; font-size: 10pt; color: #0f172a;">$ ${price}</td>
          <td style="border: 1px solid #cbd5e1; padding: 7px 10px; text-align: center; font-size: 9.5pt; color: #334155;">${start}</td>
          <td style="border: 1px solid #cbd5e1; padding: 7px 10px; text-align: center; font-size: 9.5pt; color: #334155;">${end}</td>
          <td style="border: 1px solid #cbd5e1; padding: 7px 10px; text-align: center;">
            <span style="display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 8.5pt; font-weight: bold; background-color: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder};">
              ${statusObj.label}
            </span>
          </td>
        </tr>
      `;
    });

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Membresías ${monthName}</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <th colspan="9" style="background-color: #1e3a8a; color: #ffffff; font-size: 15pt; font-weight: bold; text-align: center; padding: 14px; height: 42px;">
              GIGAFIT GIM - REPORTE MENSUAL DE MEMBRESÍAS
            </th>
          </tr>
          <tr style="background-color: #f1f5f9;">
            <td colspan="9" style="padding: 8px 12px; font-size: 10pt; color: #475569; text-align: center; border-bottom: 2px solid #cbd5e1;">
              <strong>Período:</strong> ${monthName} de ${selectedYear} &nbsp;|&nbsp; 
              <strong>Total Clientes:</strong> ${monthlySubs.length} &nbsp;|&nbsp; 
              <strong>Recaudación Total:</strong> $ ${Number(monthlyTotal).toFixed(2)} &nbsp;|&nbsp; 
              <strong>Generado el:</strong> ${emissionDate} a las ${emissionTime}
            </td>
          </tr>
          <tr><td colspan="9" style="height: 10px;"></td></tr>
          <tr style="background-color: #2563eb; color: #ffffff;">
            <th style="border: 1px solid #1d4ed8; padding: 10px 8px; font-size: 10pt; font-weight: bold; text-align: center;">#</th>
            <th style="border: 1px solid #1d4ed8; padding: 10px 12px; font-size: 10pt; font-weight: bold; text-align: left;">Cliente</th>
            <th style="border: 1px solid #1d4ed8; padding: 10px 12px; font-size: 10pt; font-weight: bold; text-align: left;">Correo Electrónico</th>
            <th style="border: 1px solid #1d4ed8; padding: 10px 10px; font-size: 10pt; font-weight: bold; text-align: center;">Teléfono</th>
            <th style="border: 1px solid #1d4ed8; padding: 10px 12px; font-size: 10pt; font-weight: bold; text-align: center;">Plan Contratado</th>
            <th style="border: 1px solid #1d4ed8; padding: 10px 12px; font-size: 10pt; font-weight: bold; text-align: right;">Valor ($)</th>
            <th style="border: 1px solid #1d4ed8; padding: 10px 10px; font-size: 10pt; font-weight: bold; text-align: center;">Fecha Inicio</th>
            <th style="border: 1px solid #1d4ed8; padding: 10px 10px; font-size: 10pt; font-weight: bold; text-align: center;">Fecha Vencimiento</th>
            <th style="border: 1px solid #1d4ed8; padding: 10px 12px; font-size: 10pt; font-weight: bold; text-align: center;">Estado Membresía</th>
          </tr>
          ${rowsHtml}
          <tr><td colspan="9" style="height: 6px;"></td></tr>
          <tr style="background-color: #dbeafe; font-weight: bold; border-top: 2px solid #2563eb; border-bottom: 2px solid #2563eb;">
            <td colspan="5" style="border: 1px solid #93c5fd; padding: 10px 12px; font-size: 11pt; color: #1e40af; text-align: right;">
              TOTAL RECAUDADO EN EL MES:
            </td>
            <td style="border: 1px solid #93c5fd; padding: 10px 12px; font-size: 11pt; color: #1e40af; text-align: right; font-weight: bold;">
              $ ${Number(monthlyTotal).toFixed(2)}
            </td>
            <td colspan="3" style="border: 1px solid #93c5fd; padding: 10px 12px; font-size: 9.5pt; color: #1e40af; text-align: center;">
              ${monthlySubs.length} membresías registradas
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\uFEFF' + excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Reporte_Mensualidades_${monthName}_${selectedYear}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatAttendanceTime = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const normalized = typeof dateStr === 'string' && dateStr.includes(' ') && !dateStr.includes('T')
        ? dateStr.replace(' ', 'T')
        : dateStr;
      const d = new Date(normalized);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr;
    }
  };

  const formatAttendanceDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const normalized = typeof dateStr === 'string' && dateStr.includes(' ') && !dateStr.includes('T')
        ? dateStr.replace(' ', 'T')
        : dateStr;
      const d = new Date(normalized);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  };

  // Descarga de reporte de asistencias diarias en Excel con diseño visual ejecutivo y colores
  const downloadDailyReport = () => {
    if (!dailyIncomes || dailyIncomes.length === 0) {
      alert('No hay asistencias registradas para descargar en la fecha seleccionada.');
      return;
    }

    const now = new Date();
    const emissionDate = now.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const emissionTime = now.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hour12: true });

    let rowsHtml = '';
    dailyIncomes.forEach((item, idx) => {
      const cleanName = item.client_name || 'Invitado Diario';
      const amount = Number(item.amount || 0).toFixed(2);
      const time = formatAttendanceTime(item.entry_date);
      const date = formatAttendanceDate(item.entry_date);
      const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';

      rowsHtml += `
        <tr style="background-color: ${rowBg};">
          <td style="border: 1px solid #cbd5e1; padding: 7px 10px; text-align: center; font-size: 10pt; color: #64748b;">${idx + 1}</td>
          <td style="border: 1px solid #cbd5e1; padding: 7px 12px; font-weight: bold; font-size: 10pt; color: #0f172a;">${cleanName}</td>
          <td style="border: 1px solid #cbd5e1; padding: 7px 12px; text-align: right; font-weight: bold; font-size: 10pt; color: #065f46; background-color: #ecfdf5;">$ ${amount}</td>
          <td style="border: 1px solid #cbd5e1; padding: 7px 10px; text-align: center; font-weight: bold; font-size: 10pt; color: #2563eb;">${time}</td>
          <td style="border: 1px solid #cbd5e1; padding: 7px 10px; text-align: center; font-size: 9.5pt; color: #334155;">${date}</td>
        </tr>
      `;
    });

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Asistencias ${selectedDailyDate}</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <th colspan="5" style="background-color: #065f46; color: #ffffff; font-size: 15pt; font-weight: bold; text-align: center; padding: 14px; height: 42px;">
              GIGAFIT GIM - REPORTE DIARIO DE ASISTENCIAS
            </th>
          </tr>
          <tr style="background-color: #f1f5f9;">
            <td colspan="5" style="padding: 8px 12px; font-size: 10pt; color: #475569; text-align: center; border-bottom: 2px solid #cbd5e1;">
              <strong>Fecha:</strong> ${selectedDailyDate} &nbsp;|&nbsp; 
              <strong>Total Asistencias:</strong> ${dailyIncomes.length} visitas &nbsp;|&nbsp; 
              <strong>Recaudación del Día:</strong> $ ${Number(dailyTotal).toFixed(2)} &nbsp;|&nbsp; 
              <strong>Generado el:</strong> ${emissionDate} a las ${emissionTime}
            </td>
          </tr>
          <tr><td colspan="5" style="height: 10px;"></td></tr>
          <tr style="background-color: #059669; color: #ffffff;">
            <th style="border: 1px solid #047857; padding: 10px 8px; font-size: 10pt; font-weight: bold; text-align: center;">#</th>
            <th style="border: 1px solid #047857; padding: 10px 12px; font-size: 10pt; font-weight: bold; text-align: left;">Cliente / Visitante</th>
            <th style="border: 1px solid #047857; padding: 10px 12px; font-size: 10pt; font-weight: bold; text-align: right;">Entrada Pagada ($)</th>
            <th style="border: 1px solid #047857; padding: 10px 10px; font-size: 10pt; font-weight: bold; text-align: center;">Hora de Ingreso</th>
            <th style="border: 1px solid #047857; padding: 10px 10px; font-size: 10pt; font-weight: bold; text-align: center;">Fecha de Registro</th>
          </tr>
          ${rowsHtml}
          <tr><td colspan="5" style="height: 6px;"></td></tr>
          <tr style="background-color: #d1fae5; font-weight: bold; border-top: 2px solid #059669; border-bottom: 2px solid #059669;">
            <td colspan="2" style="border: 1px solid #6ee7b7; padding: 10px 12px; font-size: 11pt; color: #065f46; text-align: right;">
              TOTAL RECAUDADO EN EL DÍA:
            </td>
            <td style="border: 1px solid #6ee7b7; padding: 10px 12px; font-size: 11pt; color: #065f46; text-align: right; font-weight: bold;">
              $ ${Number(dailyTotal).toFixed(2)}
            </td>
            <td colspan="2" style="border: 1px solid #6ee7b7; padding: 10px 12px; font-size: 9.5pt; color: #065f46; text-align: center;">
              ${dailyIncomes.length} clientes atendidos
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\uFEFF' + excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Reporte_Asistencias_${selectedDailyDate}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Generador de mensaje profesional de WhatsApp para membresía vencida o por vencer
  const generateWhatsAppMessage = (sub) => {
    const clientName = sub?.user?.name || sub?.billing_name || 'Estimado/a cliente';
    const planName = sub?.plan?.name || sub?.plan_id || 'Membresía del Gimnasio';
    const endsAtDate = sub?.ends_at ? new Date(sub.ends_at).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' }) : 'recientemente';
    const status = getMembershipStatus(sub);

    if (status.type === 'expiring') {
      const daysMsg = status.diffDays === 0 ? '¡Vence hoy!' : (status.diffDays === 1 ? '¡Queda solo 1 día!' : `¡Quedan ${status.diffDays} días!`);
      return `¡Hola, *${clientName}*! 💪 Esperamos que te encuentres excelente.\n\n` +
        `Te saludamos cordialmente de parte del equipo de *Gigafit Gim*.\n` +
        `Te recordamos atentamente que tu membresía (*${planName}*) está próxima a vencer el *${endsAtDate}* (${daysMsg}).\n\n` +
        `Mantener la constancia y no perder tus días de entrenamiento es clave para tus metas físicas y de bienestar. ¡Tu disciplina hace la diferencia! 🔥\n\n` +
        `📋 *Puedes renovar anticipadamente:*\n` +
        `🔹 1. Directamente en recepción (Efectivo o Transferencia)\n` +
        `🔹 2. Desde nuestra aplicación móvil\n\n` +
        `Si tienes alguna pregunta o deseas consultar sobre promociones vigentes, escríbenos por aquí con gusto.\n\n` +
        `¡Te esperamos en el gym para seguir entrenando con todo! 🥊`;
    }

    return `¡Hola, *${clientName}*! 💪 Esperamos que te encuentres con la mejor energía.\n\n` +
      `Te saludamos cordialmente de parte del equipo de *Gigafit Gim*.\n` +
      `Te escribimos para recordarte de manera atenta que tu plan de membresía (*${planName}*) finalizó el *${endsAtDate}*.\n\n` +
      `Sabemos lo importante que es mantener la constancia en tus entrenamientos para alcanzar tus metas físicas y de salud. ¡No dejes que tu progreso se detenga! 🔥\n\n` +
      `📋 *Opciones rápidas para renovar tu membresía:*\n` +
      `🔹 1. Directamente en recepción (Efectivo o Transferencia)\n` +
      `🔹 2. Desde nuestra aplicación móvil\n\n` +
      `Si deseas conocer nuestras promociones vigentes o necesitas ayuda para reactivar tu plan, estamos a tu total disposición.\n\n` +
      `¡Te esperamos pronto en el gym para seguir entrenando fuerte! 🥊`;
  };

  const handleOpenWhatsAppReminder = (sub) => {
    const rawPhone = sub?.user?.phone || sub?.billing_phone || '';
    setWhatsappModal({
      open: true,
      sub,
      phone: rawPhone,
      customMessage: generateWhatsAppMessage(sub),
      copied: false
    });
  };

  const sendWhatsAppMessage = () => {
    if (!whatsappModal.phone || !whatsappModal.phone.trim()) {
      alert('Por favor ingresa o verifica el número de teléfono del cliente.');
      return;
    }
    let cleanDigits = whatsappModal.phone.replace(/\D/g, '');
    if (cleanDigits.startsWith('0')) {
      cleanDigits = '593' + cleanDigits.substring(1);
    } else if (!cleanDigits.startsWith('593') && cleanDigits.length === 9) {
      cleanDigits = '593' + cleanDigits;
    }
    const normalizedMsg = (whatsappModal.customMessage || '').normalize('NFC');
    const encoded = encodeURIComponent(normalizedMsg);
    window.open(`https://api.whatsapp.com/send/?phone=${cleanDigits}&text=${encoded}`, '_blank');
  };

  const copyWhatsAppMessage = () => {
    navigator.clipboard.writeText(whatsappModal.customMessage);
    setWhatsappModal(prev => ({ ...prev, copied: true }));
    setTimeout(() => {
      setWhatsappModal(prev => ({ ...prev, copied: false }));
    }, 2500);
  };

  // Open manual membership modal (cargado instantáneo sin traer usuarios masivos)
  const handleOpenManualSub = async () => {
    setManualSubTab('registrado');
    setUserSearchQuery('');
    setSelectedUser(null);
    setSelectedUserId('');
    setNewClientName('');
    setNewClientEmail('');
    setNewClientPhone('');
    setSelectedPlanId('');
    setManualSubError('');
    setManualSubSuccess('');
    setUsers([]);
    setFilteredUsers([]);
    setLoadingUsers(false);
    setManualSubModalOpen(true);
    
    try {
      const plansData = await apiFetch('/admin/subscription-plans');
      const plansList = Array.isArray(plansData) ? plansData : (plansData?.data || []);
      setPlans(plansList);
      if (plansList && plansList.length > 0) setSelectedPlanId(plansList[0].id);
    } catch (e) {
      setManualSubError('Error al cargar planes: ' + e.message);
    }
  };

  const handleSelectUser = (u) => {
    if (u.has_active_subscription) {
      setManualSubError(`El usuario "${u.name}" ya cuenta con una suscripción activa (${u.active_subscription_plan || 'Plan Activo'}). No puede registrar una nueva membresía hasta que expire.`);
      return;
    }
    setSelectedUser(u);
    setSelectedUserId(u.id);
    setManualSubError('');
  };

  const handleClearSelectedUser = () => {
    setSelectedUser(null);
    setSelectedUserId('');
    setManualSubError('');
  };

  // Submit manual membership
  const handleSaveManualSub = async (e) => {
    e.preventDefault();
    setManualSubError('');
    setManualSubSuccess('');

    if (!selectedPlanId) {
      setManualSubError('Debes seleccionar un plan de suscripción.');
      return;
    }

    let finalUserId = null;

    if (manualSubTab === 'registrado') {
      if (!selectedUserId || !selectedUser) {
        setManualSubError('Debes buscar y seleccionar un usuario registrado de la lista.');
        return;
      }
      if (selectedUser.has_active_subscription) {
        setManualSubError(`El usuario "${selectedUser.name}" ya cuenta con una membresía activa (${selectedUser.active_subscription_plan || 'Plan Activo'}). No puede registrar otra membresía.`);
        return;
      }
      finalUserId = selectedUserId;
    } else {
      // Pestaña: Nuevo Cliente (Sin App)
      if (!newClientName.trim()) {
        setManualSubError('Debes ingresar el nombre completo del cliente.');
        return;
      }

      setSubmittingManualSub(true);
      try {
        const tempId = Date.now();
        const randomNum = Math.floor(Math.random() * 1000);
        const generatedUsername = `user_${tempId}_${randomNum}`;
        const generatedEmail = newClientEmail.trim() || `cliente_${tempId}_${randomNum}@gimnasio.com`;
        
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
      } catch (err) {
        setSubmittingManualSub(false);
        setManualSubError(err.message || 'Error al registrar al cliente externo.');
        return;
      }
    }

    setSubmittingManualSub(true);

    try {
      await apiFetch('/trainer/subscriptions/create', {
        method: 'POST',
        body: JSON.stringify({
          user_id: parseInt(finalUserId),
          subscription_plan_id: parseInt(selectedPlanId)
        })
      });

      setManualSubSuccess('¡Membresía creada y activada exitosamente!');
      setTimeout(() => {
        setManualSubModalOpen(false);
        fetchMonthlyReport(selectedMonth, selectedYear);
      }, 1200);
    } catch (err) {
      setManualSubError(err.message || 'El usuario ya tiene una membresía activa o no se pudo crear.');
    } finally {
      setSubmittingManualSub(false);
    }
  };

  // Open daily attendance modal
  const handleOpenDailyModal = () => {
    setDailyClientName('');
    setDailyAmount('2.00'); // default gym entrance price is now $2.00
    setDailyEntryDate(selectedDailyDate || getLocalDateString());
    setDailyEntryTime(getLocalTimeString());
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
      const timePart = dailyEntryTime || getLocalTimeString();
      const combinedDateTime = `${dailyEntryDate} ${timePart}:00`;

      await apiFetch('/admin/reports/daily', {
        method: 'POST',
        body: JSON.stringify({
          client_name: dailyClientName.trim(),
          amount: parseFloat(dailyAmount) || 0,
          entry_date: combinedDateTime
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
                <div className="page-header" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h3 style={{ margin: 0, fontSize: 16 }}>Membresías Vendidas</h3>
                    <span className="badge badge--blue">{filteredSubs.length} suscripciones</span>
                  </div>
                  <button 
                    type="button"
                    className="btn btn--secondary" 
                    onClick={downloadMonthlyReport}
                    disabled={filteredSubs.length === 0}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}
                    title="Exportar listado del mes a Excel/CSV"
                  >
                    <Download size={15} />
                    <span>Descargar Reporte (CSV)</span>
                  </button>
                </div>

                {filteredSubs.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon"><CreditCard size={40} /></div>
                    <p>No se encontraron registros de suscripción.</p>
                  </div>
                ) : (
                  <>
                    <div className="table-wrap">
                      <table className="reports-premium-table">
                        <thead>
                          <tr>
                            <th>Usuario</th>
                            <th>Plan</th>
                            <th>Precio</th>
                            <th>Inicio</th>
                            <th>Vencimiento</th>
                            <th>Estado</th>
                            <th style={{ textAlign: 'right' }}>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedSubs.map((sub) => {
                            const status = getMembershipStatus(sub);
                            const isReminderEligible = status.type === 'expired' || status.type === 'expiring';
                            return (
                              <tr key={sub.id}>
                                <td>{renderUserCell(sub.user)}</td>
                                <td style={{ fontWeight: 600 }}>{sub.plan?.name || sub.plan_id}</td>
                                <td style={{ fontWeight: 700, color: 'var(--success)' }}>${Number(sub.price || 0).toFixed(2)}</td>
                                <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{sub.starts_at ? new Date(sub.starts_at).toLocaleDateString('es-MX') : '—'}</td>
                                <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{sub.ends_at ? new Date(sub.ends_at).toLocaleDateString('es-MX') : '—'}</td>
                                <td>
                                  <span className={`badge-status badge-status--${status.type}`}>
                                    <span className={`badge-status-dot badge-status-dot--${status.type}`} />
                                    <span>{status.label}</span>
                                  </span>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                                    {isReminderEligible && (
                                      <button
                                        type="button"
                                        className="btn-whatsapp-reminder"
                                        onClick={() => handleOpenWhatsAppReminder(sub)}
                                        title={status.type === 'expired' ? "Enviar recordatorio de membresía vencida por WhatsApp" : "Enviar recordatorio de membresía por vencer por WhatsApp"}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 6,
                                          background: status.type === 'expired' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(37, 211, 102, 0.12)',
                                          color: status.type === 'expired' ? '#dc2626' : '#15803d',
                                          border: `1px solid ${status.type === 'expired' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(37, 211, 102, 0.3)'}`
                                        }}
                                      >
                                        <MessageCircle size={14} style={{ color: status.type === 'expired' ? '#dc2626' : '#25D366' }} />
                                        <span>Recordatorio</span>
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
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
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--card)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 8 }}>
                      <Calendar size={14} style={{ color: 'var(--text-secondary)' }} />
                      <input 
                        type="date" 
                        value={selectedDailyDate} 
                        onChange={e => setSelectedDailyDate(e.target.value)} 
                        style={{ border: 'none', background: 'transparent', outline: 'none', padding: 0, color: 'var(--text)', fontSize: 14 }}
                      />
                    </div>
                    <button 
                      type="button"
                      className="btn btn--secondary" 
                      onClick={downloadDailyReport}
                      disabled={dailyIncomes.length === 0}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      title="Descargar asistencias del día en CSV"
                    >
                      <Download size={15} />
                      <span>Descargar Asistencias (CSV)</span>
                    </button>
                    <button className="btn btn--primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={handleOpenDailyModal}>
                      <Plus size={16} />
                      <span>Registrar Asistencia</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-grid-2-1" style={{ marginTop: 20 }}>
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
                      <table className="reports-premium-table">
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
                              <td>
                                {renderClientNameCell(item.client_name || 'Invitado anónimo')}
                              </td>
                              <td style={{ fontWeight: 700, color: item.amount > 0 ? 'var(--success)' : 'var(--text)' }}>
                                ${Number(item.amount).toFixed(2)}
                              </td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                  <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13.5 }}>
                                    {formatAttendanceTime(item.entry_date)}
                                  </span>
                                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                                    {formatAttendanceDate(item.entry_date)}
                                  </span>
                                </div>
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
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Registrar Membresía Manual</h3>
                <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'var(--text-secondary)' }}>
                  Asigna una membresía directa con pago en efectivo o caja
                </p>
              </div>
              <button className="btn btn--ghost" style={{ padding: 6, borderRadius: '50%' }} onClick={() => setManualSubModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            {/* Selector de dos secciones: Usuario Registrado vs Nuevo Cliente */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: 6, 
              padding: 4, 
              background: 'var(--bg)', 
              border: '1px solid var(--border)', 
              borderRadius: 10, 
              marginBottom: 16 
            }}>
              <button
                type="button"
                onClick={() => { setManualSubTab('registrado'); setManualSubError(''); }}
                style={{
                  padding: '9px 12px',
                  borderRadius: 7,
                  border: 'none',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: manualSubTab === 'registrado' ? 'var(--primary)' : 'transparent',
                  color: manualSubTab === 'registrado' ? '#ffffff' : 'var(--text-secondary)',
                  boxShadow: manualSubTab === 'registrado' ? '0 2px 8px rgba(37,99,235,0.25)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <UserCheck size={16} />
                <span>Usuario Registrado</span>
              </button>
              <button
                type="button"
                onClick={() => { setManualSubTab('nuevo'); setManualSubError(''); }}
                style={{
                  padding: '9px 12px',
                  borderRadius: 7,
                  border: 'none',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: manualSubTab === 'nuevo' ? 'var(--primary)' : 'transparent',
                  color: manualSubTab === 'nuevo' ? '#ffffff' : 'var(--text-secondary)',
                  boxShadow: manualSubTab === 'nuevo' ? '0 2px 8px rgba(37,99,235,0.25)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <UserPlus size={16} />
                <span>Nuevo Cliente (Sin App)</span>
              </button>
            </div>

            {manualSubError && (
              <div className="alert alert--error" style={{ marginBottom: 14 }}>
                <AlertTriangle size={15} /> 
                <span style={{ fontSize: 13 }}>{manualSubError}</span>
              </div>
            )}
            {manualSubSuccess && (
              <div className="alert alert--success" style={{ marginBottom: 14 }}>
                <CheckCircle2 size={15} /> 
                <span style={{ fontSize: 13 }}>{manualSubSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveManualSub} className="modal-form">
              {/* SECCIÓN 1: USUARIO REGISTRADO */}
              {manualSubTab === 'registrado' && (
                <div style={{ marginBottom: 16 }}>
                  {selectedUser ? (
                    // Ficha del usuario registrado seleccionado
                    <div style={{
                      padding: '12px 14px',
                      background: 'rgba(34, 197, 94, 0.08)',
                      border: '1.5px solid #22c55e',
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar-circle" style={!getUserAvatarUrl(selectedUser) ? { backgroundColor: getAvatarBgColor(selectedUser.name), width: 36, height: 36, fontSize: 13 } : { width: 36, height: 36 }}>
                          {getUserAvatarUrl(selectedUser) ? (
                            <img src={getUserAvatarUrl(selectedUser)} alt={selectedUser.name} className="avatar-img" />
                          ) : (
                            <span>{getUserInitials(selectedUser.name)}</span>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text)' }}>
                            {selectedUser.name}
                          </div>
                          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                            {selectedUser.email || 'Sin correo'} {selectedUser.phone ? `• 📞 ${selectedUser.phone}` : ''}
                          </div>
                          <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Check size={12} /> Usuario Seleccionado (Listo para asignar membresía)
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearSelectedUser}
                        className="btn btn--secondary btn--sm"
                        style={{ fontSize: 12, padding: '4px 10px' }}
                      >
                        Cambiar
                      </button>
                    </div>
                  ) : (
                    // Buscador y lista de usuarios registrados
                    <div>
                      <div className="form-group" style={{ marginBottom: 10 }}>
                        <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 5 }}>
                          Buscar Usuario Registrado *
                        </label>
                        <div style={{ position: 'relative' }}>
                          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                          <input
                            type="text"
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                            placeholder="Escribe el nombre, correo o teléfono (ej. Liliana)..."
                            style={{ paddingLeft: 34, width: '100%', fontSize: 13 }}
                            autoFocus
                          />
                          {userSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setUserSearchQuery('')}
                              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Lista de resultados */}
                      <div style={{
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        background: 'var(--card)',
                        maxHeight: 230,
                        overflowY: 'auto',
                        padding: 2
                      }}>
                        {!userSearchQuery.trim() ? (
                          <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <Search size={26} style={{ opacity: 0.35, margin: '0 auto 8px', display: 'block' }} />
                            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>
                              Escribe el nombre del usuario
                            </div>
                            <div style={{ fontSize: 11.5, marginTop: 4, color: 'var(--text-secondary)' }}>
                              Escribe el nombre, correo o teléfono para buscar en la base de datos en tiempo real.
                            </div>
                          </div>
                        ) : loadingUsers ? (
                          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 12.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <Loader2 className="spin" size={16} />
                            <span>Buscando "{userSearchQuery}" en la base de datos...</span>
                          </div>
                        ) : filteredUsers.length === 0 ? (
                          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 12.5 }}>
                            <p style={{ margin: 0, fontWeight: 600, color: 'var(--text)' }}>No se encontraron usuarios registrados con "{userSearchQuery}".</p>
                            <p style={{ margin: '6px 0 0', fontSize: 11.5 }}>Si es un cliente nuevo sin cuenta, usa la pestaña superior "Nuevo Cliente (Sin App)".</p>
                          </div>
                        ) : (
                          filteredUsers.map((u) => {
                            const avatarUrl = getUserAvatarUrl(u);
                            const initials = getUserInitials(u.name);
                            const bgColor = getAvatarBgColor(u.name);
                            const hasActive = Boolean(u.has_active_subscription);

                            return (
                              <div
                                key={u.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: 10,
                                  padding: '8px 12px',
                                  borderBottom: '1px solid var(--border)',
                                  background: hasActive ? 'rgba(239, 68, 68, 0.04)' : 'transparent',
                                  opacity: hasActive ? 0.78 : 1,
                                  transition: 'background 0.15s ease'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                                  <div className="avatar-circle" style={!avatarUrl ? { backgroundColor: bgColor, width: 32, height: 32, fontSize: 11 } : { width: 32, height: 32 }}>
                                    {avatarUrl ? (
                                      <img src={avatarUrl} alt={u.name} className="avatar-img" />
                                    ) : (
                                      <span>{initials}</span>
                                    )}
                                  </div>
                                  <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {u.name}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {u.email} {u.phone ? `• 📞 ${u.phone}` : ''}
                                    </div>
                                    {hasActive ? (
                                      <div style={{ marginTop: 2, fontSize: 10.5, color: '#dc2626', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                        <span>⛔ Membresía Activa: <strong>{u.active_subscription_plan || 'Plan Activo'}</strong></span>
                                        {u.active_subscription_ends_at && <span>(Vence {formatEndDate(u.active_subscription_ends_at)})</span>}
                                      </div>
                                    ) : (
                                      <div style={{ marginTop: 2, fontSize: 10.5, color: '#16a34a', fontWeight: 600 }}>
                                        🟢 Sin membresía activa (Disponible)
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  {hasActive ? (
                                    <button
                                      type="button"
                                      disabled
                                      title="Este usuario ya cuenta con una suscripción activa y no puede tener otra."
                                      style={{
                                        fontSize: 11,
                                        padding: '4px 8px',
                                        borderRadius: 6,
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        color: '#dc2626',
                                        border: '1px solid rgba(239, 68, 68, 0.25)',
                                        cursor: 'not-allowed',
                                        fontWeight: 600
                                      }}
                                    >
                                      Ya suscrito
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleSelectUser(u)}
                                      className="btn btn--primary btn--sm"
                                      style={{ fontSize: 11, padding: '4px 10px' }}
                                    >
                                      Seleccionar
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SECCIÓN 2: NUEVO CLIENTE (SIN APP) */}
              {manualSubTab === 'nuevo' && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{
                    padding: '8px 12px',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    marginBottom: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <span>💡 <strong>Cliente Nuevo:</strong> Se creará el perfil del cliente en el sistema y se le activará su membresía en el acto.</span>
                  </div>

                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 600 }}>Nombre Completo del Cliente *</label>
                    <input
                      type="text"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      placeholder="Ej. Liliana Anchundia"
                      required
                    />
                  </div>

                  <div className="form-grid-2" style={{ marginBottom: 0 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: 12 }}>Teléfono / WhatsApp (Opcional)</label>
                      <input 
                        type="text" 
                        value={newClientPhone} 
                        onChange={e => setNewClientPhone(e.target.value)} 
                        placeholder="Ej. 0987654321" 
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: 12 }}>Correo Electrónico (Opcional)</label>
                      <input 
                        type="email" 
                        value={newClientEmail} 
                        onChange={e => setNewClientEmail(e.target.value)} 
                        placeholder="Ej. cliente@gmail.com" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SELECCIÓN DEL PLAN (COMÚN A AMBAS SECCIONES) */}
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600 }}>Plan de Suscripción *</label>
                <select value={selectedPlanId} onChange={e => setSelectedPlanId(e.target.value)} required style={{ fontSize: 13 }}>
                  <option value="">Selecciona un plan...</option>
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - ${Number(p.price).toFixed(2)}</option>
                  ))}
                </select>
              </div>

              <div style={{
                padding: '8px 12px',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: 11.5,
                color: 'var(--text-secondary)',
                marginBottom: 16
              }}>
                💡 <strong>Nota:</strong> Al registrar la membresía manualmente, se creará inmediatamente en estado <strong>Activo</strong> con una vigencia de 30 días, simulando el pago en efectivo o directo.
              </div>

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setManualSubModalOpen(false)}
                  disabled={submittingManualSub}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={submittingManualSub || (manualSubTab === 'registrado' && (!selectedUserId || selectedUser?.has_active_subscription))}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  {submittingManualSub ? (
                    <>
                      <Loader2 className="spin" size={15} />
                      <span>Registrando...</span>
                    </>
                  ) : (
                    <>
                      <Check size={15} />
                      <span>Registrar Membresía</span>
                    </>
                  )}
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

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Fecha de Asistencia *</label>
                  <input 
                    type="date" 
                    value={dailyEntryDate} 
                    onChange={e => setDailyEntryDate(e.target.value)} 
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Hora de Ingreso *</label>
                  <input 
                    type="time" 
                    value={dailyEntryTime} 
                    onChange={e => setDailyEntryTime(e.target.value)} 
                    required
                  />
                </div>
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
      {/* WhatsApp Reminder Modal */}
      {whatsappModal.open && (
        <div className="modal-overlay" onClick={() => setWhatsappModal(prev => ({ ...prev, open: false }))}>
          <div className="modal whatsapp-modal" style={{ maxWidth: 520, padding: '24px 24px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: '#25D366',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)'
                }}>
                  <MessageCircle size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>
                    Recordatorio de Membresía
                  </h3>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    Envío directo de aviso de vencimiento vía WhatsApp
                  </span>
                </div>
              </div>
              <button 
                type="button"
                className="btn-action-circle"
                onClick={() => setWhatsappModal(prev => ({ ...prev, open: false }))}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Cliente y Teléfono */}
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  DESTINATARIO
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>
                    {whatsappModal.sub?.user?.name || whatsappModal.sub?.billing_name || 'Cliente'}
                  </div>
                  {(() => {
                    const status = getMembershipStatus(whatsappModal.sub);
                    if (status.type === 'expired') {
                      return (
                        <span className="badge-status badge-status--expired" style={{ padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                          <span className="badge-status-dot badge-status-dot--expired" />
                          Membresía Vencida
                        </span>
                      );
                    }
                    return (
                      <span className="badge-status" style={{ padding: '3px 10px', fontSize: 11, fontWeight: 700, background: 'rgba(245, 158, 11, 0.15)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                        <span className="badge-status-dot" style={{ background: '#f59e0b' }} />
                        {status.diffDays === 0 ? 'Vence Hoy' : `Vence en ${status.diffDays} días`}
                      </span>
                    );
                  })()}
                </div>

                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Número de Teléfono</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={whatsappModal.phone}
                      onChange={e => setWhatsappModal(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Ej. 0984280334"
                      style={{ paddingLeft: 30, width: '100%' }}
                    />
                    <Phone size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  </div>
                </div>
              </div>

              {/* Mensaje Editable */}
              <div className="form-group" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Mensaje Personalizado</label>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Puedes editar el texto antes de enviar</span>
                </div>
                <textarea
                  rows={8}
                  value={whatsappModal.customMessage}
                  onChange={e => setWhatsappModal(prev => ({ ...prev, customMessage: e.target.value }))}
                  style={{
                    fontFamily: 'inherit',
                    fontSize: 13,
                    lineHeight: 1.45,
                    resize: 'vertical',
                    padding: 12,
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--card)'
                  }}
                />
              </div>

              {/* Botones de acción */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={copyWhatsAppMessage}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  {whatsappModal.copied ? <Check size={15} style={{ color: 'var(--success)' }} /> : <Copy size={15} />}
                  <span>{whatsappModal.copied ? '¡Copiado!' : 'Copiar Texto'}</span>
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={sendWhatsAppMessage}
                  style={{
                    backgroundColor: '#25D366',
                    color: '#ffffff',
                    border: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontWeight: 600,
                    boxShadow: '0 2px 8px rgba(37, 211, 102, 0.3)'
                  }}
                >
                  <Send size={15} />
                  <span>Abrir WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
