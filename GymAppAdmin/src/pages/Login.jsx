import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';
import './Login.css';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Completa todos los campos'); return; }
    setError('');
    setLoading(true);
    try {
      const data = await apiFetch('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const { user, token } = data;
      const allowed = ['admin', 'super_admin'];
      if (!allowed.includes(user?.role)) {
        setError('No tienes permisos de administrador');
        setLoading(false);
        return;
      }
      login(user, token);
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('401') || msg.includes('credentials') || msg.includes('Invalid')) {
        setError('Correo o contraseña incorrectos');
      } else if (msg.includes('fetch') || msg.includes('Network')) {
        setError('Sin conexión al servidor. Verifica que el backend esté corriendo.');
      } else {
        setError(err.message || 'Error al iniciar sesión');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-icon">🏋️</span>
          <h1 className="login-brand">GimApp</h1>
          <p className="login-subtitle">Panel de Administración</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="login-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="form-group">
            <label>Correo electrónico</label>
            <input
              type="email"
              placeholder="admin@fitness.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <div className="input-with-icon">
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button type="button" className="toggle-pass" onClick={() => setShowPass(v => !v)}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="login-footer">Solo para uso de administradores autorizados</p>
      </div>
    </div>
  );
}
