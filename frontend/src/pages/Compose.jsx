import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../context/ToastContext'

export default function Compose() {
  const [searchParams] = useSearchParams();
  const [receiverEmail, setReceiverEmail] = useState(searchParams.get('to') || '');
  const [subject, setSubject] = useState(searchParams.get('subject') || '');
  const [body, setBody] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const formData = new FormData();
    formData.append('receiverEmail', receiverEmail);
    formData.append('subject', subject);
    formData.append('body', body);
    if (file) formData.append('attachment', file);

    try {
      await api.post('/emails', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast('Email sent successfully.');
      navigate('/sent');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send email.');
    }
  };
  const handleSaveDraft = async () => {
  const formData = new FormData();
  formData.append('receiverEmail', receiverEmail);
  formData.append('subject', subject);
  formData.append('body', body);
  formData.append('saveAsDraft', 'true');
  if (file) formData.append('attachment', file);

  try {
    await api.post('/emails', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    showToast('Draft saved.');
    navigate('/drafts');
  } catch (err) {
    setError(err.response?.data?.error || 'Failed to save draft.');
  }
};

  return (
    <div>
      <h1 className="page-title">Compose</h1>
      <form onSubmit={handleSubmit} className="form-card wide">
        {error && <p className="error-text">{error}</p>}
        <label>To</label>
        <input placeholder="recipient@example.com" value={receiverEmail} onChange={e => setReceiverEmail(e.target.value)} required />
        <label>Subject</label>
        <input value={subject} onChange={e => setSubject(e.target.value)} required />
        <label>Message</label>
        <textarea value={body} onChange={e => setBody(e.target.value)} required />
        <label>Attachment (optional)</label>
        <input type="file" onChange={e => setFile(e.target.files[0])} />
        {/* <button type="submit" className="btn-primary">Send</button> */}
        <div style={{display: 'flex', gap: '8px', marginTop: '20px'}}>
  <button type="submit" className="btn-primary" style={{marginTop: 0}}>Send</button>
  <button type="button" className="btn-secondary" onClick={handleSaveDraft}>Save as draft</button>
</div>
      </form>
    </div>
  );
}