import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, 
  CreditCard, 
  ShoppingBag, 
  Tags, 
  Users, 
  FolderOpen, 
  Package, 
  Image, 
  TrendingUp, 
  Settings,
  LogOut,
  Bell,
  Sun,
  Moon,
  ChevronRight,
  Dumbbell,
  Menu,
  Landmark
} from 'lucide-react';
import './Layout.css';
import { apiFetch } from '../api/client';

// Navigation groups for the sidebar
const navGroups = [
  {
    title: 'Principal',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/reportes', icon: TrendingUp, label: 'Reportes' },
    ]
  },
  {
    title: 'Catálogo',
    items: [
      { to: '/productos', icon: Package, label: 'Productos' },
      { to: '/planes', icon: Tags, label: 'Planes' },
      { to: '/banners', icon: Image, label: 'Banners' },
    ]
  },
  {
    title: 'Ventas',
    items: [
      { to: '/pedidos', icon: ShoppingBag, label: 'Pedidos' },
      { to: '/suscripciones', icon: CreditCard, label: 'Suscripciones' },
    ]
  },
  {
    title: 'Sistema',
    items: [
      { to: '/usuarios', icon: Users, label: 'Usuarios' },
      { to: '/bancos', icon: Landmark, label: 'Cuentas Bancarias' },
      { to: '/ajustes', icon: Settings, label: 'Ajustes' },
    ]
  }
];

