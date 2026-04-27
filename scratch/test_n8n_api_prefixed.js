const https = require('https');

const N8N_URL = 'n8n-n8n.rvwwep.easypanel.host';
const API_KEY = 'n8n_api_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiNmE2ZTU4Yy01OTUwLTRkYzUtOWU3Ni0wMDI5MDhmNGQ1NzMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc3MzE2MTE3fQ.nkNeddevCEYg25dav9ExtH_W78p-zU60Zwa0NxZqn4U';

const options = {
  hostname: N8N_URL,
  path: '/api/v1/workflows?limit=1',
  method: 'GET',
  headers: {
    'X-N8N-API-KEY': API_KEY
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

req.end();
