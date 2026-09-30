const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.next' || file === '.git' || file === 'research') continue;
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walk(filePath, fileList);
    } else if (/\.(tsx|ts|jsx|js|css)$/.test(file)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const targetDirs = ['app', 'components', 'lib'];
let allFiles = [];
targetDirs.forEach(d => { allFiles = allFiles.concat(walk(d)); });

const imgRegex = /(<img|<Image|src=|image_url|secure_url|thumbnail_url|asset_url|media_url|cloudinary\.com|\.png|\.jpg|\.jpeg|\.webp|\.svg)/i;

const matches = [];
for (const f of allFiles) {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (imgRegex.test(line)) {
      matches.push({ file: f, lineNum: idx + 1, text: line.trim() });
    }
  });
}

console.log(`Found ${matches.length} references in app/, components/, lib/:`);
matches.forEach(m => console.log(`${m.file}:${m.lineNum} -> ${m.text}`));