// Flatten helper for general queries
const allNavItems = navGroups.flatMap(group => group.items);

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isTabletExpanded, setIsTabletExpanded] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationPopoverRef = useRef(null);

  const currentItem = allNavItems.find(n => n.to === location.pathname);
  const pageTitle = currentItem?.label || 'Panel';

  const loadNotifications = useCallback(async () => {
    try {
      const data = await apiFetch('/notifications');
      const next = Array.isArray(data) ? data : [];
      setNotifications(next);
      setUnreadCount(next.filter(notification => !notification.read_at).length);
    } catch (error) {
      console.error('No se pudieron cargar las notificaciones:', error);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000);
    const handleWindowFocus = () => loadNotifications();
    window.addEventListener('focus', handleWindowFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [loadNotifications]);

  useEffect(() => {
    setNotificationsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!notificationsOpen) return;

    const handleOutsideClick = (event) => {
      if (!notificationPopoverRef.current?.contains(event.target) &&
          !event.target.closest('.admin-notification-button')) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [notificationsOpen]);

  const markNotificationAsRead = async (id) => {
    const notification = notifications.find(item => item.id === id);
    if (!notification || notification.read_at) return;

    const readAt = new Date().toISOString();
    setNotifications(current => current.map(item =>
      item.id === id ? { ...item, read_at: readAt } : item
    ));
    setUnreadCount(current => Math.max(0, current - 1));

    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'POST', body: JSON.stringify({}) });
    } catch (error) {
      setNotifications(current => current.map(item =>
        item.id === id ? { ...item, read_at: null } : item
      ));
      setUnreadCount(current => current + 1);
      console.error('No se pudo marcar la notificación:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    const readAt = new Date().toISOString();
    setNotifications(current => current.map(notification => ({
      ...notification,
      read_at: notification.read_at || readAt,
    })));
    setUnreadCount(0);

    try {
      await apiFetch('/notifications/read-all', { method: 'POST', body: JSON.stringify({}) });
    } catch (error) {
      console.error('No se pudieron marcar las notificaciones:', error);
      loadNotifications();
    }
  };

  const getNotificationPresentation = (notification) => {
    if (notification.type === 'subscription_request') {
      return { icon: '💳', color: '#8b5cf6' };
    }
    if (notification.type === 'order_request') {
      return { icon: '🛍️', color: '#10b981' };
    }
    if (notification.type?.includes('subscription')) {
      return { icon: '📋', color: '#8b5cf6' };
    }
    return { icon: '🔔', color: '#f59e0b' };
  };

  const handleMenuToggle = () => {
    if (window.innerWidth < 768) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsTabletExpanded(!isTabletExpanded);
    }
  };

  const handleNavItemClick = () => {
    if (window.innerWidth < 768) {
      setIsMobileOpen(false);
    }
  };

  return (
    <div className="layout">
      {/* Sidebar Overlay for Mobile Drawer */}
      <div 
        className={`sidebar-overlay ${isMobileOpen ? 'sidebar-overlay--open' : ''}`} 
        onClick={() => setIsMobileOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside className={`sidebar ${isTabletExpanded ? 'sidebar--expanded' : ''} ${isMobileOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">
            <Dumbbell size={24} />
          </span>
          <div>
            <div className="sidebar-brand">GigaFit Gim</div>
            <div className="sidebar-role">Panel Admin</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navGroups.map(group => (
            <div key={group.title} className="sidebar-group">
              <div className="sidebar-group-title">{group.title}</div>
              {group.items.map(item => {
                const IconComponent = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}
                    onClick={handleNavItemClick}
                  >
                    <span className="nav-icon">
                      <IconComponent size={18} />
                    </span>
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name || 'Admin'}</div>
              <div className="sidebar-user-role">{user?.role || 'Administrador'}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={logout} title="Cerrar sesión">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="main">
        <header className="topbar">
          <div className="topbar-left" style={{ flexDirection: 'row', alignItems: 'center' }}>
            <button 
              className="topbar-menu-btn" 
              onClick={handleMenuToggle} 
              title="Menú lateral"
            >
              <Menu size={20} />
            </button>
            <div>
              <div className="topbar-breadcrumb">
                <span>GigaFit Gim</span>
                <ChevronRight size={12} className="topbar-breadcrumb-sep" />
                <span>Administración</span>
              </div>
              <h1 className="topbar-title">{pageTitle}</h1>
            </div>
          </div>
          <div className="topbar-right">
            {/* Theme Toggle Button */}
            <button 
              className="topbar-action-btn" 
              onClick={toggleTheme} 
              title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notification Bell */}
            <button
              className="topbar-action-btn admin-notification-button"
              title="Notificaciones"
              onClick={() => {
                setNotificationsOpen(current => !current);
                if (!notificationsOpen) loadNotifications();
              }}
            >
              <Bell size={18} />
              {unreadCount > 0 && <span className="admin-notification-count">{unreadCount > 99 ? '99+' : unreadCount}</span>}
            </button>

            {notificationsOpen && (
              <div ref={notificationPopoverRef} className="admin-notification-popover">
                <div className="admin-notification-header">
                  <div>
                    <strong>Notificaciones</strong>
                    <span>Solicitudes y actividad reciente</span>
                  </div>
                  {unreadCount > 0 && (
                    <button type="button" onClick={markAllNotificationsAsRead}>
                      Marcar todas
                    </button>
                  )}
                </div>
                <div className="admin-notification-list">
                  {notifications.length === 0 ? (
                    <div className="admin-notification-empty">
                      <Bell size={24} />
                      <span>No tienes notificaciones</span>
                    </div>
                  ) : notifications.map(notification => {
                    const presentation = getNotificationPresentation(notification);
                    return (
                      <div
                        key={notification.id}
                        className={`admin-notification-item ${notification.read_at ? 'admin-notification-item--read' : ''}`}
                        style={{ '--notification-accent': presentation.color }}
                      >
                        <div className="admin-notification-icon">{presentation.icon}</div>
                        <div className="admin-notification-content">
                          <div className="admin-notification-title-row">
                            <strong>{notification.title}</strong>
                            {!notification.read_at && <span>NUEVA</span>}
                          </div>
                          <p>{notification.message}</p>
                          <small>{notification.created_at ? new Date(notification.created_at).toLocaleString('es-MX') : ''}</small>
                          {!notification.read_at && (
                            <button type="button" onClick={() => markNotificationAsRead(notification.id)}>
                              Marcar como vista
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="topbar-divider"></div>

            {/* Admin Avatar & Email */}
            <div className="topbar-profile">
              <span className="topbar-profile-name">{user?.name || 'Admin'}</span>
              <div className="topbar-profile-avatar">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </header>
        <main className="content">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
