#!/usr/bin/env python3
"""
HOODD Mockup Render Pipeline v4 — Real Vehicle Photo Compositing
================================================================
Composites product hood cover images onto real vehicle photographs
using perspective transforms. Much better than drawing polygons.
"""

import os, sys, math, argparse, hashlib
from io import BytesIO
from pathlib import Path

import requests
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageEnhance

# ── Shopify Config ────────────────────────────────────────────────
SHOPIFY_DOMAIN = "hoodd-shop-2.myshopify.com"
STOREFRONT_TOKEN = "141024d62ca509d9945ec6845600da6c"
API_VERSION = "2024-10"
STOREFRONT_URL = f"https://{SHOPIFY_DOMAIN}/api/{API_VERSION}/graphql.json"

# ── Nations ───────────────────────────────────────────────────────
NATIONS = [
    {"code": "us", "name": "United States"}, {"code": "ca", "name": "Canada"},
    {"code": "mx", "name": "Mexico"}, {"code": "pa", "name": "Panama"},
    {"code": "cw", "name": "Curacao"}, {"code": "ht", "name": "Haiti"},
    {"code": "ar", "name": "Argentina"}, {"code": "br", "name": "Brazil"},
    {"code": "co", "name": "Colombia"}, {"code": "ec", "name": "Ecuador"},
    {"code": "py", "name": "Paraguay"}, {"code": "uy", "name": "Uruguay"},
    {"code": "gb-eng", "name": "England"}, {"code": "fr", "name": "France"},
    {"code": "de", "name": "Germany"}, {"code": "es", "name": "Spain"},
    {"code": "pt", "name": "Portugal"}, {"code": "nl", "name": "Netherlands"},
    {"code": "be", "name": "Belgium"}, {"code": "hr", "name": "Croatia"},
    {"code": "ch", "name": "Switzerland"}, {"code": "at", "name": "Austria"},
    {"code": "no", "name": "Norway"}, {"code": "gb-sct", "name": "Scotland"},
    {"code": "se", "name": "Sweden"}, {"code": "tr", "name": "Turkey"},
    {"code": "ba", "name": "Bosnia and Herzegovina"}, {"code": "cz", "name": "Czechia"},
    {"code": "ma", "name": "Morocco"}, {"code": "sn", "name": "Senegal"},
    {"code": "gh", "name": "Ghana"}, {"code": "dz", "name": "Algeria"},
    {"code": "cv", "name": "Cape Verde"}, {"code": "cd", "name": "DR Congo"},
    {"code": "eg", "name": "Egypt"}, {"code": "ci", "name": "Ivory Coast"},
    {"code": "za", "name": "South Africa"}, {"code": "tn", "name": "Tunisia"},
    {"code": "jp", "name": "Japan"}, {"code": "kr", "name": "South Korea"},
    {"code": "au", "name": "Australia"}, {"code": "sa", "name": "Saudi Arabia"},
    {"code": "ir", "name": "Iran"}, {"code": "iq", "name": "Iraq"},
    {"code": "jo", "name": "Jordan"}, {"code": "qa", "name": "Qatar"},
    {"code": "uz", "name": "Uzbekistan"}, {"code": "nz", "name": "New Zealand"},
]

CODE_TO_TITLE = {
    "us": "USA", "ca": "Canada", "mx": "Mexico", "pa": "Panama",
    "cw": "Curacao", "ht": "Haiti", "ar": "Argentina", "br": "Brazil",
    "co": "Colombia", "ec": "Ecuador", "py": "Paraguay", "uy": "Uruguay",
    "gb-eng": "England", "fr": "France", "de": "Germany", "es": "Spain",
    "pt": "Portugal", "nl": "Netherlands", "be": "Belgium", "hr": "Croatia",
    "ch": "Switzerland", "at": "Austria", "no": "Norway", "gb-sct": "Scotland",
    "se": "Sweden", "tr": "Turkey", "ba": "Bosnia", "cz": "Czech",
    "ma": "Morocco", "sn": "Senegal", "gh": "Ghana", "dz": "Algeria",
    "cv": "Cape Verde", "cd": "Congo", "eg": "Egypt", "ci": "Ivory Coast",
    "za": "South Africa", "tn": "Tunisia", "jp": "Japan", "kr": "Korea",
    "au": "Australia", "sa": "Saudi", "ir": "Iran", "iq": "Iraq",
    "jo": "Jordan", "qa": "Qatar", "uz": "Uzbekistan", "nz": "New Zealand",
}

