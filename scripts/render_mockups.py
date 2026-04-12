#!/usr/bin/env python3
"""
HOODD Mockup Render Pipeline v3 — Real Vehicles
=================================================
Generates vehicle mockup renders with detailed silhouettes:
  - Full-size pickup truck (F-150 class) for US/CA/MX
  - Compact SUV/crossover for rest-of-world variant
  - Sports sedan for rest-of-world default
"""

import os, sys, json, math, argparse, hashlib
from io import BytesIO
from pathlib import Path
from typing import Optional, List, Tuple

import requests
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageEnhance

# ── Config ─────────────────────────────────────────────────────────
SHOPIFY_DOMAIN = "hoodd-shop-2.myshopify.com"
STOREFRONT_TOKEN = "141024d62ca509d9945ec6845600da6c"
API_VERSION = "2024-10"
STOREFRONT_URL = f"https://{SHOPIFY_DOMAIN}/api/{API_VERSION}/graphql.json"

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

TOP_5 = ["br", "ar", "gb-eng", "es", "de"]
TOP_8_EXTRA = ["fr", "mx", "us"]
NORTH_AMERICA = ["us", "ca", "mx"]

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

W, H = 1920, 1080


# ── Smooth Curve Helpers ───────────────────────────────────────────

def bezier_points(p0, p1, p2, p3, n=20):
    """Cubic bezier curve as list of (x,y) tuples."""
    pts = []
    for i in range(n + 1):
        t = i / n
        u = 1 - t
        x = u**3*p0[0] + 3*u**2*t*p1[0] + 3*u*t**2*p2[0] + t**3*p3[0]
        y = u**3*p0[1] + 3*u**2*t*p1[1] + 3*u*t**2*p2[1] + t**3*p3[1]
        pts.append((int(x), int(y)))
    return pts

def arc_points(cx, cy, rx, ry, start_deg, end_deg, n=24):
    """Elliptical arc as list of (x,y) tuples."""
    pts = []
    for i in range(n + 1):
        a = math.radians(start_deg + (end_deg - start_deg) * i / n)
        pts.append((int(cx + rx * math.cos(a)), int(cy + ry * math.sin(a))))
    return pts


# ── Vehicle Definitions ───────────────────────────────────────────
# Each vehicle returns: body_shapes, hood_quad, wheels, details, ground_y

def vehicle_pickup_truck():
    """Full-size pickup truck (F-150 / Silverado class). Front 3/4 view."""
    gy = 800

    # Hood quad — large flat truck hood
    hood = [(280, 390), (1060, 360), (1100, 550), (240, 570)]

    # --- Main body shell ---
    lower_body = (
        [(220, 570)] +
        bezier_points((220, 570), (200, 610), (195, 660), (200, 710), 10) +
        [(200, 710), (220, gy - 80)] +
        arc_points(370, gy - 80, 150, 80, 180, 0, 20) +
        [(520, gy - 80), (535, 710)] +
        [(535, 680), (555, 650)] +
        [(555, 650), (1200, 635)] +  # door sill
        [(1200, 635), (1220, gy - 85)] +
        arc_points(1380, gy - 85, 155, 85, 180, 0, 20) +
        [(1535, gy - 85), (1555, 635)] +
        [(1555, 635), (1620, 620)] +  # bed side
        bezier_points((1620, 620), (1660, 600), (1680, 560), (1680, 510), 10) +
        [(1680, 510), (1680, 420)] +  # tailgate
        [(1680, 420), (1660, 405)] +  # bed rail
        [(1660, 405), (1200, 415)] +  # cab rear
        # Roof — lowered for better proportions
        [(1200, 415), (1185, 340)] +  # C-pillar
        bezier_points((1185, 340), (1170, 310), (1110, 295), (1060, 290), 10) +
        [(1060, 290), (720, 298)] +  # roof line
        bezier_points((720, 298), (660, 302), (600, 315), (560, 345), 10) +
        # Windshield — steep rake
        [(560, 345), (280, 390)] +
        [(280, 390), (240, 570)] +
        [(240, 570), (220, 570)]
    )

    windshield = (
        [(568, 350), (290, 395), (300, 390), (1065, 365)] +
        bezier_points((1065, 365), (1075, 340), (1072, 318), (1060, 296), 8) +
        [(1060, 296), (728, 304)] +
        bezier_points((728, 304), (678, 308), (620, 322), (568, 350), 8)
    )

    side_window = [
        (1070, 362), (1068, 318), (1180, 345), (1195, 418), (1105, 420)
    ]

    headlight_l = [(230, 550), (260, 490), (310, 480), (300, 560)]
    headlight_r = [(240, 575), (220, 615), (230, 635), (260, 585)]

    grille = [(250, 568), (1080, 545), (1095, 558), (255, 578)]

    bumper = (
        [(200, 710), (195, 730), (200, gy - 15), (550, gy - 8)] +
        [(550, gy - 8), (535, 710)]
    )

    wheels = [
        {"cx": 370, "cy": gy - 80, "r_tire": 76, "r_rim": 50, "r_hub": 14},
        {"cx": 1380, "cy": gy - 85, "r_tire": 80, "r_rim": 52, "r_hub": 14},
    ]

    return {
        "body": lower_body,
        "windows": [windshield, side_window],
        "details": [headlight_l, headlight_r, grille, bumper],
        "hood_quad": hood,
        "wheels": wheels,
        "ground_y": gy,
        "accent_y": gy - 5,
    }


