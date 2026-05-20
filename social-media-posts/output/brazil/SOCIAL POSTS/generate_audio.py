#!/usr/bin/env python3
"""
Hood'd Brazil — VO Clip Generator
==================================
Generates individual voiceover clips via ElevenLabs API.
Drop each clip onto your Clipchamp timeline aligned to its matching image.

Output (in vo_clips/):
  anchor_en.mp3, anchor_pt.mp3
  design_home_en.mp3, design_home_pt.mp3
  design_away_en.mp3, design_away_pt.mp3
  design_flag_en.mp3, design_flag_pt.mp3
  endcard_en.mp3, endcard_pt.mp3

Usage:
    python generate_audio.py
    python generate_audio.py --lang en
    python generate_audio.py --lang pt
    python generate_audio.py --force        # regenerate existing clips
    python generate_audio.py --list-voices

Requires:
    pip install requests
    ElevenLabs API key in D:\HOODD\05_BUSINESS\promo\scripts\.secrets\elevenlabs.env
"""
import sys
import os
import argparse
import requests
import time
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

SCRIPT_DIR = Path(__file__).parent
SECRETS_FILE = Path(r"D:\HOODD\05_BUSINESS\promo\scripts\.secrets\elevenlabs.env")
VO_DIR = SCRIPT_DIR / "vo_clips"

API_BASE = "https://api.elevenlabs.io/v1"

# VO lines per frame: (label, EN_line, PT_line)
FRAME_VO = [
    ("anchor",      "Your hood tells the world where you come from.",
                    "Seu capô mostra de onde você vem."),
    ("design_home", "Brazil Home. Bold. Green. Gold.",
                    "Brasil Local. Verde. Ouro. Ousado."),
    ("design_away", "The Away. Dark and electric.",
                    "A Visitante. Escura e elétrica."),
    ("design_flag", "Flag edition. Puro Brasil.",
                    "Edição Bandeira. Puro Brasil."),
    ("endcard",     "Three designs. One nation. Hooddshop dot com. Link in bio.",
                    "Três designs. Uma nação. Hooddshop ponto com. Link na bio."),
]

VOICE_SETTINGS = {
    "stability": 0.4,
    "similarity_boost": 0.75,
    "style": 0.5,
    "use_speaker_boost": True,
}


def load_api_key():
    key = os.environ.get("ELEVENLABS_API_KEY")
    if key:
        return key.strip()
    if SECRETS_FILE.exists():
        for line in SECRETS_FILE.read_text().splitlines():
            line = line.strip()
            if line.startswith("ELEVENLABS_API_KEY="):
                return line.split("=", 1)[1].strip()
    print("[ERROR] No ElevenLabs API key found.")
    sys.exit(1)


def list_voices(api_key):
    resp = requests.get(f"{API_BASE}/voices", headers={"xi-api-key": api_key}, timeout=15)
    resp.raise_for_status()
    return resp.json()["voices"]


def pick_voices(voices):
    picked = {}

    en_prefs = ["Adam", "Antoni", "Arnold", "Josh", "Sam"]
    pt_prefs = ["Carlos", "Diego", "Mateo", "Jorge"]

    for pref in en_prefs:
        for v in voices:
            if pref.lower() in v["name"].lower():
                picked["en"] = (v["voice_id"], v["name"])
                break
        if "en" in picked:
            break

    for v in voices:
        labels = v.get("labels", {})
        lang = labels.get("language", "").lower()
        accent = labels.get("accent", "").lower()
        if "portuguese" in lang or "brazilian" in lang or "brazilian" in accent:
            picked["pt"] = (v["voice_id"], v["name"])
            break

    if "pt" not in picked:
        for pref in pt_prefs:
            for v in voices:
                if pref.lower() in v["name"].lower():
                    picked["pt"] = (v["voice_id"], v["name"])
                    break
            if "pt" in picked:
                break

    if "en" not in picked and voices:
        picked["en"] = (voices[0]["voice_id"], voices[0]["name"])
    if "pt" not in picked:
        # Multilingual v2 model handles Portuguese fine with any voice
        picked["pt"] = picked.get("en", (voices[0]["voice_id"], voices[0]["name"]))

    return picked


