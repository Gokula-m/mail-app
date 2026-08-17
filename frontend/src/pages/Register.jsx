import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(name, email, password);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    }
  };

  return (
    <div className="auth-shell">
      <div>
        <div className="auth-brand">Relay</div>
        <form onSubmit={handleSubmit} className="form-card">
          <h1 className="page-title" style={{fontSize: '18px', marginBottom: '4px'}}>Create account</h1>
          {error && <p className="error-text">{error}</p>}
          <label>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} required />
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
<label>Password</label>
<input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
<p style={{fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px'}}>
  At least 8 characters, including a number and a special character.
</p>          <button type="submit" className="btn-primary">Create account</button>
          <p className="helper-link">Have an account? <Link to="/login">Log in</Link></p>
        </form>
      </div>
    </div>
  );
}