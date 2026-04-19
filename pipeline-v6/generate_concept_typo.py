#!/usr/bin/env python3
"""
Hood'd Pipeline v6 — Concept Typo Generator (Production)

Generates hood cover designs in the proven "concept_typo" style:
  - Bold motorsport racing livery with nation name integrated as typography
  - 3 color variants per nation: HOME jersey, AWAY jersey, FLAG colors
  - Uses OpenAI gpt-image-1 (the same AI that produced the France/Japan picks)

Output structure:
  C:\Dev\hooddshop\production\
    previews/   <- 1536x1024 API size for quick review
    print/      <- 9448x7086 Printkk production resolution

Usage:
    # Test single nation
    python generate_concept_typo.py --nations France

    # Full 48-nation production run (144 images)
    python generate_concept_typo.py

    # Only home variants
    python generate_concept_typo.py --variants home
"""

import argparse
import base64
import io
import json
import os
import sys
import time
from pathlib import Path

import requests
from dotenv import load_dotenv
from PIL import Image

Image.MAX_IMAGE_PIXELS = 200_000_000

# ---------------------------------------------------------------------------
# Import nation data
# ---------------------------------------------------------------------------
from nations_v6 import NATIONS

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
API_WIDTH = 1536
API_HEIGHT = 1024
OUTPUT_WIDTH = 9448
OUTPUT_HEIGHT = 7086

MAX_RETRIES = 3
RETRY_DELAY = 8  # seconds

# Nations with full names >= 10 chars: abbreviation only for text
LONG_NAME_THRESHOLD = 10

# FIFA codes for text overlay
FIFA_CODES = {
    "USA": ("USA", "UNITED STATES"),
    "Canada": ("CAN", "CANADA"),
    "Mexico": ("MEX", "MEXICO"),
    "Panama": ("PAN", "PANAMA"),
    "Curacao": ("CUW", "CURAÇAO"),
    "Haiti": ("HAI", "HAITI"),
    "Argentina": ("ARG", "ARGENTINA"),
    "Brazil": ("BRA", "BRAZIL"),
    "Colombia": ("COL", "COLOMBIA"),
    "Ecuador": ("ECU", "ECUADOR"),
    "Paraguay": ("PAR", "PARAGUAY"),
    "Uruguay": ("URU", "URUGUAY"),
    "England": ("ENG", "ENGLAND"),
    "France": ("FRA", "FRANCE"),
    "Germany": ("GER", "GERMANY"),
    "Spain": ("ESP", "SPAIN"),
    "Portugal": ("POR", "PORTUGAL"),
    "Netherlands": ("NED", "NETHERLANDS"),
    "Belgium": ("BEL", "BELGIUM"),
    "Croatia": ("CRO", "CROATIA"),
    "Switzerland": ("SUI", "SWITZERLAND"),
    "Austria": ("AUT", "AUSTRIA"),
    "Norway": ("NOR", "NORWAY"),
    "Scotland": ("SCO", "SCOTLAND"),
    "Sweden": ("SWE", "SWEDEN"),
    "Turkey": ("TUR", "TURKEY"),
    "Bosnia": ("BIH", "BOSNIA"),
    "Czech_Republic": ("CZE", "CZECHIA"),
    "Morocco": ("MAR", "MOROCCO"),
    "Senegal": ("SEN", "SENEGAL"),
    "Ghana": ("GHA", "GHANA"),
    "Algeria": ("ALG", "ALGERIA"),
    "Cape_Verde": ("CPV", "CAPE VERDE"),
    "DR_Congo": ("COD", "DR CONGO"),
    "Egypt": ("EGY", "EGYPT"),
    "Ivory_Coast": ("CIV", "IVORY COAST"),
    "South_Africa": ("RSA", "SOUTH AFRICA"),
    "Tunisia": ("TUN", "TUNISIA"),
    "Japan": ("JPN", "JAPAN"),
    "South_Korea": ("KOR", "SOUTH KOREA"),
    "Australia": ("AUS", "AUSTRALIA"),
    "Saudi_Arabia": ("KSA", "SAUDI ARABIA"),
    "Iran": ("IRN", "IRAN"),
    "Iraq": ("IRQ", "IRAQ"),
    "Jordan": ("JOR", "JORDAN"),
    "Qatar": ("QAT", "QATAR"),
    "Uzbekistan": ("UZB", "UZBEKISTAN"),
    "New_Zealand": ("NZL", "NEW ZEALAND"),
}


