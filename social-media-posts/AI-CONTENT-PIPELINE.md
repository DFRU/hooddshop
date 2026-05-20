# Hood'd Shop — AI Content Generation Pipeline

**Created:** 2026-04-29 | **Updated:** 2026-04-29 (v2 — hybrid real+AI structure)
**World Cup Kickoff:** June 11, 2026 — **43 days away**
**Opening Match:** Mexico vs South Africa, Estadio Azteca

---

## Constraints

| Constraint | Value |
|---|---|
| Time budget | Under 2 hours/week |
| Cash budget | $100–500/month |
| Production method | **Hybrid: real product footage intro + AI-generated scenes** |
| Physical samples | 1–2 in hand |
| Priority platforms | TikTok > Instagram Reels > Instagram Posts > YouTube Shorts |
| Accounts live | IG @hooddshopnow (1 post), YT @hooddshopnow (empty), FB Hood'd Shop (empty) |
| TikTok | Not yet created — must be done from phone |

---

## Signature Intro — The Real Footage Foundation

**All video content uses the same real-footage opening.** This is the Hood'd signature — viewers learn to recognize it, platforms classify the content as organic, and it only needs to be filmed once.

### The 2-Beat Real Intro

| Beat | Duration | Shot | Audio |
|---|---|---|---|
| **Beat 1 — "The Stretch"** | 2–3 sec | Close-up: hands stretching hood cover fabric onto a car hood. Design is hidden — camera stays tight on hands and fabric texture. The polyester-spandex catching light is the visual. | Fabric stretching sound, low ambient bass |
| **Beat 2 — "The Slam"** | 1–2 sec | Medium shot: hood slams shut from front angle. Cover is on but camera doesn't linger on the design — it's a flash. | Impact/bass drop synced to the slam |

After beat 2, a hard cut transitions into the AI-generated scene. The slam is the natural mask — the viewer's eye resets during the impact, so the shift from real to AI is invisible.

### Shot List — Film Once, Use Forever

Film all of these in one 15-minute session with your physical sample. Shoot in 9:16 vertical on your phone. Natural or garage lighting.

| Clip | Description | Duration | Notes |
|---|---|---|---|
| A | Close-up: hands unfolding the cover, stretching it toward the hood edge | 3 sec | Tight on hands + fabric. Do NOT show the printed design. |
| B | Close-up: hands smoothing fabric across the hood surface | 3 sec | Show the stretch/tension of the spandex — satisfying. |
| C | Medium: hood being lowered and slammed shut, front angle | 2 sec | Camera at hip height, hood fills the frame. Film a slow and a fast version. |
| D | Medium: hood slam from side angle | 2 sec | Backup angle for variety across posts. |
| E | Close-up: fabric texture and print quality detail | 3 sec | B-roll for end cards or standalone content. |
| F | Wide: you walking away from the car after install | 3 sec | Optional — for "behind the scenes" variants. |

**Storage:** Save all raw clips in a `real-footage/` folder on your phone. These get reused across every nation variant for months.

### Why This Structure Works

1. **Defeats AI detection.** Platforms see real-world footage at the start and classify the video as organic content. Pure AI videos are increasingly flagged and deprioritized.
2. **Creates a hook.** The hidden design in beats 1–2 creates genuine anticipation — viewers stick around to see which nation gets revealed.
3. **Builds brand recognition.** The stretch-and-slam becomes Hood'd's signature intro. Viewers start recognizing it within a week of consistent posting — this is how TikTok series build audiences.
4. **Reduces AI generation cost.** You only generate ~6–8 seconds of AI footage per video instead of 15. That's roughly 50–70 Kling credits per clip instead of 100–120.

---

## Tool Stack & Monthly Costs

### Already Owned — Image Generation (API keys in D:\HOODD\02_PIPELINES\.env)

