#!/usr/bin/env python3
"""
Hood'd Pipeline v6 — Generator Shootout

Tests the same prompt across multiple image generators to compare quality.
Outputs a side-by-side comparison grid + individual full-res files.

Supported generators:
  - OpenAI GPT Image (gpt-image-1)
  - BFL Flux Pro (via API)
  - Ideogram v2 (via API)

Usage:
    python generator_shootout.py --nations France,Japan --style concept
    python generator_shootout.py --nations USA --style all
    python generator_shootout.py --nations France --style concept --generators openai,ideogram
    python generator_shootout.py --dry-run --nations France --style concept
"""

import argparse
import base64
import json
import os
import sys
import time
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path

import requests
from dotenv import load_dotenv
from PIL import Image, ImageDraw, ImageFont

Image.MAX_IMAGE_PIXELS = 200_000_000

# Import our nation data
from nations_v6 import NATIONS, ALL_NATION_NAMES

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

OUTPUT_WIDTH = 1536
OUTPUT_HEIGHT = 1024

# For the comparison grid
GRID_THUMB_W = 768
GRID_THUMB_H = 512
GRID_PADDING = 20
LABEL_HEIGHT = 40

GENERATORS = ["openai", "bfl", "ideogram"]

# ---------------------------------------------------------------------------
# Color helpers (copied from generate_designs.py for independence)
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
# Prompt templates — concept car reference style is the priority
# ---------------------------------------------------------------------------

STYLE_PROMPTS = {
    "concept": (
        "Flat 2D graphic design for a premium sublimation fabric print. 4:3 landscape "
        "aspect ratio filling EVERY PIXEL of the frame edge to edge with zero margins. "
        "Motorsport racing livery aesthetic inspired by Formula 1 car wraps — unwrapped "
        "and laid completely flat as a 2D pattern. Aggressive diagonal speed stripes, "
        "angular chevron cutaways, and sharp geometric panels in {colors}. Metallic "
        "chrome silver accent lines with studio-lit reflective sheen. Carbon fiber "
        "textured panels interspersed between bold color bands. The design has intense "
        "directional flow sweeping from lower-left to upper-right creating a sense of "
        "velocity and forward motion. High contrast between dark and vivid color zones. "
        "This is NOT a car render — it is a FLAT surface design meant to be printed on "
        "fabric. Think of it as an F1 livery peeled off the car and pressed flat. "
        "The overall feel is aggressive, premium, and unmistakably connected to "
        "{nation}'s national colors. Professional graphic design quality, sharp vector-like "
        "edges, dramatic color blocking. "
        "ABSOLUTELY NO car, NO vehicle, NO 3D objects, NO perspective, NO background. "
        "Pure flat graphic art that fills every square inch of the rectangular frame."
    ),
    "concept_typo": (
        "Flat 2D graphic design for premium sublimation fabric print. 4:3 landscape "
        "filling EVERY PIXEL edge to edge. Bold motorsport racing livery aesthetic — "
        "aggressive diagonal speed stripes, angular chevrons, sharp geometric panels "
        "in {colors} with chrome silver accent lines and carbon fiber texture panels. "
        "The word '{nation}' is integrated INTO the design as a massive bold typographic "
        "element — the letters are part of the graphic composition itself, cut through "
        "by racing stripes, partially masked by color panels, creating a seamless fusion "
        "of typography and livery design. The text should feel embedded and organic to "
        "the design, not overlaid on top. Intense directional flow, high contrast. "
        "This is a FLAT surface design meant for fabric printing — NOT a car render. "
        "Think F1 livery unwrapped flat with the country name as a design element. "
        "ABSOLUTELY NO car, NO vehicle, NO 3D objects, NO perspective. "
        "Pure flat graphic art filling every pixel."
    ),
    "flag_flow": (
        "Flat 2D graphic design for premium sublimation fabric print. 4:3 landscape "
        "filling EVERY PIXEL edge to edge. {nation}'s national flag reimagined as "
        "dramatic flowing liquid paint art — thick glossy ribbons of {colors} in motion, "
        "swirling and blending at boundaries with visible wet paint texture, depth, and "
        "metallic iridescent sheen. The flag structure is CLEARLY RECOGNIZABLE — someone "
        "should instantly know which nation this represents. But the treatment transforms "
        "it from a static flag into a dynamic, premium artwork with paint drips, flowing "
        "curves, and luminous color transitions. Think fine art meets street art. "
        "This is a FLAT artwork — no car, no vehicle, no 3D objects, no perspective. "
        "Every square inch of the frame is filled with flowing paint art."
    ),
    "jersey_premium": (
        "Flat 2D textile pattern design for premium sublimation fabric print. 4:3 "
        "landscape filling EVERY PIXEL edge to edge. Inspired by {nation}'s iconic "
        "football kit design language — bold asymmetric geometric panels, dynamic "
        "diagonal slashes, angular cutaway shapes in {colors}. The pattern has the "
        "precision and intentionality of a $300 limited-edition sportswear collaboration "
        "between Nike and a luxury fashion house. Crisp sharp edges between color zones, "
        "subtle gradient transitions within panels, micro-texture details like woven "
        "fabric grain or perforated mesh accents. High contrast, athletic energy, "
        "modern and clean. "
        "This is a FLAT surface pattern — no jersey shape, no clothing silhouette, "
        "no car, no 3D objects. Pure geometric pattern art."
    ),
    "chrome_flat": (
        "Flat 2D graphic design for premium sublimation fabric print. 4:3 landscape "
        "filling EVERY PIXEL edge to edge. Hyper-realistic chrome and metallic surface "
        "design — mirror-finish chrome silver base with bold {colors} racing stripes "
        "and geometric accent panels cutting across the surface. The chrome has realistic "
        "reflections and curvature highlights as if lit in a studio, but the image is "
        "entirely flat — a printed surface, not a 3D object. Carbon fiber panels, "
        "brushed aluminum textures, and glossy clear-coated color sections alternate "
        "with the chrome. The effect is like looking at a perfectly polished metal "
        "panel from directly above. Premium automotive paint finish quality. "
        "NO car, NO vehicle, NO 3D objects. Flat metallic graphic art."
    ),
}

