import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function Reports() {
  const [reports, setReports] = useState([]);
  useEffect(() => { api.get('/admin/reports').then(res => setReports(res.data.reports)); }, []);

  return (
    <div>
      <h1 className="page-title">Reported Emails</h1>
      {reports.length === 0 ? <p className="empty-state">No reports.</p> : (
        <ul className="email-list">
          {reports.map(r => (
            <li key={r.id}>
              <Link to={`/reports/${r.id}`} className="email-row">
                <div className="email-row-top">
                  <span className="email-subject">{r.subject}</span>
                  <span className="email-meta mono">by {r.reporter_name}</span>
                </div>
                <p className="email-summary">{r.reason}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}