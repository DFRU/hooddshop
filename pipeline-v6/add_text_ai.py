#!/usr/bin/env python3
"""
Hood'd Pipeline v6 — AI Text Overlay

Uses the SAME AI image generator to add text to designs, so the text
genuinely matches the design's visual style. Two modes:

  Mode 1 (edit): Send existing design + mask to OpenAI edit endpoint.
    The AI paints text INTO the design in the masked region.

  Mode 2 (generate): Generate a fresh design WITH text baked in from
    the start using concept_typo style prompts. Text is part of the
    design composition, not overlaid.

Usage:
    python add_text_ai.py --input-dir "D:\\HoodD_Project_Migration\\hoodd-images\\upscaled" --output-dir ./text-ai-test --nations France,Japan,USA
    python add_text_ai.py --input-dir "..." --output-dir ./text-ai-test --nations France --mode generate
    python add_text_ai.py --input-dir "..." --output-dir ./text-ai-test --nations France --mode edit
    python add_text_ai.py --input-dir "..." --output-dir ./text-ai-test --nations France --mode both
"""

import argparse
import base64
import io
import math
import os
import sys
import time
from pathlib import Path

import numpy as np
import requests
from dotenv import load_dotenv
from PIL import Image, ImageDraw, ImageFont, ImageFilter

Image.MAX_IMAGE_PIXELS = 200_000_000

from nations_v6 import NATIONS

# ---------------------------------------------------------------------------
# FIFA data
# ---------------------------------------------------------------------------

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

# API output dimensions (OpenAI supports specific sizes)
API_WIDTH = 1536
API_HEIGHT = 1024

# Printkk final surface
OUTPUT_WIDTH = 9448
OUTPUT_HEIGHT = 7086

SAFE_ZONE_PCT = 0.15

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
# Mask generation
# ---------------------------------------------------------------------------

def create_text_zone_mask(width, height):
    """
    Create a PNG mask with transparent area where text should be painted.
    The transparent (alpha=0) region is where the AI will add text.
    The opaque (alpha=255) region stays unchanged.

    Text zone: centered, within the safe zone, roughly 60% width x 35% height.
    """
    mask = Image.new("RGBA", (width, height), (0, 0, 0, 255))

    # Safe zone boundaries
    sl = int(width * SAFE_ZONE_PCT)
    sr = int(width * (1 - SAFE_ZONE_PCT))
    st = int(height * SAFE_ZONE_PCT)
    sb = int(height * (1 - SAFE_ZONE_PCT))

    safe_w = sr - sl
    safe_h = sb - st

    # Text zone — centered in safe area, generous space for AI creativity
    tz_w = int(safe_w * 0.70)
    tz_h = int(safe_h * 0.40)
    tz_x = sl + (safe_w - tz_w) // 2
    tz_y = st + (safe_h - tz_h) // 2

    # Cut out the text zone (make it transparent)
    draw = ImageDraw.Draw(mask)
    # Soft edges — feather the mask boundary
    # Inner zone fully transparent
    draw.rectangle([tz_x, tz_y, tz_x + tz_w, tz_y + tz_h], fill=(0, 0, 0, 0))

    return mask


def prepare_image_for_api(img, target_w, target_h):
    """Resize image to API dimensions, maintaining aspect ratio with center crop."""
    src_ratio = img.width / img.height
    tgt_ratio = target_w / target_h
    if src_ratio > tgt_ratio:
        new_h = target_h
        new_w = int(target_h * src_ratio)
    else:
        new_w = target_w
        new_h = int(target_w / src_ratio)
    img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    left = (new_w - target_w) // 2
    top = (new_h - target_h) // 2
    return img.crop((left, top, left + target_w, top + target_h))


def img_to_png_bytes(img):
    """Convert PIL Image to PNG bytes."""
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf


# ---------------------------------------------------------------------------
# Mode 1: EDIT — paint text into existing design
# ---------------------------------------------------------------------------