| Tool | API Key | Best For | Incremental Cost |
|---|---|---|---|
| **Ideogram** | IDEOGRAM_API_KEY | Text-heavy content: countdown graphics, branded posts, collection wall. Best-in-class text rendering. | Existing sub |
| **Google Imagen 4.0** | GEMINI_API_KEY | Product beauty shots. Most accurate at depicting fabric hood covers (not paint). Best product realism. | Existing sub |
| **OpenAI DALL-E 3** | OPENAI_API_KEY | Cinematic scenes: meetup reveals, landmarks, night photography. Strong composition + dramatic lighting. | Existing sub |
| **FLUX (BFL)** | BFL_API_KEY | Top-tier photorealistic generation. Blocked from sandbox — run via local Python or imagine.art web UI. | Existing sub |

### Already Owned — Other

| Tool | Access | Purpose |
|---|---|---|
| **imagine.art Pro** | Web UI (expires May 6) | Video generation via Seedance 2 + general image gen. Use before expiry. |
| **CapCut** | Free app | Video editing, text overlays, music, transitions |
| **Claude** | Already running | Captions, hooks, hashtags, prompt iteration, API orchestration |
| **Google Drive** | MCP connected | Asset storage and organization |

### Still Recommended — Video Generation

| Tool | Purpose | Plan | Cost/mo |
|---|---|---|---|
| **Kling 3.0** | AI video generation for meetup/drive scenes | Pro — 3,000 credits/mo | $25.99 |

**Revised total new spend: $25.99/month** (down from $47.99). Image generation is fully covered by existing subscriptions. Only video gen requires a new tool — and imagine.art's Seedance 2 may cover this until May 6.

**Full budget allocation ($100–500/mo):**
- Kling Pro: $25.99
- Remaining $74–474: TikTok Spark Ads, Meta Ads, or Kling Premier upgrade

### Tool-to-Concept Mapping (Validated by Argentina Test)

| Concept | Primary Tool | Why |
|---|---|---|
| Meetup Reveal (key frame) | **DALL-E 3** | Best night scene composition, dramatic crowds, 9:16 vertical |
| Meetup Reveal (animation) | **Kling 3.0 img2vid** or **imagine.art Seedance 2** | Animate the DALL-E key frame |
| Match Day Drive (key frame) | **DALL-E 3** | City scenes, golden hour, POV composition |
| Nation Landmarks | **DALL-E 3** | Photorealistic landmark + car scenes |
| 43-Day Countdown | **Ideogram** | Crisp text rendering — "43 DAYS" + "ARGENTINA" + CTA all readable |
| Before/After Beauty Shot | **Imagen 4.0** | Most accurate fabric-cover depiction — clearly a cover, not a paint job |
| Collection Wall | **Ideogram** | Text + multiple flag designs in one composition |

### API Configuration

All keys are stored in `D:\HOODD\02_PIPELINES\.env`:
```
OPENAI_API_KEY=sk-pro...
GEMINI_API_KEY=AIzaSy...
IDEOGRAM_API_KEY=sCyYBN...
BFL_API_KEY=bfl_7I...
```

Python generation scripts are in `social-media-posts/test-argentina/` and can be parameterized for any nation.

### Credit Math — Kling 3.0 Pro (Hybrid Model)

- 3,000 credits/month
- **With hybrid structure, AI clips are only 6–8 seconds (beats 3+4), not 15:**
- 8-second 1080p video (no audio) = ~50–65 credits
- 8-second 1080p video (with audio) = ~70–95 credits
- **Usable output per month:** ~30–45 video clips (assuming 2–3 generations per keeper)
- **Effective weekly output:** 8–11 finished clips

The hybrid structure gives ~30% more videos per month from the same credit budget.

---

## Content Concepts — 6 Templatable Formats

All concepts are designed to be **nation-swappable** — generate once per format, then repeat across high-conversion nations by changing the flag/colors in the prompt.

### Priority Nations (generate these first)
Mexico, USA, Argentina, Brazil, England, France, Germany, Spain — then expand to all 48.

