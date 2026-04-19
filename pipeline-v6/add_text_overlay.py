#!/usr/bin/env python3
"""
Hood'd Pipeline v6 — Smart Text Overlay Tool v4

Text that BECOMES PART OF THE DESIGN — not stamped on top.

Core technique: text is filled with a contrast-boosted crop of the design itself,
then outlined with a vibrant palette color for legibility. The result looks like
the text was designed as part of the artwork.

v4 fixes from v3:
  - NO MORE BORING WHITE — uses vibrant palette colors (reds, blues, golds)
  - Design-clip is the PRIMARY fill — text reveals boosted design through letterforms
  - Stroke in vibrant contrasting palette color, not generic white/black
  - Placement centered (not biased low causing bottom clipping)
  - Bolder speed lines and accent elements
"""

import argparse
import math
import os
import sys
from pathlib import Path
from typing import Tuple, List, Dict

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops, ImageEnhance

Image.MAX_IMAGE_PIXELS = 200_000_000

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

OUTPUT_WIDTH = 9448
OUTPUT_HEIGHT = 7086
SAFE_ZONE_PCT = 0.15


def load_font(size, style="bold"):
    candidates = []
    if style == "bold":
        candidates = [
            "C:/Windows/Fonts/BebasNeue-Regular.ttf",
            "C:/Windows/Fonts/BebasNeue-Bold.ttf",
            "C:/Windows/Fonts/BEBASNEUE-REGULAR.TTF",
            "C:/Windows/Fonts/impact.ttf",
            "C:/Windows/Fonts/GOTHIC.TTF",
            "C:/Windows/Fonts/ariblk.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        ]
    elif style == "condensed":
        candidates = [
            "C:/Windows/Fonts/BebasNeue-Regular.ttf",
            "C:/Windows/Fonts/FRAMDCN.TTF",
            "C:/Windows/Fonts/impact.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


# ---------------------------------------------------------------------------
# Design analysis
# ---------------------------------------------------------------------------

def extract_palette(img, n_colors=8):
    small = img.copy().resize((150, 100)).convert("RGB")
    quantized = small.quantize(colors=n_colors, method=Image.Quantize.MEDIANCUT)
    pal = quantized.getpalette()
    colors = []
    for i in range(n_colors):
        colors.append((pal[i*3], pal[i*3+1], pal[i*3+2]))
    return colors


def luminance(c):
    return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]


def saturation(c):
    mx = max(c)
    mn = min(c)
    if mx == 0:
        return 0.0
    return (mx - mn) / mx


def contrast_ratio(c1, c2):
    def rl(c):
        vals = []
        for v in c:
            v = v / 255.0
            vals.append(v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4)
        return 0.2126 * vals[0] + 0.7152 * vals[1] + 0.0722 * vals[2]
    l1, l2 = rl(c1), rl(c2)
    lighter, darker = max(l1, l2), min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)


def detect_dominant_angle(img):
    small = img.convert("L").resize((200, 150))
    arr = np.array(small, dtype=np.float64)
    sx = np.array([[-1,0,1],[-2,0,2],[-1,0,1]], dtype=np.float64)
    sy = np.array([[-1,-2,-1],[0,0,0],[1,2,1]], dtype=np.float64)
    h, w = arr.shape
    gx = np.zeros_like(arr)
    gy = np.zeros_like(arr)
    for y in range(1, h-1):
        for x in range(1, w-1):
            patch = arr[y-1:y+2, x-1:x+2]
            gx[y,x] = np.sum(patch * sx)
            gy[y,x] = np.sum(patch * sy)
    mag = np.sqrt(gx**2 + gy**2)
    thr = np.percentile(mag, 75)
    strong = mag > thr
    angles = np.arctan2(gy[strong], gx[strong])
    edge_a = angles + np.pi / 2
    if len(edge_a) == 0:
        return 0.0
    d = 2 * edge_a
    ms = np.mean(np.sin(d))
    mc = np.mean(np.cos(d))
    dom = np.arctan2(ms, mc) / 2
    deg = math.degrees(dom)
    deg = max(-45, min(45, deg))
    if abs(deg) < 5:
        return 0.0
    return deg


