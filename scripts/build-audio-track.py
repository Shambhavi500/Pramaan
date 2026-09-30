import os
import subprocess

FFMPEG = r"C:\Projects\Pramaan\node_modules\ffmpeg-static\ffmpeg.exe"
FFPROBE = r"C:\Projects\Pramaan\node_modules\ffprobe-static\bin\win32\x64\ffprobe.exe"
AUDIO_DIR = os.path.abspath("./recordings/audio")
OUTPUT_VOICEOVER = os.path.abspath("./recordings/voiceover_5min.wav")
OUTPUT_MASTER_AUDIO = os.path.abspath("./recordings/master_audio_5min.mp3")

# Exact placement timestamps in milliseconds
PLACEMENTS = [
    {"file": "scene_01.mp3", "delay_ms": 500},       # 00:00.500
    {"file": "scene_02.mp3", "delay_ms": 28500},     # 00:28.500
    {"file": "scene_03.mp3", "delay_ms": 50500},     # 00:50.500
    {"file": "scene_04.mp3", "delay_ms": 88500},     # 01:28.500
    {"file": "scene_05.mp3", "delay_ms": 116500},    # 01:56.500
    {"file": "scene_06.mp3", "delay_ms": 154500},    # 02:34.500
    {"file": "scene_07.mp3", "delay_ms": 182500},    # 03:02.500
    {"file": "scene_08.mp3", "delay_ms": 215500},    # 03:35.500
    {"file": "scene_09.mp3", "delay_ms": 263500},    # 04:23.500
    {"file": "scene_10.mp3", "delay_ms": 283500},    # 04:43.500
]

def build_voiceover():
    print("=== BUILDING SYNCHRONIZED 5-MINUTE VOICEOVER AUDIO ===")
    inputs = []
    filter_delays = []
    mix_labels = []

    for i, p in enumerate(PLACEMENTS):
        filepath = os.path.join(AUDIO_DIR, p["file"])
        inputs.extend(["-i", filepath])
        filter_delays.append(f"[{i}:a]adelay={p['delay_ms']}|{p['delay_ms']}[a{i}]")
        mix_labels.append(f"[a{i}]")

    filter_complex = (
        ";".join(filter_delays) + ";" +
        "".join(mix_labels) + f"amix=inputs={len(PLACEMENTS)}:normalize=0:dropout_transition=0[mixed];" +
        "[mixed]apad=whole_dur=300.000,atrim=0:300.000,loudnorm=I=-14:TP=-1.5:LRA=11[out]"
    )

    cmd = [
        FFMPEG, "-y",
        *inputs,
        "-filter_complex", filter_complex,
        "-map", "[out]",
        "-ar", "48000",
        "-ac", "2",
        OUTPUT_VOICEOVER
    ]

    print("Running FFmpeg audio mix...")
    subprocess.run(cmd, check=True)

    # Verify duration of voiceover
    probe_cmd = [
        FFPROBE, "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", OUTPUT_VOICEOVER
    ]
    res = subprocess.run(probe_cmd, capture_output=True, text=True)
    dur = float(res.stdout.strip())
    print(f"[OK] Voiceover Track Duration: {dur:.3f} seconds (Target: 300.000s)")

    print("Generating ambient cinematic background soundscape...")
    bg_cmd = [
        FFMPEG, "-y",
        "-i", OUTPUT_VOICEOVER,
        "-f", "lavfi",
        "-i", "sine=frequency=110:duration=300",
        "-filter_complex",
        "[1:a]volume=0.015,lowpass=f=300,afade=t=in:ss=0:d=4,afade=t=out:st=296:d=4[bg];" +
        "[0:a][bg]amix=inputs=2:duration=first:dropout_transition=0,loudnorm=I=-14:TP=-1.5:LRA=11[master]",
        "-map", "[master]",
        "-c:a", "libmp3lame",
        "-b:a", "192k",
        "-ar", "48000",
        OUTPUT_MASTER_AUDIO
    ]
    subprocess.run(bg_cmd, check=True)

    probe_master = [
        FFPROBE, "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", OUTPUT_MASTER_AUDIO
    ]
    res_m = subprocess.run(probe_master, capture_output=True, text=True)
    dur_m = float(res_m.stdout.strip())
    print(f"[OK] Master Audio Track Duration: {dur_m:.3f} seconds (Target: 300.000s)")

if __name__ == "__main__":
    build_voiceover()
