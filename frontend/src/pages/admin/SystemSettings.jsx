// src/pages/admin/SystemSettings.jsx - System Settings (Admin)
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const SystemSettings = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/settings');
        setSettings(res.data);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetch();
  }, []);

  const handleChange = (key, value) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings', { settings: settings.map(s => ({ key: s.key, value: s.value, description: s.description })) });
      addToast('Settings saved successfully!', 'success');
    } catch (err) { 
      console.error(err); 
      addToast('Failed to save settings.', 'error');
    }
    setSaving(false);
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div><span className="loading-text">Loading settings...</span></div>;

  return (
    <div>
      <div className="page-header">
        <h1>System Settings</h1>
        <p>Configure workload thresholds and system parameters</p>
      </div>
      <div className="card" style={{ maxWidth: '600px' }}>
        <div className="card-header"><h3>Workload Thresholds</h3></div>
        <div style={{ paddingBottom: '16px' }}>
          {settings.map(s => (
            <div className="form-group" key={s.key}>
              <label>{s.description || s.key}</label>
              <input type="number" className="form-control" value={s.value} onChange={(e) => handleChange(s.key, e.target.value)} />
            </div>
          ))}
        </div>
        <div className="form-actions">
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
