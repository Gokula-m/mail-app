import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function GroupChat() {
  const { id } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');

  const loadMessages = () => api.get(`/groups/${id}/messages`).then(res => setMessages(res.data.messages));

  useEffect(() => { loadMessages(); }, [id]);

  const handleSend = async (e) => {
    e.preventDefault();
    await api.post(`/groups/${id}/messages`, { body });
    setBody('');
    loadMessages();
  };

  return (
    <div>
      <h1 className="page-title">Group Chat</h1>
      <div className="thread-container">
        {messages.map(m => (
          <div key={m.id} className={`thread-bubble ${m.sender_id === user.id ? 'mine' : 'theirs'}`}>
            <div className="thread-sender mono">{m.sender_name}</div>
            <div>{m.body}</div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} className="reply-box">
        <input placeholder="Message the group..." value={body} onChange={e => setBody(e.target.value)} required />
        <button type="submit" className="btn-primary" style={{marginTop: 0}}>Send</button>
      </form>
    </div>
  );
}