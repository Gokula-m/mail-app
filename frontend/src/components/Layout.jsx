import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Layout({ children }) {
  const { user } = useAuth();
  const [pendingReportsCount, setPendingReportsCount] = useState(0);

  useEffect(() => {
    if (user?.role === 'admin') {
      api.get('/admin/reports/pending-count')
        .then(res => setPendingReportsCount(res.data.count || 0))
        .catch(() => {});
    }
  }, [user]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/compose" className="sidebar-compose">
          <span>Compose</span>
        </NavLink>

        <NavLink to="/inbox" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span>Inbox</span>
        </NavLink>

        <NavLink to="/sent" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span>Sent</span>
        </NavLink>

        <NavLink to="/drafts" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span>Drafts</span>
        </NavLink>

        <NavLink to="/bin" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span>Bin</span>
        </NavLink>

        <NavLink to="/calendar" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span>Calendar</span>
        </NavLink>

        <NavLink to="/groups" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span>Groups</span>
        </NavLink>

        <NavLink to="/profile" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span>Profile</span>
        </NavLink>

        {user?.role === 'admin' && (
          <>
            <div style={{ margin: '18px 0 6px 24px', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Admin Panel
            </div>
            <NavLink to="/admin" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/reports" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`} style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span>Reports</span>
              </div>
              {pendingReportsCount > 0 && (
                <span className="badge badge-recalled" style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px' }}>
                  {pendingReportsCount}
                </span>
              )}
            </NavLink>
          </>
        )}
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}

