# Hood'd Design Pipeline v6

Multi-line design generator for all 48 World Cup 2026 nations.

## Quick Start

```bash
cd pipeline-v6
pip install openai pillow python-dotenv requests numpy

# Test with 2 nations, dry run (no API calls)
python generate_designs.py --nations USA,Brazil --dry-run

# Generate artsy line for USA only
python generate_designs.py --nations USA --lines artsy

# Generate all lines for Tier 1 nations (16 biggest markets)
python generate_designs.py

# Generate all 48 nations
python generate_designs.py --all

# Fix existing Printkk positioning (re-prep v5 uploads)
python upload_to_printkk.py --reprocess-existing --source-dir "D:\HoodD_Project_Migration\hoodd-images\upscaled"
```

## Design Lines

| Line | Description | Tier 1 | Tier 2 |
|------|-------------|--------|--------|
| artsy | Psychedelic abstract flowing paint | ✓ | ✓ |
| concept | Motorsport livery / chrome racing | ✓ | |
| flag_flow | National flag as liquid paint art | ✓ | ✓ |
| cultural | Cultural landmark panoramic | ✓ | |
| jersey | Athletic geometric textile pattern | ✓ | ✓ |
| retro | Vintage era tribute art | ✓ | |

## Output Structure

```
designs-v6/
  us/
    us_artsy_print.png      # 12800x9600 @ 200 DPI (archive/print)
    us_artsy_printkk.png    # 9448x7086 (upload to Printkk directly)
    us_artsy_preview.jpg    # 1280x960 (web preview)
  br/
    ...
  manifest.json
```

## Printkk Upload Fix

The v5 pipeline uploaded designs at default scale, leaving dead space.
The `upload_to_printkk.py` script pre-scales artwork to fill the entire
Printkk surface (9448x7086) so default placement has zero margins.
