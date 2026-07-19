import { useState, useEffect } from 'react';
import { apiFetch } from '../api/client';
import { Landmark, CheckCircle, AlertTriangle, RefreshCw, Save, CreditCard, User, FileText, Check } from 'lucide-react';
import '../components/Layout.css';

export default function Banks() {
  const [banks, setBanks] = useState([
    { name: 'Pichincha', accountType: 'Ahorros', account: '', holder: '', cedula: '' },
    { name: 'Produbanco', accountType: 'Ahorros', account: '', holder: '', cedula: '' },
    { name: 'Guayaquil', accountType: 'Ahorros', account: '', holder: '', cedula: '' }
  ]);

  const [activeTab, setActiveTab] = useState(0); // 0: Pichincha, 1: Produbanco, 2: Guayaquil
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Brand config for interactive card preview
  const bankBrands = [
    {
      name: 'Pichincha',
      color: '#FBBF24',
      gradient: ['#FACC15', '#1F1E1A'], // Soft yellow fading to warm dark charcoal
      textColor: '#FFFFFF',
      accentColor: '#FBBF24',
      badgeBg: 'rgba(251, 191, 36, 0.08)',
      border: 'rgba(251, 191, 36, 0.15)',
      glow: 'rgba(251, 191, 36, 0.12)',
      chipGradient: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
      chipLine: 'rgba(0, 0, 0, 0.12)'
    },
    {
      name: 'Produbanco',
      color: '#10B981',
      gradient: ['#10B981', '#111827'], // Emerald green fading to dark charcoal
      textColor: '#FFFFFF',
      accentColor: '#10B981',
      badgeBg: 'rgba(16, 185, 129, 0.08)',
      border: 'rgba(16, 185, 129, 0.15)',
      glow: 'rgba(26, 107, 60, 0.12)',
      chipGradient: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
      chipLine: 'rgba(0, 0, 0, 0.12)'
    },
    {
      name: 'Guayaquil',
      color: '#EC4899',
      gradient: ['#EC4899', '#111827'], // Soft magenta/rose fading to dark charcoal
      textColor: '#FFFFFF',
      accentColor: '#EC4899',
      badgeBg: 'rgba(236, 72, 153, 0.08)',
      border: 'rgba(236, 72, 153, 0.15)',
      glow: 'rgba(204, 0, 102, 0.12)',
      chipGradient: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
      chipLine: 'rgba(0, 0, 0, 0.12)'
    }
  ];

  useEffect(() => {
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

  const handleChange = (field, value) => {
    const newBanks = [...banks];
    newBanks[activeTab][field] = value;
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

  const currentBank = banks[activeTab];
  const brand = bankBrands[activeTab];

  return (
    <div style={{ maxWidth: 900, padding: '8px 4px' }}>
      <div className="page-header" style={{ marginBottom: 28 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>Cuentas Bancarias</h2>
          <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
            Configura las cuentas de depósito para activar las suscripciones de los usuarios.
          </p>
        </div>
      </div>

      {success && (
        <div className="alert alert--success" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="alert alert--error" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="loading-state" style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', padding: '60px 0' }}>
          <RefreshCw className="spin" size={24} />
          <span>Cargando configuración bancaria...</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Navigation Tabs */}
          <div style={{
            display: 'flex',
            background: 'var(--card)',
            padding: '6px',
            borderRadius: '14px',
            border: '1px solid var(--border)',
            gap: 6
          }}>
            {bankBrands.map((b, idx) => {
              const isActive = activeTab === idx;
              return (
                  <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveTab(idx)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: isActive ? 'var(--bg)' : 'transparent',
                    color: isActive ? 'var(--text)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  <Landmark size={16} color={isActive ? b.color : 'var(--text-secondary)'} />
                  Banco {b.name}
                </button>
              );
            })}
          </div>

          {/* Main Interactive Container: Split Layout (Card Preview + Form) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 28,
            alignItems: 'start'
          }}>

            {/* Left: Dynamic Premium Card Preview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Vista Previa de Transferencia
              </div>

              <div style={{
                background: `linear-gradient(135deg, ${brand.gradient[0]} 0%, ${brand.gradient[1]} 100%)`,
                borderRadius: '24px',
                padding: '28px',
                height: '220px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: `0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04), inset 0 0 40px rgba(255,255,255,0.03), 0 0 30px ${brand.color}18`,
                border: '1px solid rgba(255,255,255,0.08)',
                overflow: 'hidden'
              }}>
                {/* Background glow effects */}
                <div style={{
                  position: 'absolute',
                  top: '-50px',
                  right: '-50px',
                  width: '150px',
                  height: '150px',
                  borderRadius: '50%',
                  backgroundColor: brand.color,
                  opacity: 0.15,
                  filter: 'blur(40px)',
                  pointerEvents: 'none'
                }} />

                {/* Card Top */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Landmark size={22} color={brand.textColor} style={{ opacity: 0.8 }} />
                    <span style={{ fontSize: '15px', fontWeight: 800, color: brand.textColor, letterSpacing: '0.5px' }}>
                      Banco {brand.name}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: brand.textColor,
                    backgroundColor: brand.badgeBg,
                    border: `1px solid ${brand.border}`,
                    padding: '4px 10px',
                    borderRadius: '20px',
                    letterSpacing: '0.5px'
                  }}>
                    {currentBank.accountType || 'Ahorros'}
                  </span>
                </div>

                {/* Chip decoration & Sim card shape */}
                <div style={{
                  width: '36px',
                  height: '28px',
                  borderRadius: '6px',
                  background: brand.chipGradient,
                  opacity: 0.85,
                  margin: '12px 0 6px 0',
                  boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15)',
                  position: 'relative'
                }}>
                  <div style={{ position: 'absolute', width: '100%', height: '1px', backgroundColor: brand.chipLine, top: '9px' }} />
                  <div style={{ position: 'absolute', width: '100%', height: '1px', backgroundColor: brand.chipLine, top: '18px' }} />
                  <div style={{ position: 'absolute', height: '100%', width: '1px', backgroundColor: brand.chipLine, left: '12px' }} />
                  <div style={{ position: 'absolute', height: '100%', width: '1px', backgroundColor: brand.chipLine, left: '24px' }} />
                </div>

                {/* Card Number (Account number formatted) */}
                <div>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: brand.textColor,
                    fontFamily: 'monospace',
                    letterSpacing: '2px',
                    margin: '4px 0'
                  }}>
                    {currentBank.account || '•••• •••• ••••'}
                  </div>

                  {/* Card Bottom: Holder & CI */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '10px' }}>
                    <div>
                      <div style={{ fontSize: '9px', textTransform: 'uppercase', color: brand.textColor, opacity: 0.5, letterSpacing: '0.5px' }}>
                        Titular
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: brand.textColor }}>
                        {currentBank.holder || 'Nombre del Titular'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '9px', textTransform: 'uppercase', color: brand.textColor, opacity: 0.5, letterSpacing: '0.5px' }}>
                        Identificación / RUC
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: brand.textColor, textAlign: 'right' }}>
                        {currentBank.cedula || '••••••••••'}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Right: Dynamic Edit Form */}
            <form onSubmit={handleSaveBank} style={{
              background: 'var(--card)',
              borderRadius: '20px',
              padding: '28px',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.01), 0 2px 4px -2px rgba(0, 0, 0, 0.01)'
            }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                Editar parámetros de {brand.name}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Form Group: Account Type */}
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Tipo de Cuenta
                  </label>
                  <select
                    value={currentBank.accountType}
                    onChange={e => handleChange('accountType', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--text)',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="Ahorros">Ahorros</option>
                    <option value="Corriente">Corriente</option>
                  </select>
                </div>

                {/* Form Group: Account Number */}
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Número de Cuenta
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <CreditCard size={16} style={{ position: 'absolute', left: 12, color: 'var(--text-secondary)' }} />
                    <input
                      type="text"
                      value={currentBank.account}
                      onChange={e => handleChange('account', e.target.value)}
                      placeholder="Ej. 2200123456"
                      style={{
                        width: '100%',
                        padding: '12px 12px 12px 38px',
                        fontSize: '14px',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg)',
                        color: 'var(--text)',
                        outline: 'none'
                      }}
                      required
                    />
                  </div>
                </div>

                {/* Form Group: Holder */}
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Titular de la Cuenta
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <User size={16} style={{ position: 'absolute', left: 12, color: 'var(--text-secondary)' }} />
                    <input
                      type="text"
                      value={currentBank.holder}
                      onChange={e => handleChange('holder', e.target.value)}
                      placeholder="Nombre completo"
                      style={{
                        width: '100%',
                        padding: '12px 12px 12px 38px',
                        fontSize: '14px',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg)',
                        color: 'var(--text)',
                        outline: 'none'
                      }}
                      required
                    />
                  </div>
                </div>

                {/* Form Group: Cédula / RUC */}
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Cédula / RUC
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <FileText size={16} style={{ position: 'absolute', left: 12, color: 'var(--text-secondary)' }} />
                    <input
                      type="text"
                      value={currentBank.cedula || ''}
                      onChange={e => handleChange('cedula', e.target.value)}
                      placeholder="Ej. 1712345678"
                      style={{
                        width: '100%',
                        padding: '12px 12px 12px 38px',
                        fontSize: '14px',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg)',
                        color: 'var(--text)',
                        outline: 'none'
                      }}
                      required
                    />
                  </div>
                </div>

              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button
                  type="submit"
                  className="btn btn--primary"
                  style={{
                    flex: 1,
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    borderRadius: '12px',
                    boxShadow: `0 4px 12px ${brand.color}25`
                  }}
                  disabled={saving}
                >
                  {saving && <RefreshCw className="spin" size={16} />}
                  Sincronizar con App Móvil
                </button>
              </div>
            </form>

          </div>

        </div>
      )}
    </div>
  );
}
