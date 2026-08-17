import { useParams, useNavigate, Link } from 'react-router-dom';
import EmailDetail from '../components/EmailDetail';

export default function EmailView() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div style={{ width: '100%', maxWidth: '960px' }}>
      <Link to="/inbox" className="back-btn">
        ← Back to Inbox
      </Link>
      <EmailDetail emailId={id} onDeleted={() => navigate('/inbox')} />
    </div>
  );
}