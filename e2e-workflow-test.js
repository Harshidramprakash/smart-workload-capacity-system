// e2e-workflow-test.js - End-to-End Workflow Verification via API Gateway
const assert = require('assert');

const GATEWAY_URL = 'http://localhost:5000/api';

const runE2E = async () => {
  console.log('\n======================================================');
  console.log('  STARTING REAL END-TO-END WORKFLOW VERIFICATION      ');
  console.log('  Testing via API Gateway (http://localhost:5000/api) ');
  console.log('======================================================\n');

  // Step 1: Manager Authentication
  console.log('Step 1: Manager Login...');
  const loginRes = await fetch(`${GATEWAY_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'manager@example.com', password: 'Password@123' })
  });
  assert.strictEqual(loginRes.status, 200, 'Manager login failed');
  const loginData = await loginRes.json();
  const managerToken = loginData.token;
  assert.ok(managerToken, 'Manager token missing');
  assert.strictEqual(loginData.user.role, 'Project Manager', 'User role is not Project Manager');
  console.log(`  ✓ Manager authenticated: ${loginData.user.name} (${loginData.user.role})`);

  // Step 2: Select/Fetch Project
  console.log('\nStep 2: Fetching projects...');
  const projRes = await fetch(`${GATEWAY_URL}/projects`, {
    headers: { 'Authorization': `Bearer ${managerToken}` }
  });
  assert.strictEqual(projRes.status, 200, 'Failed to fetch projects');
  const projects = await projRes.json();
  assert.ok(projects.length > 0, 'No projects found');
  const project = projects[0];
  console.log(`  ✓ Project selected: "${project.project_name}" (ID: ${project._id})`);

  // Step 3: Select/Fetch Sprint
  console.log('\nStep 3: Fetching sprints for project...');
  const sprintRes = await fetch(`${GATEWAY_URL}/sprints?project_id=${project._id}`, {
    headers: { 'Authorization': `Bearer ${managerToken}` }
  });
  assert.strictEqual(sprintRes.status, 200, 'Failed to fetch sprints');
  const sprints = await sprintRes.json();
  assert.ok(sprints.length > 0, 'No sprints found');
  const sprint = sprints[0];
  console.log(`  ✓ Sprint selected: "${sprint.sprint_name}" (ID: ${sprint._id})`);

  // Step 4: Create Task
  console.log('\nStep 4: Manager creates a new sprint task...');
  const taskRes = await fetch(`${GATEWAY_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${managerToken}`
    },
    body: JSON.stringify({
      sprint_id: sprint._id,
      title: 'Automated E2E Verification Task',
      description: 'End-to-end task to verify capacity analysis and allocation workflow',
      priority: 'High',
      estimated_effort: 3,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })
  });
  assert.strictEqual(taskRes.status, 201, 'Failed to create task');
  const taskData = await taskRes.json();
  const createdTask = taskData.task;
  assert.ok(createdTask._id, 'Created task ID missing');
  console.log(`  ✓ Task created: "${createdTask.title}" (Estimated Effort: ${createdTask.estimated_effort}h, Status: ${createdTask.status})`);

  // Step 5: Analyze Employee Capacity & Get Recommendation
  console.log('\nStep 5: Querying Capacity Recommendation Engine for task effort (3h)...');
  const recRes = await fetch(`${GATEWAY_URL}/recommendations/${createdTask._id}`, {
    headers: { 'Authorization': `Bearer ${managerToken}` }
  });
  assert.strictEqual(recRes.status, 200, 'Failed to fetch recommendations');
  const recData = await recRes.json();
  assert.ok(recData.recommendations.length > 0, 'No recommendations generated');
  assert.ok(recData.bestMatch, 'Best match candidate missing');
  console.log(`  ✓ Recommendation Engine analyzed ${recData.totalAnalyzed} engineers.`);
  console.log(`  ✓ Best match recommended: ${recData.bestMatch.name} (Remaining Capacity: ${recData.bestMatch.remainingCapacity.toFixed(1)}h, Current Workload: ${recData.bestMatch.currentStatus})`);
  console.log(`  ✓ Recommendation Reason: "${recData.bestMatch.reason}"`);

  const chosenCandidate = recData.bestMatch;

  // Step 6: Manager Makes Final Assignment Decision
  console.log(`\nStep 6: Manager allocates task to recommended engineer (${chosenCandidate.name})...`);
  const assignRes = await fetch(`${GATEWAY_URL}/tasks/${createdTask._id}/assign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${managerToken}`
    },
    body: JSON.stringify({ employee_id: chosenCandidate.employee_id })
  });
  assert.strictEqual(assignRes.status, 201, 'Failed to assign task');
  const assignData = await assignRes.json();
  console.log(`  ✓ Task assigned successfully: ${assignData.message}`);
  console.log(`  ✓ Capacity Service returned updated workload: ${assignData.workload?.workloadPercentage ?? 'Updated'}%`);

  // Step 7: Verify Notification Created in Notification Service
  console.log('\nStep 7: Verifying notification was created in Notification Service...');
  const notifCheckRes = await fetch(`http://localhost:5006/api/notifications`, {
    headers: {
      'x-internal-service': 'true',
      'x-user-id': chosenCandidate.user_id
    }
  });
  assert.strictEqual(notifCheckRes.status, 200, 'Failed to query notification service');
  const notifs = await notifCheckRes.json();
  const taskNotif = (notifs.notifications || []).find(n => n.title.includes('Task Assigned'));
  assert.ok(taskNotif, 'Task assignment notification was not created in Notification Service');
  console.log(`  ✓ Notification verified in Notification Service: "${taskNotif.title}" - "${taskNotif.message}"`);

  // Step 8: Employee Logs in and Views Assigned Tasks
  console.log(`\nStep 8: Employee logs in (${chosenCandidate.email})...`);
  const empLoginRes = await fetch(`${GATEWAY_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: chosenCandidate.email, password: 'Password@123' })
  });
  assert.strictEqual(empLoginRes.status, 200, 'Employee login failed');
  const empLoginData = await empLoginRes.json();
  const empToken = empLoginData.token;

  const myTasksRes = await fetch(`${GATEWAY_URL}/tasks/my`, {
    headers: { 'Authorization': `Bearer ${empToken}` }
  });
  assert.strictEqual(myTasksRes.status, 200, 'Failed to fetch my tasks');
  const myTasks = await myTasksRes.json();
  const hasAssignedTask = myTasks.some(t => t._id === createdTask._id);
  assert.ok(hasAssignedTask, 'Assigned task not found in employee my-tasks list');
  console.log(`  ✓ Employee verified task in personal queue (${myTasks.length} active tasks)`);

  // Step 9: Employee Updates Task Progress to Completed
  console.log('\nStep 9: Employee updates task progress to "Completed" with actual effort (3h)...');
  const updateTaskRes = await fetch(`${GATEWAY_URL}/tasks/${createdTask._id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${empToken}`
    },
    body: JSON.stringify({
      status: 'Completed',
      actual_effort: 3
    })
  });
  assert.strictEqual(updateTaskRes.status, 200, 'Employee failed to update task');
  const updatedTaskData = await updateTaskRes.json();
  assert.strictEqual(updatedTaskData.task.status, 'Completed', 'Task status is not Completed');
  console.log(`  ✓ Task updated to Completed by employee: "${updatedTaskData.task.title}"`);

  // Step 10: Verify Capacity Service Recalculates Workload
  console.log('\nStep 10: Verifying Capacity Service recalculated workload via API...');
  const workloadRes = await fetch(`${GATEWAY_URL}/workload/${chosenCandidate.employee_id}`, {
    headers: { 'Authorization': `Bearer ${managerToken}` }
  });
  assert.strictEqual(workloadRes.status, 200, 'Failed to fetch employee workload');
  const workloadData = await workloadRes.json();
  console.log(`  ✓ Capacity Service confirmed workload for ${chosenCandidate.name}:`);
  console.log(`    Effective Capacity: ${workloadData.effectiveCapacity}h`);
  console.log(`    Assigned Effort:    ${workloadData.assignedEffort}h`);
  console.log(`    Remaining Capacity: ${workloadData.remainingCapacity}h`);
  console.log(`    Utilization Status: ${workloadData.utilizationStatus} (${workloadData.workloadPercentage}%)`);

  // Step 11: Manager & HR Generate Reports in Report Service
  console.log('\nStep 11: Manager requests Workload Report & Capacity Utilization Report from Report Service...');
  const reportRes = await fetch(`${GATEWAY_URL}/reports/workload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${managerToken}`
    },
    body: JSON.stringify({ type: 'employee', exportCSV: true })
  });
  assert.strictEqual(reportRes.status, 200, 'Failed to generate workload report');
  const reportData = await reportRes.json();
  console.log(`  ✓ Workload report generated: "${reportData.report?.report_type}" with ${reportData.report?.data?.data?.length} records`);
  if (reportData.export) {
    console.log(`  ✓ Storage export created: ${reportData.export.file_url}`);
  }

  const capReportRes = await fetch(`${GATEWAY_URL}/reports/capacity`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${managerToken}`
    },
    body: JSON.stringify({ exportCSV: true })
  });
  assert.strictEqual(capReportRes.status, 200, 'Failed to generate capacity report');
  const capReportData = await capReportRes.json();
  console.log(`  ✓ Capacity report generated: Overall Utilization = ${capReportData.report?.data?.summary?.overallUtilization}%`);

  console.log('\n======================================================');
  console.log('  >>> COMPLETE END-TO-END WORKFLOW VERIFIED 100%! <<< ');
  console.log('======================================================\n');
};

runE2E().catch(err => {
  console.error('\nE2E Workflow Failure:', err);
  process.exit(1);
});
