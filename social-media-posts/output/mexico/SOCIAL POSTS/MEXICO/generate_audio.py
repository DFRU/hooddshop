#!/usr/bin/env python3
"""
Hood'd Mexico Reel — VO + Music Audio Generator
================================================
Generates voiceover audio via ElevenLabs API, pads to frame timings,
mixes with background music, and outputs final audio tracks.

Produces two versions:
  - mexico_reel_audio_EN.mp3  (English VO + music)
  - mexico_reel_audio_ES.mp3  (Spanish VO + music)

Usage:
    pip install requests
    python generate_audio.py

    # With custom music file:
    python generate_audio.py --music "path/to/beat.mp3"

    # VO only (no background music):
    python generate_audio.py --no-music

    # Generate only one language:
    python generate_audio.py --lang en
    python generate_audio.py --lang es

Requires:
    - ffmpeg on PATH
    - ElevenLabs API key in .secrets/elevenlabs.env or ELEVENLABS_API_KEY env var
"""
import sys
import os
import argparse
import requests
import json
import time
import subprocess
import shutil
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# ── Config ──────────────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent
SECRETS_FILE = Path(r"D:\HOODD\05_BUSINESS\promo\scripts\.secrets\elevenlabs.env")
VO_DIR = SCRIPT_DIR / "vo_clips"

# ElevenLabs API
API_BASE = "https://api.elevenlabs.io/v1"

# Frame timing (must match create_reel.py with --no-store)
# Each tuple: (label, duration_seconds, EN_line, ES_line)
FRAME_VO = [
    ("anchor",      4.0, "Your hood tells the world where you come from.",
                         "Tu cofre dice de dónde vienes."),
    ("design_home", 3.0, "México Home. Dark. Clean. Deadly.",
                         "México Local. Oscuro. Limpio. Letal."),
    ("design_away", 3.0, "The Away. Bright and loud.",
                         "La Visitante. Brillante y fuerte."),
    ("design_flag", 3.0, "Flag edition. Puro México.",
                         "Edición Bandera. Puro México."),
    ("endcard",     5.0, "Three designs. One nation. Hooddshop dot com. Link in bio.",
                         "Tres diseños. Una nación. Hooddshop punto com. Link en bio."),
]

# Voice settings
VOICE_SETTINGS = {
    "stability": 0.4,
    "similarity_boost": 0.75,
    "style": 0.5,
    "use_speaker_boost": True,
}

# Music mix levels
VO_VOLUME_DB = 0       # VO at full volume
MUSIC_VOLUME_DB = -14   # Music ducked under VO
MUSIC_FADE_IN_MS = 500
MUSIC_FADE_OUT_MS = 2000


def load_api_key():
    """Load ElevenLabs API key from env var or secrets file."""
    key = os.environ.get("ELEVENLABS_API_KEY")
    if key:
        return key.strip()

    if SECRETS_FILE.exists():
        for line in SECRETS_FILE.read_text().splitlines():
            line = line.strip()
            if line.startswith("ELEVENLABS_API_KEY="):
                return line.split("=", 1)[1].strip()

    print("[ERROR] No ElevenLabs API key found.")
    print(f"  Set ELEVENLABS_API_KEY env var or create {SECRETS_FILE}")
    sys.exit(1)


