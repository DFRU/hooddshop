#!/usr/bin/env python3
"""
Hood'd Social Media Content Generator
=======================================
Generates ONE social media image using the ACTUAL product design as input.
Uses Gemini gemini-2.5-flash-image multimodal (same as vehicle pipeline).

The product image is fed as the source of truth — the AI must reproduce
EXACTLY that design on the car hood, not invent its own.

Usage:
    python generate_social.py Argentina meetup
    python generate_social.py Argentina landmark
    python generate_social.py Argentina beauty
    python generate_social.py Argentina countdown
    python generate_social.py Argentina collection
    python generate_social.py Mexico meetup --vehicle suv
    python generate_social.py USA beauty --vehicle truck
    python generate_social.py Argentina meetup --api openai
    python generate_social.py Brazil meetup_cinematic --api composite --product "path/to/design.png"

Requires:
    pip install google-genai Pillow openai python-dotenv requests opencv-python numpy
"""
import sys
import os
import json
import time
import argparse
from io import BytesIO
from pathlib import Path

# Fix Windows encoding
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# ── Config ──────────────────────────────────────────────────────────────────

PRODUCT_DIR = Path(r"C:\Dev\hooddshop\pipeline-v6\printkk-upload-ready")
OUTPUT_DIR = Path(r"C:\Dev\hooddshop\social-media-posts\output")
ENV_PATH = Path(r"D:\HOODD\02_PIPELINES\.env")

# Load .env manually (no dotenv dependency required but works if present)
API_KEYS = {}
if ENV_PATH.exists():
    for line in ENV_PATH.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            API_KEYS[k.strip()] = v.strip()

GEMINI_API_KEY = API_KEYS.get("GEMINI_API_KEY")
OPENAI_API_KEY = API_KEYS.get("OPENAI_API_KEY")

# Nation name mapping (matches printkk filenames)
NATION_NAMES = {
    "Algeria": "ar_dz", "Argentina": "ar", "Australia": "au", "Austria": "at",
    "Belgium": "be", "Bosnia": "ba", "Brazil": "br", "Canada": "ca",
    "Cape_Verde": "cv", "Colombia": "co", "Croatia": "hr", "Curacao": "cw",
    "Czech_Republic": "cz", "DR_Congo": "cd", "Ecuador": "ec", "Egypt": "eg",
    "England": "gb-eng", "France": "fr", "Germany": "de", "Ghana": "gh",
    "Haiti": "ht", "Iran": "ir", "Iraq": "iq", "Ivory_Coast": "ci",
    "Japan": "jp", "Jordan": "jo", "Mexico": "mx", "Morocco": "ma",
    "Netherlands": "nl", "New_Zealand": "nz", "Norway": "no", "Panama": "pa",
    "Paraguay": "py", "Portugal": "pt", "Qatar": "qa", "Saudi_Arabia": "sa",
    "Scotland": "gb-sct", "Senegal": "sn", "South_Africa": "za",
    "South_Korea": "kr", "Spain": "es", "Sweden": "se", "Switzerland": "ch",
    "Tunisia": "tn", "Turkey": "tr", "Uruguay": "uy", "USA": "us",
    "Uzbekistan": "uz",
}

VEHICLES = {
    "sedan": "a modern glossy black sedan",
    "suv": "a dark grey SUV",
    "truck": "a glossy black full-size pickup truck",
    "coupe": "a sleek black sports coupe",
}

# ── Nation-specific scene flavor (crowd, backdrop, atmosphere) ─────────────
# Each nation gets unique people and environment so batch output has variety.
# Format: (crowd_description, backdrop_detail, atmosphere_note)

NATION_FLAVOR = {
    "Argentina": (
        "young fans in sky blue and white soccer jerseys, one with a scarf, one filming with phone",
        "urban cityscape with modern buildings in the background",
        "football match night energy"
    ),
    "Mexico": (
        "fans in green El Tri soccer jerseys, one draped in a flag, one with a scarf",
        "urban city street with modern buildings at night",
        "match day energy, warm amber accent lighting mixed with teal"
    ),
    "USA": (
        "diverse group in red/white/blue US soccer scarves and jerseys, snapback caps",
        "downtown American city skyline with glass skyscrapers",
        "tailgate energy"
    ),
    "Brazil": (
        "fans in yellow Brazil soccer jerseys, high energy, one with a scarf overhead",
        "city skyline with palm trees and warm night sky",
        "golden and green accent lighting"
    ),
    "Colombia": (
        "fans in yellow Colombia soccer jerseys, high energy, clapping and cheering",
        "urban nightscape with modern buildings and warm streetlights",
        "warm golden and red accent lighting"
    ),
    "England": (
        "fans in white England soccer shirts with scarves around their necks",
        "urban cityscape with brick and modern buildings",
        "cool blue-white accent lighting"
    ),
    "France": (
        "fans in navy France soccer jerseys, one with a tricolore scarf",
        "European boulevard with classic architecture at night",
        "blue-white-red accent glow"
    ),
    "Germany": (
        "fans in white Germany soccer jerseys and black jackets",
        "modern city backdrop with clean architecture",
        "white and amber accent lighting"
    ),
    "Spain": (
        "fans in red Spain soccer jerseys, animated and passionate",
        "urban plaza with warm-toned buildings and streetlamps",
        "warm red and gold accent lighting"
    ),
    "Portugal": (
        "fans in dark red Portugal soccer jerseys, one with a green and red scarf",
        "urban nightscape with classic European architecture",
        "warm golden accent lighting"
    ),
    "Japan": (
        "fans in blue Japan soccer jerseys, one taking a photo with phone",
        "neon-lit city streetscape in the background",
        "JDM car culture meets football energy, neon pink and blue accent lighting"
    ),
    "South_Korea": (
        "fans in red South Korea soccer jerseys, high energy, headbands",
        "modern city skyline with glass towers and LED screens",
        "red and blue neon accent lighting"
    ),
    "Morocco": (
        "fans in red and green Morocco soccer jerseys, passionate",
        "urban nightscape with warm architectural lighting",
        "warm amber and green accent lighting"
    ),
    "Netherlands": (
        "fans in bright orange Netherlands soccer jerseys, one with a scarf",
        "urban setting with modern architecture at night",
        "bold orange accent lighting"
    ),
    "Croatia": (
        "fans in red-and-white checkerboard Croatia soccer jerseys, one with a scarf held high",
        "urban cityscape at night with warm lighting",
        "red and white accent lighting"
    ),
}