def classify_design_style(img):
    small = img.convert("RGB").resize((200, 150))
    gray = small.convert("L")
    ag = np.array(gray, dtype=np.float64)
    ar = np.array(small, dtype=np.float64)
    sx = np.array([[-1,0,1],[-2,0,2],[-1,0,1]], dtype=np.float64)
    sy = np.array([[-1,-2,-1],[0,0,0],[1,2,1]], dtype=np.float64)
    h, w = ag.shape
    gx = np.zeros_like(ag)
    gy = np.zeros_like(ag)
    for y in range(1, h-1):
        for x in range(1, w-1):
            patch = ag[y-1:y+2, x-1:x+2]
            gx[y,x] = np.sum(patch * sx)
            gy[y,x] = np.sum(patch * sy)
    mag = np.sqrt(gx**2 + gy**2)
    mn = mag / (mag.max() + 1e-8)
    strong_edges = float(np.mean(mn > 0.3))
    thr = np.percentile(mag, 75)
    sm = mag > thr
    if np.sum(sm) > 10:
        angles = np.arctan2(gy[sm], gx[sm])
        ea = angles + np.pi / 2
        d2 = 2 * ea
        ms = np.mean(np.sin(d2))
        mc = np.mean(np.cos(d2))
        ac = float(np.sqrt(ms**2 + mc**2))
    else:
        ac = 0.0
    bs = 10
    lvs = []
    for by in range(0, h-bs, bs):
        for bx in range(0, w-bs, bs):
            block = ar[by:by+bs, bx:bx+bs]
            lvs.append(np.var(block))
    lvs = np.array(lvs)
    flat = float(np.mean(lvs < 200))
    grad = float(np.mean((lvs >= 200) & (lvs < 2000)))
    text = float(np.mean(lvs > 2000))
    hg = grad > 0.3
    it = text > 0.15
    if ac > 0.5 and strong_edges > 0.08 and flat > 0.3:
        style = "geometric"
    elif hg and ac > 0.3:
        style = "chrome"
    elif it:
        style = "textured"
    else:
        style = "mixed"
    return {"style": style, "edge_strength": strong_edges, "angle_coherence": ac,
            "color_block_ratio": flat, "has_gradients": hg, "is_textured": it}



# ---------------------------------------------------------------------------
# Color selection — VIBRANT, not boring
# ---------------------------------------------------------------------------

def pick_vibrant_fill(palette, bg_avg):
    """
    Pick the most VIBRANT, SATURATED color from the palette for text fill.
    NOT the highest contrast — the most visually exciting color.
    Falls back to high-contrast only if nothing saturated exists.
    """
    best = None
    best_score = 0
    for color in palette:
        sat = saturation(color)
        bright = max(color) / 255.0
        cr = contrast_ratio(color, bg_avg)
        # Score: heavy weight on saturation and brightness, minimum contrast threshold
        if cr < 1.8:
            continue  # Skip if basically invisible
        score = sat * 3.0 + bright * 1.5 + min(cr / 5.0, 1.5)
        if score > best_score:
            best_score = score
            best = color

    if best is None:
        # Fallback: just pick highest contrast
        best = max(palette, key=lambda c: contrast_ratio(c, bg_avg))
    return best