def vehicle_compact_suv():
    """Compact SUV / crossover (RAV4 / CR-V class). Front 3/4 view.
    Key: Higher ride height than sedan, squared-off rear with D-pillar slope."""
    gy = 810

    hood = [(310, 450), (1080, 430), (1100, 585), (280, 600)]

    lower_body = (
        [(262, 600)] +
        # Front fender
        bezier_points((262, 600), (248, 630), (242, 665), (248, 700), 10) +
        [(248, 700), (258, gy - 72)] +
        # Front wheel arch
        arc_points(400, gy - 72, 140, 72, 180, 0, 18) +
        [(540, gy - 72), (555, 700)] +
        # Rocker panel
        [(555, 682), (1180, 670)] +
        # Rear wheel approach
        [(1180, 670), (1200, gy - 74)] +
        # Rear wheel arch
        arc_points(1340, gy - 74, 140, 74, 180, 0, 18) +
        [(1480, gy - 74), (1498, 670)] +
        # Rear quarter — SUV has more upright rear than sedan
        bezier_points((1498, 670), (1512, 630), (1518, 580), (1518, 530), 10) +
        # D-pillar / rear hatch — slopes from roof
        [(1518, 530), (1512, 470)] +
        bezier_points((1512, 470), (1505, 440), (1490, 415), (1465, 400), 8) +
        # Roof — slightly higher than sedan for SUV proportions
        [(1465, 400), (1160, 382)] +
        bezier_points((1160, 382), (1080, 376), (1000, 374), (920, 372), 8) +
        [(920, 372), (740, 378)] +
        # A-pillar
        bezier_points((740, 378), (688, 384), (638, 400), (595, 420), 8) +
        # Windshield
        [(595, 420), (310, 450)] +
        [(310, 450), (280, 600)] +
        [(280, 600), (262, 600)]
    )

    windshield = (
        [(602, 424), (318, 454), (328, 448), (1085, 435)] +
        bezier_points((1085, 435), (1088, 415), (1086, 398), (1078, 382), 8) +
        [(1078, 382), (750, 382)] +
        bezier_points((750, 382), (700, 386), (650, 404), (602, 424), 8)
    )

    side_window = [
        (1090, 432), (1082, 388), (1155, 385), (1460, 405), (1510, 475), (1115, 448)
    ]

    headlight = [(250, 585), (280, 528), (330, 518), (322, 592)]

    # Rear hatch / taillight hint
    taillight = [(1515, 528), (1518, 480), (1510, 468), (1502, 475), (1508, 520)]

    wheels = [
        {"cx": 400, "cy": gy - 72, "r_tire": 70, "r_rim": 46, "r_hub": 13},
        {"cx": 1340, "cy": gy - 74, "r_tire": 72, "r_rim": 48, "r_hub": 13},
    ]

    return {
        "body": lower_body,
        "windows": [windshield, side_window],
        "details": [headlight, taillight],
        "hood_quad": hood,
        "wheels": wheels,
        "ground_y": gy,
        "accent_y": gy - 5,
    }


