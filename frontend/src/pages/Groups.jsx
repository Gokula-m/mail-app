import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Groups() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [groups, setGroups] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState([]);

  const loadGroups = () => api.get('/groups').then(res => setGroups(res.data.groups));

  useEffect(() => {
    loadGroups();
    if (user?.role === 'admin') {
      api.get('/admin/users').then(res => setAllUsers(res.data.users.filter(u => u.id !== user.id)));
    }
  }, [user]);

  const toggleMember = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.post('/groups', { name, memberIds: selected });
    showToast('Group created.');
    setName(''); setSelected([]); setShowForm(false);
    loadGroups();
  };

  return (
    <div>
      <h1 className="page-title">Groups</h1>

      {user?.role === 'admin' && (
        showForm ? (
          <form onSubmit={handleCreate} className="form-card" style={{marginBottom: '24px'}}>
            <label>Group name</label>
            <input value={name} onChange={e => setName(e.target.value)} required />
            <label>Members</label>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px'}}>
              {allUsers.map(u => (
                <label key={u.id} style={{display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 400, fontSize: '13px'}}>
                  <input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggleMember(u.id)} style={{width: 'auto'}} />
                  {u.name}
                </label>
              ))}
            </div>
            <div style={{display: 'flex', gap: '8px', marginTop: '20px'}}>
              <button type="submit" className="btn-primary" style={{marginTop: 0}}>Create group</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <button className="btn-secondary" style={{marginBottom: '20px'}} onClick={() => setShowForm(true)}>+ Create group</button>
        )
      )}

      {groups.length === 0 ? (
        <p className="empty-state">No groups yet.</p>
      ) : (
        <ul className="email-list">
          {groups.map(g => (
            <li key={g.id}>
              <Link to={`/groups/${g.id}`} className="email-row">
                <span className="email-subject">{g.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}