// src/pages/manager/Projects.jsx - Project Management
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectForm, setProjectForm] = useState({ project_name: '', description: '', start_date: '', end_date: '', status: 'Planning' });
  const [sprintForm, setSprintForm] = useState({ sprint_name: '', start_date: '', end_date: '', goal: '', status: 'Planning' });
  const [error, setError] = useState('');
  const { addToast } = useToast();

  const fetchData = async () => {
    try { const res = await api.get('/projects'); setProjects(res.data); } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleProjectSubmit = async (e) => {
    e.preventDefault(); setError('');
    try { 
      await api.post('/projects', projectForm); 
      setShowProjectModal(false); 
      fetchData(); 
      addToast('Project created successfully', 'success');
    }
    catch (err) { setError(err.response?.data?.message || 'Failed to create project.'); }
  };

  const viewSprints = async (project) => {
    setSelectedProject(project);
    try { const res = await api.get(`/sprints?project_id=${project._id}`); setSprints(res.data); }
    catch (err) { console.error(err); }
  };

  const handleSprintSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      await api.post('/sprints', { ...sprintForm, project_id: selectedProject._id });
      setShowSprintModal(false);
      const res = await api.get(`/sprints?project_id=${selectedProject._id}`);
      setSprints(res.data);
      addToast('Sprint created successfully', 'success');
    } catch (err) { setError(err.response?.data?.message || 'Failed to create sprint.'); }
  };

  const statusBadge = (s) => {
    const map = { Planning: 'badge-planning', Active: 'badge-active', Completed: 'badge-completed', 'On Hold': 'badge-cancelled' };
    return map[s] || '';
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div><span className="loading-text">Loading projects...</span></div>;

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h1>Projects</h1>
          <p>Manage your projects and sprints</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setProjectForm({ project_name: '', description: '', start_date: '', end_date: '', status: 'Planning' }); setShowProjectModal(true); setError(''); }}>+ New Project</button>
      </div>

      <div className="grid-2">
        {/* Projects List */}
        <div className="card">
          <div className="card-header"><h3>All Projects</h3></div>
          <div className="table-container">
            <table>
              <thead><tr><th>Project</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {projects.map(p => (
                  <tr key={p._id} style={{ cursor: 'pointer', background: selectedProject?._id === p._id ? 'var(--bg)' : 'transparent' }} onClick={() => viewSprints(p)}>
                    <td><strong>{p.project_name}</strong><br/><small style={{ color: 'var(--text-light)' }}>{p.description?.substring(0, 50)}</small></td>
                    <td><span className={`badge ${statusBadge(p.status)}`}>{p.status}</span></td>
                    <td><button className="btn btn-sm btn-accent" onClick={(e) => { e.stopPropagation(); viewSprints(p); }}>Sprints</button></td>
                  </tr>
                ))}
                {projects.length === 0 && (
                  <tr>
                    <td colSpan="3" className="empty-state">
                      <div className="empty-icon">📁</div>
                      <p>No projects yet</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sprints for Selected Project */}
        <div className="card">
          <div className="card-header">
            <h3>{selectedProject ? `Sprints - ${selectedProject.project_name}` : 'Select a project'}</h3>
            {selectedProject && <button className="btn btn-sm btn-primary" onClick={() => { setSprintForm({ sprint_name: '', start_date: '', end_date: '', goal: '', status: 'Planning' }); setShowSprintModal(true); setError(''); }}>+ Sprint</button>}
          </div>
          {!selectedProject ? (
            <div className="empty-state">
              <div className="empty-icon">🎯</div>
              <p>Click "Sprints" on a project to view its sprints.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead><tr><th>Sprint</th><th>Dates</th><th>Status</th></tr></thead>
                <tbody>
                  {sprints.map(s => (
                    <tr key={s._id}>
                      <td><strong>{s.sprint_name}</strong><br/><small style={{ color: 'var(--text-light)' }}>{s.goal}</small></td>
                      <td style={{ fontSize: '0.8rem' }}>{new Date(s.start_date).toLocaleDateString()} - {new Date(s.end_date).toLocaleDateString()}</td>
                      <td><span className={`badge ${statusBadge(s.status)}`}>{s.status}</span></td>
                    </tr>
                  ))}
                  {sprints.length === 0 && <tr><td colSpan="3" className="empty-state"><p>No sprints found</p></td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Project Modal */}
      {showProjectModal && (
        <div className="modal-overlay" onClick={() => setShowProjectModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Project</h3>
              <button className="modal-close" onClick={() => setShowProjectModal(false)} aria-label="Close">✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleProjectSubmit}>
              <div className="form-group">
                <label>Project Name <span className="required">*</span></label>
                <input className="form-control" value={projectForm.project_name} onChange={(e) => setProjectForm({ ...projectForm, project_name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-control" value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date <span className="required">*</span></label>
                  <input type="date" className="form-control" value={projectForm.start_date} onChange={(e) => setProjectForm({ ...projectForm, start_date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input type="date" className="form-control" value={projectForm.end_date} onChange={(e) => setProjectForm({ ...projectForm, end_date: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowProjectModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sprint Modal */}
      {showSprintModal && (
        <div className="modal-overlay" onClick={() => setShowSprintModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Sprint</h3>
              <button className="modal-close" onClick={() => setShowSprintModal(false)} aria-label="Close">✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSprintSubmit}>
              <div className="form-group">
                <label>Sprint Name <span className="required">*</span></label>
                <input className="form-control" value={sprintForm.sprint_name} onChange={(e) => setSprintForm({ ...sprintForm, sprint_name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Goal</label>
                <textarea className="form-control" value={sprintForm.goal} onChange={(e) => setSprintForm({ ...sprintForm, goal: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date <span className="required">*</span></label>
                  <input type="date" className="form-control" value={sprintForm.start_date} onChange={(e) => setSprintForm({ ...sprintForm, start_date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>End Date <span className="required">*</span></label>
                  <input type="date" className="form-control" value={sprintForm.end_date} onChange={(e) => setSprintForm({ ...sprintForm, end_date: e.target.value })} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowSprintModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Sprint</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
