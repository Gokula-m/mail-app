import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function Inbox() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadInbox = () => {
    api.get('/emails/inbox')
      .then(res => setEmails(res.data.emails || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadInbox(); }, []);

  if (loading) return <p>Loading inbox...</p>;

  // Sort latest/newest first
  const sortedEmails = [...emails].sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : a.id;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : b.id;
    return timeB - timeA;
  });

  const unreadCount = sortedEmails.filter(e => !e.is_read).length;
  const filtered = sortedEmails.filter(e =>
    (e.subject || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.sender_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.summary || e.body || '').toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div>
      <h1 className="page-title">Inbox</h1>
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-number">{emails.length}</div>
          <div className="stat-label">Total Conversations</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: 'var(--accent)' }}>{unreadCount}</div>
          <div className="stat-label">Unread</div>
        </div>
      </div>

      <input
        className="search-input"
        placeholder="Search mail by sender, subject, or content..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {filtered.length === 0 ? (
        <div className="email-list"><p className="empty-state">No emails found.</p></div>
      ) : (
        <ul className="email-list">
          {filtered.map(email => (
            <li key={email.id}>
              <Link to={`/emails/${email.id}`} className={`email-row ${!email.is_read ? 'unread-row' : ''}`}>
                <div className="avatar">{email.sender_name?.[0]?.toUpperCase() || 'U'}</div>
                
                <div className="email-sender-col">
                  {email.sender_name}
                </div>

                <div className="email-body-col">
                  <span className={`email-subject-text ${!email.is_read ? 'unread' : ''}`}>
                    {!email.is_read && <span className="unread-dot"></span>}
                    {email.subject || '(No subject)'}
                  </span>
                  {(email.summary || email.body) && (
                    <span className="email-snippet-text">
                      — {email.summary || email.body}
                    </span>
                  )}
                </div>

                <div className="email-date-col mono">
                  {email.status === 'RECALLED' && (
                    <span className="badge badge-recalled" style={{ marginRight: '8px' }}>Recalled</span>
                  )}
                  {formatDate(email.created_at || email.timestamp)}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}