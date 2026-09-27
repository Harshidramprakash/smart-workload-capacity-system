// start-all.js - Microservices Orchestration Script
// Launches API Gateway and all 6 microservices concurrently with unified logging.
// Usage: node start-all.js [--with-frontend]

const { spawn } = require('child_process');
const path = require('path');
const net = require('net');

const withFrontend = process.argv.includes('--with-frontend');

// Microservice definitions
const SERVICES = [
  { name: 'Gateway', dir: 'gateway', script: 'server.js', port: 5000, color: '\x1b[36m' }, // Cyan
  { name: 'User', dir: 'services/user-service', script: 'server.js', port: 5001, color: '\x1b[32m' }, // Green
  { name: 'Project', dir: 'services/project-service', script: 'server.js', port: 5002, color: '\x1b[34m' }, // Blue
  { name: 'Task', dir: 'services/task-service', script: 'server.js', port: 5003, color: '\x1b[33m' }, // Yellow
  { name: 'Capacity', dir: 'services/capacity-service', script: 'server.js', port: 5004, color: '\x1b[35m' }, // Magenta
  { name: 'Report', dir: 'services/report-service', script: 'server.js', port: 5005, color: '\x1b[38;5;208m' }, // Orange
  { name: 'Notification', dir: 'services/notification-service', script: 'server.js', port: 5006, color: '\x1b[38;5;165m' } // Purple
];

if (withFrontend) {
  SERVICES.push({
    name: 'Frontend',
    dir: 'frontend',
    script: null,
    cmd: process.platform === 'win32' ? 'npm.cmd' : 'npm',
    args: ['run', 'dev'],
    port: 5173,
    color: '\x1b[96m'
  });
}

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const RED = '\x1b[31m';

console.log(`${BOLD}\n======================================================${RESET}`);
console.log(`${BOLD}  SMART WORKLOAD SYSTEM - MICROSERVICES ORCHESTRATOR  ${RESET}`);
console.log(`${BOLD}======================================================${RESET}`);
console.log(`Starting ${SERVICES.length} services...`);

const runningProcesses = [];

// Helper to test if a port is in use
const isPortInUse = (port) => new Promise((resolve) => {
  const tester = net.createServer()
    .once('error', (err) => {
      if (err.code === 'EADDRINUSE') resolve(true);
      else resolve(false);
    })
    .once('listening', () => {
      tester.close(() => resolve(false));
    })
    .listen(port);
});

// Launch a single service
const startService = (svc) => {
  const serviceDir = path.resolve(__dirname, svc.dir);
  const prefix = `${svc.color}[${svc.name.padEnd(12)}]${RESET} `;

  let child;
  if (svc.cmd) {
    child = spawn(svc.cmd, svc.args, { cwd: serviceDir, shell: true });
  } else {
    child = spawn(process.execPath, [svc.script], { cwd: serviceDir, env: { ...process.env } });
  }

  child.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    for (const line of lines) {
      if (line.trim()) console.log(`${prefix}${line}`);
    }
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    for (const line of lines) {
      if (line.trim()) console.error(`${prefix}${RED}${line}${RESET}`);
    }
  });

  child.on('close', (code) => {
    console.log(`${prefix}Process exited with code ${code}`);
  });

  child.on('error', (err) => {
    console.error(`${prefix}${RED}Failed to start: ${err.message}${RESET}`);
  });

  runningProcesses.push({ name: svc.name, process: child });
};

// Start all services
const launchAll = async () => {
  for (const svc of SERVICES) {
    startService(svc);
    // Slight stagger to allow clean socket binds
    await new Promise((r) => setTimeout(r, 600));
  }

  console.log(`\n${BOLD}All services dispatched.${RESET}`);
  console.log(`  API Gateway:        http://localhost:5000`);
  console.log(`  Gateway Health:     http://localhost:5000/api/health`);
  console.log(`  User Service:       http://localhost:5001/health`);
  console.log(`  Project Service:    http://localhost:5002/health`);
  console.log(`  Task Service:       http://localhost:5003/health`);
  console.log(`  Capacity Service:   http://localhost:5004/health`);
  console.log(`  Report Service:     http://localhost:5005/health`);
  console.log(`  Notification Svc:   http://localhost:5006/health`);
  if (withFrontend) {
    console.log(`  Frontend Web App:   http://localhost:5173`);
  }
  console.log(`\nPress Ctrl+C to terminate all services.\n`);
};

// Graceful shutdown
const shutdown = () => {
  console.log(`\n${BOLD}Shutting down all services...${RESET}`);
  for (const p of runningProcesses) {
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', p.process.pid, '/f', '/t'], { stdio: 'ignore' });
      } else {
        p.process.kill('SIGINT');
      }
    } catch (e) { /* ignore */ }
  }
  setTimeout(() => process.exit(0), 1000);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

launchAll();
