import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function TopBar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      navigate(`/inbox?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <Link to="/inbox" className="topbar-logo">
          <div className="topbar-logo-m">M</div>
          <span>Internal Mail</span>
        </Link>
      </div>

      <div className="topbar-search-container">
        <div className="topbar-search-bar">
          <input
            placeholder="Search mail..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>
      </div>

      <div className="topbar-actions">
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? 'Dark mode' : 'Light mode'}
        </button>

        {user ? (
          <div className="topbar-user">
            <div className="topbar-avatar" title={user.email}>
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <span style={{ fontWeight: '600', fontSize: '14px' }}>{user.name}</span>
            <button className="topbar-btn" onClick={logout}>Logout</button>
          </div>
        ) : (
          <>
            <Link to="/login" className="topbar-btn">Login</Link>
            <Link to="/register" className="btn-primary" style={{ textDecoration: 'none', padding: '8px 18px' }}>Register</Link>
          </>
        )}
      </div>
    </header>
  );
}