---

### CONCEPT 1: "The Meetup Reveal" (Hero Concept — Hybrid Real+AI)

**Format:** 12–15 sec hybrid video → TikTok / Reels / Shorts
**Structure:** Real intro (beats 1–2) → hard cut → AI scene (beats 3–4) → CTA (beat 5)
**Virality mechanic:** Real product tactility + anticipation + crowd reaction + dramatic reveal
**Template:** Beats 1–2 are identical every time. Swap beats 3–4 per nation.

#### Full Video Timeline

| Time | Beat | Source | What's on screen |
|---|---|---|---|
| 0:00–0:02 | 1 — The Stretch | **REAL** (Clip A or B) | Close-up: hands stretching the cover onto the hood. Design hidden. Text overlay: "They couldn't believe what pulled up..." |
| 0:02–0:04 | 2 — The Slam | **REAL** (Clip C) | Hood slams shut. Bass drop hits. Screen shakes or flash effect in CapCut. |
| 0:04–0:08 | 3 — The Scene | **AI** (Kling) | Car meetup: crowd notices something, turns in awe, moves toward camera. |
| 0:08–0:12 | 4 — The Reveal | **AI** (Kling) | Camera whips to show [NATION] flag on hood. Crowd surrounds the car. |
| 0:12–0:15 | 5 — CTA | **Text overlay** | "48 nations. $44.99. hooddshop.com" + HOODDSHIP code |

#### Kling 3.0 Prompt — Beats 3+4 Only (6–8 seconds)

```
Cinematic 9:16 vertical video, 8 seconds, nighttime car meetup in a dimly lit
urban parking lot. 5-6 diverse young adults in streetwear lean against modified
cars with underglow accent lighting — blue, purple, amber tones.

Something off-screen catches their attention. They all turn simultaneously, eyes
wide, moving toward camera with excitement and awe. Camera whips around 180
degrees to reveal: a glossy black [CAR MODEL] with a vivid [NATION NAME] flag
design stretched across the entire hood — [SPECIFIC FLAG COLORS DESCRIBED].
The colors pop under a single overhead spotlight.

The group crowds around the car, pointing, one person pulls out their phone to
film. Cinematic shallow depth of field. Cool color grading. Lens flare from
the spotlight. No text overlays.
```

#### Image-to-Video Variant (More Control)

For better flag accuracy, generate the reveal frame first in Midjourney:

```
A glossy black [CAR MODEL] in a dimly lit parking lot at night, hood facing
camera, with a vivid [NATION NAME] flag design — [SPECIFIC COLORS] — stretched
across the entire hood. Single overhead spotlight illuminating the hood. Young
adults in streetwear crowding around the car, one filming with a phone. Underglow
accent lights on neighboring cars. Cinematic, shallow depth of field. --ar 9:16
--v 6.1 --style raw
```

Then feed this image into Kling's img2vid mode with the motion prompt:
```
Camera slowly pushes in toward the car hood while people gesture excitedly around
it. One person raises their phone to film. Slight lens flare. 8 seconds.
```

#### Nation Variations

| Nation | Flag description in prompt | Car suggestion | Extra detail |
|---|---|---|---|
| Mexico | vivid green, white, and red vertical stripes with an eagle emblem centered | Black Dodge Charger | Green underglow on nearby cars |
| USA | bold red and white horizontal stripes with a blue canton of white stars | White Ford Mustang GT | Red/blue underglow |
| Argentina | sky blue and white horizontal stripes with a golden sun emblem | Black sedan | Sky blue underglow |
| Brazil | bright yellow diamond on green background with blue globe | Black VW Golf | Yellow underglow |
| England | white background with bold red cross of St. George | Black Range Rover | White underglow |
| France | blue, white, and red vertical stripes | Silver Peugeot 308 | Blue/red underglow |
| Germany | black, red, and gold horizontal stripes | Black BMW 3 Series | Gold underglow |
| Spain | red and gold horizontal stripes with coat of arms | Black SEAT Leon | Gold underglow |

