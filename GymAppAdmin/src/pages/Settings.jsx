import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../api/client';
import { MapPin, Search, Sparkles } from 'lucide-react';
import '../components/Layout.css';

export default function Settings() {
  const { isDark, toggleTheme } = useTheme();
  const [location, setLocation] = useState({
    name: 'Fitness Club Gym',
    address: 'Calle 15 y Av. 24, Barrio Córdoba, Manta, Ecuador',
    description: 'Fácil acceso, estacionamiento cercano y una zona segura para que entrenar sea parte natural de tu rutina.',
    maps_url: 'https://maps.google.com/?q=-0.9621,-80.7127'
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState('');

  useEffect(() => {
    async function fetchSettings() {
      setLoading(true);
      try {
        const data = await apiFetch('/settings/public');
        const loc = data.find(s => s.key === 'gym_location');
        if (loc && loc.value) {
          setLocation({
            name: loc.value.name || '',
            address: loc.value.address || '',
            description: loc.value.description || '',
            maps_url: loc.value.maps_url || ''
          });
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (loading) return;

    let map = null;
    let marker = null;

    const initMap = () => {
      if (!window.L) return;

      let initialLat = -0.9621;
      let initialLng = -80.7127;

      // Try to parse lat/lng from maps_url
      if (location.maps_url) {
        const match = location.maps_url.match(/query=(-?\d+\.\d+),(-?\d+\.\d+)/) || 
                      location.maps_url.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (match) {
          initialLat = parseFloat(match[1]);
          initialLng = parseFloat(match[2]);
        }
      }

      const container = document.getElementById('settings-map');
      if (!container) return;

      // Clean up previous map if active
      if (window.leafletMap) {
        window.leafletMap.remove();
      }

      map = window.L.map('settings-map').setView([initialLat, initialLng], 15);
      window.leafletMap = map;

      // Tile layer styling - use dark tiles if isDark
      const tileUrl = isDark 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      
      window.L.tileLayer(tileUrl, {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      // Create custom marker icon
      const customIcon = window.L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div style="background-color: #FB923C; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3);"><span style="width: 6px; height: 6px; background-color: white; border-radius: 50%;"></span></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      marker = window.L.marker([initialLat, initialLng], { icon: customIcon, draggable: true }).addTo(map);
      window.leafletMarker = marker;

      // Event: Drag end
      marker.on('dragend', async () => {
        const pos = marker.getLatLng();
        const lat = pos.lat.toFixed(6);
        const lng = pos.lng.toFixed(6);
        
        handleFieldChange('maps_url', `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
        
        // Reverse geocoding (Suggest address)
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          if (data && data.display_name) {
            const parts = data.display_name.split(',');
            const readableAddress = parts.slice(0, 3).join(',').trim();
            handleFieldChange('address', readableAddress);
          }
        } catch (e) {
          console.error(e);
        }
      });

      // Event: Map click
      map.on('click', async (e) => {
        const lat = e.latlng.lat.toFixed(6);
        const lng = e.latlng.lng.toFixed(6);
        marker.setLatLng([lat, lng]);
        
        handleFieldChange('maps_url', `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);

        // Suggest address
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          if (data && data.display_name) {
            const parts = data.display_name.split(',');
            const readableAddress = parts.slice(0, 3).join(',').trim();
            handleFieldChange('address', readableAddress);
          }
        } catch (err) {
          console.error(err);
        }
      });
    };

    // Load CDN CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load CDN JS
    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initMap;
      document.body.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      if (window.leafletMap) {
        window.leafletMap.remove();
        window.leafletMap = null;
      }
    };
  }, [loading, isDark]);

  const handleSearchOnMap = async () => {
    if (!location.address) return;
    setGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location.address)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const first = data[0];
        const lat = parseFloat(first.lat);
        const lon = parseFloat(first.lon);
        
        if (window.leafletMap && window.leafletMarker) {
          window.leafletMap.setView([lat, lon], 16);
          window.leafletMarker.setLatLng([lat, lon]);
          handleFieldChange('maps_url', `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`);
        }
      } else {
        alert('No se pudo encontrar esa dirección en el mapa. Intenta buscar especificando ciudad o calles de referencia.');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión al geolocalizar.');
    } finally {
      setGeocoding(false);
    }
  };

  const handleMapSearch = async () => {
    if (!mapSearchQuery.trim()) return;
    setGeocoding(true);
    try {
      // Restrict search bounds to Ecuador for maximum accuracy
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchQuery)}&countrycodes=ec&limit=5`);
      const data = await res.json();
      if (data && data.length > 0) {
        const first = data[0];
        const lat = parseFloat(first.lat);
        const lon = parseFloat(first.lon);
        
        if (window.leafletMap && window.leafletMarker) {
          window.leafletMap.setView([lat, lon], 16);
          window.leafletMarker.setLatLng([lat, lon]);
          handleFieldChange('maps_url', `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`);
          
          // Autofill address
          const parts = first.display_name.split(',');
          const readableAddress = parts.slice(0, 3).join(',').trim();
          handleFieldChange('address', readableAddress);
        }
      } else {
        alert('No se encontraron resultados para: ' + mapSearchQuery);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al buscar.');
    } finally {
      setGeocoding(false);
    }
  };

  const handleSaveLocation = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await apiFetch('/admin/settings', {
        method: 'POST',
        body: JSON.stringify({
          scope: 'public',
          key: 'gym_location',
          value: location
        })
      });
      setSuccess('¡Configuración de ubicación guardada y sincronizada con la app móvil!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setError('Error al guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const parseCoordinatesFromUrl = (url) => {
    // Matches @lat,lng (used in Google Maps URL paths)
    const geoMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (geoMatch) {
      return { lat: parseFloat(geoMatch[1]), lng: parseFloat(geoMatch[2]) };
    }
    // Matches q=lat,lng or query=lat,lng
    const queryMatch = url.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/) || url.match(/query=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (queryMatch) {
      return { lat: parseFloat(queryMatch[1]), lng: parseFloat(queryMatch[2]) };
    }
    return null;
  };

  const handleUrlChange = (url) => {
    handleFieldChange('maps_url', url);
    const coords = parseCoordinatesFromUrl(url);
    if (coords && window.leafletMap && window.leafletMarker) {
      window.leafletMap.setView([coords.lat, coords.lng], 16);
      window.leafletMarker.setLatLng([coords.lat, coords.lng]);
      
      // Auto-suggest address from coordinates
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.display_name) {
            const parts = data.display_name.split(',');
            const readableAddress = parts.slice(0, 3).join(',').trim();
            handleFieldChange('address', readableAddress);
          }
        })
        .catch(err => console.error(err));
    }
  };

  const handleFieldChange = (field, val) => {
    setLocation(prev => ({
      ...prev,
      [field]: val
    }));
  };

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div className="page-header" style={{ marginBottom: 4 }}>
        <h2>Configuraciones</h2>
        <p className="page-header__sub">Gestiona la apariencia y la información pública del gimnasio.</p>
      </div>

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

      {/* Location Settings Card */}
      <div className="card">
        <h3 style={{ margin: '0 0 16px', color: 'var(--text)', fontSize: 18 }}>Ubicación del Local</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
          Configura dónde se encuentra tu local. Puedes dar clic o arrastrar el marcador en el mapa interactivo para obtener las coordenadas y generar el enlace de Google Maps automáticamente.
        </p>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Cargando ubicación actual...</span>
          </div>
        ) : (
          <form onSubmit={handleSaveLocation} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {error && (
              <div style={{ padding: 12, backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444', borderRadius: 8, fontSize: 14 }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ padding: 12, backgroundColor: 'rgba(34,197,94,0.1)', color: '#22C55E', borderRadius: 8, fontSize: 14 }}>
                {success}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
              {/* Left Column: Form Inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Nombre del Gimnasio
                  </label>
                  <input
                    type="text"
                    required
                    value={location.name}
                    onChange={e => handleFieldChange('name', e.target.value)}
                    placeholder="Ej: Fitness Club Gym"
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--input-bg)',
                      color: 'var(--text)',
                      outline: 'none'
                    }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Dirección Completa
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      required
                      value={location.address}
                      onChange={e => handleFieldChange('address', e.target.value)}
                      placeholder="Ej: Calle 15 y Av. 24, Barrio Córdoba"
                      style={{
                        flex: 1,
                        padding: '12px',
                        fontSize: '14px',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--input-bg)',
                        color: 'var(--text)',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleSearchOnMap}
                      disabled={geocoding}
                      className="btn btn--ghost"
                      style={{
                        padding: '0 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        borderRadius: '10px',
                        borderColor: 'var(--border)',
                        color: 'var(--text)'
                      }}
                      title="Geolocalizar en el mapa"
                    >
                      <Search size={16} />
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{geocoding ? 'Buscando...' : 'Ubicar'}</span>
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Descripción
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={location.description}
                    onChange={e => handleFieldChange('description', e.target.value)}
                    placeholder="Ej: Fácil acceso, estacionamiento..."
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--input-bg)',
                      color: 'var(--text)',
                      outline: 'none',
                      resize: 'none',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Enlace de Google Maps (URL generado)
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <MapPin size={16} style={{ position: 'absolute', left: 12, color: 'var(--primary)' }} />
                    <input
                      type="url"
                      required
                      value={location.maps_url}
                      onChange={e => handleUrlChange(e.target.value)}
                      placeholder="Ej: https://www.google.com/maps/..."
                      style={{
                        width: '100%',
                        padding: '12px 12px 12px 38px',
                        fontSize: '13px',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--input-bg)',
                        color: 'var(--text)',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>
                    <Sparkles size={11} style={{ color: '#FBBF24' }} />
                    Se genera automáticamente al dar clic o arrastrar en el mapa.
                  </span>
                </div>
              </div>

              {/* Right Column: Interactive Map Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Mapa Interactivo (Arrastra o haz clic para ubicar)
                </label>
                
                {/* Dedicated Map Search Bar */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={mapSearchQuery}
                    onChange={e => setMapSearchQuery(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleMapSearch();
                      }
                    }}
                    placeholder="Buscar ciudad, calle o punto de interés..."
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      fontSize: '13px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--input-bg)',
                      color: 'var(--text)',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleMapSearch}
                    disabled={geocoding}
                    className="btn btn--ghost"
                    style={{
                      padding: '0 14px',
                      borderRadius: '8px',
                      borderColor: 'var(--border)',
                      color: 'var(--text)',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <Search size={14} />
                    <span>{geocoding ? 'Buscando...' : 'Buscar'}</span>
                  </button>
                </div>

                <div 
                  id="settings-map" 
                  style={{ 
                    width: '100%', 
                    height: '290px', 
                    borderRadius: '14px', 
                    border: '1px solid var(--border)', 
                    overflow: 'hidden',
                    zIndex: 1
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <button
                type="submit"
                disabled={saving}
                className="btn btn--primary"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  padding: '12px 32px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                  opacity: saving ? 0.7 : 1
                }}
              >
                {saving ? 'Guardando...' : 'Guardar Ubicación'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