# ---------------------------------------------------------------------------
# Jersey color data — weighted scoring per variant
#
# Each color entry is a list of (color_name, weight) tuples.
#   weight 3 = PRIMARY dominant — covers 60%+ of the jersey surface
#   weight 2 = SECONDARY — significant presence, 15-30%
#   weight 1 = ACCENT — trim, details, small elements, 5-15%
#
# The prompt builder converts these into weighted language so the AI
# allocates visual real estate proportionally.
# ---------------------------------------------------------------------------

JERSEY_COLORS = {
    # ── HOSTS ──
    "USA": {
        "home": [("navy blue", 3), ("white", 2), ("red", 1)],
        "away": [("white", 3), ("navy blue", 2), ("red", 1)],
        "flag": [("red", 3), ("white", 2), ("navy blue", 2)],
    },
    "Canada": {
        "home": [("red", 3), ("white", 2), ("black", 1)],
        "away": [("white", 3), ("red", 2), ("black", 1)],
        "flag": [("red", 3), ("white", 3)],
    },
    "Mexico": {
        "home": [("deep dark green", 3), ("white", 1), ("red", 1)],
        "away": [("white", 3), ("green", 2), ("red", 1)],
        "flag": [("green", 3), ("white", 2), ("red", 2)],
    },
    # ── CONCACAF ──
    "Panama": {
        "home": [("red", 3), ("white", 2), ("blue", 1)],
        "away": [("white", 3), ("red", 2), ("blue", 1)],
        "flag": [("red", 2), ("white", 2), ("blue", 2)],
    },
    "Curacao": {
        "home": [("royal blue", 3), ("yellow", 2), ("white", 1)],
        "away": [("white", 3), ("royal blue", 2), ("yellow", 1)],
        "flag": [("blue", 3), ("yellow", 2), ("red", 1)],
    },
    "Haiti": {
        "home": [("blue", 3), ("red", 2), ("white", 1)],
        "away": [("white", 3), ("blue", 2), ("red", 1)],
        "flag": [("blue", 3), ("red", 3)],
    },
    # ── SOUTH AMERICA ──
    "Argentina": {
        "home": [("sky blue", 3), ("white", 3), ("gold", 1)],
        "away": [("dark navy", 3), ("purple", 1), ("gold", 1)],
        "flag": [("sky blue", 3), ("white", 3), ("gold", 1)],
    },
    "Brazil": {
        "home": [("canary yellow", 3), ("green", 2), ("blue", 1)],
        "away": [("deep navy blue", 3), ("electric blue", 2), ("yellow", 1)],
        "flag": [("green", 3), ("yellow", 3), ("blue", 1)],
    },
    "Colombia": {
        "home": [("bright yellow", 3), ("blue", 2), ("red", 1)],
        "away": [("navy blue", 3), ("yellow", 2), ("red", 1)],
        "flag": [("yellow", 3), ("blue", 2), ("red", 1)],
    },
    "Ecuador": {
        "home": [("golden yellow", 3), ("blue", 2), ("red", 1)],
        "away": [("blue", 3), ("yellow", 2), ("red", 1)],
        "flag": [("yellow", 3), ("blue", 2), ("red", 1)],
    },
    "Paraguay": {
        "home": [("red", 3), ("white", 2), ("blue", 1)],
        "away": [("blue", 3), ("red", 1), ("white", 1)],
        "flag": [("red", 2), ("white", 2), ("blue", 2)],
    },
    "Uruguay": {
        "home": [("sky blue", 3), ("white", 1), ("gold", 1)],
        "away": [("white", 3), ("sky blue", 2), ("gold", 1)],
        "flag": [("sky blue", 3), ("white", 2), ("gold", 1)],
    },
    # ── EUROPE ──
    "England": {
        "home": [("white", 3), ("navy blue", 2), ("red", 1)],
        "away": [("dark navy blue", 3), ("red", 1), ("white", 1)],
        "flag": [("white", 3), ("red", 3)],
    },
    "France": {
        "home": [("navy blue", 3), ("white", 2), ("red", 1), ("gold", 1)],
        "away": [("white", 3), ("navy blue", 2), ("red", 1)],
        "flag": [("blue", 3), ("white", 2), ("red", 2)],
    },
    "Germany": {
        "home": [("white", 3), ("black", 2), ("red", 1), ("gold", 1)],
        "away": [("black", 3), ("red", 2), ("gold", 1)],
        "flag": [("black", 3), ("red", 2), ("gold", 2)],
    },
    "Spain": {
        "home": [("red", 3), ("yellow", 2), ("navy blue", 1)],
        "away": [("dark navy", 3), ("red", 1), ("yellow", 1)],
        "flag": [("red", 3), ("yellow", 3)],
    },
    "Portugal": {
        "home": [("dark red", 3), ("green", 2), ("gold", 1)],
        "away": [("mint green", 3), ("dark red", 1), ("gold", 1)],
        "flag": [("green", 3), ("red", 2), ("gold", 1)],
    },
    "Netherlands": {
        "home": [("bright orange", 3), ("black", 1), ("white", 1)],
        "away": [("dark navy blue", 3), ("orange", 2)],
        "flag": [("orange", 3), ("white", 2), ("blue", 2)],
    },
    "Belgium": {
        "home": [("red", 3), ("black", 2), ("yellow", 1)],
        "away": [("white", 3), ("red", 1), ("yellow", 1), ("black", 1)],
        "flag": [("black", 2), ("yellow", 2), ("red", 2)],
    },
    "Croatia": {
        "home": [("red", 3), ("white", 3), ("blue", 1)],
        "away": [("dark navy blue", 3), ("red", 1), ("white", 1)],
        "flag": [("red", 3), ("white", 2), ("blue", 2)],
    },
    "Switzerland": {
        "home": [("red", 3), ("white", 2)],
        "away": [("white", 3), ("red", 2)],
        "flag": [("red", 3), ("white", 2)],
    },
    "Austria": {
        "home": [("red", 3), ("white", 2)],
        "away": [("white", 3), ("red", 2)],
        "flag": [("red", 3), ("white", 2)],
    },
    "Norway": {
        "home": [("red", 3), ("blue", 1), ("white", 1)],
        "away": [("white", 3), ("red", 2), ("blue", 1)],
        "flag": [("red", 3), ("blue", 2), ("white", 1)],
    },
    "Scotland": {
        "home": [("navy blue", 3), ("white", 1)],
        "away": [("white", 3), ("navy blue", 2)],
        "flag": [("blue", 3), ("white", 3)],
    },
    "Sweden": {
        "home": [("yellow", 3), ("blue", 2)],
        "away": [("blue", 3), ("yellow", 2)],
        "flag": [("blue", 3), ("yellow", 2)],
    },
    "Turkey": {
        "home": [("red", 3), ("white", 2)],
        "away": [("white", 3), ("red", 2)],
        "flag": [("red", 3), ("white", 2)],
    },
    "Bosnia": {
        "home": [("blue", 3), ("yellow", 2), ("white", 1)],
        "away": [("white", 3), ("blue", 2), ("yellow", 1)],
        "flag": [("blue", 3), ("yellow", 2), ("white", 1)],
    },
    "Czech_Republic": {
        "home": [("red", 3), ("blue", 2), ("white", 1)],
        "away": [("white", 3), ("red", 2), ("blue", 1)],
        "flag": [("red", 2), ("white", 2), ("blue", 2)],
    },
    # ── AFRICA ──
    "Morocco": {
        "home": [("deep red", 3), ("green", 2), ("gold", 1)],
        "away": [("white", 3), ("red", 2), ("green", 1)],
        "flag": [("red", 3), ("green", 2), ("gold", 1)],
    },
    "Senegal": {
        "home": [("white", 3), ("green", 2), ("yellow", 1)],
        "away": [("green", 3), ("white", 1), ("yellow", 1)],
        "flag": [("green", 3), ("yellow", 2), ("red", 2)],
    },
    "Ghana": {
        "home": [("white", 3), ("black", 2), ("gold", 1)],
        "away": [("black", 3), ("gold", 2), ("green", 1)],
        "flag": [("red", 2), ("gold", 2), ("green", 2), ("black", 1)],
    },
    "Algeria": {
        "home": [("green", 3), ("white", 3), ("red", 1)],
        "away": [("white", 3), ("green", 2)],
        "flag": [("green", 3), ("white", 2), ("red", 1)],
    },
    "Cape_Verde": {
        "home": [("blue", 3), ("yellow", 2), ("red", 1), ("white", 1)],
        "away": [("white", 3), ("blue", 2), ("red", 1)],
        "flag": [("blue", 3), ("yellow", 2), ("red", 1), ("white", 1)],
    },
    "DR_Congo": {
        "home": [("sky blue", 3), ("red", 2), ("yellow", 1)],
        "away": [("red", 3), ("blue", 1), ("yellow", 1)],
        "flag": [("sky blue", 3), ("red", 2), ("yellow", 1)],
    },
    "Egypt": {
        "home": [("red", 3), ("gold", 2), ("black", 1), ("white", 1)],
        "away": [("white", 3), ("red", 2), ("gold", 1)],
        "flag": [("red", 2), ("white", 2), ("black", 2), ("gold", 1)],
    },
    "Ivory_Coast": {
        "home": [("orange", 3), ("green", 2), ("white", 1)],
        "away": [("green", 3), ("orange", 2), ("white", 1)],
        "flag": [("orange", 3), ("white", 2), ("green", 2)],
    },
    "South_Africa": {
        "home": [("bright yellow", 3), ("green", 2), ("black", 1)],
        "away": [("green", 3), ("yellow", 2), ("white", 1)],
        "flag": [("green", 2), ("yellow", 2), ("black", 2), ("red", 1), ("blue", 1)],
    },
    "Tunisia": {
        "home": [("red", 3), ("white", 2)],
        "away": [("white", 3), ("red", 2)],
        "flag": [("red", 3), ("white", 2)],
    },
    # ── ASIA / OCEANIA ──
    "Japan": {
        "home": [("deep blue", 3), ("white", 1)],
        "away": [("white", 3), ("blue", 1), ("red", 1)],
        "flag": [("white", 3), ("red", 3)],
    },
    "South_Korea": {
        "home": [("red", 3), ("blue", 1), ("black", 1)],
        "away": [("white", 3), ("red", 2), ("blue", 1)],
        "flag": [("white", 3), ("red", 2), ("blue", 2), ("black", 1)],
    },
    "Australia": {
        "home": [("gold", 3), ("green", 2)],
        "away": [("dark green", 3), ("gold", 2)],
        "flag": [("green", 3), ("gold", 3)],
    },
    "Saudi_Arabia": {
        "home": [("green", 3), ("white", 2), ("gold", 1)],
        "away": [("white", 3), ("green", 2), ("gold", 1)],
        "flag": [("green", 3), ("white", 2)],
    },
    "Iran": {
        "home": [("white", 3), ("red", 1), ("green", 1)],
        "away": [("red", 3), ("white", 1), ("green", 1)],
        "flag": [("green", 2), ("white", 2), ("red", 2)],
    },
    "Iraq": {
        "home": [("white", 3), ("green", 2), ("red", 1), ("black", 1)],
        "away": [("green", 3), ("white", 1), ("red", 1)],
        "flag": [("red", 2), ("white", 2), ("black", 2), ("green", 1)],
    },
    "Jordan": {
        "home": [("white", 3), ("red", 2), ("green", 1), ("black", 1)],
        "away": [("red", 3), ("white", 1), ("green", 1)],
        "flag": [("black", 2), ("white", 2), ("green", 2), ("red", 2)],
    },
    "Qatar": {
        "home": [("maroon", 3), ("white", 2), ("gold", 1)],
        "away": [("white", 3), ("maroon", 2), ("gold", 1)],
        "flag": [("maroon", 3), ("white", 3)],
    },
    "Uzbekistan": {
        "home": [("white", 3), ("blue", 2), ("green", 1)],
        "away": [("blue", 3), ("white", 2), ("green", 1)],
        "flag": [("blue", 2), ("white", 2), ("green", 2), ("red", 1)],
    },
    "New_Zealand": {
        "home": [("white", 3), ("black", 2)],
        "away": [("black", 3), ("white", 2)],
        "flag": [("black", 3), ("white", 2)],
    },
}


