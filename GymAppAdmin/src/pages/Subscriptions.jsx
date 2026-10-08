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
  CalendarClock,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  MoreVertical,
  XCircle,
  AlertCircle,
  ShieldAlert,
  MessageCircle,
  Send,
  Copy,
  Phone,
  FileText,
  Mail
} from 'lucide-react';
import '../components/Layout.css';
import './Subscriptions.css';

const STATUS_LABELS = { active: 'Activa', pending: 'Pendiente', cancelled: 'Cancelada', expired: 'Expirada', rejected: 'Rechazado' };
const STATUS_BADGE = { active: 'active', pending: 'pending', cancelled: 'cancelled', expired: 'expired', rejected: 'rejected' };

export default function Subscriptions() {
  const [subs, setSubs] = useState([]);
  const [plans, setPlans] = useState([]);
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

  // Administrative Note Modal
  const [noteModal, setNoteModal] = useState(null); // { sub, note: '', saving: false }

  // Edit Client Details Modal
  const [editClientModal, setEditClientModal] = useState(null); // { sub, name: '', phone: '', email: '', notes: '', saving: false }

  // WhatsApp Reminder State
  const [whatsappModal, setWhatsappModal] = useState({
    open: false,
    sub: null,
    phone: '',
    customMessage: '',
    copied: false
  });

  const isSubscriptionExpired = (sub) => {
    if (!sub) return false;
    if (sub.status === 'expired') return true;
    if (sub.status === 'active' && sub.ends_at) {
      const endsAt = new Date(sub.ends_at);
      const today = new Date();
      endsAt.setHours(23, 59, 59, 999);
      return endsAt < today;
    }
    return false;
  };

  const isSubscriptionExpiringSoon = (sub) => {
    if (!sub || isSubscriptionExpired(sub)) return false;
    if (sub.status !== 'active' || !sub.ends_at) return false;
    const endsAt = new Date(sub.ends_at);
    const today = new Date();
    endsAt.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((endsAt - today) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  };

  const getDaysRemainingNumber = (endsAtStr) => {
    if (!endsAtStr) return null;
    const endsAt = new Date(endsAtStr);
    const today = new Date();
    endsAt.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return Math.ceil((endsAt - today) / (1000 * 60 * 60 * 24));
  };

  const getSubscriptionExpirationState = (sub) => {
    if (!sub) return { eligible: false, isExpired: false, diffDays: null, label: 'Recordatorio WhatsApp' };
    if (isSubscriptionExpired(sub)) {
      const diffDays = getDaysRemainingNumber(sub.ends_at);
      return { eligible: true, isExpired: true, diffDays: diffDays !== null ? diffDays : -1, label: 'Recordatorio (Vencida)' };
    }
    if (sub.status === 'cancelled' || sub.status === 'rejected' || sub.status === 'pending') {
      return { eligible: false, isExpired: false, diffDays: null, label: 'Recordatorio WhatsApp' };
    }

    if (sub.ends_at) {
      const diffDays = getDaysRemainingNumber(sub.ends_at);
      if (diffDays < 0) {
        return { eligible: true, isExpired: true, diffDays, label: 'Recordatorio (Vencida)' };
      }
      if (diffDays <= 7) {
        return { eligible: true, isExpired: false, diffDays, label: 'Recordatorio (Por vencer)' };
      }
      return { eligible: true, isExpired: false, diffDays, label: 'Recordatorio WhatsApp' };
    }
    return { eligible: true, isExpired: false, diffDays: null, label: 'Recordatorio WhatsApp' };
  };

  const generateWhatsAppMessage = (sub) => {
    const clientName = sub?.user?.name || sub?.billing_name || 'Estimado/a cliente';
    const planName = sub?.plan?.name || sub?.plan_id || 'Membresía del Gimnasio';
    const expState = getSubscriptionExpirationState(sub);
    const endsAtDate = sub?.ends_at ? new Date(sub.ends_at).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' }) : 'recientemente';

    if (!expState.isExpired) {
      const daysMsg = expState.diffDays === 0 ? '¡Vence hoy!' : (expState.diffDays === 1 ? '¡Queda solo 1 día!' : `¡Quedan ${expState.diffDays} días!`);
      const statusVigencia = expState.diffDays <= 7 ? 'está próxima a vencer el' : 'se encuentra activa y tiene vigencia hasta el';
      return `¡Hola, *${clientName}*! 💪 Esperamos que te encuentres excelente.\n\n` +
        `Te saludamos cordialmente de parte del equipo de *Gigafit Gim*.\n` +
        `Te recordamos atentamente que tu membresía (*${planName}*) ${statusVigencia} *${endsAtDate}* (${daysMsg}).\n\n` +
        `Mantener la constancia y no perder tus días de entrenamiento es clave para tus metas físicas y de bienestar. ¡Tu disciplina hace la diferencia! 🔥\n\n` +
        `📋 *Puedes renovar tu plan:*\n` +
        `🔹 1. Directamente en recepción (Efectivo o Transferencia)\n` +
        `🔹 2. Desde nuestra aplicación móvil\n\n` +
        `Si tienes alguna pregunta o deseas consultar sobre promociones vigentes, escríbenos por aquí con gusto.\n\n` +
        `¡Te esperamos en el gym para seguir entrenando con todo! 🥊`;
    }

    return `¡Hola, *${clientName}*! 💪 Esperamos que te encuentres con la mejor energía.\n\n` +
      `Te saludamos cordialmente de parte del equipo de *Gigafit Gim*.\n` +
      `Te escribimos para recordarte de forma atenta que tu plan de membresía (*${planName}*) finalizó el *${endsAtDate}*.\n\n` +
      `Sabemos lo importante que es mantener la constancia en tus entrenamientos para alcanzar tus metas físicas y de salud. ¡No dejes que tu progreso se detenga! 🔥\n\n` +
      `📋 *Opciones rápidas para renovar tu membresía:*\n` +
      `🔹 1. Directamente en recepción (Efectivo o Transferencia)\n` +
      `🔹 2. Desde nuestra aplicación móvil\n\n` +
      `Si deseas conocer nuestras promociones vigentes o necesitas ayuda para reactivar tu plan, estamos a tu total disposición.\n\n` +
      `¡Te esperamos pronto en el gym para seguir entrenando fuerte! 🥊`;
  };

  const handleOpenWhatsAppReminder = (sub) => {
    const rawPhone = sub?.billing_phone || sub?.user?.phone || sub?.resolved_phone || '';
    setWhatsappModal({
      open: true,
      sub,
      phone: rawPhone,
      customMessage: generateWhatsAppMessage(sub),
      copied: false
    });
  };

  const sendWhatsAppMessage = async () => {
    if (!whatsappModal.phone || !whatsappModal.phone.trim()) {
      alert('Por favor ingresa o verifica el número de teléfono del cliente.');
      return;
    }
    const currentPhone = whatsappModal.phone.trim();

    // Auto-save phone to backend so it's permanently stored for this client
    if (whatsappModal.sub?.id) {
      try {
        await apiFetch(`/trainer/subscriptions/${whatsappModal.sub.id}/phone`, {
          method: 'POST',
          body: JSON.stringify({ phone: currentPhone })
        });
        setSubs(prev => prev.map(item => item.id === whatsappModal.sub.id ? {
          ...item,
          billing_phone: currentPhone,
          user: item.user ? { ...item.user, phone: currentPhone } : item.user
        } : item));
      } catch (e) {
        console.warn('Could not persist phone:', e);
      }
    }

    let cleanDigits = currentPhone.replace(/\D/g, '');
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

  const handleSaveNote = async () => {
    if (!noteModal?.sub) return;
    setNoteModal(prev => ({ ...prev, saving: true }));
    try {
      await apiFetch(`/trainer/subscriptions/${noteModal.sub.id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ notes: noteModal.note.trim() || null })
      });
      setSubs(prev => prev.map(item => item.id === noteModal.sub.id ? { ...item, notes: noteModal.note.trim() || null } : item));
      setSuccess('Nota administrativa guardada correctamente');
      setTimeout(() => setSuccess(''), 3000);
      setNoteModal(null);
    } catch (err) {
      setError(err.message || 'Error al guardar la nota');
      setTimeout(() => setError(''), 4000);
      setNoteModal(prev => ({ ...prev, saving: false }));
    }
  };

  const getLocalDateString = (d = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const calculateDefaultEndDate = (startDateStr, planId, plansList = plans) => {
    if (!startDateStr) return '';
    try {
      const plan = (plansList || []).find(p => String(p.id) === String(planId));
      let duration = plan?.duration || 'monthly';
      const parts = startDateStr.split('-');
      if (parts.length !== 3) return '';
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      let daysToAdd = 30;
      if (duration === 'quarterly') daysToAdd = 90;
      else if (duration === 'semiannual') daysToAdd = 180;
      else if (duration === 'annual' || duration === 'yearly') daysToAdd = 365;
      else if (typeof duration === 'number') daysToAdd = duration * 30;
      else if (!isNaN(parseInt(duration, 10))) daysToAdd = parseInt(duration, 10) * 30;
      d.setDate(d.getDate() + daysToAdd);
      return getLocalDateString(d);
    } catch {
      return '';
    }
  };

  const handleOpenEditClient = (sub) => {
    const formatForDateInput = (val) => {
      if (!val) return '';
      if (typeof val === 'string') {
        const match = val.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) return `${match[1]}-${match[2]}-${match[3]}`;
      }
      try {
        const d = new Date(val);
        return isNaN(d.getTime()) ? '' : getLocalDateString(d);
      } catch {
        return '';
      }
    };

    setEditClientModal({
      sub,
      subscription_plan_id: sub.subscription_plan_id || sub.plan?.id || '',
      name: sub.user?.name || sub.billing_name || '',
      phone: sub.billing_phone || sub.user?.phone || sub.resolved_phone || '',
      email: sub.user?.email || sub.billing_email || '',
      notes: sub.notes || '',
      starts_at: formatForDateInput(sub.starts_at),
      ends_at: formatForDateInput(sub.ends_at),
      saving: false
    });
  };

  const handleEditClientStartDateChange = (newStart) => {
    setEditClientModal(prev => {
      if (!prev) return prev;
      let newEnd = prev.ends_at;
      if (newStart && prev.starts_at && prev.ends_at) {
        const d1 = new Date(prev.starts_at + 'T00:00:00');
        const d2 = new Date(prev.ends_at + 'T00:00:00');
        const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
        if (diffDays > 0) {
          const parts = newStart.split('-');
          if (parts.length === 3 && parts[0].length === 4) {
            const nextEnd = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
            nextEnd.setDate(nextEnd.getDate() + diffDays);
            newEnd = getLocalDateString(nextEnd);
          }
        }
      } else if (newStart) {
        const planId = prev.subscription_plan_id || prev.sub?.subscription_plan_id;
        newEnd = calculateDefaultEndDate(newStart, planId, plans);
      }
      return {
        ...prev,
        starts_at: newStart,
        ends_at: newEnd
      };
    });
  };

  const handleEditModalDatePreset = (days) => {
    const base = editClientModal?.starts_at 
      ? new Date(editClientModal.starts_at + 'T00:00:00') 
      : new Date();
    base.setDate(base.getDate() + days);
    setEditClientModal(prev => ({
      ...prev,
      ends_at: getLocalDateString(base)
    }));
  };

  const handleSaveClientDetails = async (e) => {
    if (e) e.preventDefault();
    if (!editClientModal?.sub) return;
    setEditClientModal(prev => ({ ...prev, saving: true }));
    try {
      const res = await apiFetch(`/trainer/subscriptions/${editClientModal.sub.id}/client-details`, {
        method: 'POST',
        body: JSON.stringify({
          name: editClientModal.name.trim(),
          phone: editClientModal.phone.trim() || null,
          email: editClientModal.email.trim() || null,
          subscription_plan_id: editClientModal.subscription_plan_id || null,
          notes: editClientModal.notes.trim() || null,
          starts_at: editClientModal.starts_at || null,
          ends_at: editClientModal.ends_at || null
        })
      });

      const updatedSub = res?.subscription;
      const matchingPlan = plans.find(p => String(p.id) === String(editClientModal.subscription_plan_id));

      setSubs(prev => prev.map(s => s.id === editClientModal.sub.id ? {
        ...s,
        billing_name: editClientModal.name.trim(),
        billing_phone: editClientModal.phone.trim() || null,
        billing_email: editClientModal.email.trim() || null,
        notes: editClientModal.notes.trim() || null,
        subscription_plan_id: editClientModal.subscription_plan_id || s.subscription_plan_id,
        plan: updatedSub?.plan || matchingPlan || s.plan,
        starts_at: updatedSub?.starts_at || (editClientModal.starts_at ? `${editClientModal.starts_at}T00:00:00` : s.starts_at),
        ends_at: updatedSub?.ends_at || (editClientModal.ends_at ? `${editClientModal.ends_at}T23:59:59` : s.ends_at),
        status: updatedSub?.status || s.status,
        user: s.user ? {
          ...s.user,
          name: editClientModal.name.trim() || s.user.name,
          phone: editClientModal.phone.trim() || s.user.phone,
          email: editClientModal.email.trim() || s.user.email
        } : s.user,
        resolved_phone: editClientModal.phone.trim() || s.resolved_phone
      } : s));

      setSuccess('Datos de la membresía actualizados exitosamente');
      setTimeout(() => setSuccess(''), 3000);
      setEditClientModal(null);
    } catch (err) {
      setError(err.message || 'Error al guardar los datos del cliente');
      setTimeout(() => setError(''), 4000);
      setEditClientModal(prev => ({ ...prev, saving: false }));
    }
  };

  const handleOpenReceiptModal = (sub) => {
    setZoom(1);
    setRotation(0);
    setReceiptModal(sub);
  };

  const getRemainingDaysText = (endsAtStr) => {
    if (!endsAtStr) return '';
    const diffDays = getDaysRemainingNumber(endsAtStr);
    if (diffDays === null) return '';

    if (diffDays < 0) return Math.abs(diffDays) === 1 ? 'Expiró ayer' : `Expiró hace ${Math.abs(diffDays)} días`;
    if (diffDays === 0) return '¡Vence hoy!';
    if (diffDays === 1) return '¡Queda 1 día!';
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

  const renderUserCell = (user, sub) => {
    if (!user && !sub?.billing_name) return <span style={{ color: 'var(--text-secondary)' }}>—</span>;
    const name = user?.name || sub?.billing_name || 'Cliente';
    const avatarUrl = user ? getUserAvatarUrl(user) : null;
    const initials = getUserInitials(name);
    const bgColor = getAvatarBgColor(name);

    let subInfo = user?.username ? `@${user.username}` : (user?.phone || sub?.billing_phone || user?.email || '');
    if (subInfo.startsWith('cliente_') && subInfo.includes('@gimnasio.com')) {
      subInfo = user?.phone || sub?.billing_phone || 'Cliente Registrado';
    }

    return (
      <div className="user-profile-cell-wrapper">
        <div className="avatar-circle" style={!avatarUrl ? { backgroundColor: bgColor } : {}}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="avatar-img" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div className="user-text-details">
          <span className="user-name" title={name}>{name}</span>
          <span className="user-sub-info" title={subInfo}>{subInfo}</span>
        </div>
      </div>
    );
  };

  const renderStatusCell = (s) => {
    const isExpired = isSubscriptionExpired(s);
    const isExpiring = isSubscriptionExpiringSoon(s);
    const effectiveStatus = isExpired ? 'expired' : s.status;
    const days = getDaysRemainingNumber(s.ends_at);

    if (effectiveStatus === 'active') {
      if (isExpiring) {
        return (
          <div className="status-pill-container">
            <span className="status-pill status-pill--expiring" title="Vence dentro de los próximos 7 días">
              <Clock size={13} className="status-pill-icon" />
              <span>Por vencer ({days}d)</span>
            </span>
          </div>
        );
      }
      return (
        <div className="status-pill-container">
          <span className="status-pill status-pill--active">
            <CheckCircle2 size={13} className="status-pill-icon" />
            <span>Activa</span>
          </span>
        </div>
      );
    }

    if (effectiveStatus === 'expired') {
      return (
        <div className="status-pill-container">
          <span className="status-pill status-pill--expired">
            <XCircle size={13} className="status-pill-icon" />
            <span>Expirada</span>
          </span>
        </div>
      );
    }

    if (effectiveStatus === 'pending') {
      return (
        <div className="status-pill-container">
          <span className="status-pill status-pill--pending">
            <Clock size={13} className="status-pill-icon" />
            <span>Pendiente</span>
          </span>
        </div>
      );
    }

    if (effectiveStatus === 'rejected') {
      return (
        <div className="status-pill-container">
          <span className="status-pill status-pill--rejected">
            <XCircle size={13} className="status-pill-icon" />
            <span>Rechazada</span>
          </span>
          {s.rejection_reason && (
            <div className="status-rejection-info">
              <AlertCircle size={11} />
              <span className="rejection-text-truncated">{s.rejection_reason}</span>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="status-pill-container">
        <span className={`status-pill status-pill--${STATUS_BADGE[effectiveStatus] || 'expired'}`}>
          <XCircle size={13} className="status-pill-icon" />
          <span>{STATUS_LABELS[effectiveStatus] || effectiveStatus}</span>
        </span>
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

  useEffect(() => { 
    fetchSubs(); 
    apiFetch('/admin/subscription-plans')
      .then(d => setPlans(Array.isArray(d) ? d : (d?.data || [])))
      .catch(() => {});
  }, []);

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

  const pendingCount = subs.filter(s => s.status === 'pending').length;
  const expiredCount = subs.filter(s => isSubscriptionExpired(s)).length;
  const expiringCount = subs.filter(s => isSubscriptionExpiringSoon(s)).length;
  const activeCount = subs.filter(s => s.status === 'active' && !isSubscriptionExpired(s)).length;
  const cancelledCount = subs.filter(s => s.status === 'cancelled').length;

  const filtered = subs.filter(s => {
    let matchFilter = true;
    if (filter === 'pending') {
      matchFilter = s.status === 'pending';
    } else if (filter === 'active') {
      matchFilter = s.status === 'active' && !isSubscriptionExpired(s);
    } else if (filter === 'expiring') {
      matchFilter = isSubscriptionExpiringSoon(s);
    } else if (filter === 'expired') {
      matchFilter = isSubscriptionExpired(s);
    } else if (filter === 'cancelled') {
      matchFilter = s.status === 'cancelled';
    } else if (filter === 'rejected') {
      matchFilter = s.status === 'rejected';
    }

    const query = search.trim().toLowerCase();
    const matchSearch = !query ||
      s.user?.name?.toLowerCase().includes(query) ||
      s.billing_name?.toLowerCase().includes(query) ||
      s.user?.email?.toLowerCase().includes(query) ||
      s.billing_email?.toLowerCase().includes(query) ||
      (s.billing_phone && s.billing_phone.includes(query)) ||
      (s.user?.phone && s.user.phone.includes(query)) ||
      (s.resolved_phone && s.resolved_phone.includes(query));

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

      <div className="subscriptions-page-subbar">
        <p className="subscriptions-page-desc">
          Controla los ingresos, pagos y vigencias de las membresías de los clientes en tiempo real.
        </p>
        <button 
          type="button" 
          className="btn-refresh-subs" 
          onClick={fetchSubs} 
          disabled={loading}
          title="Actualizar datos"
        >
          <RefreshCw size={15} className={loading ? "spin" : ""} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* SaaS Stats Grid */}
      <div className="subscriptions-stats-grid">
        <div className="sub-stat-card sub-stat-card--total" onClick={() => setFilter('all')}>
          <div className="sub-stat-icon-wrapper active">
            <Users size={20} />
          </div>
          <div className="sub-stat-content">
            <span className="sub-stat-label">Total Suscriptores</span>
            <span className="sub-stat-value">{subs.length}</span>
          </div>
        </div>

        <div className="sub-stat-card sub-stat-card--active" onClick={() => setFilter('active')}>
          <div className="sub-stat-icon-wrapper success">
            <CheckCircle2 size={20} />
          </div>
          <div className="sub-stat-content">
            <div className="sub-stat-label-row">
              <span className="sub-stat-label">Activas</span>
              <span className="live-dot" title="En curso"></span>
            </div>
            <span className="sub-stat-value text-success">{activeCount}</span>
          </div>
        </div>

        <div className="sub-stat-card sub-stat-card--expiring" onClick={() => setFilter('expiring')}>
          <div className="sub-stat-icon-wrapper warning">
            <CalendarClock size={20} />
          </div>
          <div className="sub-stat-content">
            <span className="sub-stat-label">Por Vencer (7d)</span>
            <span className="sub-stat-value text-warning">{expiringCount}</span>
          </div>
        </div>

        <div className="sub-stat-card sub-stat-card--expired" onClick={() => setFilter('expired')}>
          <div className="sub-stat-icon-wrapper danger">
            <XCircle size={20} />
          </div>
          <div className="sub-stat-content">
            <span className="sub-stat-label">Expiradas</span>
            <span className="sub-stat-value text-danger">{expiredCount}</span>
          </div>
        </div>

        <div className="sub-stat-card sub-stat-card--pending" onClick={() => setFilter('pending')}>
          <div className="sub-stat-icon-wrapper pending">
            <Clock size={20} />
          </div>
          <div className="sub-stat-content">
            <span className="sub-stat-label">Pendientes</span>
            <span className="sub-stat-value text-pending">{pendingCount}</span>
          </div>
        </div>
      </div>

      {/* Toolbar with Search and Segmented Filters */}
      <div className="subscriptions-toolbar">
        <div className="search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            className="search-input-premium"
            placeholder="Buscar por cliente, @usuario, teléfono o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button 
              type="button" 
              className="search-clear-btn" 
              onClick={() => setSearch('')}
              title="Limpiar búsqueda"
            >
              <X size={14} />
            </button>
          )}
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
            className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            <span>Activas</span>
            <span className="tab-count active">{activeCount}</span>
          </button>
          <button
            type="button"
            className={`filter-tab ${filter === 'expiring' ? 'active' : ''}`}
            onClick={() => setFilter('expiring')}
          >
            <span>Por Vencer</span>
            <span className="tab-count expiring">{expiringCount}</span>
          </button>
          <button
            type="button"
            className={`filter-tab ${filter === 'expired' ? 'active' : ''}`}
            onClick={() => setFilter('expired')}
          >
            <span>Expiradas</span>
            <span className="tab-count expired">{expiredCount}</span>
          </button>
          <button
            type="button"
            className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            <span>Pendientes</span>
            <span className="tab-count pending">{pendingCount}</span>
          </button>
          <button
            type="button"
            className={`filter-tab ${filter === 'cancelled' ? 'active' : ''}`}
            onClick={() => setFilter('cancelled')}
          >
            <span>Canceladas</span>
            <span className="tab-count cancelled">{cancelledCount}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state"><Loader2 className="spin" size={24} /> <span>Cargando suscripciones…</span></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><CreditCard size={40} /></div>
          <p className="empty-state-title">No hay suscripciones encontradas</p>
          <p className="empty-state-desc">Prueba cambiando los términos de búsqueda o el filtro seleccionado.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="subs-desktop-view">
            <div className="subs-table-container">
              <table className="subs-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 220 }}>Cliente</th>
                    <th style={{ minWidth: 150 }}>Plan & Precio</th>
                    <th>Estado</th>
                    <th>Método</th>
                    <th style={{ minWidth: 180 }}>Vigencia</th>
                    <th style={{ textAlign: 'right', minWidth: 160 }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((s, index) => {
                    const isLastRows = index >= paginatedItems.length - 2;
                    return (
                      <tr key={s.id}>
                        <td style={{ minWidth: 220 }}>{renderUserCell(s.user, s)}</td>
                        <td>
                          <div className="plan-cell-content">
                            <span className="plan-name-badge">{s.plan?.name || s.plan_id || 'Membresía Gym'}</span>
                            <span className="plan-price-text">
                              ${s.price ? Number(s.price).toFixed(2) : (s.plan?.price ? Number(s.plan.price).toFixed(2) : '—')}
                              <small> / mes</small>
                            </span>
                            {s.notes && (
                              <div
                                onClick={() => setNoteModal({ sub: s, note: s.notes || '', saving: false })}
                                className="sub-note-badge"
                                title={`Nota: ${s.notes} (Clic para editar)`}
                              >
                                <FileText size={11} style={{ flexShrink: 0 }} />
                                <span>{s.notes}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          {renderStatusCell(s)}
                        </td>
                        <td>
                          <span className={`payment-method-pill ${s.payment_method === 'transfer' ? 'payment-method--transfer' : 'payment-method--card'}`}>
                            {s.payment_method === 'transfer' ? (
                              <>
                                <Building size={12} />
                                <span>Transferencia</span>
                              </>
                            ) : s.payment_method === 'card' ? (
                              <>
                                <CreditCard size={12} />
                                <span>Tarjeta</span>
                              </>
                            ) : (
                              <span>{s.payment_method || 'Manual'}</span>
                            )}
                          </span>
                        </td>
                        <td>
                          {s.starts_at && s.ends_at ? (
                            <div className="vigencia-stack">
                              <div className="vigencia-range">
                                <span>{new Date(s.starts_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span>
                                <span className="vigencia-arrow">→</span>
                                <span className="vigencia-end">{new Date(s.ends_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              </div>
                              {(() => {
                                const isExp = isSubscriptionExpired(s);
                                const isSoon = isSubscriptionExpiringSoon(s);
                                const days = getDaysRemainingNumber(s.ends_at);
                                if (isExp) {
                                  return (
                                    <span className="vigencia-tag vigencia-tag--expired">
                                      <XCircle size={11} /> {days !== null && days < 0 ? (Math.abs(days) === 1 ? 'Expiró ayer' : `Expiró hace ${Math.abs(days)} días`) : 'Expirada'}
                                    </span>
                                  );
                                }
                                if (isSoon) {
                                  return (
                                    <span className="vigencia-tag vigencia-tag--warning">
                                      <Clock size={11} /> {days === 0 ? '¡Vence hoy!' : (days === 1 ? '¡Queda 1 día!' : `Quedan ${days} días`)}
                                    </span>
                                  );
                                }
                                if (s.status === 'active') {
                                  return (
                                    <span className="vigencia-tag vigencia-tag--active">
                                      <CheckCircle2 size={11} /> {days !== null ? `${days} días restantes` : 'Activa'}
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          ) : (
                            <div className="vigencia-stack">
                              <span className="vigencia-no-active">Sin vigencia asignada</span>
                              <span className="vigencia-created">Creada: {s.created_at ? new Date(s.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : '—'}</span>
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="table-actions-container">
                            {/* WhatsApp Direct Action Button */}
                            {getSubscriptionExpirationState(s).eligible && (
                              <button
                                type="button"
                                className="btn-action-quick btn-action-whatsapp"
                                onClick={() => handleOpenWhatsAppReminder(s)}
                                title="Enviar recordatorio por WhatsApp"
                              >
                                <MessageCircle size={14} />
                                <span>WhatsApp</span>
                              </button>
                            )}

                            {/* View Receipt Button */}
                            {getReceiptUrl(s) && (
                              <button
                                type="button"
                                className="btn-action-icon btn-eye-action"
                                onClick={() => handleOpenReceiptModal(s)}
                                title="Ver comprobante de pago"
                              >
                                <Eye size={15} />
                              </button>
                            )}

                            {/* Actions Dropdown */}
                            <div className="actions-dropdown-wrapper">
                              <button
                                type="button"
                                className={`actions-dropdown-trigger ${activeDropdown === s.id ? 'active' : ''}`}
                                onClick={() => setActiveDropdown(activeDropdown === s.id ? null : s.id)}
                                title="Más opciones"
                                disabled={actionLoading === s.id + '_approve' || actionLoading === s.id + '_reject' || actionLoading === s.id + '_renew' || actionLoading === s.id + '_delete'}
                              >
                                {actionLoading === s.id + '_approve' || actionLoading === s.id + '_reject' || actionLoading === s.id + '_renew' || actionLoading === s.id + '_delete' ? (
                                  <Loader2 className="spin" size={15} />
                                ) : (
                                  <MoreVertical size={16} />
                                )}
                              </button>
                              {activeDropdown === s.id && (
                                <div className={`actions-dropdown-menu ${isLastRows ? 'open-up' : ''}`}>
                                  {s.status === 'pending' ? (
                                    <>
                                      <button
                                        type="button"
                                        className="dropdown-item dropdown-item--approve"
                                        onClick={() => { setActiveDropdown(null); handleApprove(s.id); }}
                                      >
                                        <Check size={14} /> <span>Aprobar pago</span>
                                      </button>
                                      <button
                                        type="button"
                                        className="dropdown-item dropdown-item--danger"
                                        onClick={() => { setActiveDropdown(null); handleReject(s.id); }}
                                      >
                                        <X size={14} /> <span>Rechazar pago</span>
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      type="button"
                                      className="dropdown-item dropdown-item--renew"
                                      onClick={() => { setActiveDropdown(null); handleRenew(s.id); }}
                                    >
                                      <RefreshCw size={14} /> <span>Renovar membresía</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    className="dropdown-item"
                                    onClick={() => {
                                      setActiveDropdown(null);
                                      setEditClientModal({
                                        sub: s,
                                        name: s.user?.name || s.billing_name || '',
                                        phone: s.user?.phone || s.billing_phone || '',
                                        email: s.user?.email || s.billing_email || '',
                                        notes: s.notes || '',
                                        saving: false
                                      });
                                    }}
                                  >
                                    <User size={14} /> <span>Detalles del cliente</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="dropdown-item"
                                    onClick={() => { setActiveDropdown(null); setNoteModal({ sub: s, note: s.notes || '', saving: false }); }}
                                  >
                                    <FileText size={14} /> <span>{s.notes ? 'Editar nota' : 'Añadir nota'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="dropdown-item dropdown-item--danger"
                                    onClick={() => { setActiveDropdown(null); handleDelete(s); }}
                                  >
                                    <Trash2 size={14} /> <span>Eliminar registro</span>
                                  </button>
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
                              {(() => {
                                const expState = getSubscriptionExpirationState(s);
                                if (!expState.eligible) return null;
                                return (
                                  <button
                                    type="button"
                                    className="actions-dropdown-item"
                                    onClick={() => {
                                      handleOpenWhatsAppReminder(s);
                                      setActiveDropdown(null);
                                    }}
                                  >
                                    <MessageCircle size={14} style={{ color: expState.isExpired ? '#dc2626' : '#25D366' }} />
                                    <span style={{ color: expState.isExpired ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
                                      {expState.label}
                                    </span>
                                  </button>
                                );
                              })()}
                              <button
                                type="button"
                                className="actions-dropdown-item"
                                onClick={() => {
                                  handleOpenEditClient(s);
                                  setActiveDropdown(null);
                                }}
                              >
                                <User size={14} style={{ color: 'var(--primary)' }} />
                                <span>Editar datos del cliente</span>
                              </button>
                              <button
                                type="button"
                                className="actions-dropdown-item"
                                onClick={() => {
                                  setNoteModal({ sub: s, note: s.notes || '', saving: false });
                                  setActiveDropdown(null);
                                }}
                              >
                                <FileText size={14} style={{ color: '#d97706' }} />
                                <span>{s.notes ? 'Editar nota' : 'Agregar nota'}</span>
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

                    {s.notes && (
                      <div className="sub-mobile-card-row" style={{ alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => setNoteModal({ sub: s, note: s.notes || '', saving: false })}>
                        <span className="sub-mobile-card-label" style={{ marginTop: '2px', color: '#b45309' }}>
                          <FileText size={13} style={{ opacity: 0.9, color: '#d97706' }} />
                          <span>Nota</span>
                        </span>
                        <span className="sub-mobile-card-val" style={{ color: '#b45309', fontStyle: 'italic', fontSize: '12px', textAlign: 'right' }}>
                          {s.notes}
                        </span>
                      </div>
                    )}

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
                            {(() => {
                              const isExp = isSubscriptionExpired(s);
                              const isSoon = isSubscriptionExpiringSoon(s);
                              const days = getDaysRemainingNumber(s.ends_at);
                              if (isExp) {
                                return (
                                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#dc2626', marginTop: '3px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    <XCircle size={12} /> {days !== null && days < 0 ? (Math.abs(days) === 1 ? 'Expiró ayer' : `Expiró hace ${Math.abs(days)} días`) : 'Expirada'}
                                  </span>
                                );
                              }
                              if (isSoon) {
                                return (
                                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#d97706', marginTop: '3px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    <Clock size={12} /> {days === 0 ? '¡Vence hoy!' : (days === 1 ? '¡Queda 1 día!' : `Quedan ${days} días`)}
                                  </span>
                                );
                              }
                              if (s.status === 'active') {
                                return (
                                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', marginTop: '3px' }}>
                                    {days !== null ? `${days} días restantes` : ''}
                                  </span>
                                );
                              }
                              return null;
                            })()}
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
                          const clientName = receiptModal.billing_name || receiptModal.user?.name || 'Cliente';
                          const planName = receiptModal.plan?.name || 'Membresía Gym';
                          const planPrice = receiptModal.plan?.price ? `$${Number(receiptModal.plan.price).toFixed(2)}` : '';

                          const message = `¡Hola ${clientName}! 👋 Gracias por elegir Gigafit Gim.

Hemos recibido tu solicitud de membresía:
⭐ *Plan:* ${planName} ${planPrice ? `(${planPrice})` : ''}

Estamos validando tu comprobante de pago para activar tu membresía de inmediato. ¡Nos vemos pronto en el gimnasio para entrenar! 💪🔥`;

                          let formattedPhone = clientPhone.replace(/\s+/g, '').replace(/[+\-]/g, '');
                          if (formattedPhone.startsWith('0')) {
                            formattedPhone = '593' + formattedPhone.substring(1);
                          } else if (!formattedPhone.startsWith('593') && formattedPhone.length === 9) {
                            formattedPhone = '593' + formattedPhone;
                          }
                          window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '20px',
                          padding: '6px 14px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 8px rgba(37, 211, 102, 0.3)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.197 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c-.001 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        <span>WhatsApp</span>
                      </button>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Cliente (Cuenta)</span>
                      <span className="info-value">{receiptModal.user?.name || '—'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Nombre Facturación</span>
                      <span className="info-value">{receiptModal.billing_name || '—'}</span>
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
                <div key={n} className={`delete-step-dot ${deleteModal.step >= n ? 'active' : ''} ${deleteModal.step > n ? 'done' : ''}`} />
              ))}
            </div>

            {/* ── STEP 1: Resumen de lo que se va a eliminar ── */}
            {deleteModal.step === 1 && (
              <>
                <div className="delete-modal-icon">
                  <Trash2 size={32} />
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
                  <AlertTriangle size={16} />
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
                  <AlertTriangle size={32} />
                </div>
                <h3 className="delete-modal-title">¿Estás completamente seguro?</h3>
                <p className="delete-modal-subtitle">Esta operación <strong>no tiene vuelta atrás</strong>. El historial de esta suscripción desaparecerá del sistema.</p>

                {/* Warning 2 */}
                <div className="delete-warning-box delete-warning-box--orange">
                  <AlertCircle size={16} />
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
                  <ShieldAlert size={32} />
                </div>
                <h3 className="delete-modal-title" style={{ color: '#dc2626' }}>Última oportunidad</h3>
                <p className="delete-modal-subtitle">Al presionar <strong>"Sí, eliminar ahora"</strong> el registro será borrado de forma permanente e irreversible del servidor.</p>

                {/* Final warning */}
                <div className="delete-warning-box delete-warning-box--red" style={{ marginBottom: 20 }}>
                  <AlertTriangle size={16} />
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
                      ? <><Loader2 size={14} className="spin" /> Eliminando...</>
                      : <><Trash2 size={14} /> Sí, eliminar ahora</>
                    }
                  </button>
                </div>
              </>
            )}

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
                    const expState = getSubscriptionExpirationState(whatsappModal.sub);
                    if (expState.isExpired) {
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
                        {expState.diffDays === 0 ? 'Vence Hoy' : `Vence en ${expState.diffDays} días`}
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

      {/* MODAL: NOTA ADMINISTRATIVA / OBSERVACIONES */}
      {noteModal && (
        <div className="modal-overlay" onClick={() => setNoteModal(null)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: 'rgba(245, 158, 11, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#d97706'
                }}>
                  <FileText size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Nota Administrativa</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                    {noteModal.sub?.user?.name || noteModal.sub?.billing_name || 'Cliente'} — {noteModal.sub?.plan?.name || 'Membresía'}
                  </p>
                </div>
              </div>
              <button className="btn btn--ghost" style={{ padding: 6, borderRadius: '50%' }} onClick={() => setNoteModal(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6, display: 'block' }}>
                Observaciones / Control de Abono
              </label>
              <textarea
                value={noteModal.note}
                onChange={e => setNoteModal(prev => ({ ...prev, note: e.target.value }))}
                placeholder="Ej. Abonó $10 en efectivo de $25. Saldo pendiente $15 a pagar el viernes."
                rows={4}
                style={{
                  fontFamily: 'inherit',
                  fontSize: 13,
                  lineHeight: 1.5,
                  resize: 'vertical',
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
                autoFocus
              />
              <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4, display: 'block' }}>
                💡 Deja el campo vacío si el cliente ya canceló todo y deseas borrar la nota.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setNoteModal(null)}
                disabled={noteModal.saving}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleSaveNote}
                disabled={noteModal.saving}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {noteModal.saving ? (
                  <>
                    <Loader2 className="spin" size={15} />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Check size={15} />
                    <span>Guardar Nota</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR DATOS DEL CLIENTE */}
      {editClientModal && (
        <div className="modal-overlay" onClick={() => setEditClientModal(null)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: 'rgba(37, 99, 235, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)'
                }}>
                  <User size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Editar Datos del Cliente</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                    Membresía #{editClientModal.sub?.id} — {editClientModal.sub?.plan?.name || 'Plan'}
                  </p>
                </div>
              </div>
              <button className="btn btn--ghost" style={{ padding: 6, borderRadius: '50%' }} onClick={() => setEditClientModal(null)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveClientDetails}>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <User size={13} style={{ color: 'var(--text-secondary)' }} />
                  <span>Nombre Completo *</span>
                </label>
                <input
                  type="text"
                  value={editClientModal.name}
                  onChange={e => setEditClientModal(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej. Juan Pérez"
                  required
                  style={{ fontSize: 13 }}
                />
              </div>

              <div className="form-grid-2" style={{ marginBottom: 12 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Phone size={13} style={{ color: 'var(--text-secondary)' }} />
                    <span>Teléfono / WhatsApp</span>
                  </label>
                  <input
                    type="text"
                    value={editClientModal.phone}
                    onChange={e => setEditClientModal(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Ej. 0987654321"
                    style={{ fontSize: 13 }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Mail size={13} style={{ color: 'var(--text-secondary)' }} />
                    <span>Correo Electrónico</span>
                  </label>
                  <input
                    type="email"
                    value={editClientModal.email}
                    onChange={e => setEditClientModal(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="cliente@ejemplo.com"
                    style={{ fontSize: 13 }}
                  />
                </div>
              </div>

              {/* Plan de Suscripción (Opcional si se desea cambiar) */}
              {plans.length > 0 && (
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Layers size={13} style={{ color: 'var(--primary)' }} />
                    <span>Plan de Suscripción</span>
                  </label>
                  <select
                    value={editClientModal.subscription_plan_id || ''}
                    onChange={e => {
                      const newPlanId = e.target.value;
                      const selPlan = plans.find(p => String(p.id) === String(newPlanId));
                      setEditClientModal(prev => {
                        let newEnd = prev.ends_at;
                        if (prev.starts_at && selPlan) {
                          newEnd = calculateDefaultEndDate(prev.starts_at, newPlanId, plans);
                        }
                        return {
                          ...prev,
                          subscription_plan_id: newPlanId,
                          ends_at: newEnd
                        };
                      });
                    }}
                    style={{ fontSize: 13 }}
                  >
                    <option value="">Mantener plan actual ({editClientModal.sub?.plan?.name || 'Plan'})</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - ${Number(p.price).toFixed(2)}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Fechas de vigencia de la membresía */}
              <div style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '12px 14px',
                marginBottom: 14
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={14} style={{ color: 'var(--primary)' }} />
                    <span>Fechas de la Membresía</span>
                  </span>
                  {(() => {
                    if (!editClientModal.starts_at || !editClientModal.ends_at) return null;
                    const d1 = new Date(editClientModal.starts_at + 'T00:00:00');
                    const d2 = new Date(editClientModal.ends_at + 'T00:00:00');
                    const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
                    if (diffDays < 0) return <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>⚠️ Fecha inválida</span>;
                    return (
                      <span style={{ fontSize: 11.5, color: 'var(--primary)', fontWeight: 600, background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', padding: '2px 8px', borderRadius: 6 }}>
                        {diffDays} días de vigencia
                      </span>
                    );
                  })()}
                </div>

                <div className="form-grid-2" style={{ marginBottom: 10 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                      Fecha de Inicio *
                    </label>
                    <input
                      type="date"
                      value={editClientModal.starts_at || ''}
                      onChange={e => handleEditClientStartDateChange(e.target.value)}
                      required
                      style={{ fontSize: 12.5, padding: '7px 10px', width: '100%', borderRadius: 7 }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                      Fecha de Vencimiento *
                    </label>
                    <input
                      type="date"
                      value={editClientModal.ends_at || ''}
                      min={editClientModal.starts_at || undefined}
                      onChange={e => setEditClientModal(prev => ({ ...prev, ends_at: e.target.value }))}
                      required
                      style={{ fontSize: 12.5, padding: '7px 10px', width: '100%', borderRadius: 7 }}
                    />
                  </div>
                </div>

                {/* Accesos rápidos de duración */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginRight: 2 }}>Ajustar fin a:</span>
                  {[
                    { label: '15 días', days: 15 },
                    { label: '1 mes (30d)', days: 30 },
                    { label: '2 meses', days: 60 },
                    { label: '3 meses', days: 90 },
                    { label: '6 meses', days: 180 },
                    { label: '1 año', days: 365 }
                  ].map(preset => (
                    <button
                      key={preset.days}
                      type="button"
                      onClick={() => handleEditModalDatePreset(preset.days)}
                      style={{
                        padding: '3px 8px',
                        fontSize: 11,
                        borderRadius: 6,
                        border: '1px solid var(--border)',
                        background: 'var(--card)',
                        color: 'var(--text)',
                        cursor: 'pointer',
                        fontWeight: 500,
                        transition: 'all 0.15s ease'
                      }}
                      title={`Fijar vencimiento a ${preset.label} desde la fecha de inicio`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <FileText size={13} style={{ color: '#d97706' }} />
                  <span>Notas / Observaciones de Pago</span>
                </label>
                <textarea
                  value={editClientModal.notes}
                  onChange={e => setEditClientModal(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Ej. Abonó $10 en efectivo. Saldo $15."
                  rows={3}
                  style={{
                    fontFamily: 'inherit',
                    fontSize: 12.5,
                    lineHeight: 1.4,
                    resize: 'vertical',
                    padding: 10,
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setEditClientModal(null)}
                  disabled={editClientModal.saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={editClientModal.saving || !editClientModal.name.trim()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  {editClientModal.saving ? (
                    <>
                      <Loader2 className="spin" size={15} />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Check size={15} />
                      <span>Guardar Datos</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