TOP_5 = ["br", "ar", "gb-eng", "es", "de"]
TOP_8_EXTRA = ["fr", "mx", "us"]
NORTH_AMERICA = ["us", "ca", "mx"]


# ── Vehicle Photo Configs ─────────────────────────────────────────
# Hood quad = 4 corners of the hood surface: [TL, TR, BR, BL]
# TL = windshield-far, TR = windshield-near, BR = grille-near, BL = grille-far

VEHICLES = {
    "hilux": {
        "file": "hq720 (1).jpg",
        "label": "Toyota Hilux",
        "type": "truck",
        # Image: 686x386, front-right 3/4 view
        # Hood only — between windshield base and grille top
        "hood_quad": [(262, 108), (480, 76), (530, 192), (192, 206)],
        "output_size": (1920, 1080),
    },
    "strada": {
        "file": "hq720.jpg",
        "label": "Fiat Strada",
        "type": "truck",
        # Image: 686x386, front-right 3/4 view
        "hood_quad": [(278, 146), (442, 115), (486, 195), (218, 210)],
        "output_size": (1920, 1080),
    },
    "model_y": {
        "file": "2026 Tesla Model Y Juniper, Front 3_4 Quarters_0.jpg",
        "label": "Tesla Model Y",
        "type": "suv",
        # Image: 1200x675, front-left 3/4 view
        "hood_quad": [(400, 315), (640, 292), (700, 358), (312, 375)],
        "output_size": (1920, 1080),
    },
    "golf": {
        "file": "2020_Volkswagen_Golf_Style_1.5_Front.jpg",
        "label": "Volkswagen Golf",
        "type": "sedan",
        # Image: 4946x2523, front-left 3/4 view
        "hood_quad": [(1920, 970), (3180, 845), (3480, 1140), (1620, 1195)],
        "output_size": (1920, 1080),
    },
    "golf_gti": {
        "file": "Golf_GTI_032.webp",
        "label": "VW Golf GTI",
        "type": "sedan",
        # Image: 1280x720, front-left 3/4 driving shot
        "hood_quad": [(482, 260), (708, 195), (795, 288), (388, 296)],
        "output_size": (1920, 1080),
    },
    "puma": {
        "file": "30-ford-puma-2024-front-driving.webp",
        "label": "Ford Puma",
        "type": "suv",
        # Image: 1752x1168, front-left driving shot
        "hood_quad": [(560, 395), (1020, 310), (1200, 530), (380, 535)],
        "output_size": (1920, 1080),
    },
}

# Which vehicles each nation type gets
VEHICLE_ASSIGNMENTS = {
    # North America: trucks + sedan
    "na": ["hilux", "strada", "golf"],
    # Top 5 (non-NA): all types
    "top5": ["golf", "model_y", "hilux"],
    # Top 8 extra (non-NA): sedan + SUV
    "top8_non_na": ["golf", "model_y"],
    # Top 8 extra (NA): truck + sedan + SUV
    "top8_na": ["hilux", "golf", "model_y"],
    # Default rest of world: sedan + SUV
    "default": ["golf_gti"],
}


# ── Shopify API ───────────────────────────────────────────────────

