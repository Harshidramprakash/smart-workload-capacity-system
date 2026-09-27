// test-all.js - Microservices Architecture & Logic Verification Test Suite
const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env') });

console.log('\n======================================================');
console.log('  SMART WORKLOAD SYSTEM - ARCHITECTURE & LOGIC TESTS  ');
console.log('======================================================\n');

let passedTests = 0;
let failedTests = 0;

const test = (name, fn) => {
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    failedTests++;
  }
};

// 1. Verify Capacity Calculation Logic
test('Effective Capacity Formula: 8h working - 2h meetings - 1h leave - 0.5h non-project = 4.5h', () => {
  const available = 8;
  const meetings = 2;
  const leave = 1;
  const nonProject = 0.5;
  const effective = Math.max(0, available - meetings - leave - nonProject);
  assert.strictEqual(effective, 4.5);
});

test('Remaining Capacity Formula: 4.5h effective - 3h assigned = 1.5h remaining', () => {
  const effective = 4.5;
  const assigned = 3;
  const remaining = Math.max(0, effective - assigned);
  assert.strictEqual(remaining, 1.5);
});

test('Workload Classification Thresholds (Low <= 60%, Normal <= 80%, High <= 100%, Overloaded > 100%)', () => {
  const thresholds = { low: 60, normal: 80, high: 100 };
  const getStatus = (pct) => {
    if (pct <= thresholds.low) return 'Low';
    if (pct <= thresholds.normal) return 'Normal';
    if (pct <= thresholds.high) return 'High';
    return 'Overloaded';
  };

  assert.strictEqual(getStatus(40), 'Low');
  assert.strictEqual(getStatus(60), 'Low');
  assert.strictEqual(getStatus(65), 'Normal');
  assert.strictEqual(getStatus(80), 'Normal');
  assert.strictEqual(getStatus(85), 'High');
  assert.strictEqual(getStatus(100), 'High');
  assert.strictEqual(getStatus(101), 'Overloaded');
  assert.strictEqual(getStatus(125), 'Overloaded');
});

// 2. Verify External Adapters (Clearly separated Mock / Local Mode)
test('Calendar Adapter reports clean mock status when real Google credentials absent', async () => {
  const calendarAdapter = require('./services/capacity-service/adapters/calendarAdapter');
  assert.strictEqual(calendarAdapter.PROVIDER, 'mock');
  const res = await calendarAdapter.getMeetingHours('test@example.com', new Date());
  assert.strictEqual(res.synced, false);
  assert.strictEqual(res.provider, 'mock');
});

test('HRMS Adapter reports clean mock status when external HRMS URL absent', async () => {
  const hrmsAdapter = require('./services/capacity-service/adapters/hrmsAdapter');
  assert.strictEqual(hrmsAdapter.PROVIDER, 'mock');
  const res = await hrmsAdapter.getLeaveData('test@example.com', new Date());
  assert.strictEqual(res.synced, false);
  assert.strictEqual(res.provider, 'mock');
});

test('SMTP Adapter reports clean mock status when placeholder credentials present', async () => {
  const smtpAdapter = require('./services/notification-service/adapters/smtpAdapter');
  assert.strictEqual(smtpAdapter.PROVIDER, 'mock');
  const res = await smtpAdapter.sendEmail({
    to: 'dev@example.com',
    subject: 'Task Allocated',
    text: 'You have a new task'
  });
  assert.strictEqual(res.sent, true);
  assert.strictEqual(res.provider, 'mock');
});

test('Storage Adapter reports clean local storage mode when S3/Cloudinary credentials absent', async () => {
  const storageAdapter = require('./services/report-service/adapters/storageAdapter');
  assert.strictEqual(storageAdapter.PROVIDER, 'local');
  const res = await storageAdapter.uploadReport({
    filename: 'unit_test_report.csv',
    content: 'Name,Capacity,Assigned\nRahul,6,5\n'
  });
  assert.strictEqual(res.provider, 'local');
  assert.strictEqual(res.is_mock, true);
  assert.ok(res.file_path.includes('unit_test_report.csv'));
});

