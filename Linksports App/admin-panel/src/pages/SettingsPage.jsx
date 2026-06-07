import React, { useState } from 'react';

const sportsConfig = [
  'Football', 'Cricket', 'Basketball', 'Tennis', 'Badminton', 'Hockey', 'Volleyball', 'Athletics', 'Swimming'
];

export default function SettingsPage() {
  const [sports, setSports] = useState(sportsConfig);
  const [newSport, setNewSport] = useState('');
  const [features, setFeatures] = useState({
    socialLogin: true,
    biometricLogin: true,
    offlineMode: true,
    playerSearch: true,
    chatEnabled: true,
    qrSharing: true,
    paymentGateway: false,
    whatsappNotifications: false,
  });

  const toggleFeature = (key) => {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const addSport = () => {
    if (newSport.trim() && !sports.includes(newSport.trim())) {
      setSports([...sports, newSport.trim()]);
      setNewSport('');
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      {/* Sport Categories */}
      <div className="broadcast-form">
        <h3>🏅 Sport Categories</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {sports.map((sport, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 20, background: 'var(--primary-light)',
              fontSize: 13, fontWeight: 500, color: 'var(--primary)'
            }}>
              {sport}
              <span
                style={{ cursor: 'pointer', opacity: 0.6, fontSize: 16 }}
                onClick={() => setSports(sports.filter(s => s !== sport))}
              >×</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="text" placeholder="Add new sport..." value={newSport} onChange={e => setNewSport(e.target.value)}
            style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }}
            onKeyPress={e => e.key === 'Enter' && addSport()}
          />
          <button className="btn btn-primary btn-sm" onClick={addSport}>Add</button>
        </div>
      </div>

      {/* Feature Flags */}
      <div className="broadcast-form">
        <h3>⚙️ Feature Flags</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Object.entries(features).map(([key, enabled]) => (
            <div key={key} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0', borderBottom: '1px solid var(--border)'
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, textTransform: 'capitalize' }}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
              </div>
              <label style={{
                position: 'relative', width: 44, height: 24, cursor: 'pointer'
              }}>
                <input type="checkbox" checked={enabled} onChange={() => toggleFeature(key)}
                  style={{ display: 'none' }}
                />
                <div style={{
                  width: 44, height: 24, borderRadius: 12,
                  background: enabled ? 'var(--primary)' : 'var(--border)',
                  transition: 'background 0.2s', position: 'relative'
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 10,
                    background: '#fff', position: 'absolute', top: 2,
                    left: enabled ? 22 : 2, transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }} />
                </div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* API Configuration */}
      <div className="broadcast-form">
        <h3>🔑 API Configuration</h3>
        <div className="form-group">
          <label>MongoDB URI</label>
          <input type="password" value="mongodb+srv://***:***@cluster0.linksports.mongodb.net" readOnly
            style={{ background: 'var(--bg)', cursor: 'not-allowed' }}
          />
        </div>
        <div className="form-group">
          <label>Cloudinary URL</label>
          <input type="password" value="cloudinary://***:***@linksports" readOnly
            style={{ background: 'var(--bg)', cursor: 'not-allowed' }}
          />
        </div>
        <div className="form-group">
          <label>FCM Server Key</label>
          <input type="password" value="AAAAx...configured" readOnly
            style={{ background: 'var(--bg)', cursor: 'not-allowed' }}
          />
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
          ⓘ Environment variables are managed via server .env file and cannot be edited here.
        </p>
      </div>

      {/* Data Export */}
      <div className="broadcast-form">
        <h3>📤 Data Export</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Export platform data as CSV/Excel files for reporting and analysis.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {['All Users', 'Player Profiles', 'Coach Profiles', 'Organizations', 'Event Registrations', 'Job Applications', 'Analytics Summary'].map((item, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--bg)'
            }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{item}</span>
              <button className="btn btn-outline btn-sm">
                Export CSV
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
