import React, { useState, useEffect } from 'react';
import { statsService, userService } from '../services/api';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [statsRes, userRes] = await Promise.all([
          statsService.getDashboardStats(),
          userService.getUsers({ limit: 5 })
        ]);
        setStats(statsRes.data.data.stats);
        setRecentUsers(userRes.data.data.users);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading || !stats) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading analytical data...</div>;
  }

  const kpis = [
    { label: 'Total Users', value: stats.users.total.toLocaleString(), trend: '+0%', up: true, color: 'blue', icon: '👥' },
    { label: 'Active Jobs', value: stats.posts.jobs, trend: '+0%', up: true, color: 'purple', icon: '💼' },
    { label: 'Upcoming Events', value: stats.posts.events, trend: '+0%', up: true, color: 'orange', icon: '🏆' },
    { label: 'Growth Peak', value: stats.growth.length > 0 ? stats.growth[stats.growth.length-1].count : 0, trend: 'Monthly', up: true, color: 'green', icon: '📈' },
  ];

  const roleStats = [
    { label: 'Players', count: stats.users.players, pct: Math.round((stats.users.players / stats.users.total) * 100), color: '#1A73E8' },
    { label: 'Coaches', count: stats.users.coaches, pct: Math.round((stats.users.coaches / stats.users.total) * 100), color: '#10B981' },
    { label: 'Orgs', count: stats.users.organizations, pct: Math.round((stats.users.organizations / stats.users.total) * 100), color: '#8B5CF6' },
  ];

  return (
    <>
      <div className="kpi-grid">
        {kpis.map((kpi, i) => (
          <div key={i} className={`kpi-card ${kpi.color}`}>
            <div className="kpi-header">
              <div className={`kpi-icon ${kpi.color}`}><span style={{ fontSize: 20 }}>{kpi.icon}</span></div>
              <span className={`kpi-trend ${kpi.up ? 'up' : 'down'}`}>{kpi.trend}</span>
            </div>
            <div className="kpi-value">{kpi.value}</div>
            <div className="kpi-label">{kpi.label}</div>
          </div>
        ))}
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <h3>Registration Velocity</h3>
          <div className="chart-placeholder">
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 100, marginBottom: 16 }}>
                {stats.growth.map((g, i) => (
                  <div key={i} style={{ flex: 1, background: 'var(--primary)', height: `${(g.count / Math.max(...stats.growth.map(x => x.count))) * 100}%`, borderRadius: '4px 4px 0 0' }} title={`${g._id}: ${g.count}`} />
                ))}
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>New monthly users tracked via MongoDB analytics</p>
            </div>
          </div>
        </div>
        <div className="chart-card">
          <h3>Community Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '10px 0' }}>
            {roleStats.map((r, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{r.label}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{r.count.toLocaleString()} ({r.pct}%)</span>
                </div>
                <div style={{ height: 10, background: 'var(--bg)', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${r.pct}%`, background: r.color, borderRadius: 5 }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            * Distribution across the unified player, coach, and organization network.
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3>Real-time Activity</h3>
          <button className="btn btn-outline btn-sm">View Database →</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Location</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            {recentUsers.map((user, i) => (
              <tr key={i}>
                <td>
                  <div className="user-cell">
                    <div className={`user-avatar ${user.role}`}>
                      {(user.fullName || user.orgName || user.username).substring(0, 2).toUpperCase()}
                    </div>
                    <div className="user-info">
                      <strong>{user.fullName || user.orgName || user.username}</strong>
                      <span>{user.email}</span>
                    </div>
                  </div>
                </td>
                <td><span className={`badge ${user.role}`}>{user.role}</span></td>
                <td style={{ fontSize: 13 }}>{user.city || user.location || 'N/A'}</td>
                <td><span className={`badge ${user.status}`}>{user.status}</span></td>
                <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td>
                   <button className="btn btn-outline btn-sm">Inspect</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