def colors_to_weighted_prompt(color_list):
    """
    Convert a weighted color list into natural language that instructs the AI
    to allocate visual surface area proportionally.

    Weight 3 = "DOMINANT — covers most of the surface"
    Weight 2 = "secondary — significant but supporting"
    Weight 1 = "accent — small details and trim"

    Example input: [("navy blue", 3), ("white", 2), ("red", 1)]
    Example output: "PREDOMINANTLY navy blue (covering 60%+ of the surface),
                     with secondary white panels and stripes, and small red accent details"
    """
    primary = [c for c, w in color_list if w == 3]
    secondary = [c for c, w in color_list if w == 2]
    accent = [c for c, w in color_list if w == 1]

    parts = []

    if primary:
        if len(primary) == 1:
            parts.append(f"PREDOMINANTLY {primary[0]} (covering 60%+ of the design surface)")
        else:
            joined = " and ".join(primary)
            parts.append(f"PREDOMINANTLY {joined} in roughly equal proportion (together covering 70%+ of the surface)")

    if secondary:
        joined = " and ".join(secondary)
        if len(secondary) == 1:
            parts.append(f"with secondary {joined} panels and stripes (20-30% of surface)")
        else:
            parts.append(f"with secondary {joined} panels and stripes (20-30% combined)")

    if accent:
        joined = " and ".join(accent)
        parts.append(f"and small {joined} accent details on edges and trim")

    return ", ".join(parts)