def edit_text_into_design(design_img, nation_key, text, api_key):
    """
    Use OpenAI images.edit to paint text INTO the existing design.
    Sends the design + a mask showing where text should go + a prompt
    describing the text to render in the design's style.

    gpt-image-1 edit requires the newer SDK call format. We try
    gpt-image-1 first, then fall back to dall-e-2 if the account
    doesn't support it for edits.
    """
    from openai import OpenAI
    client = OpenAI(api_key=api_key)

    # Prepare image at API size
    img = prepare_image_for_api(design_img.copy(), API_WIDTH, API_HEIGHT).convert("RGBA")

    # Create mask — transparent where text goes
    mask = create_text_zone_mask(API_WIDTH, API_HEIGHT)

    # Get nation colors for prompt
    nation_data = NATIONS.get(nation_key, {})
    colors = colors_to_natural(nation_data.get("flag_colors", ["#FFFFFF"]))

    # Size guidance: text should fill the largest open/calm panel in the design
    if len(text) <= 4:
        size_desc = "taking up roughly 30-40% of the image height"
    else:
        size_desc = "taking up roughly 15-25% of the image height"

    prompt = (
        f"Add the text '{text}' to this design. The text must be rendered as a BOLD "
        f"typographic element that is fully integrated into the existing design style. "
        f"CRITICAL SIZING: Find the largest open panel or calm visual space in the design "
        f"and size the text to fill that space naturally — {size_desc}. The text should "
        f"fit INTO the design's existing visual rhythm, not fight against it. "
        f"Use the same visual language of racing stripes, geometric panels, chrome accents, "
        f"and color blocking in {colors}. The letters should be cut through by the design's "
        f"existing stripe patterns, partially masked by color panels, with metallic or chrome "
        f"edge treatments. The text should feel EMBEDDED in the design, not overlaid on top. "
        f"This will be printed on a 120cm car hood cover — the text must be visible from "
        f"6-10 meters away, so no tiny text. "
        f"Maintain the exact same design style, color palette, and visual energy of the "
        f"original artwork. The text '{text}' must be spelled EXACTLY correctly with no "
        f"extra characters. Keep the rest of the design UNCHANGED."
    )

    img_bytes = img_to_png_bytes(img)
    mask_bytes = img_to_png_bytes(mask)

    # Try gpt-image-1 first (requires openai>=1.75 or so)
    models_to_try = ["gpt-image-1", "dall-e-2"]
    last_err = None
    for model in models_to_try:
        try:
            print(f"      Trying model={model}...")
            kwargs = dict(
                model=model,
                image=img_bytes,
                mask=mask_bytes,
                prompt=prompt,
                n=1,
            )
            # gpt-image-1 supports 1536x1024; dall-e-2 only 1024x1024, 512x512, 256x256
            if model == "gpt-image-1":
                kwargs["size"] = "1536x1024"
            else:
                kwargs["size"] = "1024x1024"

            response = client.images.edit(**kwargs)

            # Get result
            b64 = getattr(response.data[0], "b64_json", None)
            if b64:
                img_data = base64.b64decode(b64)
            else:
                url = response.data[0].url
                resp = requests.get(url, timeout=120)
                resp.raise_for_status()
                img_data = resp.content

            result = Image.open(io.BytesIO(img_data))
            print(f"      Success with model={model}")
            return result

        except Exception as e:
            last_err = e
            err_str = str(e)
            if "invalid_value" in err_str.lower() or "must be" in err_str.lower():
                print(f"      {model} not available for edit, trying next...")
                img_bytes.seek(0)
                mask_bytes.seek(0)
                continue
            else:
                raise  # Re-raise unexpected errors

    raise last_err  # All models failed



# ---------------------------------------------------------------------------
# Mode 2: GENERATE — fresh design with text baked in
# ---------------------------------------------------------------------------

