# Mexico Social Media Reel — Build Handoff

## What's Ready

All scripts and assets are in:
```
C:\Dev\hooddshop\social-media-posts\output\mexico\SOCIAL POSTS\
```

### Assets (already in folder)
| File | What it is |
|------|-----------|
| `meetup_cinematic_sedan_gemini_1777472314.png` | Anchor image — Challenger with Mexico hood wrap, night meetup |
| `Mexico_home.png` | Home design — dark green/red diagonal stripes, "MÉXICO" |
| `Mexico_away.png` | Away design — green/white diagonal stripes, "MEXICO" |
| `Mexico_flag.png` | Flag design — black/green/red angular, "MÉXICO" |
| `Mexico_abbrev.png` | Abbreviation design — "MEX" tricolor (available but not used in reel) |
| `endcard_ar_v3.png` | Old Argentina endcard (being replaced) |

### Scripts (already in folder)
| Script | Purpose |
|--------|---------|
| `create_endcard_mexico.py` | Generates `endcard_mx_v1.png` — 1080×1920 Mexico-branded CTA card |
| `create_reel.py` | Stitches all frames into `mexico_reel_9x16.mp4` |

---

## Step-by-Step

### 1. Install dependencies (if not already)
```powershell
pip install Pillow moviepy numpy
```
ffmpeg must be on PATH. If not:
```powershell
winget install ffmpeg
```

### 2. Generate the Mexico endcard
```powershell
cd "C:\Dev\hooddshop\social-media-posts\output\mexico\SOCIAL POSTS"
python create_endcard_mexico.py
```
**Output:** `endcard_mx_v1.png` (1080×1920)

Review it — if the layout needs tweaks, the script is self-contained PIL code. Key things to adjust:
- Font sizes (lines ~100-110)
- Mockup size and positioning (line ~140)
- CTA text wording (line ~130, currently "YOUR RIDE. YOUR FLAG!")
- Colors are defined at top of file

### 3. (Optional) Add store screenshot
Take a screenshot of hooddshop.com showing Mexico products. Save as:
```
hooddshop_store.png
```
in the same SOCIAL POSTS folder. If you skip this, use `--no-store` in step 4.

### 4. Build the video reel
```powershell
# Without store screenshot, no music:
python create_reel.py --no-store

# With store screenshot, no music:
python create_reel.py

# With music:
python create_reel.py --music "C:\path\to\track.mp3"

# With store + music:
python create_reel.py --music "C:\path\to\track.mp3"
```
**Output:** `mexico_reel_9x16.mp4` (~21 seconds, 1080×1920)

---

## Reel Sequence

| # | Frame | Duration | Source |
|---|-------|----------|--------|
| 1 | Cinematic Challenger (anchor) | 4s | `meetup_cinematic_sedan_gemini_1777472314.png` |
| 2 | hooddshop.com store | 3s | `hooddshop_store.png` (optional) |
| 3 | Mexico Home design | 3s | `Mexico_home.png` |
| 4 | Mexico Away design | 3s | `Mexico_away.png` |
| 5 | Mexico Flag design | 3s | `Mexico_flag.png` |
| 6 | CTA endcard | 5s | `endcard_mx_v1.png` |

Total: ~21s (or ~18s without store frame)
Crossfade transitions: 0.5s between each slide

---

## Music Notes

You need a royalty-free track. Good options:
- Latin/Mexican-flavored beat, energetic, 15-30s
- Search "Mexican trap beat" or "Latin car meet instrumental" on:
  - YouTube Audio Library (free)
  - Epidemic Sound
  - Artlist
  - Pixabay Music (free)
- Keep it instrumental — vocals compete with the visuals

---

## Platform Upload Specs

| Platform | Aspect Ratio | Max Length | Format |
|----------|-------------|-----------|--------|
| Instagram Reels | 9:16 | 90s | MP4, H.264 |
| TikTok | 9:16 | 10min | MP4, H.264 |
| Facebook Reels | 9:16 | 90s | MP4, H.264 |

The output MP4 is already correct for all three platforms.

---

## What to Revisit in Next Session

When sandbox is back up, Claude can:
1. Run and iterate on the endcard design live
2. Capture hooddshop.com screenshot automatically
3. Render the video and verify quality
4. Add Ken Burns (slow zoom/pan) effects to each frame
5. Generate endcards for other nations by templating this script
6. Batch-produce reels for all 48 nations
