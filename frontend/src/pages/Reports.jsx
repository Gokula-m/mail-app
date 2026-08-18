import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    api.get('/admin/reports').then(res => setReports(res.data.reports || []));
  }, []);

  const filtered = reports.filter(r => {
    if (filter === 'ALL') return true;
    return (r.status || 'PENDING') === filter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RESOLVED':
        return <span className="badge" style={{ background: 'var(--success-subtle)', color: 'var(--success)' }}>Resolved</span>;
      case 'DISMISSED':
        return <span className="badge" style={{ background: 'var(--bg)', color: 'var(--text-secondary)' }}>Dismissed</span>;
      default:
        return <span className="badge badge-recalled">Pending</span>;
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Reported Emails</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['ALL', 'PENDING', 'RESOLVED', 'DISMISSED'].map(st => (
            <button
              key={st}
              className={`btn-secondary ${filter === st ? 'active' : ''}`}
              style={{
                padding: '6px 14px',
                fontSize: '13px',
                background: filter === st ? 'var(--accent)' : undefined,
                color: filter === st ? '#ffffff' : undefined
              }}
              onClick={() => setFilter(st)}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? <p className="empty-state">No reports found.</p> : (
        <ul className="email-list">
          {filtered.map(r => (
            <li key={r.id}>
              <Link to={`/reports/${r.id}`} className="email-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {getStatusBadge(r.status)}
                    <span className="email-subject-text" style={{ fontSize: '16px' }}>
                      Report on: {r.subject || '(No Subject)'}
                    </span>
                  </div>
                  <span className="email-date-col mono">
                    {new Date(r.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <strong>Reported by:</strong> {r.reporter_name} ({r.reporter_email}) | <strong>Sender:</strong> {r.sender_name} ({r.sender_email})
                </div>

                <p className="email-snippet-text" style={{ margin: '4px 0 0 0', fontStyle: 'italic' }}>
                  Reason: "{r.reason}"
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}