def generate_design_with_text(nation_key, text, api_key):
    """
    Generate a fresh design WITH the text already integrated.
    Uses the concept_typo style — text is part of the design composition.
    """
    from openai import OpenAI
    client = OpenAI(api_key=api_key)

    nation_data = NATIONS.get(nation_key, {})
    colors = colors_to_natural(nation_data.get("flag_colors", ["#FFFFFF"]))

    prompt = (
        f"Flat 2D graphic design for premium sublimation fabric print. 4:3 landscape "
        f"filling EVERY PIXEL edge to edge with zero margins or empty space. "
        f"Bold motorsport racing livery aesthetic — aggressive diagonal speed stripes, "
        f"angular chevrons, sharp geometric panels in {colors} with chrome silver accent "
        f"lines and carbon fiber texture panels. "
        f"The word '{text}' is integrated INTO the design as a bold typographic element — "
        f"sized to fill the largest open visual panel in the composition (roughly "
        f"{'30-40' if len(text) <= 4 else '15-25'}% of image height). The letters are part of "
        f"the graphic composition itself, cut through by racing stripes, partially masked by "
        f"color panels, "
        f"with chrome/metallic edge treatments on the letterforms. The text creates a seamless "
        f"fusion of typography and racing livery design. The letters should have the same "
        f"aggressive energy as the surrounding design — sharp edges, metallic highlights, "
        f"speed stripe cutaways through the letterforms. "
        f"Intense directional flow sweeping from lower-left to upper-right. High contrast. "
        f"This is a FLAT surface design for fabric printing — NOT a car render. "
        f"Think F1 livery unwrapped flat with '{text}' as a massive design element. "
        f"The text '{text}' must be spelled EXACTLY correctly — every letter matters. "
        f"ABSOLUTELY NO car, NO vehicle, NO 3D objects, NO perspective, NO background. "
        f"Pure flat graphic art filling every pixel. No watermarks, no logos besides the text."
    )

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


# ---------------------------------------------------------------------------
# Upscale to print resolution
# ---------------------------------------------------------------------------

def upscale_to_print(img):
    """Upscale AI output (1536x1024) to Printkk surface (9448x7086)."""
    return img.resize((OUTPUT_WIDTH, OUTPUT_HEIGHT), Image.Resampling.LANCZOS)


# ---------------------------------------------------------------------------
# Production constants
# ---------------------------------------------------------------------------

LONG_NAME_THRESHOLD = 10  # Full names >= this many chars get abbreviation only

MAX_RETRIES = 3
RETRY_DELAY = 5  # seconds between retries


# ---------------------------------------------------------------------------
# Main processing
# ---------------------------------------------------------------------------

def generate_with_retry(nation_key, text, api_key, retries=MAX_RETRIES):
    """Generate with automatic retry on transient API failures."""
    for attempt in range(1, retries + 1):
        try:
            result = generate_design_with_text(nation_key, text, api_key)
            return result
        except Exception as e:
            err = str(e)
            if attempt < retries and ("timeout" in err.lower() or "rate" in err.lower()
                                       or "500" in err or "502" in err or "503" in err):
                wait = RETRY_DELAY * attempt
                print(f"      Attempt {attempt}/{retries} failed ({e}), retrying in {wait}s...")
                time.sleep(wait)
            else:
                raise


def process_nation(nation_key, output_dir, api_key, skip_full=False):
    """
    Process a single nation — generate text overlay variants.

    Args:
        nation_key: e.g. "France"
        output_dir: Path to output directory
        api_key: OpenAI API key
        skip_full: If True, skip full name variant (for long names)

    Returns:
        (success_count, fail_count)
    """
    fifa_abbrev, full_name = FIFA_CODES[nation_key]
    successes = 0
    failures = 0

    variants = [("abbrev", fifa_abbrev)]
    if not skip_full:
        variants.append(("full", full_name))

    for text_label, text_value in variants:
        print(f"    {text_value}...", end=" ", flush=True)
        try:
            result = generate_with_retry(nation_key, text_value, api_key)

            # Save API-size preview
            preview_path = output_dir / "previews" / f"{nation_key}_{text_label}.png"
            preview_path.parent.mkdir(parents=True, exist_ok=True)
            result.save(preview_path, "PNG")

            # Save print-resolution version
            big = upscale_to_print(result)
            print_path = output_dir / "print" / f"{nation_key}_{text_label}.png"
            print_path.parent.mkdir(parents=True, exist_ok=True)
            big.save(print_path, "PNG")

            size_mb = os.path.getsize(print_path) / (1024 * 1024)
            print(f"OK ({size_mb:.0f}MB)")
            successes += 1

        except Exception as e:
            print(f"FAILED: {e}")
            failures += 1

    return successes, failures