# Default flavor for nations without a specific entry
DEFAULT_FLAVOR = (
    "diverse group of fans in national team soccer jerseys and scarves",
    "urban city skyline with modern buildings at night",
    "football match night energy"
)

def get_nation_flavor(nation_name):
    """Return (crowd, backdrop, atmosphere) for a nation."""
    return NATION_FLAVOR.get(nation_name, DEFAULT_FLAVOR)

# ── Hood constraint (from ideogram-prompt-template-v2.md) ──────────────────

HOOD_CONSTRAINT = """CRITICAL — HOOD COVER PLACEMENT (read every word):

The product is a STRETCH-FIT FABRIC COVER that goes over ONLY the hood panel of the car.
Think of it like a fitted bedsheet that grips one single panel — the hood — and nothing else.

COVERAGE — THE FABRIC COVERS 100% OF THE HOOD PANEL, EDGE TO EDGE:
  The cover wraps around and tucks UNDER the hood lip on all four sides. From the
  viewer's perspective, the ENTIRE visible hood surface is covered — there is ZERO
  bare paint visible on the hood panel itself. The design goes ALL THE WAY to:
  • REAR EDGE: The fabric extends right up to and wraps around the rear hood lip at the windshield base. No black paint gap between the design and the windshield.
  • FRONT EDGE: The fabric extends right up to and wraps around the front hood lip above the grille. No black paint gap between the design and the grille.
  • LEFT EDGE: The fabric extends right up to and wraps around the left hood edge at the fender seam. No black paint gap between the design and the left fender.
  • RIGHT EDGE: The fabric extends right up to and wraps around the right hood edge at the fender seam. No black paint gap between the design and the right fender.

  The elastic tucks UNDERNEATH so from above you see ONLY the printed fabric — the
  entire hood panel reads as one continuous printed surface from edge to edge. There
  is NO visible black paint on the hood whatsoever. The color transition goes directly
  from printed fabric on the hood to black paint on the fenders/bumper/windshield frame
  with NO gap, NO margin, NO border of bare hood paint.

WHAT THE COVER LOOKS LIKE WHEN INSTALLED — THIS IS FABRIC, NOT PAINT (critical):
  The hood cover is a printed POLYESTER-SPANDEX FABRIC stretched over the hood. It must
  look like CLOTH, not like the car was repainted or vinyl-wrapped.

  HOW TO TELL FABRIC FROM PAINT — render ALL of these cues:
  • SHEEN CONTRAST: The fabric surface is MATTE or SATIN — noticeably LESS SHINY than the
    surrounding glossy clear-coat car paint. This difference in reflectivity is the #1 visual
    cue. The hood should NOT reflect light the same way the fenders do.
  • TEXTILE GRAIN: A fine knit weave pattern is faintly visible on the fabric, like looking
    closely at a sports jersey or athletic compression shirt. Individual fiber threads visible.
  • STRETCH EVIDENCE: Where the fabric curves over the hood's raised contours (power dome,
    body lines), there are subtle stretch tension lines — like a tight shirt over muscles.
  • EDGE SEAM: At the perimeter of the hood, there is a visible fabric edge — a slight
    rolled ridge where the elastic hem wraps under the hood lip. This is a 3D edge, not
    a painted line. It's like the elastic edge of a fitted bedsheet gripping a mattress corner.
  • SOFTNESS: The colors on the fabric are vivid but have a slightly soft, textile quality —
    NOT the mirror-hard gloss of automotive paint. Think printed sports jersey, not car wrap.

WHAT MUST NOT HAPPEN:
  • The design must NOT appear on the bumper, grille, headlights, fenders, doors, mirrors, roof, windshield, or ANY surface other than the hood panel
  • The fabric must NOT drape, hang, or extend past any edge of the hood panel
  • The car's original paint color must be clearly visible on ALL body panels except the hood
  • No wrinkles, no loose fabric, no billowing — it is stretched skin-tight

DESIGN FIDELITY:
  • The pattern on the hood must EXACTLY match the provided reference image — same colors, same geometry, same shapes
  • Do NOT reinterpret, simplify, or replace the design with flag stripes or solid color blocks
  • The design is a complex geometric athletic pattern — preserve its exact detail"""

NO_TEXT = "No text, no words, no letters, no numbers, no watermarks, no logos, no brand names, no license plates, no badges, no emblems, no crests, no FIFA, no Nike, no Adidas. No car manufacturer logos or badges — no BMW, Mercedes, Audi, Toyota, Ford, Chevy, Dodge, or any recognizable brand emblems on the car. The car must be a GENERIC unbranded vehicle with no manufacturer identity visible."

