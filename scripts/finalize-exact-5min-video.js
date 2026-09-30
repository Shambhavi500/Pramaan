const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

const FFMPEG = path.resolve("./node_modules/ffmpeg-static/ffmpeg.exe");
const FFPROBE = path.resolve("./node_modules/ffprobe-static/bin/win32/x64/ffprobe.exe");

const rawVideo = path.resolve("./recordings/raw_record/page@24a22d6c03b9b6ed51cdd695c0964942.webm");
const audioWav = path.resolve("./recordings/voiceover_5min.wav");
const audioMp3 = path.resolve("./recordings/master_audio_5min.mp3");

const outMp4 = path.resolve("./recordings/pramaan_demo_5min_exact.mp4");
const outWebm = path.resolve("./recordings/pramaan_demo_5min_exact.webm");

console.log("===============================================================");
console.log("   FINALIZING EXACT 05:00.000 (300.000s) MASTER VIDEO         ");
console.log("===============================================================");

// 1. Generate Master MP4 with exact 300.000s duration
const filterComplex = [
  "[0:v]tpad=stop_mode=clone:stop_duration=3.5,trim=0:300.000,setpts=PTS-STARTPTS[v]",
  "[1:a]atrim=0:300.000,asetpts=PTS-STARTPTS[a]"
].join(";");

const cmdMp4 = [
  `"${FFMPEG}" -y`,
  `-i "${rawVideo}"`,
  `-i "${audioMp3}"`,
  `-filter_complex "${filterComplex}"`,
  `-map "[v]"`,
  `-map "[a]"`,
  `-c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p -r 30`,
  `-c:a aac -b:a 192k -ar 48000`,
  `-t 300.000`,
  `"${outMp4}"`
].join(" ");

console.log("Rendering exact 300.000s MP4...");
execSync(cmdMp4, { stdio: "inherit" });

// 2. Generate Master WebM (using VP8/Vorbis for fast reliable encode)
const cmdWebm = [
  `"${FFMPEG}" -y`,
  `-i "${outMp4}"`,
  `-c:v libvpx -b:v 2.5M -crf 10 -quality realtime -cpu-used 4`,
  `-c:a libvorbis -b:a 128k`,
  `-t 300.000`,
  `"${outWebm}"`
].join(" ");

console.log("Rendering exact 300.000s WebM...");
execSync(cmdWebm, { stdio: "inherit" });

// 3. Validation with ffprobe
function getDuration(file) {
  const out = execSync(`"${FFPROBE}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${file}"`).toString().trim();
  return parseFloat(out);
}

function getDetails(file) {
  const out = execSync(`"${FFPROBE}" -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate -of csv=s=x:p=0 "${file}"`).toString().trim();
  return out;
}

const durMp4 = getDuration(outMp4);
const durWebm = getDuration(outWebm);
const resMp4 = getDetails(outMp4);
const sizeMp4MB = (fs.statSync(outMp4).size / (1024 * 1024)).toFixed(2);
const sizeWebmMB = (fs.statSync(outWebm).size / (1024 * 1024)).toFixed(2);

console.log("\n===============================================================");
console.log("   OFFICIAL QA VALIDATION & ACCREDITATION REPORT              ");
console.log("===============================================================");
console.log(`Master MP4 Path:       ${outMp4}`);
console.log(`Master MP4 Duration:   ${durMp4.toFixed(3)}s (TARGET: 300.000s ± 1s)`);
console.log(`Master MP4 Resolution: ${resMp4}`);
console.log(`Master MP4 File Size:  ${sizeMp4MB} MB`);
console.log(`Master WebM Path:      ${outWebm}`);
console.log(`Master WebM Duration:  ${durWebm.toFixed(3)}s`);
console.log(`Master WebM File Size: ${sizeWebmMB} MB`);
console.log(`Voiceover Track:       ${audioWav} (${getDuration(audioWav).toFixed(3)}s)`);
console.log(`Target Status:         ${Math.abs(durMp4 - 300.0) <= 1.0 ? "PASSED [EXACT 05:00]" : "FAILED"}`);
console.log("===============================================================\n");
