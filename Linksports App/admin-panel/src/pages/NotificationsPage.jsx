import React, { useState } from 'react';

const notificationHistory = [
  { id: 1, title: 'New Tournament Alert', body: 'National Football Championship registrations open!', target: 'Players - Football', sent: 'Mar 28, 2026', recipients: 3240, status: 'sent' },
  { id: 2, title: 'Platform Update', body: 'New features: QR profile sharing & coach booking', target: 'All Users', sent: 'Mar 25, 2026', recipients: 12847, status: 'sent' },
  { id: 3, title: 'Cricket Trial Reminder', body: 'Mumbai Cricket Trials S8 start tomorrow!', target: 'Players - Cricket, Mumbai', sent: 'Mar 21, 2026', recipients: 856, status: 'sent' },
];

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetRole, setTargetRole] = useState('all');
  const [targetSport, setTargetSport] = useState('all');
  const [targetCity, setTargetCity] = useState('');

  const targets = [
    { value: 'all', label: 'All Users' },
    { value: 'player', label: 'Players Only' },
    { value: 'coach', label: 'Coaches Only' },
    { value: 'organization', label: 'Organizations Only' },
  ];

  const sports = ['all', 'Football', 'Cricket', 'Basketball', 'Tennis', 'Badminton', 'Hockey', 'Swimming', 'Athletics'];

  return (
    <>
      {/* Broadcast Form */}
      <div className="broadcast-form">
        <h3>📢 Send Push Notification</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Notification Title</label>
            <input type="text" placeholder="e.g., New Tournament Alert!" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Notification Body</label>
            <textarea rows={3} placeholder="Write the notification message..." value={body} onChange={e => setBody(e.target.value)} style={{ resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
          <div className="form-group">
            <label>Target Audience</label>
            <div className="target-chips">
              {targets.map(t => (
                <button
                  key={t.value}
                  className={`target-chip ${targetRole === t.value ? 'selected' : ''}`}
                  onClick={() => setTargetRole(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Filter by Sport</label>
            <select value={targetSport} onChange={e => setTargetSport(e.target.value)}>
              {sports.map(s => (
                <option key={s} value={s}>{s === 'all' ? 'All Sports' : s}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Filter by City (optional)</label>
            <input type="text" placeholder="e.g., Mumbai, Delhi" value={targetCity} onChange={e => setTargetCity(e.target.value)} />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px 20px' }}>
              🚀 Send Notification
            </button>
          </div>
        </div>
      </div>

      {/* Notification History */}
      <div className="table-container">
        <div className="table-header">
          <h3>Notification History</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Message</th>
              <th>Target</th>
              <th>Recipients</th>
              <th>Sent</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {notificationHistory.map(n => (
              <tr key={n.id}>
                <td><strong style={{ fontSize: 14 }}>{n.title}</strong></td>
                <td style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 250 }}>{n.body}</td>
                <td style={{ fontSize: 13 }}>{n.target}</td>
                <td style={{ fontSize: 13, fontWeight: 600 }}>{n.recipients.toLocaleString()}</td>
                <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{n.sent}</td>
                <td><span className="badge active">{n.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