# ── Scene prompts per concept ──────────────────────────────────────────────

def get_scene_prompt(concept, nation_name, vehicle_desc):
    """Return the scene-specific prompt for each content concept."""

    crowd, backdrop, atmosphere = get_nation_flavor(nation_name)

    scenes = {
        "meetup": f"""SCENE:
- Vehicle: {vehicle_desc} (no brand logos, no badges, plain grille), clean, parked
- Camera angle: front 3/4 view from the driver side, slightly above eye level, hood clearly visible
- Setting: nighttime car meetup, dimly lit urban parking lot, teal underglow, overhead spotlight on hood
- 5-6 diverse young adults in streetwear around the car, one filming with phone, slightly out of focus
- Cinematic shallow depth of field, cool color grading, lens flare
- No text, no watermarks, no logos, no brand badges
- Photorealistic quality, 9:16 vertical portrait aspect ratio""",

        "meetup_cinematic": f"""Photorealistic cinematic photograph. 9:16 vertical portrait.

CAMERA: Front three-quarter from driver's side, ELEVATED 45 degrees looking DOWN at the car. The hood fills at least 40% of the frame. NOT eye-level — camera is clearly ABOVE the car.

CAR: Glossy black sedan, NO brand identity — no hood emblem, no grille logo, no badges. Plain unbranded grille. Must NOT resemble a BMW, Mercedes, or Audi.

HOOD: The hood panel is covered with the product from the provided image. The fabric wraps around ALL edges and tucks UNDER the hood lip — from above, you see ONLY printed fabric, ZERO black paint on the hood surface. Where hood meets fenders: abrupt transition from printed fabric to black paint. Grille and bumper below the front lip are black, uncovered.

SCENE: Nighttime car meetup. {backdrop}. Haze and smoke. {atmosphere}. Teal underglow beneath car. Overhead spotlight on hood. 5-6 {crowd} standing around the car, out of focus in background. Cinematic mood.

License plate blank or not visible. No text, no watermarks, no logos on the car or in the image.

FINAL REMINDER — the three things that MUST be right:
1. Hood design EXACTLY matches the provided product image — same pattern, same colors, same geometry. Not simplified. Not replaced with stripes.
2. Fabric covers 100% of the hood edge-to-edge, tucked UNDER the hood lip — no draping, no hanging past the hood edge onto bumper or fenders.
3. Hood surface is MATTE FABRIC (textile weave visible), NOT glossy paint. Visibly less shiny than the glossy black fenders.""",

        "landmark": f"""SCENE:
- Vehicle: {vehicle_desc} (no brand logos, no badges, plain grille), clean, parked
- Camera angle: front 3/4 view from the driver side, slightly above eye level, hood clearly visible
- Setting: parked in front of a famous stadium, golden hour sunlight, a few fans in national jerseys in background
- Professional automotive photography, shallow depth of field
- No text, no watermarks, no logos, no brand badges
- Photorealistic quality, 4:5 portrait aspect ratio""",

        "beauty": f"""SCENE:
- Vehicle: {vehicle_desc} (no brand logos, no badges, plain grille), clean, parked
- Camera angle: front 3/4 view from the driver side, slightly above eye level, hood clearly visible
- Setting: clean suburban driveway, golden hour sunlight breaking through clouds, rim lighting
- Professional automotive product photography, shallow depth of field
- No text, no watermarks, no logos, no brand badges
- Photorealistic quality, 9:16 vertical portrait aspect ratio""",

        "matchday": f"""SCENE:
- Vehicle: glossy black generic sedan (no brand logos, no badges, plain grille)
- Camera angle: dashboard-level POV looking forward through windshield, hood visible in lower third of frame
- Setting: driving through a city on a sunny match day, fans in national jerseys on sidewalks, flags on balconies
- Golden hour sunlight, festive atmosphere, clean cinematic color grading
- No text, no watermarks, no logos, no brand badges
- Photorealistic quality, 9:16 vertical portrait aspect ratio""",

        "beforeafter": f"""SCENE: Two side-by-side photographs in a single 1:1 square image.
- LEFT HALF: {vehicle_desc} (no brand logos) with bare glossy black hood. Overcast flat lighting. Plain.
- RIGHT HALF: Same car, same angle, but hood now covered with the product. Golden hour lighting.
- Only the hood panel changes between the two halves. Everything else identical.
- Clear dividing line between halves
- No text, no watermarks, no logos, no brand badges
- Photorealistic quality, 1:1 square aspect ratio""",

        "collection": f"""SCENE: Studio photograph of a dark gallery wall with 6 car hood covers pinned flat as art prints.
- Each cover is a roughly trapezoidal fabric piece (the shape of a car hood laid flat)
- CENTER cover (larger, brighter spotlight): the EXACT design from the provided image
- Other 5: geometric athletic patterns in Mexico (green/white/red), USA (red/white/blue), Brazil (yellow/green), England (white/red), France (blue/white/red) color schemes
- Gallery spotlights, polished concrete floor, premium retail display
- No text, no watermarks, no logos
Photorealistic quality. 1:1 square aspect ratio.""",
    }

    return scenes.get(concept, scenes["meetup"])


# ── Gemini generation ──────────────────────────────────────────────────────