NEGATIVE_SUFFIX = (
    "CRITICAL: This must be a completely FLAT 2D design — no car, no vehicle, no "
    "automobile, no 3D object, no 3D render, no perspective view, no background, "
    "no horizon line, no floor, no shadow on ground. The image is a flat rectangular "
    "graphic filling every pixel. No text watermarks, no copyright text, no logos, "
    "no faces, no people, no white margins, no empty space."
)


def build_prompt(nation_name, style):
    """Build prompt for a given nation + style."""
    data = NATIONS[nation_name]
    colors = colors_to_natural(data["flag_colors"])
    template = STYLE_PROMPTS[style]
    prompt = template.format(nation=nation_name, colors=colors)
    return prompt


# ---------------------------------------------------------------------------
# Generator implementations
# ---------------------------------------------------------------------------

def generate_openai(prompt, api_key):
    """Generate via OpenAI GPT Image API."""
    from openai import OpenAI
    client = OpenAI(api_key=api_key)

    full_prompt = prompt + "\n\n" + NEGATIVE_SUFFIX
    response = client.images.generate(
        model="gpt-image-1",
        prompt=full_prompt,
        n=1,
        size="1536x1024",
        quality="high",
    )

    image_url = response.data[0].url
    if image_url:
        img_response = requests.get(image_url, timeout=120)
        img_response.raise_for_status()
        return img_response.content
    else:
        b64 = response.data[0].b64_json
        return base64.b64decode(b64)


def generate_bfl(prompt, api_key):
    """Generate via BFL Flux Pro API."""
    full_prompt = prompt + "\n\n" + NEGATIVE_SUFFIX

    # Step 1: Submit generation request
    submit_url = "https://api.bfl.ml/v1/flux-pro-1.1"
    headers = {
        "Content-Type": "application/json",
        "X-Key": api_key,
    }
    payload = {
        "prompt": full_prompt,
        "width": 1536,
        "height": 1024,
        "safety_tolerance": 2,
    }

    resp = requests.post(submit_url, headers=headers, json=payload, timeout=30)
    resp.raise_for_status()
    task_id = resp.json()["id"]

    # Step 2: Poll for result
    poll_url = f"https://api.bfl.ml/v1/get_result?id={task_id}"
    for attempt in range(60):
        time.sleep(3)
        poll_resp = requests.get(poll_url, headers={"X-Key": api_key}, timeout=30)
        poll_data = poll_resp.json()
        status = poll_data.get("status")

        if status == "Ready":
            image_url = poll_data["result"]["sample"]
            img_resp = requests.get(image_url, timeout=120)
            img_resp.raise_for_status()
            return img_resp.content
        elif status in ("Error", "Request Moderated", "Content Moderated"):
            raise RuntimeError(f"BFL generation failed: {status}")
        # else: Pending, keep polling

    raise TimeoutError("BFL generation timed out after 3 minutes")


