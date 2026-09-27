// seed.js - Database Seed Script with Realistic Demo Data
// Run: node seed.js
// WARNING: This will clear all existing data!

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

// Import all models
const User = require('./models/User');
const Role = require('./models/Role');
const UserRole = require('./models/UserRole');
const Team = require('./models/Team');
const TeamMember = require('./models/TeamMember');
const Project = require('./models/Project');
const Sprint = require('./models/Sprint');
const Task = require('./models/Task');
const Employee = require('./models/Employee');
const Availability = require('./models/Availability');
const Workload = require('./models/Workload');
const CapacityAnalysis = require('./models/CapacityAnalysis');
const TaskAssignment = require('./models/TaskAssignment');
const TimeLog = require('./models/TimeLog');
const Notification = require('./models/Notification');
const SystemSetting = require('./models/SystemSetting');

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for seeding...');

    // Clear all collections
    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}), Role.deleteMany({}), UserRole.deleteMany({}),
      Team.deleteMany({}), TeamMember.deleteMany({}), Project.deleteMany({}),
      Sprint.deleteMany({}), Task.deleteMany({}), Employee.deleteMany({}),
      Availability.deleteMany({}), Workload.deleteMany({}), CapacityAnalysis.deleteMany({}),
      TaskAssignment.deleteMany({}), TimeLog.deleteMany({}), Notification.deleteMany({}),
      SystemSetting.deleteMany({})
    ]);

    // --- 1. Create Roles ---
    console.log('Creating roles...');
    const adminRole = await Role.create({ role_name: 'Admin', description: 'System administrator with full access' });
    const pmRole = await Role.create({ role_name: 'Project Manager', description: 'Manages projects, sprints, and task allocation' });
    const empRole = await Role.create({ role_name: 'Employee', description: 'Developer/team member who works on assigned tasks' });
    const hrRole = await Role.create({ role_name: 'HR Manager', description: 'Views workload reports and capacity utilization' });

    // --- 2. Create Users ---
    console.log('Creating users...');
    const password = 'Password@123';

    const admin = await User.create({ name: 'Admin User', email: 'admin@example.com', password, phone: '9876543210', status: 'active' });
    const manager = await User.create({ name: 'Priya Sharma', email: 'manager@example.com', password, phone: '9876543211', status: 'active' });
    const emp1 = await User.create({ name: 'Rahul Kumar', email: 'employee1@example.com', password, phone: '9876543212', status: 'active' });
    const emp2 = await User.create({ name: 'Arun Singh', email: 'employee2@example.com', password, phone: '9876543213', status: 'active' });
    const emp3 = await User.create({ name: 'Sneha Patel', email: 'employee3@example.com', password, phone: '9876543214', status: 'active' });
    const emp4 = await User.create({ name: 'Vikram Reddy', email: 'employee4@example.com', password, phone: '9876543215', status: 'active' });
    const emp5 = await User.create({ name: 'Anjali Gupta', email: 'employee5@example.com', password, phone: '9876543216', status: 'active' });
    const hr = await User.create({ name: 'HR Manager', email: 'hr@example.com', password, phone: '9876543217', status: 'active' });

    // --- 3. Assign Roles ---
    console.log('Assigning roles...');
    await UserRole.create({ user_id: admin._id, role_id: adminRole._id });
    await UserRole.create({ user_id: manager._id, role_id: pmRole._id });
    await UserRole.create({ user_id: emp1._id, role_id: empRole._id });
    await UserRole.create({ user_id: emp2._id, role_id: empRole._id });
    await UserRole.create({ user_id: emp3._id, role_id: empRole._id });
    await UserRole.create({ user_id: emp4._id, role_id: empRole._id });
    await UserRole.create({ user_id: emp5._id, role_id: empRole._id });
    await UserRole.create({ user_id: hr._id, role_id: hrRole._id });

    // --- 4. Create Employee Records ---
    console.log('Creating employee records...');
    const employee1 = await Employee.create({ user_id: emp1._id, designation: 'Senior Developer', hire_date: new Date('2023-01-15'), status: 'Active' });
    const employee2 = await Employee.create({ user_id: emp2._id, designation: 'Full Stack Developer', hire_date: new Date('2023-03-20'), status: 'Active' });
    const employee3 = await Employee.create({ user_id: emp3._id, designation: 'Frontend Developer', hire_date: new Date('2023-06-10'), status: 'Active' });
    const employee4 = await Employee.create({ user_id: emp4._id, designation: 'Backend Developer', hire_date: new Date('2024-01-05'), status: 'Active' });
    const employee5 = await Employee.create({ user_id: emp5._id, designation: 'QA Engineer', hire_date: new Date('2024-02-15'), status: 'Active' });

    // --- 5. Create Teams ---
    console.log('Creating teams...');
    const team1 = await Team.create({ team_name: 'Alpha Team', description: 'Frontend and full-stack development team' });
    const team2 = await Team.create({ team_name: 'Beta Team', description: 'Backend and infrastructure team' });

    // Add team members
    await TeamMember.create({ team_id: team1._id, user_id: emp1._id, role_in_team: 'Lead' });
    await TeamMember.create({ team_id: team1._id, user_id: emp3._id, role_in_team: 'Member' });
    await TeamMember.create({ team_id: team1._id, user_id: emp5._id, role_in_team: 'Member' });
    await TeamMember.create({ team_id: team2._id, user_id: emp2._id, role_in_team: 'Lead' });
    await TeamMember.create({ team_id: team2._id, user_id: emp4._id, role_in_team: 'Member' });

    // --- 6. Create Projects ---
    console.log('Creating projects...');
    const project1 = await Project.create({
      manager_id: manager._id,
      project_name: 'E-Commerce Platform',
      description: 'Building a modern e-commerce platform with React and Node.js',
      start_date: new Date('2024-09-01'),
      end_date: new Date('2025-03-31'),
      status: 'Active'
    });
    const project2 = await Project.create({
      manager_id: manager._id,
      project_name: 'HR Management System',
      description: 'Internal HR management tool for employee records and payroll',
      start_date: new Date('2024-10-01'),
      end_date: new Date('2025-06-30'),
      status: 'Active'
    });

    // --- 7. Create Sprints ---
    console.log('Creating sprints...');
    const sprint1 = await Sprint.create({
      project_id: project1._id, sprint_name: 'Sprint 1 - User Module',
      start_date: new Date('2024-09-01'), end_date: new Date('2024-09-14'),
      goal: 'Complete user registration and login', status: 'Completed'
    });
    const sprint2 = await Sprint.create({
      project_id: project1._id, sprint_name: 'Sprint 2 - Product Catalog',
      start_date: new Date('2024-09-15'), end_date: new Date('2024-09-28'),
      goal: 'Build product listing and search', status: 'Active'
    });
    const sprint3 = await Sprint.create({
      project_id: project1._id, sprint_name: 'Sprint 3 - Cart & Checkout',
      start_date: new Date('2024-09-29'), end_date: new Date('2024-10-12'),
      goal: 'Implement shopping cart and checkout', status: 'Planning'
    });
    const sprint4 = await Sprint.create({
      project_id: project2._id, sprint_name: 'Sprint 1 - Employee Module',
      start_date: new Date('2024-10-01'), end_date: new Date('2024-10-14'),
      goal: 'Build employee CRUD and profile management', status: 'Active'
    });

    // --- 8. Create Tasks ---
    console.log('Creating tasks...');
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in2Weeks = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

    const task1 = await Task.create({ sprint_id: sprint2._id, created_by: manager._id, title: 'Design Product Listing Page', description: 'Create responsive UI for product listing with filters', priority: 'High', estimated_effort: 4, status: 'Assigned', due_date: nextWeek });
    const task2 = await Task.create({ sprint_id: sprint2._id, created_by: manager._id, title: 'Build Product Search API', description: 'REST API for product search with pagination', priority: 'High', estimated_effort: 3, status: 'In Progress', due_date: nextWeek });
    const task3 = await Task.create({ sprint_id: sprint2._id, created_by: manager._id, title: 'Product Image Upload', description: 'Implement image upload and optimization', priority: 'Medium', estimated_effort: 2, status: 'Assigned', due_date: in2Weeks });
    const task4 = await Task.create({ sprint_id: sprint2._id, created_by: manager._id, title: 'Category Management', description: 'CRUD for product categories', priority: 'Medium', estimated_effort: 3, status: 'Assigned', due_date: in2Weeks });
    const task5 = await Task.create({ sprint_id: sprint3._id, created_by: manager._id, title: 'Shopping Cart Frontend', description: 'Build cart UI with add/remove functionality', priority: 'Critical', estimated_effort: 5, status: 'Effort Defined', due_date: in2Weeks });
    const task6 = await Task.create({ sprint_id: sprint3._id, created_by: manager._id, title: 'Payment Gateway Integration', description: 'Integrate Razorpay payment gateway', priority: 'Critical', estimated_effort: 6, status: 'New', due_date: in2Weeks });
    const task7 = await Task.create({ sprint_id: sprint4._id, created_by: manager._id, title: 'Employee Registration Form', description: 'Create employee registration form with validation', priority: 'High', estimated_effort: 3, status: 'Assigned', due_date: nextWeek });
    const task8 = await Task.create({ sprint_id: sprint4._id, created_by: manager._id, title: 'Employee Profile API', description: 'REST API for employee profile CRUD', priority: 'High', estimated_effort: 2, status: 'Assigned', due_date: nextWeek });
    const task9 = await Task.create({ sprint_id: sprint4._id, created_by: manager._id, title: 'Department Management', description: 'CRUD for departments and teams', priority: 'Medium', estimated_effort: 2, status: 'New', due_date: in2Weeks });
    const task10 = await Task.create({ sprint_id: sprint2._id, created_by: manager._id, title: 'Write Unit Tests for Product API', description: 'Jest tests for product search and CRUD', priority: 'Low', estimated_effort: 2, status: 'Assigned', due_date: in2Weeks });
    const task11 = await Task.create({ sprint_id: sprint1._id, created_by: manager._id, title: 'Login Page UI', description: 'Design and implement login page', priority: 'High', estimated_effort: 2, actual_effort: 2, status: 'Completed', due_date: new Date('2024-09-10') });
    const task12 = await Task.create({ sprint_id: sprint1._id, created_by: manager._id, title: 'JWT Authentication', description: 'Implement JWT-based authentication', priority: 'High', estimated_effort: 3, actual_effort: 3.5, status: 'Completed', due_date: new Date('2024-09-12') });

    // --- 9. Create Task Assignments ---
    console.log('Creating task assignments...');
    // Rahul (emp1) - 4+3 = 7 hours assigned (High workload)
    await TaskAssignment.create({ task_id: task1._id, employee_id: employee1._id, assigned_by: manager._id, status: 'Active' });
    await TaskAssignment.create({ task_id: task4._id, employee_id: employee1._id, assigned_by: manager._id, status: 'Active' });

    // Arun (emp2) - 3+2 = 5 hours assigned (Normal workload)
    await TaskAssignment.create({ task_id: task2._id, employee_id: employee2._id, assigned_by: manager._id, status: 'Active' });
    await TaskAssignment.create({ task_id: task8._id, employee_id: employee2._id, assigned_by: manager._id, status: 'Active' });

    // Sneha (emp3) - 2+3 = 5 hours assigned (High workload due to meetings)
    await TaskAssignment.create({ task_id: task3._id, employee_id: employee3._id, assigned_by: manager._id, status: 'Active' });
    await TaskAssignment.create({ task_id: task7._id, employee_id: employee3._id, assigned_by: manager._id, status: 'Active' });

    // Vikram (emp4) - 2 hours assigned (Low workload)
    await TaskAssignment.create({ task_id: task10._id, employee_id: employee4._id, assigned_by: manager._id, status: 'Active' });

    // Anjali (emp5) - No active assignments (Available)

    // Completed task assignments
    await TaskAssignment.create({ task_id: task11._id, employee_id: employee1._id, assigned_by: manager._id, status: 'Completed' });
    await TaskAssignment.create({ task_id: task12._id, employee_id: employee2._id, assigned_by: manager._id, status: 'Completed' });

    // --- 10. Create Availability Records ---
    console.log('Creating availability records...');
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    // Rahul - available 8h, 1h meeting → 7h effective
    await Availability.create({ employee_id: employee1._id, date: todayDate, available_hours: 8, meeting_hours: 1, leave_hours: 0, non_project_hours: 0, remarks: 'Daily standup' });

    // Arun - available 8h, 1h meeting, 1h non-project → 6h effective
    await Availability.create({ employee_id: employee2._id, date: todayDate, available_hours: 8, meeting_hours: 1, leave_hours: 0, non_project_hours: 1, remarks: 'Standup + code review session' });

    // Sneha - available 8h, 2h meetings, 0.5h non-project → 5.5h effective
    await Availability.create({ employee_id: employee3._id, date: todayDate, available_hours: 8, meeting_hours: 2, leave_hours: 0, non_project_hours: 0.5, remarks: 'Sprint planning + design review' });

    // Vikram - available 8h, 0.5h meeting → 7.5h effective
    await Availability.create({ employee_id: employee4._id, date: todayDate, available_hours: 8, meeting_hours: 0.5, leave_hours: 0, non_project_hours: 0, remarks: 'Daily standup' });

    // Anjali - available 6h (half day leave) → 6h effective
    await Availability.create({ employee_id: employee5._id, date: todayDate, available_hours: 8, meeting_hours: 0.5, leave_hours: 2, non_project_hours: 0, remarks: 'Half day leave in afternoon' });

    // --- 11. Create Workload Records ---
    console.log('Creating workload records...');
    // Rahul: 7h assigned / 7h capacity = 100% (High)
    await Workload.create({ employee_id: employee1._id, date: todayDate, effective_capacity: 7, workload_percentage: 100, utilization_status: 'High' });
    // Arun: 5h assigned / 6h capacity = 83% (High)
    await Workload.create({ employee_id: employee2._id, date: todayDate, effective_capacity: 6, workload_percentage: 83, utilization_status: 'High' });
    // Sneha: 5h assigned / 5.5h capacity = 91% (High)
    await Workload.create({ employee_id: employee3._id, date: todayDate, effective_capacity: 5.5, workload_percentage: 91, utilization_status: 'High' });
    // Vikram: 2h assigned / 7.5h capacity = 27% (Low)
    await Workload.create({ employee_id: employee4._id, date: todayDate, effective_capacity: 7.5, workload_percentage: 27, utilization_status: 'Low' });
    // Anjali: 0h assigned / 5.5h capacity = 0% (Low)
    await Workload.create({ employee_id: employee5._id, date: todayDate, effective_capacity: 5.5, workload_percentage: 0, utilization_status: 'Low' });

    // --- 12. Create System Settings ---
    console.log('Creating system settings...');
    await SystemSetting.create({ key: 'workload_low_threshold', value: '60', description: 'Workload percentage below this is Low' });
    await SystemSetting.create({ key: 'workload_normal_threshold', value: '80', description: 'Workload percentage below this is Normal' });
    await SystemSetting.create({ key: 'workload_high_threshold', value: '100', description: 'Workload percentage below this is High, above is Overloaded' });
    await SystemSetting.create({ key: 'default_working_hours', value: '8', description: 'Default daily working hours' });

    // --- 13. Create Notifications ---
    console.log('Creating notifications...');
    await Notification.create({ user_id: emp1._id, title: 'Task Assigned', message: 'You have been assigned "Design Product Listing Page" (High Priority)', type: 'task_assigned' });
    await Notification.create({ user_id: emp2._id, title: 'Task Assigned', message: 'You have been assigned "Build Product Search API" (High Priority)', type: 'task_assigned' });
    await Notification.create({ user_id: emp3._id, title: 'Task Assigned', message: 'You have been assigned "Product Image Upload" (Medium Priority)', type: 'task_assigned' });
    await Notification.create({ user_id: emp1._id, title: 'Workload Alert', message: 'Your workload is at 100%. Please discuss with your manager if you need support.', type: 'overloaded' });
    await Notification.create({ user_id: emp3._id, title: 'High Priority Task', message: 'You have been assigned a high-priority task: "Employee Registration Form"', type: 'task_assigned' });

    console.log('\n========================================');
    console.log('  SEED DATA CREATED SUCCESSFULLY!');
    console.log('========================================');
    console.log('\nDemo Accounts (Password: Password@123):');
    console.log('  Admin:           admin@example.com');
    console.log('  Project Manager: manager@example.com');
    console.log('  Employee 1:      employee1@example.com (Rahul - High workload)');
    console.log('  Employee 2:      employee2@example.com (Arun - High workload)');
    console.log('  Employee 3:      employee3@example.com (Sneha - High workload)');
    console.log('  Employee 4:      employee4@example.com (Vikram - Low workload)');
    console.log('  Employee 5:      employee5@example.com (Anjali - Available)');
    console.log('  HR Manager:      hr@example.com');
    console.log('\nNOTE: This is demo data only. Not for production use.');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed Error:', error);
    process.exit(1);
  }
};

seedDatabase();