def generate_gemini(product_path, prompt, output_path):
    """Generate image using Gemini gemini-2.5-flash-image with product as input."""
    from google import genai
    from google.genai import types
    from PIL import Image

    print(f"  [GEMINI] Loading product image...")
    img = Image.open(product_path)

    # Resize for API (original is 9448x7086, too large)
    max_dim = 1536
    ratio = min(max_dim / img.width, max_dim / img.height)
    if ratio < 1:
        new_size = (int(img.width * ratio), int(img.height * ratio))
        img = img.resize(new_size, Image.LANCZOS)
        print(f"  [GEMINI] Resized to {img.size}")

    buf = BytesIO()
    img.save(buf, format="PNG")
    image_bytes = buf.getvalue()

    # Build multimodal content: product image FIRST, then prompt
    # (Matches the proven vehicle pipeline approach — image as source of truth)
    contents = [
        types.Part.from_bytes(data=image_bytes, mime_type="image/png"),
        types.Part.from_text(text=f"""I am providing you with an image of a custom car hood cover product. This is a REAL PRODUCT — a stretch-fit fabric cover that goes over a vehicle's hood.

YOUR TASK: Generate a photorealistic photograph showing THIS EXACT hood cover product installed on a car's hood.

CRITICAL RULES:
1. DO NOT modify, alter, reinterpret, or change the hood cover design in ANY way. The design in the provided image is the EXACT design that must appear on the hood. Same colors, same patterns, same shapes, same geometry, same diagonal lines, same motifs. ZERO creative changes. Do NOT simplify it, do NOT replace it with flag stripes, do NOT substitute a different design.
2. The fabric cover stretches TIGHTLY over the hood surface only. It tucks under the hood lip on all four sides. No fabric visible below the hood edge. The design covers 100% of the hood panel surface edge-to-edge.
3. The print must look like sublimation-printed FABRIC — matte/satin finish, visible textile grain — NOT glossy automotive paint.

{prompt}"""),
    ]

    print(f"  [GEMINI] Calling gemini-2.5-flash-image...")
    start = time.time()

    client = genai.Client(api_key=GEMINI_API_KEY)
    response = client.models.generate_content(
        model="gemini-2.5-flash-image",
        contents=contents,
        config=types.GenerateContentConfig(
            response_modalities=["Image", "Text"],
            temperature=0.2,
        ),
    )

    elapsed = time.time() - start
    print(f"  [GEMINI] Response in {elapsed:.1f}s")

    # Extract image from response
    if response.candidates:
        for part in response.candidates[0].content.parts:
            if part.inline_data is not None:
                image_data = part.inline_data.data
                result = Image.open(BytesIO(image_data))
                result.save(str(output_path), "PNG", quality=95)
                size_kb = output_path.stat().st_size // 1024
                print(f"  [OK] Saved {output_path.name} ({size_kb}KB, {result.size})")
                return True
            elif part.text:
                print(f"  [TEXT] {part.text[:300]}")

    print(f"  [FAIL] No image in Gemini response")
    return False


# ── OpenAI generation (Responses API with image_generation tool) ──────────

def generate_openai(product_path, prompt, output_path):
    """Generate image using OpenAI Responses API with product as reference image."""
    import base64
    from openai import OpenAI
    from PIL import Image

    print(f"  [OPENAI] Loading product image...")
    img = Image.open(product_path)

    # Resize for API
    max_dim = 1536
    ratio = min(max_dim / img.width, max_dim / img.height)
    if ratio < 1:
        new_size = (int(img.width * ratio), int(img.height * ratio))
        img = img.resize(new_size, Image.LANCZOS)
        print(f"  [OPENAI] Resized to {img.size}")

    buf = BytesIO()
    img.save(buf, format="PNG")
    b64_image = base64.b64encode(buf.getvalue()).decode("utf-8")

    # Build OpenAI prompt: wrapper rules + scene prompt
    # The scene prompt already contains camera, car, scene details
    edit_prompt = f"""I am providing a reference image of a custom car hood cover product — a stretch-fit polyester-spandex fabric that installs over a vehicle's hood panel.

YOUR TASK: Generate a photorealistic cinematic photograph showing THIS EXACT design installed on a car's hood in a dramatic nighttime scene.

DESIGN FIDELITY (most important):
The hood cover design MUST exactly match the provided reference image — every color, pattern, stripe, star, text, and geometric shape reproduced faithfully. Do NOT simplify, reinterpret, or replace with plain flag colors.

HOOD COVER RULES:
- The fabric covers 100% of the hood panel surface — there is ZERO bare black paint visible on the hood. The printed design extends ALL THE WAY to every edge: left fender seam, right fender seam, front lip above grille, rear edge at windshield base. Think of a fitted bedsheet stretched over a mattress — the design goes corner to corner with NO gaps, NO margins, NO black border.
- The fabric tucks UNDER the hood lip. No draping or hanging past the hood edges onto bumper or fenders.
- The surface is MATTE FABRIC with visible textile weave — NOT glossy paint. Noticeably less shiny than the car's glossy black fenders and doors.

{prompt}"""

    print(f"  [OPENAI] Calling Responses API (gpt-image-1)...")
    start = time.time()

    client = OpenAI(api_key=OPENAI_API_KEY)
    response = client.responses.create(
        model="gpt-4o",
        input=[
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": edit_prompt},
                    {
                        "type": "input_image",
                        "image_url": f"data:image/png;base64,{b64_image}",
                    },
                ],
            }
        ],
        tools=[{"type": "image_generation"}],
    )

    elapsed = time.time() - start
    print(f"  [OPENAI] Response in {elapsed:.1f}s")

    # Extract generated image from response
    image_generation_calls = [
        output for output in response.output
        if output.type == "image_generation_call"
    ]
    if image_generation_calls:
        image_b64 = image_generation_calls[0].result
        with open(output_path, "wb") as f:
            f.write(base64.b64decode(image_b64))
        size_kb = output_path.stat().st_size // 1024
        print(f"  [OK] Saved {output_path.name} ({size_kb}KB)")
        return True

    # Check for text response (error/refusal)
    for output in response.output:
        if hasattr(output, 'content'):
            print(f"  [TEXT] {str(output.content)[:300]}")

    print(f"  [FAIL] No image in OpenAI response")
    return False


