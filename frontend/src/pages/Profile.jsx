import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    api.get('/profile').then(res => setProfile(res.data.profile));
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.patch('/profile/password', { currentPassword, newPassword });
      showToast('Password updated.');
      setCurrentPassword('');
      setNewPassword('');
      setShowPasswordForm(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update password.');
    }
  };

  if (!profile) return <p>Loading...</p>;

  return (
    <div>
      <h1 className="page-title">Profile</h1>

      <div className="email-detail" style={{marginBottom: '24px'}}>
        <div className="avatar" style={{width: '48px', height: '48px', fontSize: '18px', marginBottom: '16px'}}>
          {profile.name[0].toUpperCase()}
        </div>
        <p className="email-detail-meta mono" style={{fontSize: '15px', color: 'var(--text)'}}>{profile.name}</p>
        <p className="email-detail-meta mono">{profile.email}</p>
        <p className="email-detail-meta mono">Role: {profile.role}</p>
        <p className="email-detail-meta mono">Joined: {new Date(profile.created_at).toLocaleDateString()}</p>
      </div>

      {!showPasswordForm ? (
        <button className="btn-secondary" onClick={() => setShowPasswordForm(true)}>Change password</button>
      ) : (
        <form onSubmit={handlePasswordChange} className="form-card">
          {error && <p className="error-text">{error}</p>}
          <label>Current password</label>
          <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
          <label>New password</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
          <div style={{display: 'flex', gap: '8px', marginTop: '20px'}}>
            <button type="submit" className="btn-primary" style={{marginTop: 0}}>Update password</button>
            <button type="button" className="btn-secondary" onClick={() => setShowPasswordForm(false)}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}