def vehicle_sports_sedan():
    """Mid-grade sports sedan (BMW 3 / Audi A4 class). Front 3/4 view.
    Key: LOW roofline, steep windshield rake, visible trunk taper."""
    gy = 820

    # Hood — large and prominent, the star of the show
    hood = [(340, 500), (1080, 485), (1100, 625), (310, 636)]

    lower_body = (
        [(290, 636)] +
        # Front fender curve
        bezier_points((290, 636), (278, 660), (275, 690), (280, 715), 10) +
        [(280, 715), (290, gy - 58)] +
        # Front wheel arch
        arc_points(415, gy - 58, 122, 58, 180, 0, 18) +
        [(537, gy - 58), (550, 715)] +
        # Rocker panel
        [(550, 698), (1190, 686)] +
        # Rear wheel approach
        [(1190, 686), (1210, gy - 60)] +
        # Rear wheel arch
        arc_points(1335, gy - 60, 124, 60, 180, 0, 18) +
        [(1459, gy - 60), (1472, 686)] +
        # Rear quarter — tapers inward and up
        bezier_points((1472, 686), (1485, 650), (1490, 615), (1488, 580), 10) +
        # Trunk rear wall
        [(1488, 580), (1480, 540)] +
        # Trunk lid — visible notchback below roof
        bezier_points((1480, 540), (1470, 518), (1450, 502), (1420, 495), 8) +
        # Rear window / C-pillar slope
        bezier_points((1420, 495), (1360, 482), (1280, 472), (1200, 468), 8) +
        # Roof — low, flat, sleek
        [(1200, 468), (950, 460)] +
        bezier_points((950, 460), (880, 458), (810, 458), (740, 462), 8) +
        # A-pillar — steep rake
        bezier_points((740, 462), (690, 468), (645, 478), (605, 494), 8) +
        # Windshield to hood
        [(605, 494), (340, 500)] +
        [(340, 500), (310, 636)] +
        [(310, 636), (290, 636)]
    )

    # Windshield — narrow band, steep
    windshield = (
        [(612, 498), (348, 504), (358, 500), (1085, 488)] +
        bezier_points((1085, 488), (1090, 480), (1088, 474), (1080, 468), 8) +
        [(1080, 468), (750, 466)] +
        bezier_points((750, 466), (700, 470), (652, 482), (612, 498), 8)
    )

    # Side windows — low profile
    side_window = [
        (1090, 486), (1085, 472), (1195, 470), (1415, 498), (1478, 545), (1120, 500)
    ]

    headlight = [(282, 620), (310, 560), (360, 548), (350, 628)]
    taillight = [(1485, 575), (1488, 545), (1480, 535), (1472, 540), (1478, 568)]

    wheels = [
        {"cx": 415, "cy": gy - 58, "r_tire": 56, "r_rim": 40, "r_hub": 11},
        {"cx": 1335, "cy": gy - 60, "r_tire": 58, "r_rim": 42, "r_hub": 11},
    ]

    return {
        "body": lower_body,
        "windows": [windshield, side_window],
        "details": [headlight, taillight],
        "hood_quad": hood,
        "wheels": wheels,
        "ground_y": gy,
        "accent_y": gy - 5,
    }


# ── Shopify API ────────────────────────────────────────────────────

def fetch_all_products():
    query = """query($first:Int!,$after:String){products(first:$first,after:$after){edges{node{handle title images(first:1){edges{node{url}}}}}pageInfo{hasNextPage endCursor}}}"""
    all_p, after = [], None
    while True:
        r = requests.post(STOREFRONT_URL, headers={"Content-Type":"application/json","X-Shopify-Storefront-Access-Token":STOREFRONT_TOKEN},
                          json={"query":query,"variables":{"first":50,"after":after}})
        d = r.json().get("data",{}).get("products",{})
        for e in d.get("edges",[]):
            n=e["node"]; imgs=[x["node"]["url"] for x in n.get("images",{}).get("edges",[])]
            all_p.append({"handle":n["handle"],"title":n["title"],"images":imgs})
        pi=d.get("pageInfo",{})
        if pi.get("hasNextPage") and pi.get("endCursor"): after=pi["endCursor"]
        else: break
    return all_p

def match_products(products):
    result={}
    for n in NATIONS:
        kw=CODE_TO_TITLE.get(n["code"],n["name"]).lower()
        for p in products:
            if kw in p["title"].lower(): result[n["code"]]=p; break
    return result

def download_image(url, cache_dir):
    h=hashlib.md5(url.encode()).hexdigest(); cp=cache_dir/f"{h}.png"
    if cp.exists(): return Image.open(cp).convert("RGBA")
    try:
        r=requests.get(url,timeout=15); r.raise_for_status()
        img=Image.open(BytesIO(r.content)).convert("RGBA"); img.save(cp); return img
    except: return None