# ── Composite generation (chroma-key + perspective warp) ─────────────────

CHROMA_KEY_COLOR = (255, 0, 255)  # Magenta #FF00FF

def get_composite_scene_prompt(nation_name, vehicle_desc):
    """Scene prompt for composite approach — magenta hood, no design reproduction needed."""
    crowd, backdrop, atmosphere = get_nation_flavor(nation_name)

    return f"""Photorealistic cinematic photograph. 9:16 vertical portrait.

CAMERA: Front three-quarter from driver's side, ELEVATED 45 degrees looking DOWN at the car. The hood fills at least 40% of the frame. NOT eye-level — camera is clearly ABOVE the car.

CAR: A glossy black HONDA CIVIC sedan (4-door). Honda Civic body shape — flat hood, simple horizontal grille bars, no hood ornament. NOT a BMW, NOT a Mercedes, NOT an Audi. The car MUST have a Honda Civic front-end shape with its characteristic slim horizontal grille.

HOOD: The ENTIRE hood panel is painted FLAT SOLID MAGENTA (hex #FF00FF, bright pink-purple). The magenta is perfectly uniform — no gradients, no reflections, no highlights, no shadows on the magenta surface. Just one flat solid magenta rectangle covering 100% of the hood panel from edge to edge. The magenta stops exactly at the hood edges — fenders, grille, bumper are all glossy black. Think of it as a green-screen but magenta.

SCENE: Nighttime car meetup. {backdrop}. Haze and smoke. {atmosphere}. Teal underglow beneath car. Overhead spotlight illuminating the car. 5-6 {crowd} standing around the car, out of focus in background. Cinematic mood.

License plate blank or not visible. No text, no watermarks, no logos on the car or in the image.

CRITICAL: The magenta on the hood must be PERFECTLY FLAT and UNIFORM — no texture, no lighting variation, no reflections. This will be used as a chroma key mask."""


def detect_hood_quadrilateral(scene_img_array):
    """Detect the magenta hood region and return 4 corner points."""
    import cv2
    import numpy as np

    # Convert to HSV for better color detection
    hsv = cv2.cvtColor(scene_img_array, cv2.COLOR_RGB2HSV)

    # Magenta in HSV: H ~140-170 (OpenCV uses 0-180 scale), high S, high V
    # Magenta (255,0,255) in HSV is approximately H=150, S=255, V=255
    lower_magenta = np.array([130, 80, 80])
    upper_magenta = np.array([170, 255, 255])
    mask = cv2.inRange(hsv, lower_magenta, upper_magenta)

    # Also catch via RGB direct thresholding as backup
    r, g, b = scene_img_array[:,:,0], scene_img_array[:,:,1], scene_img_array[:,:,2]
    rgb_mask = ((r > 150) & (b > 150) & (g < 100)).astype(np.uint8) * 255
    mask = cv2.bitwise_or(mask, rgb_mask)

    # Clean up the mask
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=3)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=2)

    # Fill holes in the mask (fixes BMW emblem holes etc.)
    contours_fill, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours_fill:
        cv2.drawContours(mask, contours_fill, -1, 255, -1)  # fill interior

    # Find the largest contour
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        print("  [WARN] No magenta region detected!")
        return None, mask

    largest = max(contours, key=cv2.contourArea)
    area = cv2.contourArea(largest)
    img_area = scene_img_array.shape[0] * scene_img_array.shape[1]
    coverage = area / img_area * 100
    print(f"  [DETECT] Magenta region: {area}px ({coverage:.1f}% of image)")

    if coverage < 3:
        print("  [WARN] Magenta region too small (<3% of image), may not be the hood")
        return None, mask

    # Approximate to quadrilateral
    epsilon = 0.02 * cv2.arcLength(largest, True)
    approx = cv2.approxPolyDP(largest, epsilon, True)

    # If we don't get exactly 4 points, use the min-area bounding rect
    if len(approx) == 4:
        quad = approx.reshape(4, 2)
        print(f"  [DETECT] Found clean quadrilateral")
    else:
        print(f"  [DETECT] Got {len(approx)} vertices, using min-area rect")
        rect = cv2.minAreaRect(largest)
        quad = cv2.boxPoints(rect).astype(int)

    # Sort points: top-left, top-right, bottom-right, bottom-left
    quad = order_points(quad)
    print(f"  [DETECT] Hood corners: TL={quad[0]}, TR={quad[1]}, BR={quad[2]}, BL={quad[3]}")

    return quad, mask


def order_points(pts):
    """Order points as: top-left, top-right, bottom-right, bottom-left."""
    import numpy as np
    pts = pts.astype(np.float32)

    # Sort by y (top two and bottom two)
    s = pts.sum(axis=1)
    d = np.diff(pts, axis=1).flatten()

    tl = pts[np.argmin(s)]
    br = pts[np.argmax(s)]
    tr = pts[np.argmin(d)]
    bl = pts[np.argmax(d)]

    return np.array([tl, tr, br, bl], dtype=np.float32)


