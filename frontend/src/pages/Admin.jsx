import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext'

export default function Admin() {
  const [users, setUsers] = useState([]);
  const { showToast } = useToast();

  const loadUsers = () => {
    api.get('/admin/users').then(res => setUsers(res.data.users));
  };

  useEffect(() => { loadUsers(); }, []);

  const handleDeactivate = async (id) => {
    await api.patch(`/admin/users/${id}/deactivate`);
    loadUsers();
    showToast('User deactivated.');
  };

  return (
    <div>
      <h1 className="page-title">Admin — Users</h1>
      <table className="admin-table">
        <thead>
          <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td className="mono">{u.email}</td>
              <td>{u.role}</td>
              <td>
                <span className={`status-dot ${u.is_active ? 'active' : 'inactive'}`}></span>
                {u.is_active ? 'Active' : 'Deactivated'}
              </td>
              <td>
                {u.is_active && u.role !== 'admin' && (
                  <button className="btn-danger" onClick={() => handleDeactivate(u.id)}>Deactivate</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}