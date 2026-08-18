import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import EmailDetail from '../components/EmailDetail';

export default function Inbox() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  const loadInbox = () => {
    setLoading(true);
    api.get('/emails/inbox')
      .then(res => {
        const nextEmails = res.data.emails || [];
        setEmails(nextEmails);
        setSelectedId(current => nextEmails.some(email => email.id === current) ? current : nextEmails[0]?.id || null);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadInbox(); }, []);

  if (loading) return <p style={{ padding: '24px' }}>Loading inbox...</p>;

  // Sort latest/newest first
  const sortedEmails = [...emails].sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : a.id;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : b.id;
    return timeB - timeA;
  });

  const filtered = sortedEmails.filter(e => {
    const term = searchQuery.toLowerCase();
    return (
      (e.subject || '').toLowerCase().includes(term) ||
      (e.sender_name || '').toLowerCase().includes(term) ||
      (e.summary || e.body || '').toLowerCase().includes(term)
    );
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
    <section className="mail-workspace" aria-label="Inbox">
      <div className="mail-list-pane">
        <header className="mail-list-header">
          <h1>Inbox</h1>
          <div><span className="mail-list-header-meta">{filtered.length} messages</span> <button className="refresh-button" type="button" onClick={loadInbox}>Refresh</button></div>
        </header>
        <div className="mail-list-scroll">
          {filtered.length === 0 ? <p className="empty-state">{searchQuery ? 'No messages match your search.' : 'No emails in your inbox.'}</p> : filtered.map(email => (
            <button type="button" key={email.id} className={`mail-item ${selectedId === email.id ? 'selected' : ''} ${!email.is_read ? 'unread' : ''}`} onClick={() => setSelectedId(email.id)} aria-pressed={selectedId === email.id}>
              <div className="mail-item-top"><span className="mail-item-sender">{email.sender_name || email.sender_email}</span><time className="mail-item-date">{formatDate(email.created_at || email.timestamp)}</time></div>
              <div className="mail-item-subject">{email.subject || '(No subject)'}</div>
              <div className="mail-item-snippet">{email.summary || email.body || 'No preview available.'}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="mail-detail-pane">
        {selectedId ? <EmailDetail emailId={selectedId} onDeleted={loadInbox} /> : <div className="mail-empty-detail"><div><strong>Select a message</strong>Choose an email from the inbox to read it here.</div></div>}
      </div>
    </section>
  );
}