def composite_product_onto_hood(scene_img, product_img, quad, mask):
    """Perspective-warp product image onto the detected hood region."""
    import cv2
    import numpy as np

    h, w = scene_img.shape[:2]

    # Source points: corners of the product image
    ph, pw = product_img.shape[:2]
    src_pts = np.array([
        [0, 0],
        [pw - 1, 0],
        [pw - 1, ph - 1],
        [0, ph - 1],
    ], dtype=np.float32)

    # Destination points: the detected hood quadrilateral
    dst_pts = quad.astype(np.float32)

    # Compute perspective transform
    M = cv2.getPerspectiveTransform(src_pts, dst_pts)
    warped = cv2.warpPerspective(product_img, M, (w, h),
                                  flags=cv2.INTER_LANCZOS4,
                                  borderMode=cv2.BORDER_CONSTANT,
                                  borderValue=(0, 0, 0))

    # Create a mask for the warped product region
    product_mask = np.ones((ph, pw), dtype=np.uint8) * 255
    warped_mask = cv2.warpPerspective(product_mask, M, (w, h),
                                       flags=cv2.INTER_LANCZOS4,
                                       borderMode=cv2.BORDER_CONSTANT,
                                       borderValue=0)

    # Also constrain to the original magenta mask to avoid bleeding
    # Dilate the chroma mask slightly to cover edges
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    dilated_chroma = cv2.dilate(mask, kernel, iterations=2)
    combined_mask = cv2.bitwise_and(warped_mask, dilated_chroma)

    # Feather the edges for smooth blending
    combined_mask = cv2.GaussianBlur(combined_mask, (5, 5), 2)

    # Apply fabric texture effect: reduce contrast slightly, add subtle noise
    # This makes the warped product look like fabric rather than a flat overlay
    warped_fabric = apply_fabric_effect(warped, scene_img, combined_mask)

    # Composite: blend warped product onto scene where mask is active
    mask_3ch = cv2.merge([combined_mask, combined_mask, combined_mask]).astype(np.float32) / 255.0
    scene_float = scene_img.astype(np.float32)
    warped_float = warped_fabric.astype(np.float32)

    result = scene_float * (1 - mask_3ch) + warped_float * mask_3ch
    return result.astype(np.uint8)


