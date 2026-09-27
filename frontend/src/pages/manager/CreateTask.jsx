// src/pages/manager/CreateTask.jsx - Create Task Page
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const CreateTask = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [projects, setProjects] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [form, setForm] = useState({ sprint_id: '', title: '', description: '', priority: 'Medium', estimated_effort: '', due_date: '' });
  const [selectedProject, setSelectedProject] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try { const res = await api.get('/projects'); setProjects(res.data); } catch (err) { console.error(err); }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      const fetchSprints = async () => {
        try { const res = await api.get(`/sprints?project_id=${selectedProject}`); setSprints(res.data); }
        catch (err) { console.error(err); }
      };
      fetchSprints();
    } else { setSprints([]); }
  }, [selectedProject]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await api.post('/tasks', { ...form, estimated_effort: Number(form.estimated_effort) || 0 });
      addToast('Task created successfully!', 'success');
      navigate('/manager/tasks');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task.');
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header"><h1>Create Task</h1><p>Create a new task and define estimated effort</p></div>

      <div className="card" style={{ maxWidth: '700px' }}>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Project <span className="required">*</span></label>
            <select className="form-control" value={selectedProject} onChange={(e) => { setSelectedProject(e.target.value); setForm({ ...form, sprint_id: '' }); }} required>
              <option value="">Select Project</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.project_name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Sprint <span className="required">*</span></label>
            <select className="form-control" value={form.sprint_id} onChange={(e) => setForm({ ...form, sprint_id: e.target.value })} required disabled={!selectedProject}>
              <option value="">Select Sprint</option>
              {sprints.map(s => <option key={s._id} value={s._id}>{s.sprint_name}</option>)}
            </select>
            {!selectedProject && <div className="form-hint">Select a project first to see available sprints</div>}
          </div>
          <div className="form-group">
            <label>Task Title <span className="required">*</span></label>
            <input className="form-control" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Enter task title" required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-control" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the task requirements and acceptance criteria" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Priority <span className="required">*</span></label>
              <select className="form-control" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option>
              </select>
            </div>
            <div className="form-group">
              <label>Estimated Effort (hours)</label>
              <input type="number" className="form-control" value={form.estimated_effort} onChange={(e) => setForm({ ...form, estimated_effort: e.target.value })} placeholder="e.g. 4" min="0" step="0.5" />
              <div className="form-hint">Used for capacity-based assignment recommendations</div>
            </div>
          </div>
          <div className="form-group">
            <label>Due Date</label>
            <input type="date" className="form-control" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create Task'}</button>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/manager/tasks')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTask;
