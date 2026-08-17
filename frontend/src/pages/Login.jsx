import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/inbox');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed.');
    }
  };

return (
  <div className="auth-shell">
    <div>
      <div className="auth-brand">Relay</div>
      <form onSubmit={handleSubmit} className="form-card">
        <h1 className="page-title" style={{fontSize: '18px', marginBottom: '4px'}}>Log in</h1>
        {error && <p className="error-text">{error}</p>}
        <label>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        <label>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit" className="btn-primary">Log in</button>
        <p className="helper-link">No account? <Link to="/register">Register</Link></p>
      </form>
    </div>
  </div>
);
}