import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function ReportDetail() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/admin/reports/${id}`).then(res => setReport(res.data.report));
  }, [id]);

  if (!report) return <p>Loading...</p>;

  const handleReply = () => {
    // Reuses Compose, prefilled via URL query params
    navigate(`/compose?to=${encodeURIComponent(report.reporter_email)}&subject=${encodeURIComponent('Re: Your report on "' + report.subject + '"')}`);
  };

  return (
    <div className="email-detail">
      <h2>Report on: {report.subject}</h2>
      <p className="email-detail-meta mono">Reported by: {report.reporter_name} ({report.reporter_email})</p>
      <p className="email-detail-meta mono">Original sender: {report.sender_name} ({report.sender_email})</p>
      <p className="email-detail-summary">Reason: {report.reason}</p>
      {report.file_name && <p className="email-detail-meta">Attached: {report.file_name}</p>}
      <p className="email-detail-body">{report.body}</p>
      <div className="email-detail-actions">
        <button className="btn-primary" onClick={handleReply}>Reply to reporter</button>
      </div>
    </div>
  );
}