# ---------------------------------------------------------------------------
# Prompt template — THE proven concept_typo style
# ---------------------------------------------------------------------------

def build_prompt(nation_key, text, color_desc, variant_label):
    """
    Build the concept_typo prompt. This is the EXACT style that produced
    the France and Japan picks the user approved.

    color_desc is now a weighted natural-language string from
    colors_to_weighted_prompt(), e.g.:
      "PREDOMINANTLY navy blue (covering 60%+ of the design surface),
       with secondary white panels and stripes (20-30% of surface),
       and small red accent details on edges and trim"
    """
    return (
        f"Flat 2D graphic design for premium sublimation fabric print. 4:3 landscape "
        f"filling EVERY PIXEL edge to edge. Bold motorsport racing livery aesthetic — "
        f"aggressive diagonal speed stripes, angular chevrons, sharp geometric panels. "
        f"Color palette: {color_desc}. Chrome silver accent lines and carbon fiber "
        f"texture panels complement the color scheme. "
        f"The word '{text}' is integrated INTO the design as a massive bold typographic "
        f"element — the letters are part of the graphic composition itself, cut through "
        f"by racing stripes, partially masked by color panels, creating a seamless fusion "
        f"of typography and livery design. The text should feel embedded and organic to "
        f"the design, not overlaid on top. Intense directional flow, high contrast. "
        f"This is a FLAT surface design meant for fabric printing — NOT a car render. "
        f"Think F1 livery unwrapped flat with the country name as a design element. "
        f"The text '{text}' must be spelled EXACTLY correctly — every single letter matters. "
        f"ABSOLUTELY NO car, NO vehicle, NO 3D objects, NO perspective. "
        f"Pure flat graphic art filling every pixel. No watermarks, no logos besides the text."
    )