# ── Perspective Transform ──────────────────────────────────────────

def find_coeffs(src, dst):
    matrix=[]
    for s,d in zip(src,dst):
        matrix.append([d[0],d[1],1,0,0,0,-s[0]*d[0],-s[0]*d[1]])
        matrix.append([0,0,0,d[0],d[1],1,-s[1]*d[0],-s[1]*d[1]])
    A=np.matrix(matrix,dtype=np.float64)
    B=np.array([s for p in src for s in p],dtype=np.float64)
    return np.linalg.solve(A,B).tolist()

def warp_image(img, dst_quad, canvas_size):
    w,h=img.size
    src=[(0,0),(w,0),(w,h),(0,h)]
    c=find_coeffs(src,list(dst_quad))
    return img.transform(canvas_size,Image.PERSPECTIVE,c,Image.BICUBIC,fillcolor=(0,0,0,0))

def dominant_color(img):
    s=img.resize((40,40),Image.LANCZOS)
    px=[(r,g,b) for r,g,b,a in s.getdata() if a>128 and 80<r+g+b<680]
    if not px: return (255,77,0)
    return (sum(c[0] for c in px)//len(px), sum(c[1] for c in px)//len(px), sum(c[2] for c in px)//len(px))


# ── Rendering ──────────────────────────────────────────────────────

# Color palette
BODY_COLOR = (16, 16, 18)          # Near-black car body
BODY_HIGHLIGHT = (28, 28, 32)      # Body edge highlight
BODY_EDGE = (35, 35, 40)           # Panel line
WINDOW_COLOR = (10, 12, 18)        # Dark tinted windows
WINDOW_REFLECT = (22, 26, 38)      # Window reflection
CHROME = (55, 55, 60)              # Chrome/metal trim
TIRE_COLOR = (14, 14, 16)          # Tires
RIM_COLOR = (30, 30, 35)           # Wheel rims
RIM_EDGE = (50, 50, 58)            # Rim detail
ACCENT = (255, 77, 0)              # Orange accent


def draw_background(w, h, gy, glow_color):
    bg = Image.new("RGBA", (w, h), (5, 5, 7, 255))
    draw = ImageDraw.Draw(bg)

    # Floor gradient
    for y in range(gy, h):
        t = (y - gy) / max(1, h - gy)
        v = int(9 + 5 * (1 - t))
        draw.line([(0, y), (w, y)], fill=(v, v, v+1, 255))

    # Floor line
    draw.line([(0, gy), (w, gy)], fill=(22, 22, 25), width=1)

    # Ambient glow
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gcx, gcy = w // 2, int(gy * 0.6)
    for i in range(1, 160):
        r = 160 - i
        rx, ry = r*5, r*3
        a = max(1, int(6 * i / 160))
        gr = min(255, int(glow_color[0] * 0.12))
        gg = min(255, int(glow_color[1] * 0.12))
        gb = min(255, int(glow_color[2] * 0.12))
        x0, y0, x1, y1 = gcx-rx, gcy-ry, gcx+rx, gcy+ry
        if x1>x0 and y1>y0:
            gd.ellipse([x0,y0,x1,y1], fill=(gr,gg,gb,a))
    bg = Image.alpha_composite(bg, glow)
    return bg


def draw_wheel(draw, cx, cy, r_tire, r_rim, r_hub):
    """Draw a detailed wheel."""
    # Tire
    draw.ellipse([cx-r_tire, cy-r_tire, cx+r_tire, cy+r_tire],
                 fill=TIRE_COLOR, outline=(20,20,22))
    # Rim
    draw.ellipse([cx-r_rim, cy-r_rim, cx+r_rim, cy+r_rim],
                 fill=RIM_COLOR, outline=RIM_EDGE)
    # Spoke hints (5 spokes)
    for i in range(5):
        angle = math.radians(i * 72 - 18)
        sx = cx + int(r_hub * 1.2 * math.cos(angle))
        sy = cy + int(r_hub * 1.2 * math.sin(angle))
        ex = cx + int(r_rim * 0.85 * math.cos(angle))
        ey = cy + int(r_rim * 0.85 * math.sin(angle))
        draw.line([(sx,sy),(ex,ey)], fill=RIM_EDGE, width=2)
    # Hub cap
    draw.ellipse([cx-r_hub, cy-r_hub, cx+r_hub, cy+r_hub],
                 fill=(40,40,46), outline=(55,55,62))
    # Center dot
    draw.ellipse([cx-3, cy-3, cx+3, cy+3], fill=(50,50,56))


def draw_vehicle_body(canvas, veh):
    """Render the full vehicle silhouette with surface detail."""
    draw = ImageDraw.Draw(canvas)

    body = veh["body"]
    hood = veh["hood_quad"]
    gy = veh["ground_y"]

    # ── 1. Main body fill ────────────────────────────────
    if len(body) >= 3:
        draw.polygon(body, fill=BODY_COLOR)

    # ── 2. Upper body panel shading (lighter above belt line) ──
    # Belt line runs roughly at the bottom of the hood quad + offset
    belt_y = (hood[2][1] + hood[3][1]) // 2 + 30
    # Create a slightly lighter upper panel
    upper_panel = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    up_draw = ImageDraw.Draw(upper_panel)
    # Upper panel polygon: top of body to belt line
    up_pts = []
    for p in body:
        if p[1] <= belt_y + 20:
            up_pts.append(p)
    if len(up_pts) >= 3:
        up_draw.polygon(up_pts, fill=(22, 22, 26, 80))
    canvas = Image.alpha_composite(canvas, upper_panel)
    draw = ImageDraw.Draw(canvas)

    # ── 3. Character / shoulder line ─────────────────────
    # Prominent horizontal crease that defines the body shape
    char_y = belt_y - 5
    draw.line([(hood[3][0] - 10, char_y + 5), (1520, char_y - 15)],
              fill=(40, 40, 46), width=2)
    # Highlight just above the character line
    draw.line([(hood[3][0] - 10, char_y + 3), (1520, char_y - 17)],
              fill=(32, 32, 38), width=1)

    # ── 4. Fender crown highlights ───────────────────────
    fender_overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    fd = ImageDraw.Draw(fender_overlay)
    for wh in veh.get("wheels", []):
        cx, cy = wh["cx"], wh["cy"]
        rt = wh["r_tire"]
        # Arch highlight above wheel
        for i in range(1, 20):
            r = 20 - i
            a = max(1, int(5 * i / 20))
            rx, ry = rt + 25 + r, int(rt * 0.6) + r
            x0, y0, x1, y1 = cx - rx, cy - ry, cx + rx, cy - int(ry * 0.3)
            if x1 > x0 and y1 > y0:
                fd.ellipse([x0, y0, x1, y1], fill=(28, 28, 33, a))
    canvas = Image.alpha_composite(canvas, fender_overlay)
    draw = ImageDraw.Draw(canvas)

    # ── 5. Lower body panel line ─────────────────────────
    lower_y = belt_y + 40
    draw.line([(hood[3][0] + 20, lower_y + 3), (1480, lower_y - 10)],
              fill=(12, 12, 14), width=1)

    # ── 6. Edge highlights on body outline ───────────────
    if len(body) >= 3:
        for i in range(len(body) - 1):
            draw.line([body[i], body[i + 1]], fill=BODY_HIGHLIGHT, width=1)

    # ── 7. Windows ───────────────────────────────────────
    for win in veh.get("windows", []):
        if len(win) >= 3:
            draw.polygon(win, fill=WINDOW_COLOR)
            # Diagonal reflection streak across glass
            if len(win) > 3:
                # Reflection: line from ~25% to ~75% of window
                q1 = len(win) // 4
                q3 = 3 * len(win) // 4
                draw.line([win[q1], win[q3]], fill=WINDOW_REFLECT, width=1)

    # Window chrome trim
    for win in veh.get("windows", []):
        if len(win) >= 3:
            for i in range(len(win) - 1):
                draw.line([win[i], win[i + 1]], fill=CHROME, width=1)

    # ── 8. Details (headlights, grille, bumper, taillights) ──
    for detail in veh.get("details", []):
        if len(detail) >= 3:
            draw.polygon(detail, fill=(45, 45, 55, 255))
            for i in range(len(detail) - 1):
                draw.line([detail[i], detail[i + 1]], fill=(65, 65, 75), width=1)

    # ── 9. Headlight glow ────────────────────────────────
    if veh.get("details"):
        hl = veh["details"][0]
        if len(hl) >= 3:
            hcx = sum(p[0] for p in hl) // len(hl)
            hcy = sum(p[1] for p in hl) // len(hl)
            glow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
            gd = ImageDraw.Draw(glow)
            for i in range(1, 40):
                r = 40 - i
                a = max(1, int(10 * i / 40))
                x0, y0, x1, y1 = hcx - r * 3, hcy - r, hcx + r * 3, hcy + r
                if x1 > x0 and y1 > y0:
                    gd.ellipse([x0, y0, x1, y1], fill=(220, 225, 245, a))
            canvas = Image.alpha_composite(canvas, glow)

    # ── 10. Wheels ───────────────────────────────────────
    draw2 = ImageDraw.Draw(canvas)
    for wh in veh.get("wheels", []):
        draw_wheel(draw2, wh["cx"], wh["cy"], wh["r_tire"], wh["r_rim"], wh["r_hub"])

    # ── 11. Accent line under front bumper ───────────────
    ay = veh.get("accent_y", gy - 5)
    glow2 = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    gd2 = ImageDraw.Draw(glow2)
    gd2.line([(200, ay), (700, ay + 5)], fill=ACCENT + (60,), width=8)
    glow2 = glow2.filter(ImageFilter.GaussianBlur(5))
    canvas = Image.alpha_composite(canvas, glow2)
    draw3 = ImageDraw.Draw(canvas)
    draw3.line([(200, ay), (700, ay + 5)], fill=ACCENT + (180,), width=2)

    # ── 12. Roof edge highlight ──────────────────────────
    # Catches studio light on the roof crown
    roof_pts = [(p[0], p[1]) for p in body if p[1] <= belt_y - 60]
    if len(roof_pts) >= 2:
        roof_pts.sort(key=lambda p: p[0])
        for i in range(len(roof_pts) - 1):
            draw3.line([roof_pts[i], roof_pts[i + 1]], fill=(38, 38, 44), width=1)

    return canvas


def add_hood_product(canvas, product_img, hood_quad):
    """Perspective-warp product image onto the hood."""
    warped = warp_image(product_img, hood_quad, (W, H))
    # Boost
    warped = ImageEnhance.Contrast(warped).enhance(1.15)
    warped = ImageEnhance.Color(warped).enhance(1.1)
    canvas = Image.alpha_composite(canvas, warped)

    # Specular highlight
    overlay = Image.new("RGBA", (W, H), (0,0,0,0))
    od = ImageDraw.Draw(overlay)
    cx = sum(p[0] for p in hood_quad) // 4
    cy = sum(p[1] for p in hood_quad) // 4
    for i in range(1, 50):
        r = 50 - i
        rx, ry = max(1, r*4), max(1, r*2)
        a = max(1, int(3 * i / 50))
        x0,y0,x1,y1 = cx-rx, cy-ry, cx+rx, cy+ry
        if x1>x0 and y1>y0:
            od.ellipse([x0,y0,x1,y1], fill=(255,255,255,a))
    canvas = Image.alpha_composite(canvas, overlay)
    return canvas


def add_reflection(canvas, gy):
    strip_h = min(80, H - gy - 5)
    if strip_h <= 5: return canvas
    strip = canvas.crop((0, gy - strip_h, W, gy))
    ref = strip.transpose(Image.FLIP_TOP_BOTTOM)
    r,g,b,a = ref.split()
    a = a.point(lambda x: int(x * 0.06))
    ref = Image.merge("RGBA", (r,g,b,a)).filter(ImageFilter.GaussianBlur(5))
    canvas.paste(ref, (0, gy + 2), ref)
    return canvas


def add_text(canvas, nation_name, gy, font_path=None):
    draw = ImageDraw.Draw(canvas)
    tx, ty = 80, gy + 40

    try:
        if font_path:
            fs = ImageFont.truetype(font_path, 12)
            bold = font_path.replace("segoeui","segoeuib").replace("Regular","Bold")
            fl = ImageFont.truetype(bold if os.path.exists(bold) else font_path, 36)
        else:
            fs = fl = ImageFont.load_default()
    except:
        fs = fl = ImageFont.load_default()

    draw.text((tx, ty), "HOOD'D", fill=ACCENT + (200,), font=fs)
    draw.text((tx, ty + 16), nation_name.upper(), fill=(255,255,255,235), font=fl)
    draw.text((tx, ty + 58), "JERSEY LINE  |  HOOD COVER", fill=(70,70,75,200), font=fs)


def render(product_img, nation_name, vehicle_fn, font_path=None):
    """Full render pipeline."""
    veh = vehicle_fn()
    gc = dominant_color(product_img)

    canvas = draw_background(W, H, veh["ground_y"], gc)
    canvas = draw_vehicle_body(canvas, veh)
    canvas = add_hood_product(canvas, product_img, veh["hood_quad"])
    canvas = add_reflection(canvas, veh["ground_y"])
    add_text(canvas, nation_name, veh["ground_y"], font_path)

    return canvas.convert("RGB")


# ── Composition Assignment ─────────────────────────────────────────
# Which vehicle(s) each nation gets

def get_vehicle_assignments(code):
    """
    Returns list of (suffix, vehicle_fn, label) for the nation.
    - US/CA/MX: truck + sedan (+ extra for top 5/8)
    - Rest of world: sedan default, SUV as extra variant
    """
    assignments = []

    if code in NORTH_AMERICA:
        # Always get a truck render first
        assignments.append(("", vehicle_pickup_truck, "Pickup Truck"))
        assignments.append(("_sedan", vehicle_sports_sedan, "Sports Sedan"))
    else:
        # Default is sports sedan
        assignments.append(("", vehicle_sports_sedan, "Sports Sedan"))

    # Top 5 get 3 extra = all 3 vehicle types
    if code in TOP_5:
        if code not in NORTH_AMERICA:
            assignments.append(("_suv", vehicle_compact_suv, "Compact SUV"))
            assignments.append(("_truck", vehicle_pickup_truck, "Pickup Truck"))
        else:
            assignments.append(("_suv", vehicle_compact_suv, "Compact SUV"))
        # Extra overhead-style (we reuse sedan but it's another angle conceptually)

    # Top 8 extra get 1 extra
    elif code in TOP_8_EXTRA:
        if code not in NORTH_AMERICA:
            assignments.append(("_suv", vehicle_compact_suv, "Compact SUV"))
        else:
            assignments.append(("_suv", vehicle_compact_suv, "Compact SUV"))

    # Everyone else who isn't NA gets an SUV variant IF they're in the top 8
    # (already handled above)

    # Rest-of-world base nations: just sedan (1 render)
    # But add SUV for variety if not already assigned
    if code not in NORTH_AMERICA and code not in TOP_5 and code not in TOP_8_EXTRA:
        # Single sedan render only
        pass

    return assignments


# ── Main ───────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="./renders")
    parser.add_argument("--cache", default="./.image-cache")
    parser.add_argument("--font", default=None)
    parser.add_argument("--only", default=None)
    parser.add_argument("--start", type=int, default=0)
    parser.add_argument("--count", type=int, default=999)
    args = parser.parse_args()

    out = Path(args.output); out.mkdir(parents=True, exist_ok=True)
    cache = Path(args.cache); cache.mkdir(parents=True, exist_ok=True)

    font = args.font
    if not font:
        for c in ["C:/Windows/Fonts/segoeui.ttf"]:
            if os.path.exists(c): font = c; break

    print("=" * 60)
    print("  HOODD Mockup Render Pipeline v3 — Real Vehicles")
    print("=" * 60)

    print("[1/4] Fetching products...")
    products = fetch_all_products()
    print(f"       {len(products)} products")

    print("[2/4] Matching nations...")
    np_map = match_products(products)
    print(f"       {len(np_map)}/48 matched")

    print("[3/4] Loading images...")
    images = {}
    for code, prod in np_map.items():
        if prod["images"]:
            img = download_image(prod["images"][0], cache)
            if img: images[code] = img
    print(f"       {len(images)} ready")

    print("[4/4] Rendering...")
    count = 0
    sl = NATIONS[args.start:args.start + args.count]

    for nation in sl:
        code, name = nation["code"], nation["name"]
        if args.only and code != args.only: continue
        if code not in images:
            print(f"  SKIP {code}"); continue

        assignments = get_vehicle_assignments(code)

        for suffix, veh_fn, label in assignments:
            fname = f"{code}{suffix}.png"
            try:
                result = render(images[code], name, veh_fn, font)
                result.save(out / fname, "PNG", optimize=True)
                count += 1
                print(f"  OK {fname:40s} [{label}]")
            except Exception as e:
                print(f"  ERR {fname} - {e}")

    print(f"\nDone! {count} renders -> {out.resolve()}")

if __name__ == "__main__":
    main()
