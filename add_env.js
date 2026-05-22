const { execSync } = require('child_process');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const lines = envFile.split('\n').filter(l => l && !l.startsWith('#'));

for (const line of lines) {
  const idx = line.indexOf('=');
  if (idx === -1) continue;
  const key = line.slice(0, idx);
  const value = line.slice(idx + 1);
  
  console.log(`Adding ${key}...`);
  try {
    // adding to production
    execSync(`export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; npx --yes vercel env add ${key} production --value "${value}" --yes --force`, { stdio: 'ignore' });
    // adding to development
    execSync(`export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; npx --yes vercel env add ${key} development --value "${value}" --yes --force`, { stdio: 'ignore' });
    // adding to preview
    // the Vercel CLI bug requires passing the branch as '' or similar to explicitly omit? 
    // actually, let's just add it to 'preview' 'feat/homepage-polish'
    execSync(`export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; npx --yes vercel env add ${key} preview feat/homepage-polish --value "${value}" --yes --force`, { stdio: 'ignore' });
    execSync(`export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; npx --yes vercel env add ${key} preview main --value "${value}" --yes --force`, { stdio: 'ignore' });
  } catch (e) {
    console.error(`Failed to add ${key}`);
  }
}