def main():
    parser = argparse.ArgumentParser(
        description="Hood'd AI Text Overlay — Production Pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Single nation test
  python add_text_ai.py --nations France

  # Full 48-nation production run
  python add_text_ai.py

  # Custom output location
  python add_text_ai.py --output-dir "D:\\custom\\path"
        """
    )
    parser.add_argument("--input-dir", type=str,
                        default="D:\\HoodD_Project_Migration\\hoodd-images\\upscaled",
                        help="Source designs (default: D:\\HoodD_Project_Migration\\hoodd-images\\upscaled)")
    parser.add_argument("--output-dir", type=str,
                        default="C:\\Dev\\hooddshop\\production",
                        help="Output directory (default: C:\\Dev\\hooddshop\\production)")
    parser.add_argument("--nations", type=str, default=None,
                        help="Comma-separated nation list (default: all 48)")
    parser.add_argument("--long-name-threshold", type=int, default=LONG_NAME_THRESHOLD,
                        help=f"Full names >= this length get abbreviation only (default: {LONG_NAME_THRESHOLD})")
    parser.add_argument("--mode", choices=["edit", "generate", "both"], default="generate",
                        help="generate=fresh design with text (recommended, default)")
    parser.add_argument("--text-type", choices=["abbrev", "full", "both"], default="both",
                        help="Force abbrev-only or full-only for all nations")
    args = parser.parse_args()

    load_dotenv()
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("ERROR: OPENAI_API_KEY not found in .env")
        sys.exit(1)

    input_dir = Path(args.input_dir)
    if not input_dir.exists():
        print(f"ERROR: Input dir not found: {input_dir}")
        sys.exit(1)

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "previews").mkdir(exist_ok=True)
    (output_dir / "print").mkdir(exist_ok=True)

    nations = list(FIFA_CODES.keys())
    if args.nations:
        requested = [n.strip() for n in args.nations.split(",")]
        nations = [n for n in requested if n in FIFA_CODES]
        not_found = [n for n in requested if n not in FIFA_CODES]
        if not_found:
            print(f"WARNING: Unknown nations skipped: {', '.join(not_found)}")

    # Determine which nations get full name vs abbreviation only
    long_names = []
    short_names = []
    for n in nations:
        _, full = FIFA_CODES[n]
        if len(full) >= args.long_name_threshold:
            long_names.append(n)
        else:
            short_names.append(n)

    total_variants = len(short_names) * 2 + len(long_names)

    print(f"\n{'='*60}")
    print(f"  Hood'd AI Text Pipeline — PRODUCTION RUN")
    print(f"{'='*60}")
    print(f"  Nations: {len(nations)} total")
    print(f"    Both variants (abbrev + full): {len(short_names)}")
    print(f"    Abbreviation only (name >= {args.long_name_threshold} chars): {len(long_names)}")
    if long_names:
        print(f"      -> {', '.join(FIFA_CODES[n][0] for n in sorted(long_names))}")
    print(f"  Total images to generate: {total_variants}")
    print(f"  API: OpenAI gpt-image-1 ({API_WIDTH}x{API_HEIGHT})")
    print(f"  Print output: {OUTPUT_WIDTH}x{OUTPUT_HEIGHT}")
    print(f"  Output: {output_dir.resolve()}")
    print(f"{'='*60}\n")

    total_ok = 0
    total_fail = 0
    start_time = time.time()

    for i, nation_key in enumerate(sorted(nations), 1):
        _, full_name = FIFA_CODES[nation_key]
        skip_full = len(full_name) >= args.long_name_threshold or args.text_type == "abbrev"
        if args.text_type == "full":
            skip_full = False  # Override: force full name

        tag = "abbrev-only" if skip_full else "both"
        print(f"  [{i}/{len(nations)}] {nation_key} ({tag}):")

        ok, fail = process_nation(nation_key, output_dir, api_key, skip_full=skip_full)
        total_ok += ok
        total_fail += fail

        # Progress estimate
        elapsed = time.time() - start_time
        rate = elapsed / i if i > 0 else 0
        remaining = rate * (len(nations) - i)
        print(f"         [{total_ok} done, {total_fail} failed, ~{remaining/60:.0f}min remaining]")

    elapsed_total = time.time() - start_time
    print(f"\n{'='*60}")
    print(f"  COMPLETE")
    print(f"  {total_ok} images generated, {total_fail} failed")
    print(f"  Time: {elapsed_total/60:.1f} minutes")
    print(f"  Output: {output_dir.resolve()}")
    print(f"    previews/ — API-size (1536x1024) for review")
    print(f"    print/    — Print-res (9448x7086) for production")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
