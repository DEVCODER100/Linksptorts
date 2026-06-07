import React from 'react';

export default function Topbar({ title }) {
  return (
    <header className="topbar">
      <h2 className="topbar-title">{title}</h2>
      <div className="topbar-actions">
        <div className="topbar-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Search users, events..." />
        </div>
        <div className="user-cell" style={{ cursor: 'pointer' }}>
          <div className="user-avatar" style={{ background: 'var(--primary)', fontSize: '12px' }}>AD</div>
          <div className="user-info">
            <strong style={{ fontSize: '13px' }}>Admin</strong>
            <span>Super Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}