def generate_tts(api_key, voice_id, text, output_path, model="eleven_multilingual_v2"):
    resp = requests.post(
        f"{API_BASE}/text-to-speech/{voice_id}",
        headers={"xi-api-key": api_key, "Content-Type": "application/json"},
        json={"text": text, "model_id": model, "voice_settings": VOICE_SETTINGS},
        timeout=30,
    )
    resp.raise_for_status()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(resp.content)
    size_kb = output_path.stat().st_size / 1024
    print(f"    [OK] {output_path.name} ({size_kb:.0f}KB)")


def main():
    parser = argparse.ArgumentParser(description="Generate Brazil VO clips")
    parser.add_argument("--lang", type=str, default="both", choices=["en", "pt", "both"])
    parser.add_argument("--list-voices", action="store_true")
    parser.add_argument("--voice-en", type=str, default=None)
    parser.add_argument("--voice-pt", type=str, default=None)
    parser.add_argument("--force", action="store_true", help="Regenerate existing clips")
    args = parser.parse_args()

    print("Hood'd Brazil — VO Clip Generator")
    print("=" * 50)

    api_key = load_api_key()
    print("[KEY] API key loaded")

    print("[VOICES] Fetching voices...")
    voices = list_voices(api_key)

    if args.list_voices:
        print(f"\n{'Name':<25} {'ID':<25} {'Labels'}")
        print("-" * 80)
        for v in voices:
            labels = v.get("labels", {})
            label_str = ", ".join(f"{k}={val}" for k, val in labels.items()) if labels else ""
            print(f"{v['name']:<25} {v['voice_id']:<25} {label_str}")
        return

    picked = pick_voices(voices)
    if args.voice_en:
        picked["en"] = (args.voice_en, "custom-en")
    if args.voice_pt:
        picked["pt"] = (args.voice_pt, "custom-pt")

    print(f"  EN voice: {picked['en'][1]} ({picked['en'][0][:12]}...)")
    print(f"  PT voice: {picked['pt'][1]} ({picked['pt'][0][:12]}...)")

    langs = ["en", "pt"] if args.lang == "both" else [args.lang]

    VO_DIR.mkdir(exist_ok=True)
    total_generated = 0

    for lang in langs:
        voice_id, voice_name = picked[lang]
        print(f"\n[TTS] Generating {lang.upper()} clips ({voice_name})...")

        for label, en_line, pt_line in FRAME_VO:
            text = en_line if lang == "en" else pt_line
            out_path = VO_DIR / f"{label}_{lang}.mp3"

            if out_path.exists() and not args.force:
                print(f"    [SKIP] {out_path.name} (exists, use --force)")
                continue

            print(f"    [{label}] \"{text}\"")
            generate_tts(api_key, voice_id, text, out_path)
            total_generated += 1
            time.sleep(0.3)

    print(f"\n{'=' * 50}")
    print(f"[DONE] {total_generated} clips generated in {VO_DIR}")
    print(f"\nClipchamp timeline (suggested):")
    print(f"  0-4s   anchor   → {VO_DIR / 'anchor_XX.mp3'}")
    print(f"  4-7s   home     → {VO_DIR / 'design_home_XX.mp3'}")
    print(f"  7-10s  away     → {VO_DIR / 'design_away_XX.mp3'}")
    print(f"  10-13s flag     → {VO_DIR / 'design_flag_XX.mp3'}")
    print(f"  13-18s endcard  → {VO_DIR / 'endcard_XX.mp3'}")
    print(f"\n  (Replace XX with 'en' or 'pt')")


if __name__ == "__main__":
    main()