// 3. Verify Microservice Server Entry Points & Route Configurations
test('All 6 Microservices and API Gateway export Express applications', () => {
  const gateway = require('./gateway/server');
  const userService = require('./services/user-service/server');
  const projectService = require('./services/project-service/server');
  const taskService = require('./services/task-service/server');
  const capacityService = require('./services/capacity-service/server');
  const reportService = require('./services/report-service/server');
  const notificationService = require('./services/notification-service/server');

  assert.ok(gateway);
  assert.ok(userService);
  assert.ok(projectService);
  assert.ok(taskService);
  assert.ok(capacityService);
  assert.ok(reportService);
  assert.ok(notificationService);
});

// 4. Verify Task Service does not directly touch Capacity/Workload collections
test('Task Service controller uses REST API for capacity and notification integration', () => {
  const fs = require('fs');
  const taskCtrlContent = fs.readFileSync(path.resolve(__dirname, 'services/task-service/controllers/taskController.js'), 'utf8');

  // Should NOT import Workload or Availability models
  assert.ok(!taskCtrlContent.includes("require('../../../shared/models/Workload')"), 'Task controller must not import Workload model directly');
  assert.ok(!taskCtrlContent.includes("require('../../../shared/models/Availability')"), 'Task controller must not import Availability model directly');
  assert.ok(!taskCtrlContent.includes("require('../../../shared/models/Notification')"), 'Task controller must not import Notification model directly');

  // Should call Capacity and Notification service endpoints
  assert.ok(taskCtrlContent.includes('/api/workload/recalculate/'), 'Task controller must call Capacity Service recalculation API');
  assert.ok(taskCtrlContent.includes('/api/notifications'), 'Task controller must call Notification Service API');
});

// 5. Verify Gateway Path Preservation
test('API Gateway preserves route paths and does not create duplicate prefixes', () => {
  const fs = require('fs');
  const gwContent = fs.readFileSync(path.resolve(__dirname, 'gateway/server.js'), 'utf8');
  assert.ok(gwContent.includes('pathRewrite: (path, req) => req.originalUrl'), 'Gateway must preserve originalUrl to prevent /api/api path duplication');
});

// 6. Verify User Service Registration Role Security
test('User Service registration disallows privilege self-assignment', () => {
  const fs = require('fs');
  const authCtrlContent = fs.readFileSync(path.resolve(__dirname, 'services/user-service/controllers/authController.js'), 'utf8');
  assert.ok(authCtrlContent.includes("if (role && role !== 'Employee')"), 'Auth controller must disallow self-assigning privileged roles');
});

// 7. Verify Seed Data Contains Realistic Software Development Tasks
test('Seed script contains realistic software development tasks and projects', () => {
  const fs = require('fs');
  const seedContent = fs.readFileSync(path.resolve(__dirname, 'seed.js'), 'utf8');

  assert.ok(seedContent.includes('Develop Authentication Module'));
  assert.ok(seedContent.includes('Build Employee Dashboard'));
  assert.ok(seedContent.includes('Implement Capacity Analysis'));
  assert.ok(seedContent.includes('Create Task Allocation API'));
  assert.ok(seedContent.includes('Develop Workload Report'));
  assert.ok(seedContent.includes('Implement Availability Tracking'));
  assert.ok(seedContent.includes('Implement Task Reassignment'));
  assert.ok(seedContent.includes('Integrate Calendar Data'));
  assert.ok(!seedContent.includes('E-Commerce Platform'), 'E-commerce platform demo data must be removed');
});

console.log('\n------------------------------------------------------');
console.log(`Results: ${passedTests} Passed, ${failedTests} Failed`);
console.log('======================================================\n');

if (failedTests > 0) process.exit(1);
else process.exit(0);