def generate_ideogram(prompt, api_key):
    """Generate via Ideogram v2 API."""
    full_prompt = prompt + "\n\n" + NEGATIVE_SUFFIX

    url = "https://api.ideogram.ai/generate"
    headers = {
        "Api-Key": api_key,
        "Content-Type": "application/json",
    }
    payload = {
        "image_request": {
            "prompt": full_prompt,
            "aspect_ratio": "ASPECT_3_2",
            "model": "V_2",
            "magic_prompt_option": "AUTO",
            "style_type": "REALISTIC",
        }
    }

    resp = requests.post(url, headers=headers, json=payload, timeout=120)
    resp.raise_for_status()
    data = resp.json()

    # Ideogram returns image URLs in the response
    image_url = data["data"][0]["url"]
    img_resp = requests.get(image_url, timeout=120)
    img_resp.raise_for_status()
    return img_resp.content


GENERATOR_FUNCS = {
    "openai": generate_openai,
    "bfl": generate_bfl,
    "ideogram": generate_ideogram,
}

GENERATOR_KEY_NAMES = {
    "openai": "OPENAI_API_KEY",
    "bfl": "BFL_API_KEY",
    "ideogram": "IDEOGRAM_API_KEY",
}


# ---------------------------------------------------------------------------
# Comparison grid builder
# ---------------------------------------------------------------------------