def fetch_all_products():
    query = """query($first:Int!,$after:String){products(first:$first,after:$after){edges{node{handle title images(first:1){edges{node{url}}}}}pageInfo{hasNextPage endCursor}}}"""
    all_p, after = [], None
    while True:
        r = requests.post(STOREFRONT_URL,
                          headers={"Content-Type": "application/json",
                                   "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN},
                          json={"query": query, "variables": {"first": 50, "after": after}})
        d = r.json().get("data", {}).get("products", {})
        for e in d.get("edges", []):
            n = e["node"]
            imgs = [x["node"]["url"] for x in n.get("images", {}).get("edges", [])]
            all_p.append({"handle": n["handle"], "title": n["title"], "images": imgs})
        pi = d.get("pageInfo", {})
        if pi.get("hasNextPage") and pi.get("endCursor"):
            after = pi["endCursor"]
        else:
            break
    return all_p


def match_products(products):
    result = {}
    for n in NATIONS:
        kw = CODE_TO_TITLE.get(n["code"], n["name"]).lower()
        for p in products:
            if kw in p["title"].lower():
                result[n["code"]] = p
                break
    return result


def download_image(url, cache_dir):
    h = hashlib.md5(url.encode()).hexdigest()
    cp = cache_dir / f"{h}.png"
    if cp.exists():
        return Image.open(cp).convert("RGBA")
    try:
        r = requests.get(url, timeout=15)
        r.raise_for_status()
        img = Image.open(BytesIO(r.content)).convert("RGBA")
        img.save(cp)
        return img
    except:
        return None


# ── Perspective Transform ─────────────────────────────────────────

def find_coeffs(src, dst):
    """Compute perspective transform coefficients."""
    matrix = []
    for s, d in zip(src, dst):
        matrix.append([d[0], d[1], 1, 0, 0, 0, -s[0]*d[0], -s[0]*d[1]])
        matrix.append([0, 0, 0, d[0], d[1], 1, -s[1]*d[0], -s[1]*d[1]])
    A = np.matrix(matrix, dtype=np.float64)
    B = np.array([s for p in src for s in p], dtype=np.float64)
    return np.linalg.solve(A, B).tolist()


def warp_to_quad(product_img, hood_quad, canvas_size):
    """Perspective-warp product image to fit the hood quadrilateral."""
    w, h = product_img.size
    src = [(0, 0), (w, 0), (w, h), (0, h)]
    coeffs = find_coeffs(src, list(hood_quad))
    warped = product_img.transform(canvas_size, Image.PERSPECTIVE, coeffs,
                                    Image.BICUBIC, fillcolor=(0, 0, 0, 0))
    return warped


# ── Hood Mask ─────────────────────────────────────────────────────

def create_hood_mask(hood_quad, canvas_size, feather=2):
    """Create a feathered mask for the hood area."""
    mask = Image.new("L", canvas_size, 0)
    draw = ImageDraw.Draw(mask)
    draw.polygon(hood_quad, fill=255)

    if feather > 0:
        # Feather edges by blurring the mask slightly
        mask = mask.filter(ImageFilter.GaussianBlur(feather))
        # Re-threshold to keep core solid but soften edges
        mask = mask.point(lambda x: min(255, int(x * 1.5)))

    return mask


# ── Compositing ───────────────────────────────────────────────────

def composite_product_on_vehicle(vehicle_img, product_img, hood_quad, output_size):
    """
    Composite a product image onto a vehicle photo's hood.

    1. Scale vehicle photo to output size
    2. Perspective-warp product to hood quad
    3. Create feathered hood mask
    4. Composite warped product onto vehicle using mask
    5. Add subtle enhancement (contrast, shadow)
    """
    # Work at the vehicle photo's native resolution
    vw, vh = vehicle_img.size

    # Ensure vehicle is RGBA
    if vehicle_img.mode != "RGBA":
        vehicle_img = vehicle_img.convert("RGBA")

    # Warp product onto hood at vehicle photo resolution
    warped = warp_to_quad(product_img, hood_quad, (vw, vh))

    # Boost the warped product slightly for vibrancy
    warped = ImageEnhance.Contrast(warped).enhance(1.08)
    warped = ImageEnhance.Color(warped).enhance(1.05)

    # Create feathered mask for hood area
    mask = create_hood_mask(hood_quad, (vw, vh), feather=3)

    # Composite: use the mask to blend product onto vehicle
    # First, darken the hood area slightly to simulate the cover sitting on paint
    result = vehicle_img.copy()

    # Apply warped product within the mask
    # Extract alpha from warped product and intersect with hood mask
    _, _, _, warped_alpha = warped.split()
    combined_mask = Image.new("L", (vw, vh), 0)
    combined_mask.paste(mask)
    # Intersect: only show product where both mask and product alpha agree
    combined_mask = Image.fromarray(
        np.minimum(np.array(mask), np.array(warped_alpha))
    )

    result.paste(warped, (0, 0), combined_mask)

    # Add subtle specular highlight on the cover
    highlight = Image.new("RGBA", (vw, vh), (0, 0, 0, 0))
    hd = ImageDraw.Draw(highlight)
    # Center of hood quad
    cx = sum(p[0] for p in hood_quad) // 4
    cy = sum(p[1] for p in hood_quad) // 4
    # Subtle elliptical highlight
    for i in range(1, 30):
        r = 30 - i
        rx = max(1, r * 3)
        ry = max(1, r * 1)
        a = max(1, int(2 * i / 30))
        x0, y0, x1, y1 = cx - rx, cy - ry, cx + rx, cy + ry
        if x1 > x0 and y1 > y0:
            hd.ellipse([x0, y0, x1, y1], fill=(255, 255, 255, a))
    result = Image.alpha_composite(result, highlight)

    # Scale to output size
    result = result.resize(output_size, Image.LANCZOS)

    return result.convert("RGB")


# ── Vehicle Assignment ────────────────────────────────────────────

def get_vehicle_list(code):
    """Determine which vehicle photos a nation gets."""
    if code in TOP_5:
        if code in NORTH_AMERICA:
            return VEHICLE_ASSIGNMENTS["top8_na"]
        return VEHICLE_ASSIGNMENTS["top5"]
    elif code in TOP_8_EXTRA:
        if code in NORTH_AMERICA:
            return VEHICLE_ASSIGNMENTS["top8_na"]
        return VEHICLE_ASSIGNMENTS["top8_non_na"]
    elif code in NORTH_AMERICA:
        return VEHICLE_ASSIGNMENTS["na"]
    else:
        return VEHICLE_ASSIGNMENTS["default"]


# ── Main ──────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="HOODD v4 — Real Vehicle Compositing")
    parser.add_argument("--vehicles", required=True, help="Path to VEHICLES folder")
    parser.add_argument("--output", default="./renders_v4")
    parser.add_argument("--cache", default="./.image-cache")
    parser.add_argument("--only", default=None, help="Render only this nation code")
    parser.add_argument("--vehicle", default=None, help="Use only this vehicle key")
    parser.add_argument("--start", type=int, default=0)
    parser.add_argument("--count", type=int, default=999)
    args = parser.parse_args()

    out = Path(args.output)
    out.mkdir(parents=True, exist_ok=True)
    cache = Path(args.cache)
    cache.mkdir(parents=True, exist_ok=True)
    vehicles_dir = Path(args.vehicles)

    print("=" * 60)
    print("  HOODD Mockup Render Pipeline v4 — Real Vehicle Photos")
    print("=" * 60)

    # Load vehicle base photos
    print("[1/4] Loading vehicle photos...")
    vehicle_images = {}
    for key, cfg in VEHICLES.items():
        fp = vehicles_dir / cfg["file"]
        if fp.exists():
            vehicle_images[key] = Image.open(fp)
            print(f"       OK {key}: {cfg['file']} ({vehicle_images[key].size})")
        else:
            print(f"       MISSING {key}: {cfg['file']}")
    print(f"       {len(vehicle_images)} vehicles loaded")

    # Fetch Shopify products
    print("[2/4] Fetching products from Shopify...")
    products = fetch_all_products()
    print(f"       {len(products)} products")

    print("       Matching nations...")
    product_map = match_products(products)
    print(f"       {len(product_map)}/48 matched")

    # Download product images
    print("[3/4] Downloading product images...")
    product_images = {}
    for code, prod in product_map.items():
        if prod["images"]:
            img = download_image(prod["images"][0], cache)
            if img:
                product_images[code] = img
    print(f"       {len(product_images)} product images ready")

    # Render
    print("[4/4] Compositing renders...")
    count = 0
    nation_slice = NATIONS[args.start:args.start + args.count]

    for nation in nation_slice:
        code = nation["code"]
        name = nation["name"]

        if args.only and code != args.only:
            continue
        if code not in product_images:
            print(f"  SKIP {code} (no product image)")
            continue

        prod_img = product_images[code]

        # Determine vehicle assignments
        veh_keys = get_vehicle_list(code)

        # Filter to specific vehicle if requested
        if args.vehicle:
            veh_keys = [args.vehicle] if args.vehicle in veh_keys else [args.vehicle]

        for i, veh_key in enumerate(veh_keys):
            if veh_key not in vehicle_images:
                print(f"  SKIP {code}/{veh_key} (vehicle photo missing)")
                continue

            veh_cfg = VEHICLES[veh_key]
            veh_img = vehicle_images[veh_key]

            # Build filename: nation_vehicle.png
            if len(veh_keys) == 1:
                fname = f"{code}_{veh_key}.png"
            else:
                fname = f"{code}_{veh_key}.png"

            try:
                result = composite_product_on_vehicle(
                    veh_img, prod_img,
                    veh_cfg["hood_quad"],
                    veh_cfg["output_size"]
                )
                result.save(out / fname, "PNG", optimize=True)
                count += 1
                print(f"  OK {fname:45s} [{veh_cfg['label']}]")
            except Exception as e:
                print(f"  ERR {fname} — {e}")

    print(f"\nDone! {count} renders saved to {out.resolve()}")


if __name__ == "__main__":
    main()
