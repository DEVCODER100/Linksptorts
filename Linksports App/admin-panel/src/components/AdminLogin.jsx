import React, { useState } from 'react';
import { authService } from '../services/api';

export default function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authService.login({ email, password });
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.data.user));
        onLogin(res.data.data.user);
      }
    } catch (err) {
      setError('Invalid admin credentials. Access denied.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ background: 'var(--bg)', zIndex: 9999 }}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h3>LinkSports Admin Access</h3>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <p style={{ fontSize: 13, marginBottom: 20, color: 'var(--text-secondary)' }}>
            Please authenticate with organization or admin credentials to access the database.
          </p>
          {error && <div style={{ color: 'var(--error)', marginBottom: 16, fontSize: 13 }}>{error}</div>}
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="admin@linksports.in"
            />
          </div>
          <div className="form-group" style={{ marginTop: 12 }}>
            <label>Password</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: 24, padding: 12 }}
          >
            {loading ? 'Authenticating...' : 'Enter Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
