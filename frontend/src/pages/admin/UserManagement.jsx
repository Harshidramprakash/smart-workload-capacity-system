// src/pages/admin/UserManagement.jsx - User Management (Admin)
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const UserManagement = () => {
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: 'Password@123', phone: '', role: 'Employee', designation: '' });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([api.get('/users'), api.get('/roles')]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editId) {
        await api.put(`/users/${editId}`, form);
        addToast('User updated successfully.', 'success');
      } else {
        await api.post('/users', form);
        addToast('User created successfully.', 'success');
      }
      setShowModal(false);
      setEditId(null);
      setForm({ name: '', email: '', password: 'Password@123', phone: '', role: 'Employee', designation: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed.');
    }
  };

  const handleEdit = (user) => {
    setEditId(user._id);
    setForm({ name: user.name, email: user.email, password: '', phone: user.phone || '', role: user.role, designation: '' });
    setShowModal(true);
    setError('');
  };

  const handleToggleStatus = async (user) => {
    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      await api.put(`/users/${user._id}`, { status: newStatus });
      addToast(`${user.name} ${newStatus === 'active' ? 'enabled' : 'disabled'}.`, 'success');
      fetchData();
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div><span className="loading-text">Loading users...</span></div>;

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h1>User Management</h1>
          <p>Manage system users and their roles</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditId(null); setForm({ name: '', email: '', password: 'Password@123', phone: '', role: 'Employee', designation: '' }); setShowModal(true); setError(''); }}>
          + Add User
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td><strong>{user.name}</strong></td>
                  <td>{user.email}</td>
                  <td><span className="badge badge-normal">{user.role}</span></td>
                  <td><span className={`badge ${user.status === 'active' ? 'badge-active' : 'badge-cancelled'}`}>{user.status}</span></td>
                  <td>
                    <div className="btn-group">
                      <button className="btn btn-sm btn-outline" onClick={() => handleEdit(user)}>Edit</button>
                      <button className={`btn btn-sm ${user.status === 'active' ? 'btn-warning' : 'btn-success'}`} onClick={() => handleToggleStatus(user)}>
                        {user.status === 'active' ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan="5" className="empty-state"><p>No users found</p></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Form Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? 'Edit User' : 'Create User'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Close">✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full Name <span className="required">*</span></label>
                <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Enter full name" />
              </div>
              {!editId && (
                <div className="form-group">
                  <label>Email <span className="required">*</span></label>
                  <input type="email" className="form-control" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="user@example.com" />
                </div>
              )}
              {!editId && (
                <div className="form-group">
                  <label>Password</label>
                  <input type="password" className="form-control" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  <div className="form-hint">Default: Password@123</div>
                </div>
              )}
              <div className="form-group">
                <label>Phone</label>
                <input className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" />
              </div>
              <div className="form-group">
                <label>Role <span className="required">*</span></label>
                <select className="form-control" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="Admin">Admin</option>
                  <option value="Project Manager">Project Manager</option>
                  <option value="Employee">Employee</option>
                  <option value="HR Manager">HR Manager</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