def apply_fabric_effect(warped, scene, mask):
    """Make the flat product image look like fabric on a 3D surface."""
    import cv2
    import numpy as np

    result = warped.copy().astype(np.float32)

    # 1. Extract lighting from the scene (grayscale luminance map)
    scene_gray = cv2.cvtColor(scene, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255.0

    # Blur to get broad lighting, not fine detail
    light_map = cv2.GaussianBlur(scene_gray, (51, 51), 20)

    # Normalize the light map so average = 1.0
    mean_light = light_map.mean()
    if mean_light > 0:
        light_map = light_map / mean_light

    # Clamp to avoid over-darkening or over-brightening
    light_map = np.clip(light_map, 0.4, 1.6)

    # Apply scene lighting to the product
    for c in range(3):
        result[:, :, c] *= light_map

    # 2. Reduce specularity — fabric is matte, so dampen highlights
    result = np.clip(result, 0, 230)  # cap brightness below full white

    # 3. Add very subtle noise for textile grain
    noise = np.random.normal(0, 3, result.shape).astype(np.float32)
    result += noise

    # 4. Slight desaturation (fabric absorbs light differently than screens)
    gray = cv2.cvtColor(result.astype(np.uint8), cv2.COLOR_RGB2GRAY)
    gray_3ch = cv2.merge([gray, gray, gray]).astype(np.float32)
    result = result * 0.92 + gray_3ch * 0.08  # 8% desaturation

    return np.clip(result, 0, 255).astype(np.uint8)


def generate_composite(product_path, scene_prompt, output_path, nation_name):
    """Two-step composite: AI generates scene with magenta hood, then we warp product onto it."""
    import cv2
    import numpy as np
    from PIL import Image
    from google import genai
    from google.genai import types

    print(f"  [COMPOSITE] Step 1: Generating car scene with magenta hood...")

    # Generate the scene with magenta hood via Gemini
    chroma_prompt = get_composite_scene_prompt(nation_name, "a modern glossy black sedan")

    client = genai.Client(api_key=GEMINI_API_KEY)
    start = time.time()

    response = client.models.generate_content(
        model="gemini-2.5-flash-image",
        contents=[types.Part.from_text(text=chroma_prompt)],
        config=types.GenerateContentConfig(
            response_modalities=["Image", "Text"],
            temperature=0.3,
        ),
    )

    elapsed = time.time() - start
    print(f"  [COMPOSITE] Scene generated in {elapsed:.1f}s")

    # Extract scene image
    scene_pil = None
    if response.candidates:
        for part in response.candidates[0].content.parts:
            if part.inline_data is not None:
                scene_pil = Image.open(BytesIO(part.inline_data.data)).convert("RGB")
                print(f"  [COMPOSITE] Scene size: {scene_pil.size}")
                break
            elif part.text:
                print(f"  [TEXT] {part.text[:200]}")

    if scene_pil is None:
        print(f"  [FAIL] No scene image from Gemini")
        return False

    # Save intermediate scene for debugging
    debug_dir = output_path.parent / "debug"
    debug_dir.mkdir(exist_ok=True)
    scene_debug_path = debug_dir / f"scene_{output_path.stem}.png"
    scene_pil.save(str(scene_debug_path))
    print(f"  [DEBUG] Scene saved: {scene_debug_path.name}")

    # Convert to numpy for OpenCV
    scene_array = np.array(scene_pil)

    # Step 2: Detect magenta hood region
    print(f"  [COMPOSITE] Step 2: Detecting hood region...")
    quad, mask = detect_hood_quadrilateral(scene_array)

    if quad is None:
        print(f"  [FAIL] Could not detect hood quadrilateral")
        # Save the mask for debugging
        mask_debug = debug_dir / f"mask_{output_path.stem}.png"
        Image.fromarray(mask).save(str(mask_debug))
        print(f"  [DEBUG] Mask saved: {mask_debug.name}")
        return False

    # Save mask debug
    mask_debug = debug_dir / f"mask_{output_path.stem}.png"
    Image.fromarray(mask).save(str(mask_debug))

    # Load and prepare product image
    print(f"  [COMPOSITE] Step 3: Warping product onto hood...")
    product_pil = Image.open(product_path).convert("RGB")

    # Resize product to reasonable dimensions for warping
    max_dim = 2048
    ratio = min(max_dim / product_pil.width, max_dim / product_pil.height)
    if ratio < 1:
        new_size = (int(product_pil.width * ratio), int(product_pil.height * ratio))
        product_pil = product_pil.resize(new_size, Image.LANCZOS)

    product_array = np.array(product_pil)

    # Composite
    result = composite_product_onto_hood(scene_array, product_array, quad, mask)

    # Save final result
    result_pil = Image.fromarray(result)
    result_pil.save(str(output_path), "PNG", quality=95)
    size_kb = output_path.stat().st_size // 1024
    print(f"  [OK] Saved {output_path.name} ({size_kb}KB, {result_pil.size})")
    return True


# ── Hybrid generation (composite + AI refinement) ────────────────────────

def generate_hybrid(product_path, scene_prompt, output_path, nation_name):
    """Three-step hybrid: composite for design accuracy, then AI refinement for realism.

    Step 1: Gemini generates car scene with magenta hood (chroma key)
    Step 2: Programmatic perspective-warp of product image onto hood (100% design fidelity)
    Step 3: Feed composite to OpenAI asking it to refine ONLY the blending/lighting/texture
            while preserving the design exactly as-is
    """
    import cv2
    import numpy as np
    import base64
    from PIL import Image
    from google import genai
    from google.genai import types
    from openai import OpenAI

    debug_dir = output_path.parent / "debug"
    debug_dir.mkdir(exist_ok=True)

    # ── Step 1: Generate scene with magenta hood ──
    print(f"  [HYBRID] Step 1/3: Generating car scene with magenta hood...")
    chroma_prompt = get_composite_scene_prompt(nation_name, "a modern glossy black sedan")

    client_gemini = genai.Client(api_key=GEMINI_API_KEY)
    start = time.time()

    response = client_gemini.models.generate_content(
        model="gemini-2.5-flash-image",
        contents=[types.Part.from_text(text=chroma_prompt)],
        config=types.GenerateContentConfig(
            response_modalities=["Image", "Text"],
            temperature=0.3,
        ),
    )
    print(f"  [HYBRID] Scene generated in {time.time() - start:.1f}s")

    scene_pil = None
    if response.candidates:
        for part in response.candidates[0].content.parts:
            if part.inline_data is not None:
                scene_pil = Image.open(BytesIO(part.inline_data.data)).convert("RGB")
                break
            elif part.text:
                print(f"  [TEXT] {part.text[:200]}")

    if scene_pil is None:
        print(f"  [FAIL] No scene image from Gemini")
        return False

    scene_pil.save(str(debug_dir / f"1_scene_{output_path.stem}.png"))
    scene_array = np.array(scene_pil)

    # ── Step 2: Detect hood and composite product ──
    print(f"  [HYBRID] Step 2/3: Detecting hood and compositing product...")
    quad, mask = detect_hood_quadrilateral(scene_array)

    if quad is None:
        print(f"  [FAIL] Could not detect hood quadrilateral")
        Image.fromarray(mask).save(str(debug_dir / f"2_mask_{output_path.stem}.png"))
        return False

    Image.fromarray(mask).save(str(debug_dir / f"2_mask_{output_path.stem}.png"))

    product_pil = Image.open(product_path).convert("RGB")
    max_dim = 2048
    ratio = min(max_dim / product_pil.width, max_dim / product_pil.height)
    if ratio < 1:
        new_size = (int(product_pil.width * ratio), int(product_pil.height * ratio))
        product_pil = product_pil.resize(new_size, Image.LANCZOS)

    product_array = np.array(product_pil)
    composite_array = composite_product_onto_hood(scene_array, product_array, quad, mask)
    composite_pil = Image.fromarray(composite_array)
    composite_pil.save(str(debug_dir / f"2_composite_{output_path.stem}.png"))
    print(f"  [HYBRID] Composite saved to debug")

    # ── Step 3: AI refinement via OpenAI ──
    print(f"  [HYBRID] Step 3/3: AI refinement pass (OpenAI)...")

    # Encode composite as base64
    buf = BytesIO()
    composite_pil.save(buf, format="PNG")
    composite_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

    refine_prompt = """This image shows a car at a nighttime meetup scene. The hood has a custom printed fabric cover that was composited on programmatically and looks slightly artificial.

YOUR TASK: Refine this image to make it look like a single cohesive photograph. Specifically:

1. DO NOT CHANGE THE HOOD DESIGN — the pattern, colors, text, stars, and geometry on the hood must remain EXACTLY as they are. Do not alter, simplify, or reinterpret the design in any way.
2. Make the hood cover look like MATTE FABRIC — add subtle textile weave texture, ensure it's less shiny than the glossy car paint on the fenders and doors.
3. Blend the edges of the hood cover naturally — where the fabric meets the fender seams and hood lip, make the transition look realistic, like fabric tucked under a lip.
4. Match the lighting and color grading — the hood cover should be lit consistently with the rest of the scene (spotlight, underglow, ambient).
5. Keep everything else in the image exactly as-is — the car, crowd, background, atmosphere.

The result should look like a single photograph taken at a real car meetup, not a composite."""

    client_openai = OpenAI(api_key=OPENAI_API_KEY)
    start = time.time()

    response = client_openai.responses.create(
        model="gpt-4o",
        input=[
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": refine_prompt},
                    {
                        "type": "input_image",
                        "image_url": f"data:image/png;base64,{composite_b64}",
                    },
                ],
            }
        ],
        tools=[{"type": "image_generation"}],
    )

    elapsed = time.time() - start
    print(f"  [HYBRID] Refinement in {elapsed:.1f}s")

    image_generation_calls = [
        output for output in response.output
        if output.type == "image_generation_call"
    ]
    if image_generation_calls:
        image_b64 = image_generation_calls[0].result
        with open(output_path, "wb") as f:
            f.write(base64.b64decode(image_b64))
        size_kb = output_path.stat().st_size // 1024
        print(f"  [OK] Saved {output_path.name} ({size_kb}KB)")
        return True

    for output in response.output:
        if hasattr(output, 'content'):
            print(f"  [TEXT] {str(output.content)[:300]}")

    print(f"  [FAIL] No image from OpenAI refinement")
    return False


