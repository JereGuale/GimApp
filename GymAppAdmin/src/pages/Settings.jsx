import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../api/client';
import '../components/Layout.css';

export default function Settings() {
  const { isDark, toggleTheme } = useTheme();
  
  // Bank accounts config
  const [banks, setBanks] = useState([
    { name: 'Pichincha', accountType: 'Ahorros', account: '', holder: '', cedula: '' },
    { name: 'Produbanco', accountType: 'Ahorros', account: '', holder: '', cedula: '' },
    { name: 'Guayaquil', accountType: 'Ahorros', account: '', holder: '', cedula: '' }
  ]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Cargar configuracion de bancos desde el servidor
    apiFetch('/admin/settings?scope=public')
      .then(settings => {
        const bankSetting = settings.find(s => s.key === 'bank_accounts');
        if (bankSetting && bankSetting.value) {
          try {
            const parsed = typeof bankSetting.value === 'string' ? JSON.parse(bankSetting.value) : bankSetting.value;
            if (Array.isArray(parsed) && parsed.length === 3) {
              setBanks(parsed);
            }
          } catch (e) {
            console.error('Error parsing bank config', e);
          }
        }
      })
      .catch(e => setError('Error al cargar configuración: ' + e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (index, field, value) => {
    const newBanks = [...banks];
    newBanks[index][field] = value;
    setBanks(newBanks);
  };

  const handleSaveBank = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      await apiFetch('/admin/settings', {
        method: 'POST',
        body: JSON.stringify({
          scope: 'public',
          key: 'bank_accounts',
          value: banks
        })
      });
      setSuccess('Configuración bancaria guardada y sincronizada con la app móvil');
      setTimeout(() => setSuccess(''), 4000);
    } catch (e) {
      setError('Error al guardar: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 800 }}>
      {success && <div className="alert alert--success">✅ {success}</div>}
      {error && <div className="alert alert--error">⚠️ {error}</div>}

      {/* Visual Settings Card */}
      <div className="card">
        <h3 style={{ margin: '0 0 16px', color: 'var(--text)', fontSize: 18 }}>Personalización</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
          Elige el modo de visualización preferido para el panel administrativo.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Modo de Color</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              {isDark ? 'Tema Oscuro Premium activado' : 'Tema Claro Limpio activado'}
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="btn btn--ghost"
            style={{ padding: '10px 20px', fontSize: 14, borderColor: 'var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {isDark ? '☀️ Cambiar a Claro' : '🌙 Cambiar a Oscuro'}
          </button>
        </div>
      </div>

      {/* Bank Details Settings Card */}
      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ margin: '0 0 8px', color: 'var(--text)', fontSize: 18 }}>Cuentas Bancarias</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
          Configura las cuentas bancarias donde los clientes deben depositar para activar sus suscripciones. 
          Al guardarlas aquí, se actualizarán automáticamente en la aplicación móvil.
        </p>

        {loading ? (
          <div className="loading-state">⏳ Cargando configuración...</div>
        ) : (
          <form onSubmit={handleSaveBank}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
              {banks.map((bank, index) => (
                <div key={index} style={{ background: 'var(--bg)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                    🏦 Banco {bank.name}
                  </h4>
                  
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12 }}>Tipo de Cuenta</label>
                    <select 
                      value={bank.accountType} 
                      onChange={e => handleChange(index, 'accountType', e.target.value)}
                      style={{ padding: 8, fontSize: 13 }}
                    >
                      <option value="Ahorros">Ahorros</option>
                      <option value="Corriente">Corriente</option>
                    </select>
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12 }}>Número de Cuenta</label>
                    <input
                      type="text"
                      value={bank.account}
                      onChange={e => handleChange(index, 'account', e.target.value)}
                      placeholder="Ej. 2200..."
                      style={{ padding: 8, fontSize: 13 }}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12 }}>Titular (Nombre)</label>
                    <input
                      type="text"
                      value={bank.holder}
                      onChange={e => handleChange(index, 'holder', e.target.value)}
                      placeholder="Ej. Juan Pérez"
                      style={{ padding: 8, fontSize: 13 }}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: 12 }}>Cédula / RUC</label>
                    <input
                      type="text"
                      value={bank.cedula || ''}
                      onChange={e => handleChange(index, 'cedula', e.target.value)}
                      placeholder="Ej. 0901234567"
                      style={{ padding: 8, fontSize: 13 }}
                      required
                    />
                  </div>
                </div>
              ))}
            </div>

            <button type="submit" className="btn btn--primary" style={{ marginTop: 24 }} disabled={saving}>
              {saving ? '⏳ Guardando...' : '💾 Sincronizar con Aplicación Móvil'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