def list_voices(api_key):
    """Fetch available voices from ElevenLabs."""
    resp = requests.get(
        f"{API_BASE}/voices",
        headers={"xi-api-key": api_key},
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()["voices"]


def pick_voices(voices):
    """Pick suitable EN and ES voices. Returns dict with 'en' and 'es' voice IDs."""
    picked = {}

    # Preferred voices (by name substring, in priority order)
    en_prefs = ["Adam", "Antoni", "Arnold", "Josh", "Sam"]
    es_prefs = ["Carlos", "Diego", "Mateo", "Jorge"]

    # Find EN voice
    for pref in en_prefs:
        for v in voices:
            if pref.lower() in v["name"].lower():
                picked["en"] = (v["voice_id"], v["name"])
                break
        if "en" in picked:
            break

    # Find ES voice — look for Spanish language labels or names
    for v in voices:
        labels = v.get("labels", {})
        lang = labels.get("language", "").lower()
        accent = labels.get("accent", "").lower()
        if "spanish" in lang or "spanish" in accent or "latino" in accent:
            picked["es"] = (v["voice_id"], v["name"])
            break

    # Fallback: try name-based matching for ES
    if "es" not in picked:
        for pref in es_prefs:
            for v in voices:
                if pref.lower() in v["name"].lower():
                    picked["es"] = (v["voice_id"], v["name"])
                    break
            if "es" in picked:
                break

    # Final fallback: use same voice for both
    if "en" not in picked and voices:
        picked["en"] = (voices[0]["voice_id"], voices[0]["name"])
    if "es" not in picked:
        picked["es"] = picked.get("en", (voices[0]["voice_id"], voices[0]["name"]))

    return picked


def generate_tts(api_key, voice_id, text, output_path, model="eleven_multilingual_v2"):
    """Generate TTS audio via ElevenLabs API."""
    resp = requests.post(
        f"{API_BASE}/text-to-speech/{voice_id}",
        headers={
            "xi-api-key": api_key,
            "Content-Type": "application/json",
        },
        json={
            "text": text,
            "model_id": model,
            "voice_settings": VOICE_SETTINGS,
        },
        timeout=30,
    )
    resp.raise_for_status()

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(resp.content)

    size_kb = output_path.stat().st_size / 1024
    print(f"    [OK] {output_path.name} ({size_kb:.0f}KB)")
    return output_path


def build_timed_vo_ffmpeg(lang, clips_dir, output_path):
    """
    Place VO clips at exact timestamps in a silent master track.
    Uses Python wave module for sample-accurate placement — no complex ffmpeg filters.
    Steps: decode each clip to raw PCM → write into a silent WAV at correct offset → encode to MP3.
    """
    import wave
    import struct
    import tempfile

    SAMPLE_RATE = 44100
    CHANNELS = 2
    SAMPLE_WIDTH = 2  # 16-bit
    BYTES_PER_SAMPLE = SAMPLE_WIDTH * CHANNELS  # 4 bytes per stereo sample
    LEAD_SAMPLES = int(0.2 * SAMPLE_RATE)  # 200ms lead silence per frame

    # Calculate total duration and frame offsets
    total_duration_s = sum(dur for _, dur, _, _ in FRAME_VO)
    total_samples = int(total_duration_s * SAMPLE_RATE)

    # Create master buffer (silence)
    print(f"    [INIT] Creating {total_duration_s}s silent master track...")
    master = bytearray(total_samples * BYTES_PER_SAMPLE)

    tmp_dir = Path(tempfile.mkdtemp(prefix="hoodd_vo_"))

    try:
        # Calculate sample offset for each frame
        sample_offset = 0
        for label, frame_dur, en_line, es_line in FRAME_VO:
            clip_path = clips_dir / f"{label}_{lang}.mp3"
            frame_samples = int(frame_dur * SAMPLE_RATE)

            if clip_path.exists():
                # Decode MP3 to raw PCM WAV using ffmpeg
                wav_path = tmp_dir / f"{label}_{lang}.wav"
                cmd = [
                    "ffmpeg", "-y",
                    "-i", str(clip_path),
                    "-ar", str(SAMPLE_RATE),
                    "-ac", str(CHANNELS),
                    "-sample_fmt", "s16",
                    "-f", "wav",
                    str(wav_path),
                ]
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
                if result.returncode != 0:
                    print(f"    [WARN] Decode failed for {label}: {result.stderr[:150]}")
                    sample_offset += frame_samples
                    continue

                # Read the decoded PCM data
                with wave.open(str(wav_path), "rb") as wf:
                    pcm_data = wf.readframes(wf.getnframes())

                # Place clip at offset + lead silence
                insert_at = sample_offset + LEAD_SAMPLES
                byte_offset = insert_at * BYTES_PER_SAMPLE
                # Don't overflow past this frame's boundary
                max_bytes = (frame_samples - LEAD_SAMPLES) * BYTES_PER_SAMPLE
                clip_bytes = min(len(pcm_data), max_bytes)

                if byte_offset + clip_bytes <= len(master):
                    master[byte_offset:byte_offset + clip_bytes] = pcm_data[:clip_bytes]
                    clip_dur = clip_bytes / BYTES_PER_SAMPLE / SAMPLE_RATE
                    print(f"    [PLACE] {label} at {sample_offset/SAMPLE_RATE:.1f}s ({clip_dur:.1f}s clip)")
                else:
                    print(f"    [WARN] {label} clip exceeds master buffer, skipping")
            else:
                print(f"    [SKIP] {label} (no clip)")

            sample_offset += frame_samples

        # Write master WAV
        master_wav = tmp_dir / "master_vo.wav"
        with wave.open(str(master_wav), "wb") as wf:
            wf.setnchannels(CHANNELS)
            wf.setsampwidth(SAMPLE_WIDTH)
            wf.setframerate(SAMPLE_RATE)
            wf.writeframes(bytes(master))

        print(f"    [WAV] Master: {master_wav.name} ({os.path.getsize(master_wav) / 1024:.0f}KB)")

        # Encode to MP3
        cmd = [
            "ffmpeg", "-y",
            "-i", str(master_wav),
            "-c:a", "libmp3lame", "-b:a", "192k",
            str(output_path),
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode != 0:
            print(f"  [ERROR] MP3 encode failed: {result.stderr[:300]}")
            return False

        size_kb = output_path.stat().st_size / 1024
        print(f"  [OK] VO track: {output_path.name} ({size_kb:.0f}KB)")
        return True

    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


def mix_vo_and_music_ffmpeg(vo_path, music_path, output_path, vo_duration_s):
    """
    Mix VO track with background music using ffmpeg.
    Music is ducked under VO and faded in/out.
    """
    if not music_path or not Path(music_path).exists():
        # No music — just copy the VO as the final output
        import shutil
        shutil.copy2(vo_path, output_path)
        size_kb = output_path.stat().st_size / 1024
        print(f"  [OK] {output_path.name} ({size_kb:.0f}KB, VO only)")
        return True

    fade_in_s = MUSIC_FADE_IN_MS / 1000.0
    fade_out_s = MUSIC_FADE_OUT_MS / 1000.0
    fade_out_start = max(0, vo_duration_s - fade_out_s)

    cmd = [
        "ffmpeg", "-y",
        "-i", str(vo_path),
        "-i", str(music_path),
        "-filter_complex",
        # Music: trim to VO duration, duck volume, fade in/out
        f"[1:a]atrim=0:{vo_duration_s},asetpts=PTS-STARTPTS,"
        f"volume={MUSIC_VOLUME_DB}dB,"
        f"afade=t=in:st=0:d={fade_in_s},"
        f"afade=t=out:st={fade_out_start}:d={fade_out_s}[music];"
        # Mix VO + music
        f"[0:a][music]amix=inputs=2:duration=first:dropout_transition=0[out]",
        "-map", "[out]",
        "-c:a", "libmp3lame", "-b:a", "192k",
        str(output_path),
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    if result.returncode != 0:
        print(f"  [ERROR] Mix failed: {result.stderr[:300]}")
        return False

    size_kb = output_path.stat().st_size / 1024
    print(f"  [OK] {output_path.name} ({size_kb:.0f}KB, VO + music)")
    return True


def main():
    parser = argparse.ArgumentParser(description="Generate VO + music for Mexico reel")
    parser.add_argument("--music", type=str, default=None,
                        help="Path to background music file (MP3/WAV)")
    parser.add_argument("--no-music", action="store_true",
                        help="Skip background music (VO only)")
    parser.add_argument("--lang", type=str, default="both", choices=["en", "es", "both"],
                        help="Which language(s) to generate")
    parser.add_argument("--list-voices", action="store_true",
                        help="List available ElevenLabs voices and exit")
    parser.add_argument("--voice-en", type=str, default=None,
                        help="ElevenLabs voice ID for English VO")
    parser.add_argument("--voice-es", type=str, default=None,
                        help="ElevenLabs voice ID for Spanish VO")
    args = parser.parse_args()

    print("Hood'd Mexico — VO + Audio Generator")
    print("=" * 50)

    # Load API key
    api_key = load_api_key()
    print("[KEY] ElevenLabs API key loaded")

    # Fetch voices
    print("[VOICES] Fetching available voices...")
    voices = list_voices(api_key)

    if args.list_voices:
        print(f"\n{'Name':<25} {'ID':<25} {'Labels'}")
        print("-" * 80)
        for v in voices:
            labels = v.get("labels", {})
            label_str = ", ".join(f"{k}={v}" for k, v in labels.items()) if labels else ""
            print(f"{v['name']:<25} {v['voice_id']:<25} {label_str}")
        return

    # Pick voices
    picked = pick_voices(voices)
    if args.voice_en:
        picked["en"] = (args.voice_en, "custom-en")
    if args.voice_es:
        picked["es"] = (args.voice_es, "custom-es")

    print(f"  EN voice: {picked['en'][1]} ({picked['en'][0][:12]}...)")
    print(f"  ES voice: {picked['es'][1]} ({picked['es'][0][:12]}...)")

    # Determine languages to generate
    langs = ["en", "es"] if args.lang == "both" else [args.lang]

    # Generate VO clips
    VO_DIR.mkdir(exist_ok=True)
    for lang in langs:
        voice_id, voice_name = picked[lang]
        print(f"\n[TTS] Generating {lang.upper()} voiceover ({voice_name})...")

        for label, dur, en_line, es_line in FRAME_VO:
            text = en_line if lang == "en" else es_line
            out_path = VO_DIR / f"{label}_{lang}.mp3"

            # Skip if already generated (use --force to regenerate)
            if out_path.exists():
                print(f"    [SKIP] {out_path.name} (exists)")
                continue

            print(f"    [{label}] \"{text}\"")
            generate_tts(api_key, voice_id, text, out_path)
            time.sleep(0.3)  # Rate limit courtesy

    # Build timed VO tracks using ffmpeg
    print(f"\n[MIX] Building timed VO tracks (ffmpeg)...")
    music_path = None if args.no_music else args.music

    # Calculate total duration from frame sequence
    total_duration = sum(dur for _, dur, _, _ in FRAME_VO)

    for lang in langs:
        print(f"\n  [{lang.upper()}] Assembling VO...")
        vo_path = SCRIPT_DIR / f"mexico_vo_{lang}.mp3"
        success = build_timed_vo_ffmpeg(lang, VO_DIR, vo_path)
        if not success:
            print(f"  [ERROR] Failed to build {lang.upper()} VO track")
            continue

        output_name = f"mexico_reel_audio_{lang.upper()}.mp3"
        output_path = SCRIPT_DIR / output_name

        print(f"  [{lang.upper()}] Mixing VO + music...")
        mix_vo_and_music_ffmpeg(vo_path, music_path, output_path, total_duration)

    # Print next steps
    print(f"\n{'=' * 50}")
    print("[DONE] Audio files ready.\n")
    print("Next: rebuild reels with audio:")
    for lang in langs:
        audio_file = f"mexico_reel_audio_{lang.upper()}.mp3"
        output_file = f"mexico_reel_{lang.lower()}_9x16.mp4"
        print(f"  python create_reel.py --no-store --music \"{audio_file}\"")
        print(f"    → rename output to {output_file}\n")


if __name__ == "__main__":
    main()
