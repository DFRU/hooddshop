#!/usr/bin/env python3
"""
Mexico Endcard Generator
========================
Creates a Mexico-branded endcard matching the Argentina v3 layout style.
Outputs: endcard_mx_v1.png (1080x1920 for 9:16 vertical)

Usage:
    python create_endcard_mexico.py

Requires:
    pip install Pillow
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# ── Config ──────────────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent
OUTPUT_PATH = SCRIPT_DIR / "endcard_mx_v1.png"

# Mexico design images (in same folder)
DESIGN_FILES = {
    "HOME": SCRIPT_DIR / "Mexico_home.png",
    "AWAY": SCRIPT_DIR / "Mexico_away.png",
    "FLAG": SCRIPT_DIR / "Mexico_flag.png",
}

# Canvas dimensions (9:16 vertical for Reels/TikTok)
W, H = 1080, 1920

# Colors
BG_COLOR = (15, 15, 15)          # Near-black background
ACCENT_ORANGE = (232, 93, 26)     # Hood'd brand orange
WHITE = (255, 255, 255)
LIGHT_GRAY = (180, 180, 180)
DARK_GRAY = (40, 40, 40)
MX_GREEN = (0, 104, 71)          # Mexico green
MX_RED = (206, 17, 38)           # Mexico red

# ── Font helper ─────────────────────────────────────────────────────────────

def get_font(size, bold=False):
    """Try to load a good font, fall back to default."""
    font_candidates = [
        # Windows fonts
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/calibrib.ttf" if bold else "C:/Windows/Fonts/calibri.ttf",
        "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/impact.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for fp in font_candidates:
        try:
            return ImageFont.truetype(fp, size)
        except (IOError, OSError):
            continue
    return ImageFont.load_default()


def get_impact_font(size):
    """Get Impact or a heavy bold font for headlines."""
    heavy_fonts = [
        "C:/Windows/Fonts/impact.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/calibrib.ttf",
    ]
    for fp in heavy_fonts:
        try:
            return ImageFont.truetype(fp, size)
        except (IOError, OSError):
            continue
    return ImageFont.load_default()


# ── Drawing helpers ─────────────────────────────────────────────────────────

def draw_rounded_rect(draw, xy, radius, fill):
    """Draw a rounded rectangle."""
    x0, y0, x1, y1 = xy
    draw.rectangle([x0 + radius, y0, x1 - radius, y1], fill=fill)
    draw.rectangle([x0, y0 + radius, x1, y1 - radius], fill=fill)
    draw.pieslice([x0, y0, x0 + 2*radius, y0 + 2*radius], 180, 270, fill=fill)
    draw.pieslice([x1 - 2*radius, y0, x1, y0 + 2*radius], 270, 360, fill=fill)
    draw.pieslice([x0, y1 - 2*radius, x0 + 2*radius, y1], 90, 180, fill=fill)
    draw.pieslice([x1 - 2*radius, y1 - 2*radius, x1, y1], 0, 90, fill=fill)


def draw_diagonal_accent(img):
    """Draw subtle diagonal accent lines (matches Hood'd branding)."""
    draw = ImageDraw.Draw(img)
    # Orange diagonal accents in corners
    for offset in range(0, 200, 40):
        draw.line([(W - 200 + offset, 0), (W, offset)], fill=ACCENT_ORANGE, width=2)
        draw.line([(0, H - 200 + offset), (200 - offset, H)], fill=ACCENT_ORANGE, width=2)


def create_hood_mockup(design_path, size=(300, 220)):
    """Create a hood-shaped mockup from a flat design image.
    Crops to a trapezoidal hood shape and adds perspective feel."""
    design = Image.open(design_path).convert("RGBA")

    # Resize to fill the mockup area
    design = design.resize(size, Image.LANCZOS)

    # Create a trapezoidal mask (hood shape - wider at bottom, narrower at top)
    mask = Image.new("L", size, 0)
    mask_draw = ImageDraw.Draw(mask)
    w, h = size
    # Hood trapezoid: narrower at top (windshield), wider at bottom (front)
    inset_top = int(w * 0.12)
    points = [
        (inset_top, 0),           # top-left (inset)
        (w - inset_top, 0),       # top-right (inset)
        (w, h),                    # bottom-right (full width)
        (0, h),                    # bottom-left (full width)
    ]
    mask_draw.polygon(points, fill=255)

    # Apply mask
    result = Image.new("RGBA", size, (0, 0, 0, 0))
    result.paste(design, (0, 0), mask)

    # Add subtle border/shadow
    border_draw = ImageDraw.Draw(result)
    border_draw.polygon(points, outline=(80, 80, 80), width=2)

    return result


# ── Main endcard creation ───────────────────────────────────────────────────

def create_endcard():
    # Create canvas
    img = Image.new("RGB", (W, H), BG_COLOR)
    draw = ImageDraw.Draw(img)

    # Draw diagonal accent lines
    draw_diagonal_accent(img)

    # ── "WORLD CUP 2026" badge (top-left) ──
    badge_font = get_font(18, bold=True)
    badge_text = "WORLD CUP 2026"
    bbox = badge_font.getbbox(badge_text)
    badge_w = bbox[2] - bbox[0] + 24
    badge_h = bbox[3] - bbox[1] + 14
    draw_rounded_rect(draw, (40, 60, 40 + badge_w, 60 + badge_h), 4, ACCENT_ORANGE)
    draw.text((52, 64), badge_text, fill=WHITE, font=badge_font)

    # ── Main headline: "GET HOODD." ──
    y_cursor = 180
    headline_font = get_impact_font(110)
    draw.text((W // 2, y_cursor), "GET HOODD.", fill=WHITE, font=headline_font, anchor="mt")

    # ── Subtitle: "YOUR RIDE. YOUR FLAG." ──
    y_cursor += 130
    sub_font = get_impact_font(62)
    # "YOUR RIDE. " in white, "YOUR FLAG." in orange
    text_yr = "YOUR RIDE. "
    text_yf = "YOUR FLAG!"
    yr_bbox = sub_font.getbbox(text_yr)
    yf_bbox = sub_font.getbbox(text_yf)
    yr_w = yr_bbox[2] - yr_bbox[0]
    yf_w = yf_bbox[2] - yf_bbox[0]
    total_w = yr_w + yf_w
    start_x = (W - total_w) // 2
    draw.text((start_x, y_cursor), text_yr, fill=WHITE, font=sub_font)
    draw.text((start_x + yr_w, y_cursor), text_yf, fill=ACCENT_ORANGE, font=sub_font)

    # ── Mexico hood mockups (3 across) ──
    y_cursor += 120
    mockup_size = (300, 220)
    gap = 20
    total_mockup_w = 3 * mockup_size[0] + 2 * gap
    start_x = (W - total_mockup_w) // 2

    mockup_labels = list(DESIGN_FILES.keys())
    for i, (label, path) in enumerate(DESIGN_FILES.items()):
        if not path.exists():
            print(f"  [WARN] Missing design file: {path}")
            continue

        x = start_x + i * (mockup_size[0] + gap)
        mockup = create_hood_mockup(path, mockup_size)

        # Paste mockup (handle alpha)
        img.paste(mockup, (x, y_cursor), mockup)

    # ── Design labels under mockups ──
    y_cursor += mockup_size[1] + 15
    label_font = get_font(20, bold=True)
    labels_text = "MEXICO  ·  HOME  ·  AWAY  ·  FLAG"
    draw.text((W // 2, y_cursor), labels_text, fill=LIGHT_GRAY, font=label_font, anchor="mt")

    # ── hooddshop.com ──
    y_cursor += 70
    url_font = get_impact_font(56)
    draw.text((W // 2, y_cursor), "hooddshop.com", fill=WHITE, font=url_font, anchor="mt")

    # ── Divider line ──
    y_cursor += 80
    line_w = 600
    draw.line([(W // 2 - line_w // 2, y_cursor), (W // 2 + line_w // 2, y_cursor)],
              fill=(60, 60, 60), width=1)

    # ── Bottom info bar ──
    y_cursor += 30
    info_font = get_font(18, bold=True)
    info_text = "48 WORLD CUP NATIONS  •  MULTIPLE DESIGNS PER NATION  •  FROM $44.99 USD"
    draw.text((W // 2, y_cursor), info_text, fill=LIGHT_GRAY, font=info_font, anchor="mt")

    # ── Mexico flag color bar at very bottom ──
    bar_h = 6
    third = W // 3
    draw.rectangle([(0, H - bar_h), (third, H)], fill=MX_GREEN)
    draw.rectangle([(third, H - bar_h), (2 * third, H)], fill=WHITE)
    draw.rectangle([(2 * third, H - bar_h), (W, H)], fill=MX_RED)

    # Save
    img.save(str(OUTPUT_PATH), "PNG", quality=95)
    size_kb = OUTPUT_PATH.stat().st_size // 1024
    print(f"[OK] Saved endcard: {OUTPUT_PATH} ({size_kb}KB, {W}x{H})")
    return OUTPUT_PATH


if __name__ == "__main__":
    create_endcard()
