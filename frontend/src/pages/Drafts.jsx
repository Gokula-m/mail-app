import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function Drafts() {
  const [drafts, setDrafts] = useState([]);
  useEffect(() => { api.get('/emails/drafts').then(res => setDrafts(res.data.emails)); }, []);

  return (
    <div>
      <h1 className="page-title">Drafts</h1>
      {drafts.length === 0 ? (
        <div className="email-list"><p className="empty-state">No drafts saved.</p></div>
      ) : (
        <ul className="email-list">
          {drafts.map(d => (
            <li key={d.id}>
              <Link to={`/emails/${d.id}`} className="email-row">
                <span className="email-subject">{d.subject || '(No subject)'}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}