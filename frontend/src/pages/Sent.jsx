import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function Sent() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/emails/sent')
      .then(res => setEmails(res.data.emails || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading sent mail...</p>;

  // Sort latest/newest first
  const sortedEmails = [...emails].sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : a.id;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : b.id;
    return timeB - timeA;
  });

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
      <h1 className="page-title">Sent</h1>
      {sortedEmails.length === 0 ? (
        <div className="email-list"><p className="empty-state">No sent emails yet.</p></div>
      ) : (
        <ul className="email-list">
          {sortedEmails.map(email => (
            <li key={email.id}>
              <Link to={`/emails/${email.id}`} className="email-row">
                <div className="avatar">{email.receiver_name?.[0]?.toUpperCase() || 'U'}</div>

                <div className="email-sender-col">
                  To: {email.receiver_name}
                </div>

                <div className="email-body-col">
                  <span className="email-subject-text">
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