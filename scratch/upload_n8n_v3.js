const https = require('https');
const fs = require('fs');
const path = require('path');

const N8N_URL = 'n8n-n8n.rvwwep.easypanel.host';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiNmE2ZTU4Yy01OTUwLTRkYzUtOWU3Ni0wMDI5MDhmNGQ1NzMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc3MzE0MTUxfQ.w6snR-dolnGYhN5k_z3g2kbbNC0OvG564kAGQM-W6wU';

const workflowPath = path.join(__dirname, '..', 'N8N_WORKFLOW_AUTH.json');
const workflowData = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

const body = JSON.stringify({
  name: workflowData.name,
  nodes: workflowData.nodes,
  connections: workflowData.connections,
  active: true
});

const options = {
  hostname: N8N_URL,
  path: '/api/v1/workflows',
  method: 'POST',
  headers: {
    'X-N8N-API-KEY': API_KEY,
    'Content-Type': 'application/json',
    'Content-Length': body.length
  }
};

const req = https.request(options, (res) => {
  console.log('Status:', res.statusCode);
  let responseBody = '';
  res.on('data', (d) => { responseBody += d; });
  res.on('end', () => {
    console.log('Response:', responseBody);
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.write(body);
req.end();
