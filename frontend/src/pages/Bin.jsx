import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function Bin() {
  const [emails, setEmails] = useState([]);
  useEffect(() => { api.get('/emails/bin').then(res => setEmails(res.data.emails)); }, []);

  return (
    <div>
      <h1 className="page-title">Bin</h1>
      {emails.length === 0 ? (
        <div className="email-list"><p className="empty-state">Bin is empty.</p></div>
      ) : (
        <ul className="email-list">
          {emails.map(e => (
            <li key={e.id}>
              <Link to={`/emails/${e.id}`} className="email-row">
                <span className="email-subject">{e.subject}</span>
                <span className="email-meta mono">{e.other_party_name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}