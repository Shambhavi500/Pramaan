import asyncio
import os
import subprocess
import edge_tts

VOICE = "en-US-ChristopherNeural"  # Professional, confident, clear, technically credible

SCENES = [
    {
        "id": "scene_01",
        "name": "The Crisis & Problem Hook",
        "start": 0.0,
        "end": 25.0,
        "text": "In 2026, seeing is no longer believing. Over 2,600 crore rupees in rural development and CSR funds have been siphoned off using fake, recycled, and AI-generated field photographs. Government circulars now mandate manual checks because field agents are literally photographing photographs on laptop screens. Corporate funders and communities are flying completely blind."
    },
    {
        "id": "scene_02",
        "name": "Introducing Pramaan",
        "start": 25.0,
        "end": 45.0,
        "text": "This is Pramaan: the trust engine that transforms vulnerable field media into mathematically verified, audit-grade impact proof. Built across five core lifecycle stages, Pramaan combines edge cryptography, PostGIS geofencing, multi-agent AI verification, and an immutable ledger into an unbroken chain of custody."
    },
    {
        "id": "scene_03",
        "name": "Hardware Attestation & Field Capture",
        "start": 45.0,
        "end": 85.0,
        "text": "It begins right at the edge. The moment a field worker selects an image on the capture page, Pramaan immediately computes a client-side SHA-256 hash using the Web Crypto API before a single byte leaves the device, locking its hardware GPS coordinates. We select the Nayapura check dam site and simulate on-site coordinates in Jhabua. Watch as the coordinates lock to 22.77 degrees north, 74.59 degrees east, with high-accuracy GPS attestation."
    },
    {
        "id": "scene_04",
        "name": "Authoritative Server Re-Hash & Ledger Commit",
        "start": 85.0,
        "end": 115.0,
        "text": "We select check dam construction as the activity, designate this as baseline before evidence, and click submit proof. Behind the scenes, our server recomputes the SHA-256 hash directly from the raw byte stream to guarantee zero tampering, while Supabase PostGIS validates the boundary polygon. It scores 91 out of 100, verified, and commits to the ledger."
    },
    {
        "id": "scene_05",
        "name": "Auditor Moderation Queue & Fraud Detection",
        "start": 115.0,
        "end": 155.0,
        "text": "What happens when someone attempts fraud? Pramaan's eight-signal trust engine catches perceptual hash reuse, screen recapture artifacts, and synthetic AI infills. In the auditor review queue, suspicious uploads are prioritized by risk. Here, an upload is flagged because its coordinates were 480 kilometers away from the site. An auditor inspects the forensic breakdown, records an explicit override justification, and seals the verified decision permanently into the immutable audit ledger."
    },
    {
        "id": "scene_06",
        "name": "Before / After Visual Change Inspection",
        "start": 155.0,
        "end": 185.0,
        "text": "To prove genuine physical transformation, Pramaan pairs baseline and terminal evidence. Watch as we slide across Check Dam JH-04: an arid, dry riverbed on the left, and complete monsoon water retention with surrounding green vegetation on the right. Notice the Excess Green Index delta measuring positive ecological recovery."
    },
    {
        "id": "scene_07",
        "name": "Natural Language Discover & Query Planner",
        "start": 185.0,
        "end": 220.0,
        "text": "Need specific proof across thousands of field assets? Our Discover engine uses Gemini 2.5 Flash Lite to translate plain English search requests into structured, validated database queries with zero SQL injection risk. We search for check dam construction verified. The system interprets the intent, filters by verified status and site code, and instantly retrieves the exact matching evidence cards."
    },
    {
        "id": "scene_08",
        "name": "Autonomous Multi-Agent Investigation",
        "start": 220.0,
        "end": 265.0,
        "text": "Now, the core intelligence layer: autonomous multi-agent investigation. We provide an activity brief for Check Dam JH-04, and our LangGraph orchestrator dispatches six specialized sub-agents. The Retrieval agent executes 768-dimensional pgvector semantic searches. The Forensics agent validates geofences. The Vision agent enforces our strict Generative Firewall, permanently barring synthetic AI pixels from entering the evidence store. When an anomaly is detected, the graph pauses at a human-in-the-loop checkpoint. Once approved, the Synthesizer agent drafts a grounded report where every claim cites verified evidence."
    },
    {
        "id": "scene_09",
        "name": "Public QR Verification & Chain of Custody",
        "start": 265.0,
        "end": 285.0,
        "text": "And when a corporate donor, regulator, or citizen scans the QR code on a published CSR report, this is what they see: complete, tamper-proof provenance from published media back through privacy redactions to raw camera pixels and the immutable ledger block."
    },
    {
        "id": "scene_10",
        "name": "Conclusion & Verifiable Impact",
        "start": 285.0,
        "end": 300.0,
        "text": "Real projects. Verifiable proof. Zero greenwashing. Pramaan brings cryptographic truth back to ground reality, restoring trust to the world's most vital social and climate initiatives. Thank you."
    }
]

async def generate_speech():
    audio_dir = os.path.abspath("./recordings/audio")
    os.makedirs(audio_dir, exist_ok=True)
    
    print("=== GENERATING NEURAL AI VOICEOVER CLIPS ===")
    for s in SCENES:
        clip_path = os.path.join(audio_dir, f"{s['id']}.mp3")
        print(f"Generating {s['id']} ({s['name']})...")
        communicate = edge_tts.Communicate(s["text"], VOICE, rate="+3%")
        await communicate.save(clip_path)
        
        ffprobe_path = r"C:\Projects\Pramaan\node_modules\ffprobe-static\bin\win32\x64\ffprobe.exe"
        cmd = [
            ffprobe_path, "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", clip_path
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        dur = float(res.stdout.strip())
        s["audio_duration"] = dur
        s["allocated_duration"] = s["end"] - s["start"]
        print(f"  -> Duration: {dur:.2f}s (Allocated window: {s['allocated_duration']}s)")

    print("\n=== AUDIO GENERATION SUMMARY ===")
    total_speech = sum(s["audio_duration"] for s in SCENES)
    print(f"Total Speech: {total_speech:.2f}s across {len(SCENES)} scenes.")
    print("All audio clips generated successfully!")

if __name__ == "__main__":
    asyncio.run(generate_speech())
