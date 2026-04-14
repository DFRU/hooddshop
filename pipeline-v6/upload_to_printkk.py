#!/usr/bin/env python3
"""
Hood'd Pipeline v6 — Printkk Upload Prep

Prepares design files for Printkk upload by ensuring they are sized to
FILL the entire Printkk print surface (9448x7086px) with zero dead space.

The previous pipeline uploaded at default scale, leaving margins.
This script creates upload-ready PNGs that fill the surface edge-to-edge.

Usage:
    python upload_to_printkk.py --input-dir ./designs-v6     # Prep all designs
    python upload_to_printkk.py --nations us,br,ar           # Specific nations
    python upload_to_printkk.py --reprocess-existing          # Fix existing v5 designs
    python upload_to_printkk.py --source-dir ../hoodd-images/upscaled  # Re-prep v5 uploads
"""

import argparse
import os
import sys
from pathlib import Path

from PIL import Image

Image.MAX_IMAGE_PIXELS = 200_000_000

# Printkk recommended surface dimensions
PRINTKK_W = 9448
PRINTKK_H = 7086


def prep_for_printkk(input_path, output_path, overshoot_pct=2):
    """
    Resize and crop the design to exactly fill the Printkk surface.

    overshoot_pct: Slightly oversizes the image so Printkk's default placement
    has zero dead space even with minor positioning drift. 2% is safe.
    """
    img = Image.open(input_path).convert("RGB")

    # Target with slight overshoot
    target_w = int(PRINTKK_W * (1 + overshoot_pct / 100))
    target_h = int(PRINTKK_H * (1 + overshoot_pct / 100))

    # Resize to cover (maintain aspect, crop excess)
    src_ratio = img.width / img.height
    target_ratio = target_w / target_h

    if src_ratio > target_ratio:
        # Source is wider — fit height, crop width
        new_h = target_h
        new_w = int(target_h * src_ratio)
    else:
        # Source is taller — fit width, crop height
        new_w = target_w
        new_h = int(target_w / src_ratio)

    img = img.resize((new_w, new_h), Image.LANCZOS)

    # Center crop to target
    left = (new_w - target_w) // 2
    top = (new_h - target_h) // 2
    img = img.crop((left, top, left + target_w, top + target_h))

    # Final resize to exact Printkk dims (in case of rounding)
    img = img.resize((PRINTKK_W, PRINTKK_H), Image.LANCZOS)

    img.save(output_path, "PNG")
    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    return size_mb


def main():
    parser = argparse.ArgumentParser(description="Prepare designs for Printkk upload")
    parser.add_argument("--input-dir", type=str, help="Directory with design PNGs")
    parser.add_argument("--output-dir", type=str, default="printkk-upload-ready",
                        help="Output directory for Printkk-ready files")
    parser.add_argument("--nations", type=str, help="Comma-separated nation codes to process")
    parser.add_argument("--reprocess-existing", action="store_true",
                        help="Reprocess the existing v5 jersey designs from hoodd-images/upscaled")
    parser.add_argument("--source-dir", type=str,
                        help="Source directory for --reprocess-existing")
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    files_to_process = []

    if args.reprocess_existing:
        # Fix the existing 48 jersey designs that were uploaded with bad positioning
        source = Path(args.source_dir) if args.source_dir else Path("../hoodd-images/upscaled")
        if not source.exists():
            print(f"ERROR: Source directory not found: {source}")
            sys.exit(1)

        for f in sorted(source.glob("*.png")):
            files_to_process.append(f)

    elif args.input_dir:
        input_dir = Path(args.input_dir)
        if not input_dir.exists():
            print(f"ERROR: Input directory not found: {input_dir}")
            sys.exit(1)

        # Find all print PNGs or printkk PNGs
        for f in sorted(input_dir.rglob("*_print.png")):
            if args.nations:
                codes = [c.strip() for c in args.nations.split(",")]
                if not any(f.stem.startswith(c + "_") for c in codes):
                    continue
            files_to_process.append(f)

        # Also check for direct PNGs (non-nested)
        if not files_to_process:
            for f in sorted(input_dir.glob("*.png")):
                files_to_process.append(f)

    if not files_to_process:
        print("No files to process. Use --input-dir or --reprocess-existing.")
        sys.exit(1)

    print(f"\nPreparing {len(files_to_process)} designs for Printkk upload")
    print(f"Target: {PRINTKK_W}x{PRINTKK_H}px (fills entire surface)")
    print(f"Output: {output_dir.resolve()}\n")

    for f in files_to_process:
        out_path = output_dir / f.name
        try:
            size_mb = prep_for_printkk(f, out_path)
            print(f"  ✓ {f.name} → {size_mb:.1f} MB")
        except Exception as e:
            print(f"  ✗ {f.name} — {e}")

    print(f"\nDone. Upload files from: {output_dir.resolve()}")
    print("On Printkk: Bulk Design → select all → product 5K14TS → create")


if __name__ == "__main__":
    main()
