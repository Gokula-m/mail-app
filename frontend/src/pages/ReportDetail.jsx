import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

export default function ReportDetail() {
  const { id } = useParams();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const loadReport = () => {
    api.get(`/admin/reports/${id}`)
      .then(res => setReportData(res.data))
      .catch(err => showToast(err.response?.data?.error || 'Could not load report.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadReport(); }, [id]);

  if (loading) return <p>Loading report details...</p>;
  if (!reportData || !reportData.report) return <p className="error-text">Report not found.</p>;

  const { report, thread } = reportData;

  const handleUpdateStatus = async (newStatus) => {
    try {
      await api.patch(`/admin/reports/${id}/status`, { status: newStatus });
      showToast(`Report status updated to ${newStatus}.`);
      loadReport();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update report status.', 'error');
    }
  };

  const handleToggleUserStatus = async (userId, userName, currentActive) => {
    try {
      await api.patch(`/admin/users/${userId}/toggle-status`, { isActive: !currentActive });
      showToast(`User ${userName} is now ${!currentActive ? 'active' : 'deactivated'}.`);
      loadReport();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update user status.', 'error');
    }
  };

  const handleCreateResolutionGroup = async () => {
    try {
      const userIds = [report.reporter_id, report.sender_id, report.receiver_id].filter(Boolean);
      const res = await api.post('/admin/groups/create', {
        name: `Resolution: ${report.subject || 'Report #' + report.id}`,
        userIds: userIds
      });
      showToast('Resolution group chat created.');
      navigate(`/groups/${res.data.group.id}`);
    } catch (err) {
      showToast(err.response?.data?.error || 'Could not create resolution group.', 'error');
    }
  };

  const handleReplyToReporter = () => {
    navigate(`/compose?to=${encodeURIComponent(report.reporter_email)}&subject=${encodeURIComponent('Re: Report on "' + (report.subject || '') + '"')}`);
  };

  return (
    <div style={{ maxWidth: '960px' }}>
      <Link to="/reports" className="back-btn">
        ← Back to Reports
      </Link>

      <div className="email-detail" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ margin: 0 }}>Report: {report.subject || '(No Subject)'}</h2>
            <div style={{ margin: '8px 0 16px 0', fontSize: '14.5px', color: 'var(--text-secondary)' }}>
              Report ID #{report.id} • Filed on {new Date(report.created_at).toLocaleString()}
            </div>
          </div>
          <div>
            <span className={`badge ${report.status === 'RESOLVED' ? '' : report.status === 'DISMISSED' ? '' : 'badge-recalled'}`}
                  style={{
                    fontSize: '13px', padding: '6px 14px', borderRadius: '20px',
                    background: report.status === 'RESOLVED' ? 'var(--success-subtle)' : report.status === 'DISMISSED' ? 'var(--bg)' : undefined,
                    color: report.status === 'RESOLVED' ? 'var(--success)' : report.status === 'DISMISSED' ? 'var(--text-secondary)' : undefined
                  }}>
              Status: {report.status || 'PENDING'}
            </span>
          </div>
        </div>

        <div style={{ background: 'var(--accent-subtle)', padding: '18px 22px', borderRadius: 'var(--radius)', margin: '16px 0' }}>
          <h4 style={{ margin: '0 0 6px 0', color: 'var(--accent)' }}>Report Reason</h4>
          <p style={{ margin: 0, fontSize: '15.5px', fontWeight: '500' }}>"{report.reason}"</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', margin: '20px 0' }}>
          <div style={{ background: 'var(--bg)', padding: '14px 18px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Reporter</div>
            <div style={{ fontWeight: '600', fontSize: '15px', marginTop: '4px' }}>{report.reporter_name}</div>
            <div className="mono" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{report.reporter_email}</div>
          </div>

          <div style={{ background: 'var(--bg)', padding: '14px 18px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Reported Sender</div>
            <div style={{ fontWeight: '600', fontSize: '15px', marginTop: '4px' }}>{report.sender_name}</div>
            <div className="mono" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{report.sender_email}</div>
            <button
              className={report.sender_active ? 'btn-danger' : 'btn-secondary'}
              style={{ marginTop: '8px', padding: '4px 10px', fontSize: '12px' }}
              onClick={() => handleToggleUserStatus(report.sender_id, report.sender_name, report.sender_active)}
            >
              {report.sender_active ? 'Deactivate Sender' : 'Reactivate Sender'}
            </button>
          </div>

          <div style={{ background: 'var(--bg)', padding: '14px 18px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Recipient</div>
            <div style={{ fontWeight: '600', fontSize: '15px', marginTop: '4px' }}>{report.receiver_name}</div>
            <div className="mono" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{report.receiver_email}</div>
          </div>
        </div>

        {report.file_name && (
          <div style={{ background: 'var(--bg)', padding: '12px 18px', borderRadius: 'var(--radius)', marginBottom: '16px' }}>
            <strong>Attached Proof / File:</strong> {report.file_name}
          </div>
        )}

        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '17px', marginBottom: '12px' }}>Admin Actions</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => handleUpdateStatus('RESOLVED')}>
              Mark as Resolved
            </button>
            <button className="btn-secondary" onClick={() => handleUpdateStatus('DISMISSED')}>
              Dismiss Report
            </button>
            <button className="btn-secondary" onClick={() => handleUpdateStatus('PENDING')}>
              Mark as Pending
            </button>
            <button className="btn-secondary" onClick={handleCreateResolutionGroup}>
              Create Resolution Group Chat
            </button>
            <button className="btn-secondary" onClick={handleReplyToReporter}>
              Reply to Reporter
            </button>
          </div>
        </div>
      </div>

      <div style={{ margin: '32px 0 16px 0' }}>
        <h2 style={{ fontSize: '22px' }}>Complete Email Conversation & Replies Exchanged</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Showing all messages exchanged in this email thread to give full context to the Admin.
        </p>

        {thread && thread.length > 0 ? (
          <div className="thread-container" style={{ maxHeight: 'none', overflow: 'visible' }}>
            {thread.map((msg, index) => (
              <div key={msg.id} style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '20px 24px',
                marginBottom: '16px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="avatar">{msg.sender_name?.[0]?.toUpperCase() || 'U'}</div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '15px' }}>{msg.sender_name}</div>
                      <div className="mono" style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                        From: {msg.sender_email} → To: {msg.receiver_email}
                      </div>
                    </div>
                  </div>
                  <div className="mono" style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    Message #{index + 1} • {new Date(msg.created_at).toLocaleString()}
                  </div>
                </div>

                <div style={{ fontSize: '15.5px', whiteSpace: 'pre-wrap', lineHeight: '1.6', marginTop: '12px' }}>
                  {msg.body}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="email-detail">
            <p className="email-detail-body">{report.body}</p>
          </div>
        )}
      </div>
    </div>
  );
}