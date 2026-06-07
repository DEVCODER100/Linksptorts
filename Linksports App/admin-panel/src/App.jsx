import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import EventsPage from './pages/EventsPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import AdminLogin from './components/AdminLogin';

function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [authenticated, setAuthenticated] = useState(!!localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));

  if (!authenticated) {
    return <AdminLogin onLogin={(u) => { setAuthenticated(true); setUser(u); }} />;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthenticated(false);
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <DashboardPage />;
      case 'users': return <UsersPage />;
      case 'events': return <EventsPage />;
      case 'notifications': return <NotificationsPage />;
      case 'settings': return <SettingsPage />;
      default: return <DashboardPage />;
    }
  };

  const pageTitles = {
    dashboard: 'Dashboard',
    users: 'User Management',
    events: 'Events & Jobs',
    notifications: 'Push Notifications',
    settings: 'System Settings',
  };

  return (
    <div className="app">
      <Sidebar activePage={activePage} setActivePage={setActivePage} onLogout={handleLogout} />
      <main className="main-content">
        <Topbar title={pageTitles[activePage] || 'Dashboard'} user={user} />
        <div className="page-content">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

export default App;
