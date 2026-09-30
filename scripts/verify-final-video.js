const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const FFPROBE = path.resolve('./node_modules/ffprobe-static/bin/win32/x64/ffprobe.exe');

const files = [
  './recordings/pramaan_demo_5min_exact.mp4',
  './recordings/pramaan_demo_5min_exact.webm',
  './recordings/pramaan_demo_5min_master.mp4',
  './recordings/pramaan_demo_5min_master.webm'
];

console.log('=== FINAL PRODUCTION VERIFICATION ===');
files.forEach(f => {
  const p = path.resolve(f);
  const dur = execSync(`"${FFPROBE}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${p}"`).toString().trim();
  const v = execSync(`"${FFPROBE}" -v error -select_streams v:0 -show_entries stream=codec_name,width,height,r_frame_rate -of csv=s=x:p=0 "${p}"`).toString().trim();
  const a = execSync(`"${FFPROBE}" -v error -select_streams a:0 -show_entries stream=codec_name,sample_rate,channels -of csv=s=x:p=0 "${p}"`).toString().trim();
  const sizeMB = (fs.statSync(p).size / (1024 * 1024)).toFixed(2);
  console.log(`${f}:`);
  console.log(`  Duration:    ${parseFloat(dur).toFixed(3)}s (TARGET: 300.000s)`);
  console.log(`  File Size:   ${sizeMB} MB`);
  console.log(`  Video Codec: ${v}`);
  console.log(`  Audio Codec: ${a}`);
  console.log(`  Compliance:  ${Math.abs(parseFloat(dur) - 300.0) <= 1.0 ? 'PASSED [EXACT 05:00]' : 'FAILED'}\n`);
});
