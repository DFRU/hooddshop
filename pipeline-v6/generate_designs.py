#!/usr/bin/env python3
"""
Hood'd Design Pipeline v6 — Multi-line design generator for all 48 nations.

Generates print-ready hood cover artwork using OpenAI GPT Image API.
Output: 12800x9600 PNG @ 200 DPI (Printkk print spec).

Usage:
    python generate_designs.py                              # Tier 1 nations, all lines
    python generate_designs.py --nations USA,Brazil         # Specific nations
    python generate_designs.py --lines artsy,jersey         # Specific design lines
    python generate_designs.py --tier 2                     # Tier 2 nations only
    python generate_designs.py --all                        # All 48 nations, all lines
    python generate_designs.py --dry-run                    # Print prompts, no API calls
    python generate_designs.py --output-dir ./designs-v6    # Custom output dir
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path

import requests
from dotenv import load_dotenv
from openai import OpenAI
from PIL import Image

# Allow large images for print resolution
Image.MAX_IMAGE_PIXELS = 200_000_000

# Import our nation data
from nations_v6 import NATIONS, TIER_1, TIER_2, ALL_NATION_NAMES

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

PRINT_WIDTH = 12800
PRINT_HEIGHT = 9600
PRINT_DPI = 200
PREVIEW_WIDTH = 1280
PREVIEW_HEIGHT = 960

# Printkk surface dimensions — artwork is pre-scaled to fill this
PRINTKK_WIDTH = 9448
PRINTKK_HEIGHT = 7086

ALL_LINES = ["artsy", "concept", "flag_flow", "cultural", "jersey", "retro"]

# Tier 1 gets all 6 lines, Tier 2 gets 3
TIER_2_LINES = ["artsy", "flag_flow", "jersey"]

# ---------------------------------------------------------------------------
# Color helpers
# ---------------------------------------------------------------------------

HEX_TO_NAME = {
    "#B22234": "red", "#FFFFFF": "white", "#3C3B6E": "navy blue",
    "#006847": "green", "#CE1126": "red", "#FF0000": "red",
    "#009C3B": "green", "#FFDF00": "gold", "#002776": "blue",
    "#74ACDF": "sky blue", "#F6B40E": "gold", "#000000": "black",
    "#DD0000": "red", "#FFCC00": "gold", "#CE1124": "red",
    "#003478": "navy blue", "#002395": "blue", "#ED2939": "red",
    "#FFD700": "gold", "#009246": "green", "#CE2B37": "red",
    "#AA151B": "red", "#F1BF00": "yellow", "#006600": "green",
    "#FCD116": "yellow", "#003893": "blue", "#BC002D": "red",
    "#CD2E3A": "red", "#0047A0": "blue", "#008751": "green",
    "#C1272D": "red", "#006233": "green", "#AE1C28": "red",
    "#21468B": "blue", "#FF6600": "orange", "#FDDA24": "yellow",
    "#EF3340": "red", "#0000FF": "blue", "#0038A8": "blue",
    "#00853F": "green", "#FDEF42": "yellow", "#E31B23": "red",
    "#002868": "navy blue", "#BF0A30": "red", "#004225": "dark green",
    "#002FA7": "deep blue", "#003DA5": "royal blue", "#00008B": "dark navy",
    "#FF8200": "orange", "#009A44": "green", "#FFB612": "gold",
    "#DE3831": "red", "#007A4D": "green", "#E70013": "red",
    "#BA0C2F": "red", "#00205B": "navy blue", "#006AA7": "blue",
    "#FECC02": "yellow", "#E30A17": "red", "#FFCD00": "yellow",
    "#D7141A": "red", "#11457E": "blue", "#DA121A": "red",
    "#F7D116": "yellow", "#007FFF": "sky blue", "#CE1021": "red",
    "#F7D618": "yellow", "#C09E5F": "antique gold", "#DA0000": "red",
    "#239F40": "green", "#007A3D": "green", "#8A1538": "maroon",
    "#0099B5": "turquoise blue", "#1EB53A": "green", "#00247D": "navy blue",
    "#CC142B": "red", "#D21034": "red", "#F9E814": "yellow",
    "#002B7F": "royal blue", "#00209F": "blue",
}


def colors_to_natural(hex_colors):
    """Convert hex color list to natural language."""
    names = []
    seen = set()
    for h in hex_colors:
        name = HEX_TO_NAME.get(h.upper(), h)
        if name not in seen:
            names.append(name)
            seen.add(name)
    if len(names) == 1:
        return names[0]
    elif len(names) == 2:
        return f"{names[0]} and {names[1]}"
    return ", ".join(names[:-1]) + f", and {names[-1]}"


# ---------------------------------------------------------------------------
# Prompt templates — each produces FLAT artwork, NO vehicles, NO 3D objects
# ---------------------------------------------------------------------------

PROMPTS = {
    "artsy": (
        "Psychedelic maximalist abstract art filling the ENTIRE frame edge to edge "
        "with absolutely no background visible. Dense swirling ribbons of vibrant paint in "
        "{colors} flowing in dramatic spirals, S-curves, and turbulent vortexes. "
        "Colors layer and interweave with visible depth and glossy sheen. Fine geometric "
        "line patterns and hatching nested within flowing forms. Extreme saturation, "
        "high contrast, bold and overwhelming. Large-format fine art print viewed from "
        "inches away. No objects, no symbols, no figures, no text, no logos. "
        "Pure abstract color field energy. Every square inch filled solid."
    ),
    "concept": (
        "Bold automotive-inspired graphic art, flat 2D composition filling the ENTIRE "
        "frame edge to edge. Dynamic diagonal speed stripes and angular shapes in "
        "{colors} with metallic chrome highlights and reflections. Racing-inspired "
        "design with aggressive forward-slanting geometry, carbon fiber texture accents, "
        "and polished metallic sheen on color surfaces. High contrast between dark "
        "areas and vivid color bands. Professional motorsport livery aesthetic — sleek, "
        "powerful, premium. Studio-lit appearance with specular highlights. "
        "No car, no vehicle, no 3D object — flat graphic art only. Every pixel covered."
    ),
    "flag_flow": (
        "National flag of {nation} reimagined as dramatic flowing liquid paint art, "
        "filling the ENTIRE frame edge to edge. The flag's distinctive pattern — "
        "{flag_pattern} — is clearly recognizable but transformed into thick glossy "
        "flowing ribbons of paint in motion. Colors in {colors} swirl and blend at "
        "their boundaries with visible paint texture, depth, and metallic sheen. "
        "The composition maintains the flag's essential visual structure while adding "
        "dramatic S-curves, turbulent flows, and painterly energy. Bold, saturated, "
        "every square inch covered. No car, no vehicle — flat art viewed straight on. "
        "No text, no emblems, no logos."
    ),
    "cultural": (
        "Epic panoramic illustration in {colors}, filling the ENTIRE frame edge to "
        "edge with no background gaps. A dramatic center focal point radiates outward "
        "with flowing color ribbons and bold cultural imagery. Integrated into the "
        "swirling composition: {cultural_motifs}. Dense layered composition with "
        "Art Nouveau flowing organic lines meeting bold graphic shapes. Every element "
        "flows into the next — no isolated floating objects. Rich texture, metallic "
        "highlights, visible brushwork energy. Viewed straight-on as flat art. "
        "No car, no vehicle, no 3D rendering. No text, no words, no logos."
    ),
    "jersey": (
        "Abstract geometric athletic textile pattern filling the ENTIRE frame edge "
        "to edge. Inspired by {nation}'s football identity: {jersey_pattern}. "
        "Bold angular shapes, diagonal speed lines, and tessellated geometric forms "
        "in {colors}. Fabric-like texture with sublimation print quality — smooth "
        "gradients meeting sharp geometric boundaries. Professional sportswear design "
        "aesthetic with dynamic asymmetric composition. High contrast, clean edges, "
        "modern athletic energy. No jersey shape, no clothing silhouette, no text, "
        "no numbers, no logos, no crests — pure pattern art filling every pixel."
    ),
    "retro": (
        "Tribute artwork celebrating {nation}'s {retro_era} football era. "
        "Vintage-inspired design in {retro_colors_natural} filling the ENTIRE frame "
        "edge to edge. {retro_desc}. Retro graphic style with grain texture, "
        "halftone dot patterns, screen-print layers. Bold typography-free composition "
        "using era-appropriate design language — chunky geometric shapes, vintage "
        "color palettes, nostalgic warmth. Professional poster art quality. "
        "No text, no numbers, no logos, no faces, no photographs. "
        "Pure retro graphic art. Every square inch filled."
    ),
}

# Base negative prompt applied to ALL generations
NEGATIVE_SUFFIX = (
    "No text, no words, no letters, no numbers, no logos, no watermarks, "
    "no signatures, no faces, no people, no hands, no cars, no vehicles, "
    "no 3D objects, no photographs, no frames, no borders, no white margins, "
    "no empty space, no background showing through."
)

# Nation-specific things to NEVER generate
COUNTRY_NEGATIVES = {
    "Japan": "Rising Sun military flag with rays, anime characters, ninja",
    "Saudi Arabia": "Arabic text, shahada inscription, religious calligraphy, Quran verses",
    "Morocco": "Arabic religious text, Quran quotes",
    "Iran": "political regime symbols, Ayatollah imagery",
    "Iraq": "war imagery, political regime symbols",
    "Turkey": "Armenian references, political symbols",
    "South Korea": "North Korea flag, K-pop branding",
    "Germany": "Iron Cross, Imperial Eagle, swastika, Nazi symbols",
    "Israel": "Star of David in political context",  # not in tournament but safety
}


def build_prompt(nation_name, line):
    """Build the full prompt for a nation + design line."""
    data = NATIONS[nation_name]
    colors = colors_to_natural(data["flag_colors"])

    template = PROMPTS[line]
    prompt = template.format(
        nation=nation_name,
        colors=colors,
        flag_pattern=data.get("flag_pattern", ""),
        cultural_motifs=data.get("cultural_motifs", ""),
        jersey_pattern=data.get("jersey_pattern", ""),
        retro_era=data.get("retro_era", ""),
        retro_desc=data.get("retro_desc", ""),
        retro_colors_natural=colors_to_natural(data.get("retro_colors", data["flag_colors"])),
    )
    return prompt


# ---------------------------------------------------------------------------
# Image generation
# ---------------------------------------------------------------------------

def generate_image(client, prompt, nation_name):
    """Generate an image via OpenAI GPT Image API. Returns image bytes."""
    # Add negative suffix
    full_prompt = prompt + "\n\n" + NEGATIVE_SUFFIX

    # Add country-specific negatives
    if nation_name in COUNTRY_NEGATIVES:
        full_prompt += f"\n\nSpecifically avoid: {COUNTRY_NEGATIVES[nation_name]}"

    print(f"    Calling OpenAI API...")
    response = client.images.generate(
        model="gpt-image-1",
        prompt=full_prompt,
        n=1,
        size="1536x1024",  # Closest to 3:2 aspect for hood cover
        quality="high",
    )

    # Download the image
    image_url = response.data[0].url
    if image_url:
        img_response = requests.get(image_url, timeout=60)
        img_response.raise_for_status()
        return img_response.content
    else:
        # Base64 response
        import base64
        b64 = response.data[0].b64_json
        return base64.b64decode(b64)


def upscale_to_print(image_bytes, output_path):
    """Upscale image to print resolution (12800x9600 @ 200 DPI) and save."""
    img = Image.open(BytesIO(image_bytes))
    img = img.convert("RGB")
    img = img.resize((PRINT_WIDTH, PRINT_HEIGHT), Image.LANCZOS)
    img.save(output_path, "PNG", dpi=(PRINT_DPI, PRINT_DPI))
    return output_path


def save_printkk_ready(image_bytes, output_path):
    """Save at Printkk surface resolution (9448x7086) for direct upload.
    This fills the ENTIRE Printkk surface with no dead space."""
    img = Image.open(BytesIO(image_bytes))
    img = img.convert("RGB")
    img = img.resize((PRINTKK_WIDTH, PRINTKK_HEIGHT), Image.LANCZOS)
    img.save(output_path, "PNG")
    return output_path


def save_preview(image_bytes, output_path):
    """Save a web-quality preview (1280x960 JPEG)."""
    img = Image.open(BytesIO(image_bytes))
    img = img.convert("RGB")
    img = img.resize((PREVIEW_WIDTH, PREVIEW_HEIGHT), Image.LANCZOS)
    img.save(output_path, "JPEG", quality=85)
    return output_path


# ---------------------------------------------------------------------------
# QC checks
# ---------------------------------------------------------------------------

def qc_check(image_bytes):
    """Run basic quality checks. Returns (passed: bool, issues: list)."""
    issues = []
    try:
        img = Image.open(BytesIO(image_bytes))
        w, h = img.size

        # Check aspect ratio is roughly 3:2
        ratio = w / h
        if ratio < 1.3 or ratio > 1.7:
            issues.append(f"Aspect ratio {ratio:.2f} outside 3:2 range")

        # Check it's not too small
        if w < 1024 or h < 768:
            issues.append(f"Too small: {w}x{h}")

        # Check it's RGB
        if img.mode not in ("RGB", "RGBA"):
            issues.append(f"Color mode {img.mode}, expected RGB")

        # Check for excessive white/black borders (edge uniformity)
        import numpy as np
        arr = np.array(img.convert("RGB"))
        # Check edges
        top_row = arr[0, :, :].mean()
        bottom_row = arr[-1, :, :].mean()
        left_col = arr[:, 0, :].mean()
        right_col = arr[:, -1, :].mean()
        edge_avg = (top_row + bottom_row + left_col + right_col) / 4
        if edge_avg > 245:
            issues.append("Edges appear mostly white — may have borders")
        if edge_avg < 10:
            issues.append("Edges appear mostly black — may have borders")

    except Exception as e:
        issues.append(f"QC error: {e}")

    return len(issues) == 0, issues


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Hood'd Design Pipeline v6")
    parser.add_argument("--nations", type=str, help="Comma-separated nation names")
    parser.add_argument("--lines", type=str, help="Comma-separated design lines")
    parser.add_argument("--tier", type=int, choices=[1, 2], help="Generate for tier 1 or 2")
    parser.add_argument("--all", action="store_true", help="All 48 nations")
    parser.add_argument("--dry-run", action="store_true", help="Print prompts only")
    parser.add_argument("--output-dir", type=str, default="designs-v6", help="Output directory")
    parser.add_argument("--skip-existing", action="store_true", default=True, help="Skip if output exists")
    parser.add_argument("--printkk-ready", action="store_true", default=True,
                        help="Also save Printkk-surface-sized version (fills entire surface)")
    args = parser.parse_args()

    # Load API keys
    load_dotenv()
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key and not args.dry_run:
        print("ERROR: OPENAI_API_KEY not found in environment or .env file")
        sys.exit(1)

    client = None if args.dry_run else OpenAI(api_key=api_key)

    # Determine nations to process
    if args.nations:
        nation_names = [n.strip() for n in args.nations.split(",")]
        # Validate
        for n in nation_names:
            if n not in NATIONS:
                print(f"ERROR: Unknown nation '{n}'. Available: {', '.join(ALL_NATION_NAMES)}")
                sys.exit(1)
    elif args.all:
        nation_names = ALL_NATION_NAMES
    elif args.tier == 2:
        nation_names = TIER_2
    else:
        nation_names = TIER_1

    # Determine design lines
    if args.lines:
        lines = [l.strip() for l in args.lines.split(",")]
        for l in lines:
            if l not in ALL_LINES:
                print(f"ERROR: Unknown line '{l}'. Available: {', '.join(ALL_LINES)}")
                sys.exit(1)
    else:
        lines = None  # Will be determined per-nation based on tier

    # Setup output directory
    output_base = Path(args.output_dir)
    output_base.mkdir(parents=True, exist_ok=True)

    # Manifest for tracking
    manifest = {
        "pipeline": "hoodd-design-v6",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "nations": [],
    }

    total_generated = 0
    total_skipped = 0
    total_failed = 0

    print(f"\n{'='*60}")
    print(f"  Hood'd Design Pipeline v6")
    print(f"  Nations: {len(nation_names)} | Lines: {lines or 'auto (tier-based)'}")
    print(f"  Output: {output_base.resolve()}")
    print(f"  Dry run: {args.dry_run}")
    print(f"{'='*60}\n")

    for nation_name in nation_names:
        data = NATIONS[nation_name]
        code = data["code"]

        # Determine lines for this nation
        if lines:
            nation_lines = lines
        elif nation_name in TIER_1:
            nation_lines = ALL_LINES
        else:
            nation_lines = TIER_2_LINES

        print(f"\n{'─'*50}")
        print(f"  {nation_name} ({code}) — {len(nation_lines)} design lines")
        print(f"{'─'*50}")

        nation_dir = output_base / code
        nation_dir.mkdir(exist_ok=True)

        for line in nation_lines:
            filename_base = f"{code}_{line}"
            print_path = nation_dir / f"{filename_base}_print.png"
            printkk_path = nation_dir / f"{filename_base}_printkk.png"
            preview_path = nation_dir / f"{filename_base}_preview.jpg"

            # Skip if exists
            if args.skip_existing and print_path.exists():
                print(f"  [{line}] SKIP — already exists")
                total_skipped += 1
                continue

            # Build prompt
            prompt = build_prompt(nation_name, line)

            if args.dry_run:
                print(f"\n  [{line}] PROMPT:")
                print(f"  {prompt[:200]}...")
                total_skipped += 1
                continue

            # Generate
            try:
                print(f"  [{line}] Generating...", end="", flush=True)
                start_t = time.time()
                image_bytes = generate_image(client, prompt, nation_name)
                elapsed = time.time() - start_t
                print(f" {elapsed:.1f}s", end="")

                # QC check
                passed, issues = qc_check(image_bytes)
                if not passed:
                    print(f" ⚠ QC issues: {issues}")
                else:
                    print(f" ✓ QC passed")

                # Save print resolution
                upscale_to_print(image_bytes, print_path)
                print(f"    → Print: {print_path}")

                # Save Printkk-ready (fills entire surface)
                if args.printkk_ready:
                    save_printkk_ready(image_bytes, printkk_path)
                    print(f"    → Printkk: {printkk_path}")

                # Save preview
                save_preview(image_bytes, preview_path)

                total_generated += 1

                # Rate limiting — be respectful
                time.sleep(2)

            except Exception as e:
                print(f" ✗ FAILED: {e}")
                total_failed += 1
                time.sleep(5)  # Back off on errors
                continue

        manifest["nations"].append({
            "name": nation_name,
            "code": code,
            "lines": nation_lines,
        })

    # Save manifest
    manifest_path = output_base / "manifest.json"
    manifest["summary"] = {
        "generated": total_generated,
        "skipped": total_skipped,
        "failed": total_failed,
    }
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    print(f"\n{'='*60}")
    print(f"  COMPLETE")
    print(f"  Generated: {total_generated} | Skipped: {total_skipped} | Failed: {total_failed}")
    print(f"  Manifest: {manifest_path}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