# ---------------------------------------------------------------------------
# API call with retry
# ---------------------------------------------------------------------------

def generate_image(prompt, api_key, retries=MAX_RETRIES):
    """Call OpenAI gpt-image-1 with retry logic."""
    from openai import OpenAI
    client = OpenAI(api_key=api_key)

    for attempt in range(1, retries + 1):
        try:
            response = client.images.generate(
                model="gpt-image-1",
                prompt=prompt,
                n=1,
                size="1536x1024",
                quality="high",
            )
            b64 = response.data[0].b64_json
            if b64:
                img_data = base64.b64decode(b64)
            else:
                url = response.data[0].url
                resp = requests.get(url, timeout=120)
                resp.raise_for_status()
                img_data = resp.content
            return Image.open(io.BytesIO(img_data))

        except Exception as e:
            err = str(e)
            if attempt < retries and any(k in err.lower() for k in
                                          ["timeout", "rate", "500", "502", "503", "529"]):
                wait = RETRY_DELAY * attempt
                print(f"  retry {attempt}/{retries} in {wait}s ({e})")
                time.sleep(wait)
            else:
                raise


def upscale_to_print(img):
    """Upscale 1536x1024 -> 9448x7086 for Printkk."""
    return img.resize((OUTPUT_WIDTH, OUTPUT_HEIGHT), Image.Resampling.LANCZOS)


