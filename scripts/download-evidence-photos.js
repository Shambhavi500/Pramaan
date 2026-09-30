const fs = require('fs');
const path = require('path');
const https = require('https');

const dir = path.resolve('./public/evidence');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const photoSources = {
  // 1. Baseline dry gully
  before_01: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&q=85',
  // 2. Upstream dry channel
  before_02: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=1200&q=85',
  // 3. Dry scrub vegetation pre-monsoon
  before_veg: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&q=85',
  // 4. Foundation excavation
  during_01: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1200&q=85',
  // 5. Masonry wall construction with workers
  during_02: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=1200&q=85',
  // 6. Community workers group
  during_community: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=85',
  // 7. Low quality WhatsApp forward
  during_lowq: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=400&q=30',
  // 8. Completed dam holding deep monsoon water
  after_01: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=85',
  // 9. Impounded water reservoir
  after_02: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=85',
  // 10. Lush vegetation post-monsoon
  after_veg: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=85',
  // 11. Monitoring post-monsoon
  monitoring_01: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&q=85',
  // 12. Completed dam no GPS
  after_nogps: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=85',
  // 13. Wrong geofence: farm pond
  after_wronggeo: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=85',
  // 14. Reused duplicate
  after_reuse: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=50',
  // 15. Screen recapture
  after_recapture: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=85',
  // 16. AI edited
  after_ai_edit: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&q=85'
};

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return download(response.headers.location, dest).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: status code ${response.statusCode}`));
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(dest));
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  console.log('Downloading 16 realistic evidence images to public/evidence/...');
  for (const [key, url] of Object.entries(photoSources)) {
    const dest = path.join(dir, `${key}.jpg`);
    try {
      await download(url, dest);
      const size = (fs.statSync(dest).size / 1024).toFixed(1);
      console.log(`[OK] ${key}.jpg (${size} KB)`);
    } catch (e) {
      console.error(`[ERR] ${key}:`, e.message);
    }
  }

  // Copy sample for capture page
  const cleanDest = path.resolve('./public/evidence/trust_clean.png');
  if (fs.existsSync('./pitch/screenshots/trust_clean.png')) {
    fs.copyFileSync('./pitch/screenshots/trust_clean.png', cleanDest);
    console.log('[OK] trust_clean.png copied to public/evidence/');
  }

  console.log('All static evidence photos ready!');
}

run();