#### CapCut Assembly Instructions

1. **Import Clip A or B** (the stretch) — trim to 2–3 seconds
2. **Import Clip C** (the slam) — trim to the impact moment, ~1 second
3. **Hard cut** immediately to the Kling-generated AI clip
4. **Audio:** Layer a bass-heavy beat. Sync the bass drop to the hood slam at 0:02–0:03. The beat carries across the real→AI transition and makes it feel seamless.
5. **Text overlays:**
   - 0:00: "They couldn't believe what pulled up..."
   - 0:12: "48 nations. $44.99"
   - 0:13: "hooddshop.com"
6. **Screen shake effect** on the slam frame (CapCut → Effects → Video Effects → Shake)
7. **Export:** 9:16, 1080x1920, MP4, no CapCut watermark

#### Estimated Cost Per Nation (Hybrid)
- AI portion: ~50–70 Kling credits (~$1.50–2.50)
- Midjourney key frame (if using img2vid): ~$0.50
- **Total: ~$2–3 per finished nation video**
- Real footage clips: $0 (filmed once, reused)

#### Time Per Nation
- Generate AI clip: 3 min (prompt + wait)
- CapCut assembly: 5 min (drag clips, sync audio, add text)
- Caption writing: 2 min
- **Total: ~10 min per nation variant**

---

### CONCEPT 2: "Match Day Drive" (Hybrid Real+AI — POV City Cruise)

**Format:** 12–15 sec hybrid video → TikTok / Reels / Shorts
**Structure:** Real intro (beats 1–2) → hard cut → AI driving POV (beats 3–4) → CTA
**Virality mechanic:** Real tactility → immersive POV → aspirational world-building
**Template:** Beats 1–2 identical. Swap city + nation in AI portion.

#### Full Video Timeline

| Time | Beat | Source | What's on screen |
|---|---|---|---|
| 0:00–0:02 | 1 — The Stretch | **REAL** (Clip A or B) | Close-up: hands stretching the cover on. Text: "POV: You pull up to the World Cup" |
| 0:02–0:04 | 2 — The Slam | **REAL** (Clip C) | Hood slams shut. Bass drop. |
| 0:04–0:12 | 3 — The Drive | **AI** (Kling) | POV driving through match-day city. Fans in the streets. Hood cover visible. Stadium ahead. |
| 0:12–0:15 | 4 — CTA | **Text overlay** | "Rep your nation. hooddshop.com" |

#### Kling 3.0 Prompt — Beat 3 Only (8 seconds)

```
Cinematic first-person driving POV, 9:16 vertical, 8 seconds. A car drives
through [CITY NAME] on a sunny World Cup match day. Fans wearing [NATION]
jerseys walk along sidewalks waving flags. [NATION] flags hang from balconies
and storefronts.

Camera angle: dashboard-level looking forward through windshield, the car's
hood prominently visible in the lower third of frame. The hood is covered with
a vivid [NATION] flag design — [SPECIFIC FLAG COLORS DESCRIBED].

A large modern soccer stadium is visible ahead in the distance. Golden hour
sunlight. Festive atmosphere. People crossing the street in celebration.
Clean cinematic color grading. No text overlays.
```

#### Variations

| Nation | City | Stadium/Landmark | Special detail |
|---|---|---|---|
| Mexico | Mexico City | Estadio Azteca | OPENING MATCH — June 11. Priority content. |
| USA | Miami | Hard Rock Stadium | Palm trees, beach vibe |
| USA | New York | MetLife Stadium | Manhattan skyline |
| Brazil | Rio de Janeiro | Christ the Redeemer glimpse | Samba street party |
| England | London | Wembley arch | Double-decker bus, pubs |
| France | Paris | Eiffel Tower | Café-lined streets |

