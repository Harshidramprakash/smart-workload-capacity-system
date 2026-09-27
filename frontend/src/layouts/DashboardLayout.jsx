// src/layouts/DashboardLayout.jsx - Main Dashboard Layout with Sidebar
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

/**
 * Dashboard layout with sidebar navigation, top bar, breadcrumbs, and notification bell.
 * Sidebar items change based on user role.
 */
const DashboardLayout = () => {
  const { user, logout, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

  // Load notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      } catch (err) { /* silent */ }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close notifications dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) { /* silent */ }
  };

  // Build sidebar nav items based on role
  const getNavItems = () => {
    switch (role) {
      case 'Admin':
        return [
          { section: 'Main' },
          { to: '/admin', label: '📊 Dashboard', end: true },
          { section: 'Management' },
          { to: '/admin/users', label: '👤 User Management' },
          { to: '/admin/teams', label: '👥 Team Management' },
          { to: '/admin/settings', label: '⚙️ System Settings' },
          { section: 'Analytics' },
          { to: '/admin/reports', label: '📋 Reports' },
        ];
      case 'Project Manager':
        return [
          { section: 'Main' },
          { to: '/manager', label: '📊 Dashboard', end: true },
          { section: 'Project' },
          { to: '/manager/projects', label: '📁 Projects' },
          { to: '/manager/tasks', label: '📝 Tasks' },
          { to: '/manager/create-task', label: '➕ Create Task' },
          { section: 'Workload' },
          { to: '/manager/capacity', label: '📈 Capacity Analysis' },
          { to: '/manager/team-workload', label: '👥 Team Workload' },
          { section: 'Analytics' },
          { to: '/manager/reports', label: '📋 Reports' },
        ];
      case 'Employee':
        return [
          { section: 'Main' },
          { to: '/employee', label: '📊 Dashboard', end: true },
          { section: 'Work' },
          { to: '/employee/tasks', label: '📝 My Tasks' },
          { to: '/employee/availability', label: '📅 Update Availability' },
        ];
      case 'HR Manager':
        return [
          { section: 'Main' },
          { to: '/hr', label: '📊 Dashboard', end: true },
          { section: 'Workload' },
          { to: '/hr/workload', label: '📈 Employee Workload' },
          { section: 'Analytics' },
          { to: '/hr/reports', label: '📋 Reports' },
        ];
      default:
        return [];
    }
  };

  // Breadcrumb generation
  const getBreadcrumbs = () => {
    const parts = location.pathname.split('/').filter(Boolean);
    const labels = {
      admin: 'Admin', manager: 'Manager', employee: 'Employee', hr: 'HR',
      users: 'Users', teams: 'Teams', settings: 'Settings',
      projects: 'Projects', tasks: 'Tasks', 'create-task': 'Create Task',
      capacity: 'Capacity Analysis', 'team-workload': 'Team Workload',
      reports: 'Reports', availability: 'Availability', workload: 'Employee Workload'
    };
    return parts.map((part, i) => ({
      label: labels[part] || part.charAt(0).toUpperCase() + part.slice(1),
      path: '/' + parts.slice(0, i + 1).join('/'),
      isLast: i === parts.length - 1
    }));
  };

  const portalTitle = role === 'Admin' ? 'Admin Panel' :
    role === 'Project Manager' ? 'Project Manager' :
    role === 'Employee' ? 'Employee Portal' :
    role === 'HR Manager' ? 'HR Dashboard' : 'Dashboard';

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="app-layout">
      {/* Sidebar Overlay (mobile) */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} role="navigation" aria-label="Main navigation">
        <div className="sidebar-brand">
          <h2>⚡ Smart Workload</h2>
          <small>Capacity Analysis System</small>
        </div>
        <ul className="sidebar-nav">
          {getNavItems().map((item, i) => {
            if (item.section) {
              return <li key={i} className="sidebar-section-title">{item.section}</li>;
            }
            return (
              <li key={i}>
                <NavLink to={item.to} end={item.end} className={({ isActive }) => isActive ? 'active' : ''}>
                  {item.label}
                </NavLink>
              </li>
            );
          })}
          <li className="sidebar-section-title">Account</li>
          <li><button onClick={handleLogout} aria-label="Log out">🚪 Logout</button></li>
        </ul>
      </aside>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Top Navigation */}
        <header className="topnav">
          <div className="topnav-left">
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle navigation menu"
            >
              ☰
            </button>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)' }}>{portalTitle}</div>
              {breadcrumbs.length > 1 && (
                <nav className="breadcrumbs" aria-label="Breadcrumb">
                  {breadcrumbs.map((crumb, i) => (
                    <span key={crumb.path}>
                      {i > 0 && <span className="breadcrumb-sep">›</span>}
                      {crumb.isLast ? (
                        <span className="breadcrumb-current">{crumb.label}</span>
                      ) : (
                        <NavLink to={crumb.path}>{crumb.label}</NavLink>
                      )}
                    </span>
                  ))}
                </nav>
              )}
            </div>
          </div>
          <div className="topnav-right">
            {/* Notification Bell */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <div
                className="notification-bell"
                onClick={() => setShowNotifications(!showNotifications)}
                role="button"
                tabIndex={0}
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                onKeyDown={(e) => e.key === 'Enter' && setShowNotifications(!showNotifications)}
              >
                🔔
                {unreadCount > 0 && <span className="notification-count">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </div>
              {showNotifications && (
                <div className="notification-dropdown">
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.875rem' }}>Notifications</strong>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="btn btn-sm btn-outline" style={{ fontSize: '0.7rem' }}>Mark all read</button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-light)', fontSize: '0.85rem' }}>
                      No notifications
                    </div>
                  ) : (
                    notifications.slice(0, 10).map(n => (
                      <div key={n._id} className={`notification-item ${!n.is_read ? 'unread' : ''}`} onClick={() => markAsRead(n._id)}>
                        <h4>{n.title}</h4>
                        <p>{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            {/* User Info */}
            <div className="user-info">
              <div>
                <div className="name">{user?.name}</div>
                <div className="role">{role}</div>
              </div>
              <div className="user-avatar" aria-hidden="true">{initials}</div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