# ── Main ───────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Generate Hood'd social media content")
    parser.add_argument("nation", help="Nation name matching printkk filename (e.g., Argentina, USA, Mexico)")
    parser.add_argument("concept", choices=["meetup", "meetup_cinematic", "landmark", "beauty", "matchday", "beforeafter", "collection"],
                        help="Content concept to generate")
    parser.add_argument("--vehicle", default="sedan", choices=list(VEHICLES.keys()),
                        help="Vehicle type (default: sedan)")
    parser.add_argument("--api", default="gemini", choices=["gemini", "openai", "composite", "hybrid", "both"],
                        help="Which API to use. 'composite' = chroma-key warp. 'hybrid' = composite + AI refinement")
    parser.add_argument("--output-dir", type=Path, default=None,
                        help="Custom output directory")
    parser.add_argument("--product", type=Path, default=None,
                        help="Custom product image path (overrides default lookup)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Print prompt only, no API call")
    args = parser.parse_args()

    # Find product image
    if args.product:
        product_path = args.product
    else:
        product_path = PRODUCT_DIR / f"{args.nation}_jersey.png"
    if not product_path.exists():
        print(f"[ERROR] Product image not found: {product_path}")
        if not args.product:
            print(f"  Available: {', '.join(p.stem.replace('_jersey','') for p in PRODUCT_DIR.glob('*_jersey.png'))}")
        sys.exit(1)

    # Output directory
    out_dir = args.output_dir or OUTPUT_DIR / args.nation.lower()
    out_dir.mkdir(parents=True, exist_ok=True)

    vehicle_desc = VEHICLES[args.vehicle]
    prompt = get_scene_prompt(args.concept, args.nation, vehicle_desc)

    print(f"[START] {args.nation} — {args.concept} — {args.vehicle}")
    print(f"  Product: {product_path}")
    print(f"  Output:  {out_dir}")

    if args.dry_run:
        print(f"\n--- PROMPT ---\n{prompt}\n--- END ---")
        return

    apis = [args.api] if args.api != "both" else ["gemini", "openai"]

    for api in apis:
        timestamp = int(time.time())
        out_path = out_dir / f"{args.concept}_{args.vehicle}_{api}_{timestamp}.png"

        if api == "gemini":
            if not GEMINI_API_KEY:
                print("[ERROR] GEMINI_API_KEY not found in .env")
                continue
            try:
                generate_gemini(product_path, prompt, out_path)
            except Exception as e:
                print(f"  [ERROR] Gemini: {e}")

        elif api == "composite":
            if not GEMINI_API_KEY:
                print("[ERROR] GEMINI_API_KEY not found in .env (composite uses Gemini for scene)")
                continue
            try:
                generate_composite(product_path, prompt, out_path, args.nation)
            except Exception as e:
                import traceback
                print(f"  [ERROR] Composite: {e}")
                traceback.print_exc()

        elif api == "hybrid":
            if not GEMINI_API_KEY or not OPENAI_API_KEY:
                print("[ERROR] hybrid requires both GEMINI_API_KEY and OPENAI_API_KEY")
                continue
            try:
                generate_hybrid(product_path, prompt, out_path, args.nation)
            except Exception as e:
                import traceback
                print(f"  [ERROR] Hybrid: {e}")
                traceback.print_exc()

        elif api == "openai":
            if not OPENAI_API_KEY:
                print("[ERROR] OPENAI_API_KEY not found in .env")
                continue
            try:
                generate_openai(product_path, prompt, out_path)
            except Exception as e:
                print(f"  [ERROR] OpenAI: {e}")

    print(f"\n[DONE] Check output in: {out_dir}")


if __name__ == "__main__":
    main()