#### CapCut Assembly

Same process as Concept 1: Clip A/B → Clip C (slam) → hard cut to AI → text overlays → export. Layer crowd/stadium ambience under a trending beat.

#### Cost: ~50–70 Kling credits per nation (~$1.50–2.50)
#### Time: ~10 min per nation

---

### CONCEPT 3: "Nation Landmarks" (AI Image Series)

**Format:** 1080x1080 or 1080x1350 AI-generated still images → IG Posts + carousel
**Virality mechanic:** National pride + visual wow + shareability in diaspora communities
**Template:** Swap landmark + nation + car

**Scene description:**
A sleek car with the nation's flag hood cover parked dramatically in front of that nation's most iconic landmark. Golden hour. Cinematic composition.

**Midjourney Prompt Template:**
```
A [CAR MODEL] with a vivid [NATION] flag design stretched across the entire
car hood, parked in front of [LANDMARK], [CITY]. Golden hour sunlight casting
long shadows. The car is centered in frame, hood facing the viewer. The flag
design on the hood is crisp and colorful — [describe specific flag colors].
Clean, modern photography style, shallow depth of field, the landmark softly
in focus behind. --ar 4:5 --v 6.1 --style raw
```

**Nation → Landmark pairings:**
| Nation | Landmark | Car suggestion |
|---|---|---|
| Mexico | Palacio de Bellas Artes, Mexico City | Black Dodge Charger |
| USA | Statue of Liberty, NYC | White Ford Mustang |
| Argentina | La Bombonera, Buenos Aires | Black sedan |
| Brazil | Christ the Redeemer, Rio | Black VW Golf |
| England | Big Ben, London | Black Range Rover |
| France | Eiffel Tower, Paris | Silver Peugeot 308 |
| Germany | Brandenburg Gate, Berlin | Black BMW 3 Series |
| Spain | Sagrada Familia, Barcelona | Black SEAT Leon |

**Post-production:**
- Add subtle Hood'd Shop watermark (bottom corner)
- Caption from CAPTIONS.md with nation-specific hashtags

**Estimated cost:** ~$0.50–1.00 per image (Midjourney Basic = 200 images/mo)
**Time:** ~5 min per nation (prompt + upscale + download)

---

### CONCEPT 4: "43-Day Countdown" (Daily Hero Shots)

**Format:** 10-sec AI video OR dramatic still → daily post across all platforms
**Virality mechanic:** Daily content drumbeat + urgency + FOMO + collectibility
**Template:** One nation per day, countdown number prominent

**This is your content backbone — it guarantees daily posting with minimal effort.**

**Production method:** Mix of Kling video (for top-8 nations) and Midjourney stills (for remaining 35 nations). This keeps costs manageable.

**Kling Prompt (video version — top 8 nations):**
```
Dramatic 9:16 vertical video, 5 seconds. A large bold number "[DAYS LEFT]"
appears floating in a dark environment, then shatters/explodes to reveal
a car with the [NATION] flag hood cover, spinning slowly on a turntable
under dramatic studio lighting. The flag colors [DESCRIBE COLORS] are vivid
and saturated. Smoke or haze drifts at ground level. Premium product
showcase feel. Clean black background.
```

**Midjourney Prompt (still version — other 35 nations):**
```
Bold typography "[DAYS LEFT]" overlaid on a dramatic shot of a car hood
covered with the [NATION] flag design, studio lighting, dark background,
smoke at ground level, premium product photography, the number is large
and metallic gold. --ar 9:16 --v 6.1 --style raw
```

**Posting template:**
```
[DAYS LEFT] days until World Cup 2026.

[NATION FLAG EMOJI] [NATION NAME] is ready. Are you?

48 nations. $44.99. Free shipping: HOODDSHIP
hooddshop.com

#WorldCup2026 #Countdown #[Nation] #HoodCover #HooddShop #WC2026
```

