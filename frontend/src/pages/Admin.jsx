import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const loadData = () => {
    api.get('/admin/users').then(res => setUsers(res.data.users || [])).catch(() => {});
    api.get('/admin/stats').then(res => setStats(res.data.stats || null)).catch(() => {});
  };

  useEffect(() => { loadData(); }, []);

  const handleToggleStatus = async (user) => {
    try {
      const nextStatus = !user.is_active;
      await api.patch(`/admin/users/${user.id}/toggle-status`, { isActive: nextStatus });
      loadData();
      showToast(`User ${user.name} is now ${nextStatus ? 'active' : 'deactivated'}.`);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update user status.', 'error');
    }
  };

  const handleOpenGroupModal = (initialUserId = null) => {
    if (initialUserId) {
      setSelectedUserIds([initialUserId]);
    } else {
      setSelectedUserIds([]);
    }
    setGroupName('');
    setGroupModalOpen(true);
  };

  const toggleUserSelection = (userId) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      return showToast('Group name is required.', 'error');
    }
    if (selectedUserIds.length === 0) {
      return showToast('Select at least one user for the group.', 'error');
    }

    try {
      const res = await api.post('/admin/groups/create', {
        name: groupName,
        userIds: selectedUserIds
      });
      showToast('Group chat created successfully.');
      setGroupModalOpen(false);
      navigate(`/groups/${res.data.group.id}`);
    } catch (err) {
      showToast(err.response?.data?.error || 'Could not create group.', 'error');
    }
  };

  return (
    <div>
      <h1 className="page-title">Admin Dashboard</h1>

      {stats && (
        <div className="stats-row" style={{ flexWrap: 'wrap' }}>
          <div className="stat-card">
            <div className="stat-number">{stats.totalUsers}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{ color: 'var(--success)' }}>{stats.activeUsers}</div>
            <div className="stat-label">Active Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{ color: 'var(--danger)' }}>{stats.deactivatedUsers}</div>
            <div className="stat-label">Deactivated</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.totalEmails}</div>
            <div className="stat-label">Total Emails</div>
          </div>
          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/reports')}>
            <div className="stat-number" style={{ color: stats.pendingReports > 0 ? 'var(--danger)' : 'var(--text)' }}>
              {stats.pendingReports}
            </div>
            <div className="stat-label">Pending Reports</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '32px 0 16px 0' }}>
        <h2 style={{ fontSize: '20px', margin: 0 }}>User Management</h2>
        <button className="btn-primary" onClick={() => handleOpenGroupModal()}>
          + Create Group Chat
        </button>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>
                <div style={{ fontWeight: '600' }}>{u.name}</div>
              </td>
              <td className="mono">{u.email}</td>
              <td>
                <span className="badge" style={{ background: u.role === 'admin' ? 'var(--accent-subtle)' : 'var(--bg)', color: u.role === 'admin' ? 'var(--accent)' : 'var(--text)' }}>
                  {u.role}
                </span>
              </td>
              <td>
                <span className={`status-dot ${u.is_active ? 'active' : 'inactive'}`}></span>
                {u.is_active ? 'Active' : 'Deactivated'}
              </td>
              <td style={{ textAlign: 'right' }}>
                <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'flex-end' }}>
                  {u.role !== 'admin' && (
                    <button
                      className={u.is_active ? 'btn-danger' : 'btn-secondary'}
                      style={{ padding: '6px 14px', fontSize: '13px' }}
                      onClick={() => handleToggleStatus(u)}
                    >
                      {u.is_active ? 'Deactivate' : 'Reactivate'}
                    </button>
                  )}
                  <button
                    className="btn-secondary"
                    style={{ padding: '6px 14px', fontSize: '13px' }}
                    onClick={() => handleOpenGroupModal(u.id)}
                  >
                    Group Chat
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {groupModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyCenter: 'center', zIndex: 1000
        }}>
          <div className="form-card" style={{ width: '480px', margin: '0 auto' }}>
            <h2 style={{ marginTop: 0 }}>Create Resolution Group</h2>
            <form onSubmit={handleCreateGroup}>
              <label>Group Name</label>
              <input
                placeholder="e.g. Issue Resolution Group"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                required
              />

              <label>Select Members</label>
              <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '8px' }}>
                {users.map(u => (
                  <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '6px 0', cursor: 'pointer', fontWeight: 'normal' }}>
                    <input
                      type="checkbox"
                      style={{ width: 'auto' }}
                      checked={selectedUserIds.includes(u.id)}
                      onChange={() => toggleUserSelection(u.id)}
                    />
                    <span>{u.name} ({u.email})</span>
                  </label>
                ))}
              </div>

              <div className="btn-row" style={{ marginTop: '24px' }}>
                <button type="submit" className="btn-primary">Create Group</button>
                <button type="button" className="btn-secondary" onClick={() => setGroupModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}