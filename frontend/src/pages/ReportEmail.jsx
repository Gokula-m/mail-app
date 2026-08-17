import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

export default function ReportEmail() {
  const { id } = useParams();
  const [email, setEmail] = useState(null);
  const [reason, setReason] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    api.get(`/emails/${id}`).then(res => setEmail(res.data.email));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const formData = new FormData();
    formData.append('reason', reason);
    if (file) formData.append('document', file);

    try {
      await api.post(`/emails/${id}/report`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      showToast('Report submitted.');
      navigate('/inbox');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit report.');
    }
  };

  if (!email) return <p>Loading...</p>;

  return (
    <div>
      <h1 className="page-title">Report Email</h1>
      <form onSubmit={handleSubmit} className="form-card wide">
        {error && <p className="error-text">{error}</p>}
        <label>Reported email</label>
        <p className="mono email-detail-meta">"{email.subject}" — from {email.sender_email}</p>
        <label>Why are you reporting this?</label>
        <textarea value={reason} onChange={e => setReason(e.target.value)} required placeholder="Describe the issue..." />
        <label>Supporting document (optional)</label>
        <input type="file" onChange={e => setFile(e.target.files[0])} />
        <button type="submit" className="btn-primary">Submit report</button>
      </form>
    </div>
  );
}