**Cost for full 43-day run:**
- 8 videos × ~100 credits = 800 Kling credits
- 35 stills × ~1 Midjourney generation = 35 Midjourney credits
- Total: ~$15–20 for the entire countdown series

**Time:** Batch-generate in 2 sessions (~45 min each). Schedule posts daily.

---

### CONCEPT 5: "Before/After Transformation" (Hybrid Real+AI)

**Format:** 8–10 sec hybrid video → TikTok / Reels / Shorts
**Structure:** Real stretch+slam intro → AI "after" beauty shot → CTA
**Virality mechanic:** Real product demo + satisfying transformation + "that's it?"
**Template:** Beats 1–2 identical. AI beauty shot swaps per nation.

This concept leans hardest into the real footage — it's essentially a product demo that transitions into a cinematic hero shot.

#### Full Video Timeline

| Time | Beat | Source | What's on screen |
|---|---|---|---|
| 0:00–0:03 | 1 — The Stretch | **REAL** (Clip A+B combo) | Hands stretching cover on. Text: "One upgrade. Zero tools." |
| 0:03–0:04 | 2 — The Slam | **REAL** (Clip C) | Slam. Flash transition. |
| 0:04–0:08 | 3 — The Beauty Shot | **AI** (Kling or Midjourney) | The car now sits in dramatic lighting, hood cover vivid and perfect. Slow cinematic push-in. |
| 0:08–0:10 | 4 — CTA | **Text overlay** | "$44.99 | Free shipping: HOODDSHIP | hooddshop.com" |

#### Kling Prompt — Beat 3 (4–5 seconds)

```
Cinematic 9:16 vertical video, 5 seconds. A glossy black [CAR MODEL] in a
clean driveway or parking area, dramatic sunlight breaking through clouds.
The hood is covered with a vivid [NATION] flag design — [SPECIFIC COLORS].
Camera slowly pushes in toward the hood, showing fabric texture and color
detail. The car looks transformed and premium. Shallow depth of field.
Clean, modern automotive photography feel.
```

#### Post-production
1. Use the real clips slightly longer here (show both the unfold AND the smooth)
2. The slam acts as the "before/after" divider
3. Satisfying "whoosh" or impact sound synced to the slam
4. Works especially well with trending "glow-up" audio formats on TikTok

#### Cost: ~40–55 Kling credits per nation (shorter AI clip)
#### Time: ~8 min per nation

---

### CONCEPT 6: "The Collection Wall" (Product Catalog Flex)

**Format:** 1080x1080 AI still → IG Post (single or carousel)
**Virality mechanic:** Completionism + "which one is yours?" engagement bait
**Template:** Generate once, can make regional variants

**Midjourney Prompt:**
```
A dramatic studio wall display showing 8 car hood covers pinned/mounted
on a dark gallery wall, each one a different nation's flag design. From left
to right: Mexico (green-white-red), USA (red-white-blue stars and stripes),
Argentina (sky blue and white), Brazil (yellow and green), England (white
with red cross), France (blue-white-red), Germany (black-red-gold),
Spain (red and gold). Gallery lighting, each cover lit by its own spotlight.
Premium retail display feel. Concrete floor. --ar 1:1 --v 6.1 --style raw
```

**Caption:**
```
8 down. 40 to go. Which nation are you?

Drop your flag in the comments.

$44.99 each | Free shipping: HOODDSHIP | hooddshop.com

#WorldCup2026 #HoodCover #RepYourNation #48Nations #HooddShop
```

**Cost:** ~$0.50 per image
**Time:** ~5 min

---

## Weekly Production Workflow

**Total time: ~90 minutes/week** (within your under-2-hours constraint)

### Sunday — Batch Session (60 min)

