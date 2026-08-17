import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function TopBar() {
  const { user, logout } = useAuth();
  return (
    <header className="topbar">
      <div className="topbar-title">Internal Mailing Application</div>
      <div className="topbar-actions">
        {user ? (
          <>
            <span className="topbar-user mono">{user.name}</span>
            <button className="topbar-btn" onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="topbar-link">Login</Link>
            <Link to="/register" className="topbar-link">Register</Link>
          </>
        )}
      </div>
    </header>
  );
}