// src/pages/admin/TeamManagement.jsx - Team Management (Admin)
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const TeamManagement = () => {
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [teamForm, setTeamForm] = useState({ team_name: '', description: '' });
  const [memberForm, setMemberForm] = useState({ user_id: '', role_in_team: 'Member' });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const { addToast } = useToast();

  const fetchData = async () => {
    try {
      const [teamsRes, usersRes] = await Promise.all([api.get('/teams'), api.get('/users')]);
      setTeams(teamsRes.data);
      setUsers(usersRes.data.filter(u => u.status === 'active'));
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleTeamSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      if (editId) { 
        await api.put(`/teams/${editId}`, teamForm); 
        addToast('Team updated successfully.', 'success');
      } else { 
        await api.post('/teams', teamForm); 
        addToast('Team created successfully.', 'success');
      }
      setShowTeamModal(false); setEditId(null);
      setTeamForm({ team_name: '', description: '' }); fetchData();
    } catch (err) { setError(err.response?.data?.message || 'Operation failed.'); }
  };

  const viewMembers = async (team) => {
    setSelectedTeam(team);
    try {
      const res = await api.get(`/teams/${team._id}/members`);
      setMembers(res.data);
      setShowMemberModal(true);
    } catch (err) { console.error(err); }
  };

  const addMember = async (e) => {
    e.preventDefault(); setError('');
    try {
      await api.post(`/teams/${selectedTeam._id}/members`, memberForm);
      const res = await api.get(`/teams/${selectedTeam._id}/members`);
      setMembers(res.data);
      setMemberForm({ user_id: '', role_in_team: 'Member' }); fetchData();
      addToast('Member added successfully.', 'success');
    } catch (err) { setError(err.response?.data?.message || 'Failed to add member.'); }
  };

  const removeMember = async (userId) => {
    try {
      await api.delete(`/teams/${selectedTeam._id}/members/${userId}`);
      const res = await api.get(`/teams/${selectedTeam._id}/members`);
      setMembers(res.data); fetchData();
      addToast('Member removed.', 'success');
    } catch (err) { console.error(err); addToast('Failed to remove member.', 'error'); }
  };

  const confirmDelete = (team) => {
    setSelectedTeam(team);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try { 
      await api.delete(`/teams/${selectedTeam._id}`); 
      setShowDeleteModal(false);
      fetchData(); 
      addToast('Team deleted successfully.', 'success');
    } catch (err) { 
      console.error(err); 
      setShowDeleteModal(false);
      addToast('Failed to delete team.', 'error');
    }
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div><span className="loading-text">Loading teams...</span></div>;

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h1>Team Management</h1>
          <p>Create and manage teams</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditId(null); setTeamForm({ team_name: '', description: '' }); setShowTeamModal(true); setError(''); }}>+ Add Team</button>
      </div>

      <div className="stats-grid">
        {teams.map(team => (
          <div className="card" key={team._id}>
            <h3>{team.team_name}</h3>
            <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', margin: '8px 0' }}>{team.description || 'No description'}</p>
            <p style={{ fontWeight: 600, marginBottom: '12px' }}>{team.memberCount || 0} Members</p>
            <div className="btn-group">
              <button className="btn btn-sm btn-accent" onClick={() => viewMembers(team)}>Members</button>
              <button className="btn btn-sm btn-outline" onClick={() => { setEditId(team._id); setTeamForm({ team_name: team.team_name, description: team.description }); setShowTeamModal(true); }}>Edit</button>
              <button className="btn btn-sm btn-danger" onClick={() => confirmDelete(team)}>Delete</button>
            </div>
          </div>
        ))}
        {teams.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-icon">👥</div>
            <p>No teams found</p>
          </div>
        )}
      </div>

      {/* Team Form Modal */}
      {showTeamModal && (
        <div className="modal-overlay" onClick={() => setShowTeamModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? 'Edit Team' : 'Create Team'}</h3>
              <button className="modal-close" onClick={() => setShowTeamModal(false)} aria-label="Close">✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleTeamSubmit}>
              <div className="form-group">
                <label>Team Name <span className="required">*</span></label>
                <input className="form-control" value={teamForm.team_name} onChange={(e) => setTeamForm({ ...teamForm, team_name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-control" value={teamForm.description} onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowTeamModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Management Modal */}
      {showMemberModal && selectedTeam && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>{selectedTeam.team_name} - Members</h3>
              <button className="modal-close" onClick={() => setShowMemberModal(false)} aria-label="Close">✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={addMember} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <select className="form-control" value={memberForm.user_id} onChange={(e) => setMemberForm({ ...memberForm, user_id: e.target.value })} required style={{ flex: 1 }}>
                <option value="">Select User</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
              </select>
              <select className="form-control" value={memberForm.role_in_team} onChange={(e) => setMemberForm({ ...memberForm, role_in_team: e.target.value })} style={{ width: '120px' }}>
                <option value="Member">Member</option>
                <option value="Lead">Lead</option>
              </select>
              <button type="submit" className="btn btn-primary">Add</button>
            </form>
            <div className="table-container">
              <table>
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Action</th></tr></thead>
                <tbody>
                  {members.map(m => (
                    <tr key={m._id}>
                      <td><strong>{m.user_id?.name}</strong></td>
                      <td>{m.user_id?.email}</td>
                      <td><span className="badge badge-normal">{m.role_in_team}</span></td>
                      <td><button className="btn btn-sm btn-danger" onClick={() => removeMember(m.user_id?._id)}>Remove</button></td>
                    </tr>
                  ))}
                  {members.length === 0 && <tr><td colSpan="4" className="empty-state"><p>No members yet</p></td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedTeam && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Confirm Deletion</h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)} aria-label="Close">✕</button>
            </div>
            <p style={{ marginBottom: '20px' }}>Are you sure you want to delete the team <strong>{selectedTeam.team_name}</strong>? This action cannot be undone.</p>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete Team</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