| Min | Task |
|---|---|
| 0–15 | Generate 7 countdown posts for the week (Midjourney stills or Kling shorts) |
| 15–30 | Generate AI portions (beats 3+4) for 2 Meetup Reveal or Match Day Drive videos |
| 30–45 | Generate 1 Before/After AI beauty shot + 1 Landmark still |
| 45–55 | **CapCut assembly:** Combine real intro clips + AI clips for each video. Add hooks, text, music, sync bass drop to slam. |
| 55–60 | Write/adapt captions for all posts (use Claude for speed) |

**Output from Sunday session:** ~10–11 content pieces for the week
**Kling credits used:** ~150–250 (well within weekly budget of ~750)

### Wednesday — Quick Top-Up (30 min)

| Min | Task |
|---|---|
| 0–10 | Check which posts performed best; generate 1–2 more in that format |
| 10–20 | Generate 1 "Collection Wall" or engagement-bait post |
| 20–30 | Reply to comments, follow relevant accounts, engage with WC content |

### Daily — Posting (5 min/day)

Post 1–2 pre-made pieces from your batch. Cross-post to all platforms.

| Time | Platform | Content |
|---|---|---|
| 12 PM ET | TikTok + IG Reels + YT Shorts | Video of the day |
| 6 PM ET | IG Posts | Countdown image or Landmark still |

---

## Monthly Cost Projection

### Minimum Viable ($26/mo) — NEW, down from $48
- Kling Pro: $25.99
- Image gen: $0 (existing Ideogram + DALL-E + Imagen 4.0 + FLUX subs)
- **Output:** ~30–45 hybrid videos + unlimited images = ~75+ pieces/month

### Recommended ($100/mo)
- Kling Pro: $25.99
- TikTok Spark Ads (boost top performer weekly): $75
- **Output:** ~30–45 hybrid videos + unlimited images + paid reach

### Aggressive ($300/mo)
- Kling Premier: $64.99
- TikTok Spark Ads: $125
- Meta Ads (IG Reels boost): $110
- **Output:** ~70+ hybrid videos + unlimited images + multi-platform paid amplification

*Image generation costs are effectively $0 incremental — all covered by existing API subscriptions.*

---

## Cross-Posting Checklist

Every piece of video content gets posted to all 4 platforms. Stills go to IG + Facebook.

| Step | Action | Time |
|---|---|---|
| 1 | Export from CapCut as 9:16 1080x1920 MP4 (no watermark) | — |
| 2 | Post to TikTok with TikTok-optimized caption + hashtags | 2 min |
| 3 | Post same video to Instagram Reels with IG caption | 2 min |
| 4 | Post same video to YouTube Shorts with YT description | 2 min |
| 5 | Post still frame to IG feed if applicable | 1 min |
| 6 | Share to Facebook page | 1 min |

---

## Immediate Action Items (This Week)

### Dan — Manual (phone required)

**Priority 1 — Do this first (unlocks entire pipeline):**

1. **Film the Signature Intro clips (15 min).** Use your physical sample and any car. See the "Shot List — Film Once, Use Forever" section above. You need clips A through E minimum. Film in 9:16 vertical. Save raw files in a `real-footage/` folder on your phone. This is the single most important action — all video content depends on these clips.

**Priority 2 — Account setup:**

2. **Create TikTok account** — @hooddshopnow, Business Account, follow setup in TIKTOK-CONTENT-KIT.md Step 1
3. **Sign up for Kling 3.0 Pro** — klingai.com, $25.99/month
4. **Sign up for Midjourney Basic** — midjourney.com, $10/month

**Priority 3 — Optional bonus footage:**

5. **Film 2–3 extra real clips** if you have time:
   - Pulling the cover off (easy removal demo)
   - Walking up to the car from a distance (the "walk-up" reveal)
   - You holding the folded cover, showing how compact it is

### Claude — Can Generate Now

1. Full caption set for all 6 concept formats × 8 priority nations = 48 captions
2. Hashtag research per nation (diaspora-targeted hashtags)
3. Weekly posting calendar pre-filled for next 6 weeks
4. Prompt refinement after first Kling test outputs

