import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user } = useAuth();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/compose" className="sidebar-compose">Compose</NavLink>
        <NavLink to="/inbox" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>Inbox</NavLink>
        <NavLink to="/sent" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>Sent</NavLink>
        <NavLink to="/drafts" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>Drafts</NavLink>
        <NavLink to="/bin" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>Bin</NavLink>
        <NavLink to="/calendar" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>Calendar</NavLink>
        <NavLink to="/groups" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>Groups</NavLink>
        <NavLink to="/profile" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>Profile</NavLink>
        {user?.role === 'admin' && (
          <>
            <NavLink to="/admin" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>Admin</NavLink>
            <NavLink to="/reports" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>Reports</NavLink>
          </>
        )}
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}