# ---------------------------------------------------------------------------
# Process one nation
# ---------------------------------------------------------------------------

def process_nation(nation_key, variants, output_dir, api_key):
    """
    Generate concept_typo designs for a nation.

    Args:
        nation_key: e.g. "France"
        variants: list of variant names to generate, e.g. ["home", "away", "flag"]
        output_dir: Path
        api_key: str

    Returns:
        (ok_count, fail_count)
    """
    if nation_key not in FIFA_CODES:
        print(f"    SKIP: {nation_key} not in FIFA_CODES")
        return 0, 0

    fifa_abbrev, full_name = FIFA_CODES[nation_key]
    colors = JERSEY_COLORS.get(nation_key, {})

    # Decide text: abbreviation for long names, full name otherwise
    if len(full_name) >= LONG_NAME_THRESHOLD:
        text = fifa_abbrev
    else:
        text = full_name

    ok = 0
    fail = 0

    for variant in variants:
        color_weights = colors.get(variant)
        if not color_weights:
            print(f"    {variant}: no color data, skipping")
            fail += 1
            continue

        color_desc = colors_to_weighted_prompt(color_weights)
        print(f"    {variant} ({color_desc[:60]}...) ", end="", flush=True)

        try:
            prompt = build_prompt(nation_key, text, color_desc, variant)
            result = generate_image(prompt, api_key)

            # Save preview
            pdir = output_dir / "previews"
            pdir.mkdir(parents=True, exist_ok=True)
            preview_path = pdir / f"{nation_key}_{variant}.png"
            result.save(preview_path, "PNG")

            # Save print-res
            prdir = output_dir / "print"
            prdir.mkdir(parents=True, exist_ok=True)
            print_path = prdir / f"{nation_key}_{variant}.png"
            big = upscale_to_print(result)
            big.save(print_path, "PNG")

            size_mb = os.path.getsize(print_path) / (1024 * 1024)
            print(f"OK ({size_mb:.0f}MB)")
            ok += 1

        except Exception as e:
            print(f"FAILED: {e}")
            fail += 1

    return ok, fail


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Hood'd Concept Typo Generator — Production Pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Generates 3 color variants per nation in the proven concept_typo style:
  home  = official team home jersey colors
  away  = official team away jersey colors
  flag  = national flag colors