---

## Key Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| AI-generated content looks obviously fake | Audience trust drops | **Mitigated by hybrid structure.** Real footage intro grounds every video in reality. AI portion is shorter and mostly background/crowd scenes. Use Kling's img2vid mode with Midjourney key frames for flag accuracy. |
| TikTok deprioritizes AI content | Lower organic reach | **Largely mitigated.** The real-footage intro means platforms classify videos as organic. The signature stretch-and-slam is genuinely filmed content. If TikTok cracks down further, increase the real portion (add walk-up shots, voiceover). |
| Copyright strike on national imagery | Content removed | Hood covers use original designs inspired by national colors — not official FIFA or federation marks. State "inspired by" not "official." |
| Kling output quality inconsistent | Wasted credits | Generate in batches; keep the best 1 of every 3; use img2vid mode for more control. The real intro also means a mediocre AI clip is less damaging — the first 4 seconds already hooked the viewer. |
| Under-2-hour time budget too tight | Content volume drops | The hybrid model helps: film real clips once (15 min total), then all weekly effort goes to AI generation + CapCut assembly. Countdown series covers daily posting; hero concepts only need 2/week. |
| Real footage clips feel repetitive | Viewers notice same intro | Film multiple angles (A, B, C, D) and rotate them. After 2–3 weeks, film a fresh set with a different car or location for variety. |

---

## Prompt Optimization Tips

1. **Image-to-video is more controllable than text-to-video.** Generate the "key frame" (the reveal shot with hood cover clearly visible) in Midjourney first, then feed that image into Kling's img2vid to animate it. This gives you accurate flag designs instead of AI hallucinations.

2. **Be extremely specific about flag colors.** Don't just say "Mexico flag" — say "vivid green, white, and red vertical stripes with an eagle emblem centered." Every nation variation in this doc includes the specific color description to use.

3. **Always specify 9:16 vertical.** Default output is usually 16:9. Every prompt must include aspect ratio.

4. **Generate at night or low-light for the meetup concept.** AI models handle dark/dramatic lighting better than bright daylight for car scenes — fewer artifacts, more cinematic feel.

5. **Use CapCut's AI features** for upscaling, noise reduction, and frame interpolation on AI-generated clips that are slightly rough.

6. **Match the real footage lighting to the AI scene.** If your real clips are filmed in daylight, pair them with AI scenes that start in bright lighting (Match Day Drive, Before/After). If filmed in a garage or dim setting, pair with the Meetup Reveal (nighttime). Consistent lighting across the cut makes the transition invisible.

7. **The slam is your best friend.** The hood slam provides a natural hard cut, a sound design sync point, and a visual reset that hides the real→AI transition. Every video format that uses the signature intro should cut on the slam impact — never fade or dissolve.

---

## Measurement — What to Track Weekly

| Metric | Target (Month 1) | Tool |
|---|---|---|
| TikTok followers | 500+ | TikTok analytics |
| IG followers | 100+ (from 11) | IG insights |
| Best-performing video views | 10,000+ | Platform analytics |
| Website clicks from bio | 50+/week | Shopify analytics (UTM links) |
| Engagement rate | >5% | Platform analytics |
| Content pieces posted | 10+/week | This tracker |

---

## File Reference

| File | Purpose |
|---|---|
| `AI-CONTENT-PIPELINE.md` | This file — master pipeline spec |
| `CAPTIONS.md` | Existing captions for 8 nation post images |
| `TIKTOK-CONTENT-KIT.md` | TikTok setup + 10 phone-filmed video scripts |
| `YOUTUBE-SHORTS-KIT.md` | YouTube Shorts cross-posting guide |
| `FACEBOOK-KIT.md` | Facebook strategy |
| `INFLUENCER-DM-OUTREACH.md` | 15 influencer targets + DM templates |
| `PROGRESS.md` | Run log + account status tracker |
