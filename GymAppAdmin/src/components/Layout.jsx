import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  Menu
} from 'lucide-react';
import './Layout.css';

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
    title: 'Ventas',
    items: [
      { to: '/suscripciones', icon: CreditCard, label: 'Suscripciones' },
      { to: '/pedidos', icon: ShoppingBag, label: 'Pedidos' },
      { to: '/planes', icon: Tags, label: 'Planes' },
    ]
  },
  {
    title: 'Catálogo',
    items: [
      { to: '/usuarios', icon: Users, label: 'Usuarios' },
      { to: '/categorias', icon: FolderOpen, label: 'Categorías' },
      { to: '/productos', icon: Package, label: 'Productos' },
      { to: '/banners', icon: Image, label: 'Banners' },
    ]
  },
  {
    title: 'Sistema',
    items: [
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

  const currentItem = allNavItems.find(n => n.to === location.pathname);
  const pageTitle = currentItem?.label || 'Panel';

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
            <div className="sidebar-brand">GimApp</div>
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
                <span>GimApp</span>
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
            <button className="topbar-action-btn" title="Notificaciones">
              <Bell size={18} />
            </button>

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
          {children}
        </main>
      </div>
    </div>
  );
}
