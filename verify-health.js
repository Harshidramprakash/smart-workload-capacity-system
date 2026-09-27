// verify-health.js - Verify all microservices health endpoints
const endpoints = [
  { name: 'Gateway', url: 'http://localhost:5000/api/health' },
  { name: 'User Service', url: 'http://localhost:5001/health' },
  { name: 'Project Service', url: 'http://localhost:5002/health' },
  { name: 'Task Service', url: 'http://localhost:5003/health' },
  { name: 'Capacity Service', url: 'http://localhost:5004/health' },
  { name: 'Report Service', url: 'http://localhost:5005/health' },
  { name: 'Notification Service', url: 'http://localhost:5006/health' },
];

(async () => {
  let allHealthy = true;
  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url);
      const json = await res.json();
      console.log(`[${ep.name}] Status ${res.status}:`, JSON.stringify(json));
      if (!res.ok) allHealthy = false;
    } catch (err) {
      console.error(`[${ep.name}] FAIL:`, err.message);
      allHealthy = false;
    }
  }
  if (!allHealthy) process.exit(1);
  else console.log('\n>>> ALL 7 HEALTH ENDPOINTS RESPONDED WITH HTTP 200 OK! <<<');
})();
