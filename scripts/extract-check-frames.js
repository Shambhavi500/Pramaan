const { execSync } = require('child_process');
const path = require('path');
const FFMPEG = path.resolve('./node_modules/ffmpeg-static/ffmpeg.exe');
const video = path.resolve('./recordings/pramaan_demo_5min_exact.mp4');

[15, 70, 160, 240].forEach((t, i) => {
  const out = path.resolve(`./recordings/check_frame_${i}.png`);
  execSync(`"${FFMPEG}" -y -ss ${t} -i "${video}" -vframes 1 "${out}"`);
  console.log(`Saved frame at ${t}s to ${out}`);
});
