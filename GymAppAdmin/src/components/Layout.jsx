import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const navItems = [
  { to: '/', icon: '📊', label: 'Dashboard' },
  { to: '/suscripciones', icon: '💳', label: 'Suscripciones' },
  { to: '/pedidos', icon: '🛍️', label: 'Pedidos' },
  { to: '/planes', icon: '🏷️', label: 'Planes' },
  { to: '/usuarios', icon: '👥', label: 'Usuarios' },
  { to: '/categorias', icon: '📂', label: 'Categorías' },
  { to: '/productos', icon: '📦', label: 'Productos' },
  { to: '/banners', icon: '🖼️', label: 'Banners' },
  { to: '/reportes', icon: '📈', label: 'Reportes' },
  { to: '/ajustes', icon: '⚙️', label: 'Ajustes' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const pageTitle = navItems.find(n => n.to === location.pathname)?.label || 'Panel';

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">🏋️</span>
          <div>
            <div className="sidebar-brand">GimApp</div>
            <div className="sidebar-role">Panel Admin</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name || 'Admin'}</div>
              <div className="sidebar-user-role">{user?.role}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={logout} title="Cerrar sesión">
            🚪
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="main">
        <header className="topbar">
          <h1 className="topbar-title">{pageTitle}</h1>
          <div className="topbar-right">
            <span className="topbar-email">{user?.email}</span>
          </div>
        </header>
        <main className="content">
          {children}
        </main>
      </div>
    </div>
  );
}