def build_comparison_grid(images: dict, nation: str, style: str, output_path: Path):
    """
    Build a side-by-side comparison image.
    images: {generator_name: PIL.Image}
    """
    n = len(images)
    if n == 0:
        return

    grid_w = n * GRID_THUMB_W + (n + 1) * GRID_PADDING
    grid_h = LABEL_HEIGHT + GRID_THUMB_H + GRID_PADDING * 2 + 50  # extra for title

    grid = Image.new("RGB", (grid_w, grid_h), (20, 20, 20))
    draw = ImageDraw.Draw(grid)

    # Title
    try:
        title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 28)
        label_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 20)
    except Exception:
        try:
            title_font = ImageFont.truetype("C:/Windows/Fonts/impact.ttf", 28)
            label_font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 20)
        except Exception:
            title_font = ImageFont.load_default()
            label_font = ImageFont.load_default()

    title = f"{nation} — {style.upper()} — Generator Comparison"
    draw.text((GRID_PADDING, 10), title, fill=(255, 255, 255), font=title_font)

    x = GRID_PADDING
    y = 50

    for gen_name, img in images.items():
        # Label
        draw.text((x, y), gen_name.upper(), fill=(255, 165, 0), font=label_font)

        # Thumbnail
        thumb = img.copy().resize((GRID_THUMB_W, GRID_THUMB_H), Image.LANCZOS)
        grid.paste(thumb, (x, y + LABEL_HEIGHT))

        x += GRID_THUMB_W + GRID_PADDING

    grid.save(output_path, "JPEG", quality=92)
    return output_path


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Generator Shootout — compare image generators")
    parser.add_argument("--nations", type=str, required=True,
                        help="Comma-separated nation names (e.g. France,Japan)")
    parser.add_argument("--style", type=str, default="concept",
                        help=f"Style to test: {', '.join(STYLE_PROMPTS.keys())} or 'all'. "
                        "All styles produce FLAT print-ready artwork, not vehicle renders.")
    parser.add_argument("--generators", type=str, default=None,
                        help=f"Comma-separated generators: {', '.join(GENERATORS)} (default: all)")
    parser.add_argument("--output-dir", type=str, default="shootout-results",
                        help="Output directory")
    parser.add_argument("--dry-run", action="store_true",
                        help="Print prompts and exit")
    args = parser.parse_args()

    load_dotenv()

    # Parse nations
    nation_names = [n.strip() for n in args.nations.split(",")]
    for n in nation_names:
        if n not in NATIONS:
            print(f"ERROR: Unknown nation '{n}'. Available: {', '.join(ALL_NATION_NAMES)}")
            sys.exit(1)

    # Parse styles
    if args.style == "all":
        styles = list(STYLE_PROMPTS.keys())
    else:
        styles = [s.strip() for s in args.style.split(",")]
        for s in styles:
            if s not in STYLE_PROMPTS:
                print(f"ERROR: Unknown style '{s}'. Available: {', '.join(STYLE_PROMPTS.keys())}")
                sys.exit(1)

    # Parse generators
    if args.generators:
        gens = [g.strip() for g in args.generators.split(",")]
    else:
        gens = GENERATORS.copy()

    # Verify API keys
    api_keys = {}
    for g in gens:
        key_name = GENERATOR_KEY_NAMES[g]
        key = os.getenv(key_name)
        if not key and not args.dry_run:
            print(f"WARNING: {key_name} not set — skipping {g}")
            continue
        api_keys[g] = key

    if not api_keys and not args.dry_run:
        print("ERROR: No API keys available for any generator")
        sys.exit(1)

    active_gens = list(api_keys.keys()) if not args.dry_run else gens

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    total_tests = len(nation_names) * len(styles) * len(active_gens)
    print(f"\n{'='*60}")
    print(f"  Generator Shootout")
    print(f"  Nations: {', '.join(nation_names)}")
    print(f"  Styles: {', '.join(styles)}")
    print(f"  Generators: {', '.join(active_gens)}")
    print(f"  Total tests: {total_tests}")
    print(f"  Output: {output_dir.resolve()}")
    print(f"{'='*60}\n")

    results = {}

    for nation in nation_names:
        for style in styles:
            prompt = build_prompt(nation, style)
            test_key = f"{nation}_{style}"

            print(f"\n{'─'*50}")
            print(f"  {nation} — {style}")
            print(f"{'─'*50}")

            if args.dry_run:
                print(f"\n  PROMPT:\n  {prompt[:200]}...\n")
                continue

            gen_images = {}

            for gen_name in active_gens:
                print(f"  [{gen_name.upper()}] Generating...")
                try:
                    start = time.time()
                    img_bytes = GENERATOR_FUNCS[gen_name](prompt, api_keys[gen_name])
                    elapsed = time.time() - start

                    img = Image.open(BytesIO(img_bytes)).convert("RGB")

                    # Save individual file
                    nation_dir = output_dir / nation.lower()
                    nation_dir.mkdir(exist_ok=True)

                    individual_path = nation_dir / f"{nation.lower()}_{style}_{gen_name}.png"
                    img.save(individual_path, "PNG")
                    size_mb = os.path.getsize(individual_path) / (1024 * 1024)

                    print(f"  [{gen_name.upper()}] Done in {elapsed:.1f}s — {img.size[0]}x{img.size[1]} — {size_mb:.1f}MB")

                    gen_images[gen_name] = img

                    # Rate limit between generators
                    time.sleep(2)

                except Exception as e:
                    print(f"  [{gen_name.upper()}] FAILED: {e}")

            # Build comparison grid
            if len(gen_images) > 1:
                grid_path = output_dir / f"{nation.lower()}_{style}_comparison.jpg"
                build_comparison_grid(gen_images, nation, style, grid_path)
                print(f"\n  Comparison grid: {grid_path}")

            results[test_key] = {
                "nation": nation,
                "style": style,
                "prompt": prompt,
                "generators": {
                    g: str(output_dir / nation.lower() / f"{nation.lower()}_{style}_{g}.png")
                    for g in gen_images
                },
                "comparison": str(output_dir / f"{nation.lower()}_{style}_comparison.jpg")
                if len(gen_images) > 1 else None,
            }

    # Save results manifest
    manifest_path = output_dir / "shootout_manifest.json"
    with open(manifest_path, "w") as f:
        json.dump({
            "run_at": datetime.now(timezone.utc).isoformat(),
            "tests": results,
        }, f, indent=2)

    print(f"\n{'='*60}")
    print(f"  Shootout complete!")
    print(f"  Results in: {output_dir.resolve()}")
    print(f"  Manifest: {manifest_path}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