Examples:
  python generate_concept_typo.py --nations France,Japan
  python generate_concept_typo.py --variants home
  python generate_concept_typo.py                          # all 48, all 3 variants
        """
    )
    parser.add_argument("--output-dir", type=str,
                        default="C:\\Dev\\hooddshop\\production",
                        help="Output directory (default: C:\\Dev\\hooddshop\\production)")
    parser.add_argument("--nations", type=str, default=None,
                        help="Comma-separated nation list (default: all 48)")
    parser.add_argument("--variants", type=str, default="home,away,flag",
                        help="Comma-separated variant list (default: home,away,flag)")
    parser.add_argument("--resume-from", type=str, default=None,
                        help="Resume from this nation (skip all before it alphabetically)")
    args = parser.parse_args()

    load_dotenv()
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("ERROR: OPENAI_API_KEY not found in .env")
        sys.exit(1)

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    variants = [v.strip() for v in args.variants.split(",")]
    valid_variants = {"home", "away", "flag"}
    for v in variants:
        if v not in valid_variants:
            print(f"ERROR: Unknown variant '{v}'. Must be: {valid_variants}")
            sys.exit(1)

    nations = sorted(JERSEY_COLORS.keys())
    if args.nations:
        requested = [n.strip() for n in args.nations.split(",")]
        nations = [n for n in requested if n in JERSEY_COLORS]
        missing = [n for n in requested if n not in JERSEY_COLORS]
        if missing:
            print(f"WARNING: No color data for: {', '.join(missing)}")

    if args.resume_from:
        idx = next((i for i, n in enumerate(nations) if n >= args.resume_from), len(nations))
        skipped = nations[:idx]
        nations = nations[idx:]
        if skipped:
            print(f"Resuming from {args.resume_from}, skipping {len(skipped)} nations")

    # Count what we'll generate
    total_images = 0
    for n in nations:
        _, full = FIFA_CODES.get(n, ("", ""))
        total_images += len(variants)

    # Check for already-done files (skip if preview exists)
    already_done = 0
    todo_nations = []
    for n in nations:
        nation_variants = []
        for v in variants:
            preview = output_dir / "previews" / f"{n}_{v}.png"
            if preview.exists():
                already_done += 1
            else:
                nation_variants.append(v)
        if nation_variants:
            todo_nations.append((n, nation_variants))

    print(f"\n{'='*60}")
    print(f"  Hood'd Concept Typo Generator — PRODUCTION")
    print(f"{'='*60}")
    print(f"  Nations: {len(nations)}")
    print(f"  Variants per nation: {', '.join(variants)}")
    print(f"  Total images: {total_images}")
    print(f"  Already done (skipped): {already_done}")
    print(f"  To generate: {total_images - already_done}")
    print(f"  API: OpenAI gpt-image-1 ({API_WIDTH}x{API_HEIGHT})")
    print(f"  Print output: {OUTPUT_WIDTH}x{OUTPUT_HEIGHT}")
    print(f"  Output: {output_dir.resolve()}")
    print(f"{'='*60}\n")

    if not todo_nations:
        print("Nothing to generate — all files already exist.")
        return

    total_ok = 0
    total_fail = 0
    start_time = time.time()
    nation_count = len(todo_nations)

    for i, (nation_key, nation_variants) in enumerate(todo_nations, 1):
        abbrev, full_name = FIFA_CODES.get(nation_key, ("???", "???"))
        text_used = abbrev if len(full_name) >= LONG_NAME_THRESHOLD else full_name
        print(f"  [{i}/{nation_count}] {nation_key} — text='{text_used}' ({len(nation_variants)} variants):")

        ok, fail = process_nation(nation_key, nation_variants, output_dir, api_key)
        total_ok += ok
        total_fail += fail

        elapsed = time.time() - start_time
        rate = elapsed / i
        remaining = rate * (nation_count - i)
        print(f"    [{total_ok} done, {total_fail} failed, ~{remaining/60:.0f}min remaining]\n")

    elapsed_total = time.time() - start_time
    print(f"{'='*60}")
    print(f"  COMPLETE")
    print(f"  {total_ok} generated, {total_fail} failed")
    print(f"  Time: {elapsed_total/60:.1f} minutes")
    print(f"  Output: {output_dir.resolve()}")
    print(f"    previews/ — 1536x1024 for review")
    print(f"    print/    — 9448x7086 for production")
    print(f"{'='*60}")

    # Save run manifest
    manifest = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "nations": len(nations),
        "variants": variants,
        "generated": total_ok,
        "failed": total_fail,
        "elapsed_minutes": round(elapsed_total / 60, 1),
    }
    manifest_path = output_dir / "manifest.json"
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"  Manifest: {manifest_path}")


if __name__ == "__main__":
    main()
