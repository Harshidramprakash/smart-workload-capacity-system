// src/App.jsx - Main Application with Routes
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Register from './pages/Register';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import TeamManagement from './pages/admin/TeamManagement';
import SystemSettings from './pages/admin/SystemSettings';

// Manager Pages
import ManagerDashboard from './pages/manager/ManagerDashboard';
import Projects from './pages/manager/Projects';
import Tasks from './pages/manager/Tasks';
import CreateTask from './pages/manager/CreateTask';
import CapacityAnalysis from './pages/manager/CapacityAnalysis';
import TeamWorkload from './pages/manager/TeamWorkload';
import WorkloadReports from './pages/manager/WorkloadReports';

// Employee Pages
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import MyTasks from './pages/employee/MyTasks';
import UpdateAvailability from './pages/employee/UpdateAvailability';

// HR Pages
import HRDashboard from './pages/hr/HRDashboard';
import EmployeeWorkload from './pages/hr/EmployeeWorkload';
import HRReports from './pages/hr/HRReports';

/**
 * Protected Route component - checks authentication and role
 */
const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, loading, role } = useAuth();

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(role)) {
    // Redirect to appropriate dashboard based on role
    const dashboardRoutes = {
      'Admin': '/admin',
      'Project Manager': '/manager',
      'Employee': '/employee',
      'HR Manager': '/hr'
    };
    return <Navigate to={dashboardRoutes[role] || '/login'} replace />;
  }

  return children;
};

function App() {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  // Determine home redirect based on role
  const getHomeRedirect = () => {
    if (!isAuthenticated) return '/login';
    const routes = {
      'Admin': '/admin',
      'Project Manager': '/manager',
      'Employee': '/employee',
      'HR Manager': '/hr'
    };
    return routes[role] || '/login';
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={isAuthenticated ? <Navigate to={getHomeRedirect()} replace /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to={getHomeRedirect()} replace /> : <Register />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute roles={['Admin']}><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="teams" element={<TeamManagement />} />
        <Route path="settings" element={<SystemSettings />} />
        <Route path="reports" element={<WorkloadReports />} />
      </Route>

      {/* Project Manager Routes */}
      <Route path="/manager" element={<ProtectedRoute roles={['Project Manager', 'Admin']}><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<ManagerDashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="create-task" element={<CreateTask />} />
        <Route path="capacity" element={<CapacityAnalysis />} />
        <Route path="team-workload" element={<TeamWorkload />} />
        <Route path="reports" element={<WorkloadReports />} />
      </Route>

      {/* Employee Routes */}
      <Route path="/employee" element={<ProtectedRoute roles={['Employee']}><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<EmployeeDashboard />} />
        <Route path="tasks" element={<MyTasks />} />
        <Route path="availability" element={<UpdateAvailability />} />
      </Route>

      {/* HR Routes */}
      <Route path="/hr" element={<ProtectedRoute roles={['HR Manager', 'Admin']}><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<HRDashboard />} />
        <Route path="workload" element={<EmployeeWorkload />} />
        <Route path="reports" element={<HRReports />} />
      </Route>

      {/* Default redirect */}
      <Route path="*" element={<Navigate to={getHomeRedirect()} replace />} />
    </Routes>
  );
}

export default App;
