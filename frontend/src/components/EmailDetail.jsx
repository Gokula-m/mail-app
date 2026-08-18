import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function EmailDetail({ emailId, onDeleted }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState(null);
  const [thread, setThread] = useState([]);
  const [quickReplies, setQuickReplies] = useState([]);
  const [replyBody, setReplyBody] = useState('');
  const [error, setError] = useState('');

  const loadData = () => {
    api.get(`/emails/${emailId}`).then(res => setEmail(res.data.email)).catch(err => setError(err.response?.data?.error || 'Could not load email.'));
    api.get(`/emails/${emailId}/thread`).then(res => setThread(res.data.thread)).catch(() => {});
    api.get(`/emails/${emailId}/quick-replies`).then(res => setQuickReplies(res.data.replies)).catch(() => {});
  };

  useEffect(() => {
    if (!emailId) return;
    setEmail(null);
    setError('');
    loadData();
  }, [emailId]);

  const handleDelete = async () => {
    await api.delete(`/emails/${emailId}`);
    showToast('Moved to Bin.');
    if (onDeleted) onDeleted();
  };
  const handleRecall = async () => { await api.patch(`/emails/${emailId}/recall`); showToast('Email recalled.'); loadData(); };

  const sendReply = async (text) => {
    await api.post(`/emails/${emailId}/reply`, { body: text });
    setReplyBody('');
    showToast('Reply sent.');
    loadData();
  };
  const handleReply = (e) => { e.preventDefault(); sendReply(replyBody); };

  const renderContent = (body, recalled, expired) => {
    if (recalled) return <span className="recalled-note">🚫 This message was recalled by the sender</span>;
    if (expired) return <span className="recalled-note">⏱ This message has expired</span>;
    return body;
  };

  if (!emailId) return <div className="empty-state">Select an email to read it here.</div>;
  if (error) return <p className="error-text">{error}</p>;
  if (!email) return <p>Loading...</p>;

  const isRecalledTop = email.status === 'RECALLED';
  const isExpiredTop = email.expires_at && new Date(email.expires_at) < new Date();

  return (
    <div>
      <div className="email-detail">
        <div className="email-detail-header">
        <h2>{email.subject || '(No subject)'}</h2>
        <p className="email-detail-meta mono">From: {email.sender_name} ({email.sender_email})</p>
        <p className="email-detail-meta mono">To: {email.receiver_name} ({email.receiver_email})</p>
        <div className="btn-row">
          <button className="btn-danger" onClick={handleDelete} title="Move this conversation to Bin">Delete</button>
          <button className="btn-secondary" onClick={handleRecall} title="Revoke access to this email for the recipient">Recall</button>
          <Link to={`/emails/${emailId}/report`} className="btn-secondary" style={{textDecoration: 'none'}} title="Flag this email for admin review">Report</Link>
        </div>
        </div>
        {email.summary && <p className="email-detail-summary">{email.summary}</p>}
        <p className="email-detail-body">{renderContent(email.body, isRecalledTop, isExpiredTop)}</p>
      </div>

      <div className="thread-container">
        {thread.map(msg => (
          <div key={msg.id} className={`thread-bubble ${msg.sender_id === user.id ? 'mine' : 'theirs'}`}>
            <div className="thread-sender mono">{msg.sender_name}</div>
            <div>{renderContent(msg.body, msg.recalled, msg.expired)}</div>
          </div>
        ))}
      </div>

      <form onSubmit={handleReply} className="reply-box">
        <input placeholder="Type a reply..." value={replyBody} onChange={e => setReplyBody(e.target.value)} required />
        <button type="submit" className="btn-primary" style={{marginTop: 0}} title="Send this reply">Reply</button>
      </form>

      {quickReplies.length > 0 && (
        <div className="quick-replies">
          {quickReplies.map((r, i) => (
            <button key={i} className="quick-reply-chip" onClick={() => sendReply(r)} title="Send this quick reply">{r}</button>
          ))}
        </div>
      )}
    </div>
  );
}
