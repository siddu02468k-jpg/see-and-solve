const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const deployDir = path.join(root, 'deploy');

// Clean or recreate deployDir
if (fs.existsSync(deployDir)) {
  fs.rmSync(deployDir, { recursive: true, force: true });
}
fs.mkdirSync(deployDir, { recursive: true });

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

// 1. Copy server
copyRecursive(path.join(root, 'server'), path.join(deployDir, 'server'));

// 2. Copy public
copyRecursive(path.join(root, 'public'), path.join(deployDir, 'public'));

// 3. Copy data (only JSON files)
const dataDest = path.join(deployDir, 'data');
fs.mkdirSync(dataDest, { recursive: true });
fs.copyFileSync(path.join(root, 'data', 'gov_services.json'), path.join(dataDest, 'gov_services.json'));
fs.copyFileSync(path.join(root, 'data', 'technicians.json'), path.join(dataDest, 'technicians.json'));

// 4. Copy config and security files (Strictly excluding .env and .db files)
['package.json', 'Dockerfile', 'docker-compose.yml', 'render.yaml', 'README.md', '.gitignore', '.env.example'].forEach(file => {
  const filePath = path.join(root, file);
  if (fs.existsSync(filePath)) {
    fs.copyFileSync(filePath, path.join(deployDir, file));
  }
});

console.log('Deploy package prepared in:', deployDir);
