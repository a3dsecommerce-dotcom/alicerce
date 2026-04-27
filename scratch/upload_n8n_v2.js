const https = require('https');
const fs = require('fs');
const path = require('path');

const N8N_URL = 'n8n-n8n.rvwwep.easypanel.host';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlMzhkZTExMy0zMWY4LTQzMGQtOWQ0NC0zZDFiOGNjYTEwZDQiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNzQzMjVmMWYtODk1OC00ZmY5LWI4MGUtYzU3YjcwNjMyZmU0IiwiaWF0IjoxNzc3MzEwOTM1fQ.os3cfP5LVqxiQtBnwycMpXhrDD85NRLFHd6YsZA5-YM';

const workflowPath = path.join(__dirname, '..', 'N8N_WORKFLOW_AUTH.json');
const workflowData = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

const body = JSON.stringify({
  name: workflowData.name,
  nodes: workflowData.nodes,
  connections: workflowData.connections,
  active: true
});

// Tentando com Authorization Bearer e X-N8N-API-KEY
const options = {
  hostname: N8N_URL,
  path: '/api/v1/workflows',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
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
