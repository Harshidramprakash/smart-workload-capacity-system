// seed.js - Database Seed Script with Realistic Software Engineering Data
// Run: node seed.js
// WARNING: This clears existing demo data and seeds fresh software development domain data.

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

// Import all shared models
const User = require('./shared/models/User');
const Role = require('./shared/models/Role');
const UserRole = require('./shared/models/UserRole');
const Team = require('./shared/models/Team');
const TeamMember = require('./shared/models/TeamMember');
const Project = require('./shared/models/Project');
const Sprint = require('./shared/models/Sprint');
const Task = require('./shared/models/Task');
const Employee = require('./shared/models/Employee');
const Availability = require('./shared/models/Availability');
const Workload = require('./shared/models/Workload');
const CapacityAnalysis = require('./shared/models/CapacityAnalysis');
const TaskAssignment = require('./shared/models/TaskAssignment');
const TimeLog = require('./shared/models/TimeLog');
const Notification = require('./shared/models/Notification');
const SystemSetting = require('./shared/models/SystemSetting');
const Report = require('./shared/models/Report');

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_workload';
    console.log(`Connecting to MongoDB: ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected successfully.');

    console.log('Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}), Role.deleteMany({}), UserRole.deleteMany({}),
      Team.deleteMany({}), TeamMember.deleteMany({}), Project.deleteMany({}),
      Sprint.deleteMany({}), Task.deleteMany({}), Employee.deleteMany({}),
      Availability.deleteMany({}), Workload.deleteMany({}), CapacityAnalysis.deleteMany({}),
      TaskAssignment.deleteMany({}), TimeLog.deleteMany({}), Notification.deleteMany({}),
      SystemSetting.deleteMany({}), Report.deleteMany({})
    ]);

    // --- 1. Roles ---
    console.log('Creating standard system roles...');
    const adminRole = await Role.create({ role_name: 'Admin', description: 'System administrator with full administrative access' });
    const pmRole = await Role.create({ role_name: 'Project Manager', description: 'Manages projects, sprints, and task allocations' });
    const empRole = await Role.create({ role_name: 'Employee', description: 'Software engineer who works on assigned sprint tasks' });
    const hrRole = await Role.create({ role_name: 'HR Manager', description: 'Monitors workload capacity, team health, and utilization reports' });

    // --- 2. Users ---
    console.log('Creating software engineering team accounts...');
    const password = 'Password@123';

    const admin = await User.create({ name: 'System Admin', email: 'admin@example.com', password, phone: '9876543210', status: 'active' });
    const manager = await User.create({ name: 'Priya Sharma', email: 'manager@example.com', password, phone: '9876543211', status: 'active' });
    const emp1 = await User.create({ name: 'Rahul Kumar', email: 'employee1@example.com', password, phone: '9876543212', status: 'active' });
    const emp2 = await User.create({ name: 'Arun Singh', email: 'employee2@example.com', password, phone: '9876543213', status: 'active' });
    const emp3 = await User.create({ name: 'Sneha Patel', email: 'employee3@example.com', password, phone: '9876543214', status: 'active' });
    const emp4 = await User.create({ name: 'Vikram Reddy', email: 'employee4@example.com', password, phone: '9876543215', status: 'active' });
    const emp5 = await User.create({ name: 'Anjali Gupta', email: 'employee5@example.com', password, phone: '9876543216', status: 'active' });
    const hr = await User.create({ name: 'Kavita Iyer', email: 'hr@example.com', password, phone: '9876543217', status: 'active' });

    // --- 3. Assign Roles ---
    await UserRole.create({ user_id: admin._id, role_id: adminRole._id });
    await UserRole.create({ user_id: manager._id, role_id: pmRole._id });
    await UserRole.create({ user_id: emp1._id, role_id: empRole._id });
    await UserRole.create({ user_id: emp2._id, role_id: empRole._id });
    await UserRole.create({ user_id: emp3._id, role_id: empRole._id });
    await UserRole.create({ user_id: emp4._id, role_id: empRole._id });
    await UserRole.create({ user_id: emp5._id, role_id: empRole._id });
    await UserRole.create({ user_id: hr._id, role_id: hrRole._id });

    // --- 4. Employee Profiles ---
    console.log('Creating employee profiles...');
    const employee1 = await Employee.create({ user_id: emp1._id, designation: 'Principal Software Engineer', hire_date: new Date('2022-04-10'), status: 'Active' });
    const employee2 = await Employee.create({ user_id: emp2._id, designation: 'Senior Full Stack Engineer', hire_date: new Date('2022-09-15'), status: 'Active' });
    const employee3 = await Employee.create({ user_id: emp3._id, designation: 'Frontend Specialist (React)', hire_date: new Date('2023-02-01'), status: 'Active' });
    const employee4 = await Employee.create({ user_id: emp4._id, designation: 'Backend Specialist (Node/Mongo)', hire_date: new Date('2023-06-20'), status: 'Active' });
    const employee5 = await Employee.create({ user_id: emp5._id, designation: 'DevOps & QA Engineer', hire_date: new Date('2023-11-10'), status: 'Active' });

    // --- 5. Teams ---
    console.log('Setting up engineering squads...');
    const teamCore = await Team.create({ team_name: 'Core Platform Squad', description: 'Core microservices, auth, and capacity analysis engine' });
    const teamApps = await Team.create({ team_name: 'Product & Integration Squad', description: 'User interfaces, external calendar/HRMS adapters, and reports' });

    await TeamMember.create({ team_id: teamCore._id, user_id: emp1._id, role_in_team: 'Lead' });
    await TeamMember.create({ team_id: teamCore._id, user_id: emp4._id, role_in_team: 'Member' });
    await TeamMember.create({ team_id: teamCore._id, user_id: emp5._id, role_in_team: 'Member' });

    await TeamMember.create({ team_id: teamApps._id, user_id: emp2._id, role_in_team: 'Lead' });
    await TeamMember.create({ team_id: teamApps._id, user_id: emp3._id, role_in_team: 'Member' });

    // --- 6. Software Development Projects ---
    console.log('Creating software development projects...');
    const project1 = await Project.create({
      manager_id: manager._id,
      project_name: 'Smart Workload Capacity Allocation Platform',
      description: 'Distributed microservices platform for real-time workload tracking, capacity analytics, and decision support',
      start_date: new Date('2024-08-01'),
      end_date: new Date('2025-02-28'),
      status: 'Active'
    });

    const project2 = await Project.create({
      manager_id: manager._id,
      project_name: 'Enterprise Integrations & Workflow Automation',
      description: 'Connecting Google/Outlook calendars, HRMS leave systems, and automated email notifications',
      start_date: new Date('2024-09-01'),
      end_date: new Date('2025-04-30'),
      status: 'Active'
    });

    // --- 7. Sprints ---
    console.log('Creating development sprints...');
    const sprint1 = await Sprint.create({
      project_id: project1._id,
      sprint_name: 'Sprint 1 - Foundation & Microservices Core',
      start_date: new Date('2024-08-01'),
      end_date: new Date('2024-08-15'),
      goal: 'Deliver Gateway reverse proxy and User authentication microservice',
      status: 'Completed'
    });

    const sprint2 = await Sprint.create({
      project_id: project1._id,
      sprint_name: 'Sprint 2 - Capacity Analysis Engine',
      start_date: new Date('2024-08-16'),
      end_date: new Date('2024-08-31'),
      goal: 'Implement effective capacity calculations, recommendation engine, and task allocations',
      status: 'Active'
    });

    const sprint3 = await Sprint.create({
      project_id: project1._id,
      sprint_name: 'Sprint 3 - Frontend Dashboards & Workload Reports',
      start_date: new Date('2024-09-01'),
      end_date: new Date('2024-09-15'),
      goal: 'Build interactive dashboards for Manager, Employee, and HR with report exports',
      status: 'Active'
    });

    const sprint4 = await Sprint.create({
      project_id: project2._id,
      sprint_name: 'Sprint 1 - Calendar & HRMS Integration Adapters',
      start_date: new Date('2024-09-01'),
      end_date: new Date('2024-09-15'),
      goal: 'Implement Google Calendar and HRMS leave synchronization adapters',
      status: 'Active'
    });

    // --- 8. Realistic Software Development Tasks ---
    console.log('Creating software engineering tasks...');
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const inTwoWeeks = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

    // Completed Tasks from Sprint 1
    const taskAuth = await Task.create({
      sprint_id: sprint1._id,
      created_by: manager._id,
      title: 'Develop Authentication Module',
      description: 'Implement JWT token generation, role verification middleware, and password hashing with bcrypt',
      priority: 'High',
      estimated_effort: 4,
      actual_effort: 4,
      status: 'Completed',
      due_date: new Date('2024-08-10')
    });

    const taskTaskApi = await Task.create({
      sprint_id: sprint1._id,
      created_by: manager._id,
      title: 'Create Task Allocation API',
      description: 'REST endpoints for creating, assigning, and reassigning sprint tasks with validation',
      priority: 'High',
      estimated_effort: 4,
      actual_effort: 3.5,
      status: 'Completed',
      due_date: new Date('2024-08-14')
    });

    // Active Sprint 2 Tasks
    const taskCapacity = await Task.create({
      sprint_id: sprint2._id,
      created_by: manager._id,
      title: 'Implement Capacity Analysis',
      description: 'Core engine: Effective Capacity = Available - Meetings - Leaves - NonProject, and remaining capacity calculation',
      priority: 'Critical',
      estimated_effort: 5,
      status: 'In Progress',
      due_date: nextWeek
    });

    const taskAvail = await Task.create({
      sprint_id: sprint2._id,
      created_by: manager._id,
      title: 'Implement Availability Tracking',
      description: 'Employee availability tracking with meeting hours, leave deductions, and non-project commitments',
      priority: 'High',
      estimated_effort: 3,
      status: 'Assigned',
      due_date: nextWeek
    });

    const taskReassign = await Task.create({
      sprint_id: sprint2._id,
      created_by: manager._id,
      title: 'Implement Task Reassignment',
      description: 'Workflow enabling managers to reassign tasks and update both origin and destination workloads',
      priority: 'High',
      estimated_effort: 3,
      status: 'Assigned',
      due_date: nextWeek
    });

    // Active Sprint 3 Tasks
    const taskDashboard = await Task.create({
      sprint_id: sprint3._id,
      created_by: manager._id,
      title: 'Build Employee Dashboard',
      description: 'React dashboard with active tasks, logged hours, capacity utilization gauge, and availability update form',
      priority: 'High',
      estimated_effort: 4,
      status: 'In Progress',
      due_date: inTwoWeeks
    });

    const taskReport = await Task.create({
      sprint_id: sprint3._id,
      created_by: manager._id,
      title: 'Develop Workload Report',
      description: 'Detailed analytics on employee utilization, team averages, capacity bottlenecks, and CSV export',
      priority: 'High',
      estimated_effort: 4,
      status: 'Effort Defined',
      due_date: inTwoWeeks
    });

    // Sprint 4 Tasks
    const taskCalendar = await Task.create({
      sprint_id: sprint4._id,
      created_by: manager._id,
      title: 'Integrate Calendar Data',
      description: 'Connect Google Calendar / Outlook APIs to automatically deduct meeting durations from daily available capacity',
      priority: 'Medium',
      estimated_effort: 3,
      status: 'New',
      due_date: inTwoWeeks
    });

    const taskSmtp = await Task.create({
      sprint_id: sprint4._id,
      created_by: manager._id,
      title: 'Configure SMTP Notification Service',
      description: 'Implement nodemailer transport with HTML alert templates for task assignments and overload warnings',
      priority: 'Medium',
      estimated_effort: 2,
      status: 'Assigned',
      due_date: inTwoWeeks
    });

    // --- 9. Task Assignments ---
    console.log('Assigning tasks to engineers...');
    // Completed assignments
    await TaskAssignment.create({ task_id: taskAuth._id, employee_id: employee1._id, assigned_by: manager._id, status: 'Completed' });
    await TaskAssignment.create({ task_id: taskTaskApi._id, employee_id: employee2._id, assigned_by: manager._id, status: 'Completed' });

    // Active assignments
    // Rahul (emp1): Capacity Analysis (5h)
    await TaskAssignment.create({ task_id: taskCapacity._id, employee_id: employee1._id, assigned_by: manager._id, status: 'Active' });

    // Arun (emp2): Task Reassignment (3h)
    await TaskAssignment.create({ task_id: taskReassign._id, employee_id: employee2._id, assigned_by: manager._id, status: 'Active' });

    // Sneha (emp3): Build Employee Dashboard (4h)
    await TaskAssignment.create({ task_id: taskDashboard._id, employee_id: employee3._id, assigned_by: manager._id, status: 'Active' });

    // Vikram (emp4): Availability Tracking (3h)
    await TaskAssignment.create({ task_id: taskAvail._id, employee_id: employee4._id, assigned_by: manager._id, status: 'Active' });

    // Anjali (emp5): SMTP Notification Service (2h)
    await TaskAssignment.create({ task_id: taskSmtp._id, employee_id: employee5._id, assigned_by: manager._id, status: 'Active' });

    // --- 10. Availability Records ---
    console.log('Configuring daily availability & calendar schedules...');
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    // Rahul: 8h available - 2h meetings (Architecture sync + standup) = 6h effective
    await Availability.create({
      employee_id: employee1._id,
      date: todayDate,
      available_hours: 8,
      meeting_hours: 2,
      leave_hours: 0,
      non_project_hours: 0,
      remarks: 'Architecture review & daily standup'
    });

    // Arun: 8h available - 1h meeting - 1h code review = 6h effective
    await Availability.create({
      employee_id: employee2._id,
      date: todayDate,
      available_hours: 8,
      meeting_hours: 1,
      leave_hours: 0,
      non_project_hours: 1,
      remarks: 'Sprint refinement & PR code reviews'
    });

    // Sneha: 8h available - 1.5h sprint planning - 0.5h design review = 6h effective
    await Availability.create({
      employee_id: employee3._id,
      date: todayDate,
      available_hours: 8,
      meeting_hours: 1.5,
      leave_hours: 0,
      non_project_hours: 0.5,
      remarks: 'UI/UX review & sprint planning'
    });

    // Vikram: 8h available - 0.5h standup - 0.5h internal learning = 7h effective
    await Availability.create({
      employee_id: employee4._id,
      date: todayDate,
      available_hours: 8,
      meeting_hours: 0.5,
      leave_hours: 0,
      non_project_hours: 0.5,
      remarks: 'Engineering sync'
    });

    // Anjali: 8h available - 1h standup - 2h partial leave = 5h effective
    await Availability.create({
      employee_id: employee5._id,
      date: todayDate,
      available_hours: 8,
      meeting_hours: 1,
      leave_hours: 2,
      non_project_hours: 0,
      remarks: 'Medical appointment in afternoon'
    });

    // --- 11. Workload Records ---
    console.log('Calculating initial baseline workloads...');
    // Rahul: 5h assigned / 6h effective = 83% (High)
    await Workload.create({ employee_id: employee1._id, date: todayDate, effective_capacity: 6, workload_percentage: 83, utilization_status: 'High' });
    // Arun: 3h assigned / 6h effective = 50% (Low)
    await Workload.create({ employee_id: employee2._id, date: todayDate, effective_capacity: 6, workload_percentage: 50, utilization_status: 'Low' });
    // Sneha: 4h assigned / 6h effective = 67% (Normal)
    await Workload.create({ employee_id: employee3._id, date: todayDate, effective_capacity: 6, workload_percentage: 67, utilization_status: 'Normal' });
    // Vikram: 3h assigned / 7h effective = 43% (Low)
    await Workload.create({ employee_id: employee4._id, date: todayDate, effective_capacity: 7, workload_percentage: 43, utilization_status: 'Low' });
    // Anjali: 2h assigned / 5h effective = 40% (Low)
    await Workload.create({ employee_id: employee5._id, date: todayDate, effective_capacity: 5, workload_percentage: 40, utilization_status: 'Low' });

    // --- 12. System Settings ---
    console.log('Writing system workload threshold settings...');
    await SystemSetting.create({ key: 'workload_low_threshold', value: '60', description: 'Workload percentage <= 60 is Low utilization' });
    await SystemSetting.create({ key: 'workload_normal_threshold', value: '80', description: 'Workload percentage <= 80 is Normal utilization' });
    await SystemSetting.create({ key: 'workload_high_threshold', value: '100', description: 'Workload percentage <= 100 is High utilization, > 100 is Overloaded' });
    await SystemSetting.create({ key: 'default_working_hours', value: '8', description: 'Standard daily working hours per engineer' });

    // --- 13. Notifications ---
    console.log('Generating seed notifications...');
    await Notification.create({
      user_id: emp1._id,
      title: 'New Task Assigned',
      message: 'You have been assigned: "Implement Capacity Analysis" (Priority: Critical, Effort: 5h)',
      type: 'task_assigned'
    });
    await Notification.create({
      user_id: emp1._id,
      title: 'Workload Status: High',
      message: 'Your current workload is 83%. You have 1.0h remaining capacity for today.',
      type: 'info'
    });
    await Notification.create({
      user_id: emp3._id,
      title: 'New Task Assigned',
      message: 'You have been assigned: "Build Employee Dashboard" (Priority: High, Effort: 4h)',
      type: 'task_assigned'
    });
    await Notification.create({
      user_id: emp4._id,
      title: 'New Task Assigned',
      message: 'You have been assigned: "Implement Availability Tracking" (Priority: High, Effort: 3h)',
      type: 'task_assigned'
    });

    console.log('\n======================================================');
    console.log('  SOFTWARE DEVELOPMENT SEED DATA READY!');
    console.log('======================================================');
    console.log('  Password for all accounts: Password@123\n');
    console.log('  Admin:           admin@example.com');
    console.log('  Project Manager: manager@example.com (Priya Sharma)');
    console.log('  Employee 1:      employee1@example.com (Rahul Kumar - 83% High)');
    console.log('  Employee 2:      employee2@example.com (Arun Singh - 50% Low)');
    console.log('  Employee 3:      employee3@example.com (Sneha Patel - 67% Normal)');
    console.log('  Employee 4:      employee4@example.com (Vikram Reddy - 43% Low)');
    console.log('  Employee 5:      employee5@example.com (Anjali Gupta - 40% Low)');
    console.log('  HR Manager:      hr@example.com (Kavita Iyer)');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed Error:', error);
    process.exit(1);
  }
};

seedDatabase();
