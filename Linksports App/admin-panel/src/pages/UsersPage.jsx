import React, { useState, useEffect } from 'react';
import { userService } from '../services/api';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter, page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await userService.getUsers({
        role: roleFilter,
        status: statusFilter,
        search: search,
        page,
        limit: 10
      });
      setUsers(res.data.data.users);
      setTotalUsers(res.data.total);
      setError(null);
    } catch (err) {
      setError('Failed to fetch users. Ensure you are logged in.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (user) => {
    try {
      const newStatus = user.status === 'active' ? 'suspended' : 'active';
      await userService.updateStatus(user._id, newStatus);
      setUsers(users.map(u => u._id === user._id ? { ...u, status: newStatus } : u));
    } catch (err) {
      alert('Error updating user status');
    }
  };

  const handleVerify = async (userId) => {
    try {
      await userService.verifyUser(userId);
      setUsers(users.map(u => {
        if (u._id === userId) {
          if (u.role === 'organization') return { ...u, isVerifiedOrg: true };
          if (u.role === 'coach') return { ...u, isVerified: true, verificationLevel: 'Verified' };
          return { ...u, emailVerified: true };
        }
        return u;
      }));
    } catch (err) {
      alert('Error verifying user');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to PERMANENTLY delete this user? This cannot be undone.')) return;
    try {
      await userService.deleteUser(userId);
      setUsers(users.filter(u => u._id !== userId));
      setSelectedUser(null);
    } catch (err) {
      alert('Error deleting user');
    }
  };

  const getDisplayName = (user) => {
    return user.fullName || user.orgName || user.username || 'N/A';
  };

  const isUserVerified = (user) => {
    return user.isVerified || user.isVerifiedOrg || user.emailVerified;
  };

  return (
    <>
      {/* Filters and Search */}
      <div className="filter-bar">
        <div style={{ display: 'flex', gap: 12 }}>
          <select value={roleFilter} onChange={e => {setRoleFilter(e.target.value); setPage(1);}}>
            <option value="all">All Roles</option>
            <option value="player">Players</option>
            <option value="coach">Coaches</option>
            <option value="organization">Organizations</option>
          </select>
          <select value={statusFilter} onChange={e => {setStatusFilter(e.target.value); setPage(1);}}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        
        <div className="search-box" style={{ marginLeft: 20, flex: 1, maxWidth: 300 }}>
          <input 
            type="text" 
            placeholder="Search by name, email..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && fetchUsers()}
            style={{ width: '100%', padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)' }}
          />
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <button className="btn btn-primary btn-sm" onClick={fetchUsers}>
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading user data...</div>
      ) : error ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--error)' }}>{error}</div>
      ) : (
        <div className="table-container">
          <div className="table-header">
            <h3>Registered Community ({totalUsers})</h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>User / Identity</th>
                <th>Role</th>
                <th>Location</th>
                <th>Status</th>
                <th>Verification</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td>
                    <div className="user-cell">
                      <div className={`user-avatar ${user.role}`}>
                        {(user.fullName || user.username).substring(0, 2).toUpperCase()}
                      </div>
                      <div className="user-info">
                        <strong>{getDisplayName(user)}</strong>
                        <span>{user.email}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>@{user.username}</span>
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge ${user.role}`}>{user.role}</span></td>
                  <td style={{ fontSize: 13 }}>{user.city || user.location || 'N/A'}</td>
                  <td><span className={`badge ${user.status}`}>{user.status}</span></td>
                  <td>
                    {isUserVerified(user)
                      ? <span className="badge verified">✓ Verified</span>
                      : <button className="btn btn-outline btn-sm" style={{ fontSize: 11 }} onClick={() => handleVerify(user._id)}>Verify</button>
                    }
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => setSelectedUser(user)}>View</button>
                      <button 
                        className="btn btn-outline btn-sm" 
                        style={{ color: user.status === 'active' ? 'var(--error)' : 'var(--success)' }}
                        onClick={() => handleStatusToggle(user)}
                      >
                        {user.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="pagination">
            <span className="pagination-info">Showing {users.length} of {totalUsers} users</span>
            <div className="pagination-buttons">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="page-btn">‹</button>
              <button className="page-btn active">{page}</button>
              <button disabled={users.length < 10} onClick={() => setPage(p => p + 1)} className="page-btn">›</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Database Registry Detail</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setSelectedUser(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <div className={`user-avatar ${selectedUser.role}`} style={{ width: 56, height: 56, fontSize: 18 }}>
                  {(selectedUser.fullName || selectedUser.username).substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 style={{ fontSize: 18 }}>{getDisplayName(selectedUser)}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>@{selectedUser.username} • {selectedUser.email}</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  ['Mongo ID', selectedUser._id],
                  ['Role', selectedUser.role],
                  ['Primary Sport', selectedUser.sportType || selectedUser.specialization || 'N/A'],
                  ['City/State', `${selectedUser.city || ''} ${selectedUser.state || ''}`.trim() || 'N/A'],
                  ['Mobile', selectedUser.mobileNo || 'N/A'],
                  ['Account Status', selectedUser.status],
                  ['Verified', isUserVerified(selectedUser) ? 'Yes' : 'No'],
                  ['Created On', new Date(selectedUser.createdAt).toLocaleString()],
                ].map(([label, value], i) => (
                  <div key={i} className="form-group">
                    <label>{label}</label>
                    <div style={{ padding: '8px 0', fontSize: 14 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selectedUser._id)}>Delete Permanently</button>
              {!isUserVerified(selectedUser) && <button className="btn btn-primary btn-sm" onClick={() => handleVerify(selectedUser._id)}>Verify Now</button>}
              <button className="btn btn-outline btn-sm" onClick={() => setSelectedUser(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