def pick_vibrant_stroke(palette, fill_color, bg_avg):
    """
    Pick a stroke color that:
    1. Contrasts with the fill (so text is legible)
    2. Is itself a vibrant palette color (not generic black/white)
    3. Falls back to near-black or near-white only if palette has nothing
    """
    best = None
    best_score = 0
    for color in palette:
        if color == fill_color:
            continue
        cr_fill = contrast_ratio(color, fill_color)
        cr_bg = contrast_ratio(color, bg_avg)
        sat = saturation(color)
        if cr_fill < 2.0:
            continue  # Must be visible against fill
        # Prefer saturated palette colors for stroke too
        score = cr_fill * 2.0 + sat * 2.0 + cr_bg * 0.5
        if score > best_score:
            best_score = score
            best = color

    if best is None:
        # Fallback: dark or light based on fill luminance
        lum = luminance(fill_color)
        if lum > 128:
            # Dark stroke — try to find the darkest palette color
            darkest = min(palette, key=lambda c: luminance(c))
            if contrast_ratio(darkest, fill_color) > 2.0:
                return darkest
            return (20, 20, 40)
        else:
            lightest = max(palette, key=lambda c: luminance(c))
            if contrast_ratio(lightest, fill_color) > 2.0:
                return lightest
            return (240, 240, 255)
    return best


def pick_accent_color(palette, fill_color, stroke_color):
    """Pick the most eye-catching color for speed lines — different from fill and stroke."""
    best = None
    best_vib = 0
    for color in palette:
        if color == fill_color or color == stroke_color:
            continue
        sat = saturation(color)
        bright = max(color) / 255.0
        vib = sat * bright
        if vib > best_vib:
            best_vib = vib
            best = color
    return best if best else fill_color


