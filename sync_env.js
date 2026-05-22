const fs = require('fs');
const https = require('https');

const TOKEN = 'vca_2aIZ2ZgOsb2MMVNaPhh9gwsXS4sS4MUNPWWGi1278USD3JnKD32BfHH5';
const PROJECT_ID = 'prj_f8Pjat0geAG18gOltkAlBVWdVsPy';

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.vercel.com',
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  // Get all existing env vars
  console.log('Fetching existing env vars...');
  const existing = await request('GET', `/v9/projects/${PROJECT_ID}/env`);
  
  // Delete existing
  if (existing.envs) {
    for (const env of existing.envs) {
      console.log(`Deleting ${env.key}...`);
      await request('DELETE', `/v9/projects/${PROJECT_ID}/env/${env.id}`);
    }
  }

  // Parse .env.local
  const envFile = fs.readFileSync('.env.local', 'utf8');
  const lines = envFile.split('\n').filter(l => l && !l.startsWith('#'));
  
  for (const line of lines) {
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx);
    const value = line.slice(idx + 1);
    
    console.log(`Adding ${key}...`);
    const result = await request('POST', `/v10/projects/${PROJECT_ID}/env`, {
      key: key,
      value: value,
      type: "encrypted",
      target: ["production", "preview", "development"]
    });
    if (result.error) console.error(`Error adding ${key}:`, result.error);
  }
  console.log('Done!');
}
run();