def get_region_avg_color(img, cx, cy, rw, rh):
    iw, ih = img.size
    x1 = max(0, cx - rw // 2)
    y1 = max(0, cy - rh // 2)
    x2 = min(iw, cx + rw // 2)
    y2 = min(ih, cy + rh // 2)
    region = img.crop((x1, y1, x2, y2)).resize((10, 10))
    arr = np.array(region.convert("RGB"))
    avg = arr.mean(axis=(0, 1))
    return (int(avg[0]), int(avg[1]), int(avg[2]))


# ---------------------------------------------------------------------------
# Design-aware placement + sizing
# ---------------------------------------------------------------------------

def find_optimal_text_region(img, is_abbreviation, text, angle_deg):
    """
    Scan the safe zone for the largest low-variance region where text fits
    naturally.  Returns (cx, cy, recommended_font_size, letter_spacing).

    Strategy:
      1. Downsample to analysis resolution (~400×300)
      2. Compute a local-variance map using sliding blocks
      3. For each candidate text height (from large to small), sweep the
         safe zone looking for a horizontal band that has enough calm area
         to hold text at that height.  The first height that finds a good
         placement wins — so we get the largest text the design can hold.
      4. Enforce product-visibility minimums: abbreviations >= 20% of h,
         full names >= 10% of h (readable from 6-10 m on a 120 cm hood).
    """
    w, h = img.size

    # Safe zone boundaries in full-res coords
    sl = int(w * SAFE_ZONE_PCT)
    sr = int(w * (1 - SAFE_ZONE_PCT))
    st_ = int(h * SAFE_ZONE_PCT)
    sb = int(h * (1 - SAFE_ZONE_PCT))
    safe_w = sr - sl
    safe_h = sb - st_

    # --- Analysis at reduced resolution ---
    ANALYSIS_W, ANALYSIS_H = 400, 300
    scale_x = ANALYSIS_W / w
    scale_y = ANALYSIS_H / h
    small = np.array(img.convert("RGB").resize((ANALYSIS_W, ANALYSIS_H)), dtype=np.float64)

    # Local variance map: block size = ~4% of analysis height
    bsz = max(4, int(ANALYSIS_H * 0.04))
    var_map = np.zeros((ANALYSIS_H, ANALYSIS_W), dtype=np.float64)
    for y in range(0, ANALYSIS_H - bsz, bsz // 2):
        for x in range(0, ANALYSIS_W - bsz, bsz // 2):
            block = small[y:y+bsz, x:x+bsz]
            v = np.var(block)
            var_map[y:y+bsz, x:x+bsz] = np.maximum(var_map[y:y+bsz, x:x+bsz], v)

    # Threshold: "calm" pixels have variance below median
    var_threshold = np.percentile(var_map, 55)

    # Safe zone in analysis coords
    a_sl = int(sl * scale_x)
    a_sr = int(sr * scale_x)
    a_st = int(st_ * scale_y)
    a_sb = int(sb * scale_y)

    # --- Candidate text heights (full-res pixels), from large to small ---
    if is_abbreviation:
        # 3-letter codes: try 35% down to 18%
        min_pct, max_pct = 0.20, 0.38
    else:
        # Full names: try 18% down to 8%
        min_pct, max_pct = 0.10, 0.20
        if len(text) > 14:
            max_pct = 0.14
        elif len(text) > 10:
            max_pct = 0.16

    # Step through sizes, largest first
    best_result = None
    size_steps = 12
    for step in range(size_steps):
        pct = max_pct - (max_pct - min_pct) * step / (size_steps - 1)
        candidate_h = int(h * pct)

        # Approximate text width based on character count + spacing
        if is_abbreviation:
            approx_w = int(candidate_h * len(text) * 0.85)
        else:
            approx_w = int(candidate_h * len(text) * 0.55)

        # Skip if text is wider than safe zone (even at this height)
        if approx_w > int(safe_w * 0.88):
            continue

        # Convert to analysis coords
        a_ch = max(3, int(candidate_h * scale_y))
        a_cw = max(5, int(approx_w * scale_x))

        # Sweep the safe zone in analysis coords looking for a calm band
        best_score = -1
        best_pos = None
        step_y = max(1, a_ch // 4)
        step_x = max(1, a_cw // 6)

        for ay in range(a_st, a_sb - a_ch, step_y):
            for ax in range(a_sl, a_sr - a_cw, step_x):
                region_var = var_map[ay:ay+a_ch, ax:ax+a_cw]
                calm_ratio = float(np.mean(region_var < var_threshold))

                # Bonus for being near center (prefer centered placement)
                center_y = (ay + a_ch / 2) / ANALYSIS_H
                center_x = (ax + a_cw / 2) / ANALYSIS_W
                center_bonus = 1.0 - 0.3 * abs(center_y - 0.5) - 0.15 * abs(center_x - 0.5)

                score = calm_ratio * center_bonus
                if score > best_score:
                    best_score = score
                    best_pos = (ax, ay)

        # Accept if at least 40% of the region is calm
        if best_pos is not None and best_score > 0.35:
            ax, ay = best_pos
            # Convert back to full-res center
            cx = int((ax + a_cw / 2) / scale_x)
            cy = int((ay + a_ch / 2) / scale_y)
            # Clamp to safe zone
            half_w = approx_w // 2 + 50
            half_h = candidate_h // 2 + 50
            cx = max(sl + half_w, min(sr - half_w, cx))
            cy = max(st_ + half_h, min(sb - half_h, cy))
            best_result = (cx, cy, candidate_h, pct, best_score)
            break  # Take the largest size that fits

    # Fallback: if no calm region found, use center with minimum size
    if best_result is None:
        cx = sl + safe_w // 2
        cy = st_ + safe_h // 2
        candidate_h = int(h * min_pct)
        best_result = (cx, cy, candidate_h, min_pct, 0.0)

    cx, cy, text_height, pct, score = best_result

    # --- Convert text_height to font_size and letter_spacing ---
    # Font size ≈ text_height (Bebas Neue is cap-height dominant)
    font_size = text_height
    if is_abbreviation:
        letter_spacing = int(font_size * 0.22)
    else:
        letter_spacing = int(font_size * 0.12)

    print(f"    Region scan: size={pct*100:.1f}%h ({text_height}px) | "
          f"calm_score={score:.2f} | center=({cx},{cy})")

    return cx, cy, font_size, letter_spacing



# ---------------------------------------------------------------------------
# Text mask + outline
# ---------------------------------------------------------------------------

def create_text_mask(text, font, letter_spacing):
    tmp = ImageDraw.Draw(Image.new("L", (1, 1)))
    total_w = 0
    cws = []
    for i, ch in enumerate(text):
        bb = tmp.textbbox((0, 0), ch, font=font)
        cw = bb[2] - bb[0]
        cws.append(cw)
        total_w += cw + (letter_spacing if i < len(text) - 1 else 0)
    bb_ref = tmp.textbbox((0, 0), "A", font=font)
    th = bb_ref[3] - bb_ref[1]
    pad = 30
    mask = Image.new("L", (total_w + pad * 2, th + pad * 2), 0)
    draw = ImageDraw.Draw(mask)
    xc = pad
    for i, ch in enumerate(text):
        draw.text((xc, pad), ch, font=font, fill=255)
        xc += cws[i] + (letter_spacing if i < len(text) - 1 else 0)
    return mask, total_w, th, cws


def create_outline_mask(text_mask, width):
    expanded = text_mask.copy()
    for _ in range(width):
        expanded = expanded.filter(ImageFilter.MaxFilter(3))
    outline = ImageChops.subtract(expanded, text_mask)
    return outline, expanded


# ---------------------------------------------------------------------------
# Accent rendering
# ---------------------------------------------------------------------------

def render_speed_lines(size, angle, accent_color, tcx, tcy, tw, th, style_info):
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)

    ar = math.radians(angle)
    ca = math.cos(ar)
    sa = math.sin(ar)

    # BOLDER lines than v3
    if style_info["style"] == "geometric":
        num = 10
        lw_base = max(5, th // 15)
        ll_base = int(tw * 0.7)
        gap = th // 5
    elif style_info["style"] == "chrome":
        num = 7
        lw_base = max(6, th // 12)
        ll_base = int(tw * 0.9)
        gap = th // 3
    else:
        num = 8
        lw_base = max(4, th // 16)
        ll_base = int(tw * 0.6)
        gap = th // 4

    half = num // 2
    for i in range(num):
        po = (i - half) * gap
        lm = 0.4 + 0.6 * (1 - abs(i - half) / (half + 1))
        ll = int(ll_base * lm)
        lw = max(3, int(lw_base * lm))

        # Lines extend from BOTH sides of text for balance
        for direction in [1, -1]:
            sx = tcx + int(tw * 0.52 * ca * direction) - int(po * sa)
            sy = tcy + int(tw * 0.52 * sa * direction) + int(po * ca)
            ex = sx + int(ll * ca * direction)
            ey = sy + int(ll * sa * direction)
            alpha = int(200 * lm)
            draw.line([(sx, sy), (ex, ey)], fill=(*accent_color, alpha), width=lw)

    layer = layer.filter(ImageFilter.GaussianBlur(radius=2))
    return layer


def render_geometric_slash(size, angle, accent_color, tcx, tcy, tw, th):
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)

    # Two slashes at different angles for dynamic energy
    for offset_angle, alpha, width_mult in [(25, 120, 1.0), (-15, 80, 0.6)]:
        sa = angle + offset_angle
        sr = math.radians(sa)
        cs = math.cos(sr)
        ss = math.sin(sr)

        sl = int(tw * 1.5)
        sw = max(8, int(th // 6 * width_mult))
        hl = sl // 2
        hw = sw // 2

        p1 = (tcx - hl*cs - hw*ss, tcy - hl*ss + hw*cs)
        p2 = (tcx + hl*cs - hw*ss, tcy + hl*ss + hw*cs)
        p3 = (tcx + hl*cs + hw*ss, tcy + hl*ss - hw*cs)
        p4 = (tcx - hl*cs + hw*ss, tcy - hl*ss - hw*cs)

        draw.polygon([p1, p2, p3, p4], fill=(*accent_color, alpha))

        # Parallel accent lines
        for sign, la in [(-1, 60), (1, 40)]:
            o = sign * sw * 2.5
            op1 = (p1[0] - o*ss, p1[1] + o*cs)
            op2 = (p2[0] - o*ss, p2[1] + o*cs)
            draw.line([op1, op2], fill=(*accent_color, la), width=max(3, sw // 3))

    return layer



# ---------------------------------------------------------------------------
# Main text renderer
# ---------------------------------------------------------------------------

def render_styled_text(canvas, text, is_abbreviation):
    """
    v4: Text that MATCHES the design.

    Layer stack (bottom to top):
    1. Deep shadow for depth
    2. Geometric slash accents (if applicable)
    3. Speed lines in accent color
    4. THICK stroke in vibrant palette color (legibility)
    5. Design-clipped fill (text reveals boosted design — THIS IS THE STAR)
    6. Thin inner glow in accent color for extra pop

    NO solid white/gray fill. The design IS the fill.
    """
    canvas = canvas.convert("RGBA")
    w, h = canvas.size

    palette = extract_palette(canvas, n_colors=8)
    angle = detect_dominant_angle(canvas)
    style_info = classify_design_style(canvas)

    print(f"    Style: {style_info['style']} | Angle: {angle:+.1f} | "
          f"Edges: {style_info['edge_strength']:.2f} | "
          f"Coherence: {style_info['angle_coherence']:.2f}")

    # --- Design-aware sizing: find the best region FIRST, then size to fit ---
    cx, cy, base_size, letter_spacing = find_optimal_text_region(
        canvas, is_abbreviation, text, angle
    )
    font = load_font(base_size, "bold")
    text_mask, total_w, text_h, cws = create_text_mask(text, font, letter_spacing)
    pad = 30

    # Safety clamp: if rendered text still exceeds safe zone, scale down
    safe_max_w = int(w * (1 - 2 * SAFE_ZONE_PCT) * 0.85)
    safe_max_h = int(h * (1 - 2 * SAFE_ZONE_PCT) * 0.60)
    if total_w > safe_max_w or text_h > safe_max_h:
        scale = min(safe_max_w / max(total_w, 1), safe_max_h / max(text_h, 1))
        base_size = int(base_size * scale)
        font = load_font(base_size, "bold")
        letter_spacing = int(letter_spacing * scale)
        text_mask, total_w, text_h, cws = create_text_mask(text, font, letter_spacing)

    # Re-clamp placement so text + padding stays in safe zone
    sl = int(w * SAFE_ZONE_PCT)
    sr = int(w * (1 - SAFE_ZONE_PCT))
    st_ = int(h * SAFE_ZONE_PCT)
    sb = int(h * (1 - SAFE_ZONE_PCT))
    half_tw = total_w // 2 + pad + 20
    half_th = text_h // 2 + pad + 20
    cx = max(sl + half_tw, min(sr - half_tw, cx))
    cy = max(st_ + half_th, min(sb - half_th, cy))

    # --- Colors: VIBRANT, from the design palette ---
    bg_avg = get_region_avg_color(canvas, cx, cy, total_w + 300, text_h + 300)
    fill_color = pick_vibrant_fill(palette, bg_avg)
    stroke_color = pick_vibrant_stroke(palette, fill_color, bg_avg)
    accent_color = pick_accent_color(palette, fill_color, stroke_color)

    print(f"    Fill: {fill_color} | Stroke: {stroke_color} | Accent: {accent_color}")

    # --- Composite canvas ---
    cp = max(total_w, text_h) + 500
    cs = (total_w + pad * 2 + cp, text_h + pad * 2 + cp)
    ccx = cs[0] // 2
    ccy = cs[1] // 2
    mx = ccx - text_mask.size[0] // 2
    my = ccy - text_mask.size[1] // 2

    # === LAYER 1: Deep shadow ===
    shadow = Image.new("RGBA", cs, (0, 0, 0, 0))
    so = max(8, base_size // 10)
    sf = Image.new("RGBA", text_mask.size, (0, 0, 0, 150))
    st = Image.new("RGBA", text_mask.size, (0, 0, 0, 0))
    st.paste(sf, (0, 0), text_mask)
    shadow.paste(st, (mx + so, my + so))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=so * 2))

    # === LAYER 2: THICK stroke in vibrant color ===
    stroke_w = max(8, base_size // 8)  # MUCH thicker than v3
    _, expanded = create_outline_mask(text_mask, stroke_w)
    stroke_layer = Image.new("RGBA", cs, (0, 0, 0, 0))
    sfill = Image.new("RGBA", expanded.size, (*stroke_color, 255))
    stemp = Image.new("RGBA", expanded.size, (0, 0, 0, 0))
    stemp.paste(sfill, (0, 0), expanded)
    stroke_layer.paste(stemp, (mx, my))

    # === LAYER 3: Design-clipped fill — THE STAR ===
    # Text reveals a contrast-boosted version of the design
    mask_w, mask_h = text_mask.size
    region_x1 = max(0, cx - mask_w // 2)
    region_y1 = max(0, cy - mask_h // 2)
    region_x2 = min(w, region_x1 + mask_w)
    region_y2 = min(h, region_y1 + mask_h)

    design_region = canvas.crop((region_x1, region_y1, region_x2, region_y2)).convert("RGBA")

    # AGGRESSIVELY boost the design for visibility inside text
    design_region = ImageEnhance.Contrast(design_region).enhance(2.0)
    design_region = ImageEnhance.Color(design_region).enhance(1.8)
    design_region = ImageEnhance.Brightness(design_region).enhance(1.4)

    # Pad if region is smaller than mask
    aw = region_x2 - region_x1
    ah = region_y2 - region_y1
    if aw != mask_w or ah != mask_h:
        padded = Image.new("RGBA", (mask_w, mask_h), (*fill_color, 255))
        padded.paste(design_region, (0, 0))
        design_region = padded

    clip_layer = Image.new("RGBA", cs, (0, 0, 0, 0))
    clipped = Image.new("RGBA", (mask_w, mask_h), (0, 0, 0, 0))
    clipped.paste(design_region, (0, 0), text_mask)
    clip_layer.paste(clipped, (mx, my))

    # === LAYER 4: Thin vibrant inner edge glow ===
    # A thin line of the fill color just inside the stroke for extra pop
    inner_glow_w = max(3, base_size // 25)
    _, inner_expanded = create_outline_mask(text_mask, inner_glow_w)
    inner_outline = ImageChops.subtract(inner_expanded, text_mask)
    glow_layer = Image.new("RGBA", cs, (0, 0, 0, 0))
    gfill = Image.new("RGBA", inner_outline.size, (*fill_color, 200))
    gtemp = Image.new("RGBA", inner_outline.size, (0, 0, 0, 0))
    gtemp.paste(gfill, (0, 0), inner_outline)
    glow_layer.paste(gtemp, (mx, my))

    # === LAYER 5: Speed lines ===
    speed = render_speed_lines(cs, angle, accent_color, ccx, ccy, total_w, text_h, style_info)

    # === LAYER 6: Geometric slash (angular designs) ===
    slash = None
    if style_info["angle_coherence"] > 0.35:
        slash = render_geometric_slash(cs, angle, accent_color, ccx, ccy, total_w, text_h)

    # --- Stack all layers ---
    comp = shadow.copy()
    if slash is not None:
        comp = Image.alpha_composite(comp, slash)
    comp = Image.alpha_composite(comp, speed)
    comp = Image.alpha_composite(comp, stroke_layer)
    comp = Image.alpha_composite(comp, clip_layer)
    comp = Image.alpha_composite(comp, glow_layer)

    # --- Rotate to match design flow ---
    if abs(angle) > 2:
        comp = comp.rotate(-angle, resample=Image.BICUBIC, expand=False,
                           center=(ccx, ccy))

    # --- Paste onto canvas ---
    px = cx - ccx
    py = cy - ccy
    full = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    sx1 = max(0, -px)
    sy1 = max(0, -py)
    dx1 = max(0, px)
    dy1 = max(0, py)
    cw = min(cs[0] - sx1, w - dx1)
    ch = min(cs[1] - sy1, h - dy1)
    if cw > 0 and ch > 0:
        region = comp.crop((sx1, sy1, sx1 + cw, sy1 + ch))
        full.paste(region, (dx1, dy1))