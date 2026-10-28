# History Vox-Style Animated Documentary: Master Production Blueprint

> **Skill Name**: `history-vox-style-skill-guide`  
> **Aesthetic**: Vox / Johnny Harris style (tactile parchment paper canvas, dynamic SVG film grain, cutout historical figures with drop-shadows, animated vector maps, kinetic text highlights, smooth camera pans and zooms).  
> **Rendering Engine**: HyperFrames + GSAP (GreenSock) running in headless Chromium.  
> **Cloud Compute**: GitHub Actions (100% Free parallel runners).  

---

## Table of Contents
1. [Visual Aesthetic & Design DNA](#1-visual-aesthetic--design-dna)
2. [Phase 1: Concept, Scripting & Audio Timing](#2-phase-1-concept-scripting--audio-timing)
3. [Phase 2: Visual Asset Generation & Specifications](#3-phase-2-visual-asset-generation--specifications)
4. [Phase 3: HyperFrames DOM Architecture (`index.html`)](#4-phase-3-hyperframes-dom-architecture-indexhtml)
5. [Phase 4: CRITICAL Architecture Rule — Local Timestamp Normalization](#5-phase-4-critical-architecture-rule--local-timestamp-normalization)
6. [Phase 5: Cloud Rendering Pipeline (GitHub Actions $0 Cost)](#6-phase-5-cloud-rendering-pipeline-github-actions-0-cost)
7. [Phase 6: Automated Download with Python](#7-phase-6-automated-download-with-python)
8. [Phase 7: Final Lossless Video Stitching](#8-phase-7-final-lossless-video-stitching)

---

## 1. Visual Aesthetic & Design DNA

To create a genuine Vox-style historical documentary:

| Element | Technique | Specification |
|---|---|---|
| **Canvas** | Parchment Yellow Background | `#f1e6c8` or `#ece1c3` with aged paper borders |
| **Film Texture** | Animated SVG Film Grain | `<feTurbulence type="fractalNoise" baseFrequency="0.8">` with `mix-blend-mode: multiply`, opacity `0.18` |
| **Characters** | Cutout historical portraits / statues | Transparent PNGs with `filter: drop-shadow(0 15px 25px rgba(20,15,10,0.4))` |
| **Motion** | Gentle breathing / hover micro-motion | GSAP `y: "+=8"`, `rotation: "+=0.8"`, `yoyo: true`, `repeat: -1`, `ease: "sine.inOut"` |
| **Maps** | Ancient vector cartography | SVG path tracing with `stroke-dasharray` and `stroke-dashoffset` |
| **Typography** | Typewriter / Stamp / Tape aesthetic | Serif fonts (`Cinzel`, `Georgia`), uppercase text, dark tape background `#2b1f14` |
| **Virtual Camera** | Pan & Zoom (`#stage` wrapper) | GSAP smooth scale from 1.0 to 1.2x focused on focal points |

---

## 2. Phase 1: Concept, Scripting & Audio Timing

1. **Chaptering**: Divide long documentaries into **5-to-10 minute episodes** (standard: `600.0` seconds each).
2. **Narration Audio**: Produce voiceover with clear chapter boundaries.
3. **Audio Cue Sheet (`audio_cues.json`)**: Map sound effects (paper wipes, whooshes, parchment rustles, drum hits) to exact timestamps:
   ```json
   [
     { "t": 0.5, "sfx": "paper_wipe" },
     { "t": 12.3, "sfx": "whoosh_soft" },
     { "t": 45.0, "sfx": "drum_hit" }
   ]
   ```

---

## 3. Phase 2: Visual Asset Generation & Specifications

Store all assets inside each episode's `assets/` directory:
- `assets/gsap.min.js`: GreenSock animation library.
- `assets/engine.js`: HyperFrames animation driver.
- `assets/characters/`: Transparent cutout PNGs (e.g. `caesar.png`, `scipio.png`, `hannibal.png`).
- `assets/maps/`: High-resolution historical map backgrounds (`map_mediterranean.webp`).
- `assets/pins/`: Vector location pins (`pin_rome.svg`, `pin_carthage.svg`).

---

## 4. Phase 3: HyperFrames DOM Architecture (`index.html`)

Every episode must follow this exact DOM structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Episode Title</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #000; display: flex; justify-content: center; align-items: center; min-height: 100vh; overflow: hidden; }
    
    #stage {
      position: relative;
      width: 1920px;
      height: 1080px;
      background: #f1e6c8; /* Parchment canvas */
      overflow: hidden;
      font-family: 'Georgia', serif;
    }

    #grain {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none;
      opacity: 0.18;
      mix-blend-mode: multiply;
      z-index: 1000;
    }

    .layer {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      will-change: transform, opacity;
    }

    .cutout {
      position: absolute;
      filter: drop-shadow(0 15px 25px rgba(20, 15, 10, 0.4));
      transform-origin: center bottom;
    }

    .banner {
      position: absolute;
      background: #2b1f14;
      color: #f7edd0;
      padding: 12px 24px;
      font-size: 30px;
      font-weight: bold;
      letter-spacing: 2px;
      text-transform: uppercase;
      box-shadow: 0 8px 20px rgba(0,0,0,0.3);
    }
  </style>
</head>
<body>
  <!-- STAGE: data-start is 0, duration is the episode length in seconds -->
  <div id="stage" data-composition-id="ep_01" data-start="0" data-duration="600.0" data-width="1920" data-height="1080">
    
    <!-- Film Grain Overlay -->
    <svg id="grain" xmlns="http://www.w3.org/2000/svg">
      <filter id="noiseFilter">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/>
      </filter>
      <rect width="100%" height="100%" filter="url(#noiseFilter)"/>
    </svg>

    <!-- Visual Scenes (data-start is LOCAL to this episode: 0.0 to 600.0) -->
    <div class="layer" data-start="0.0" data-duration="18.0" id="scene-1">
      <img src="assets/map_mediterranean.webp" style="width:100%; height:100%; object-fit:cover;">
      <div class="banner" style="top: 150px; left: 100px;">The First Punic War</div>
      <img src="assets/scipio.png" class="cutout" style="bottom: 50px; right: 250px; height: 700px;">
    </div>

  </div>

  <script src="assets/gsap.min.js"></script>
  <script>
    window.ROME_DATA = {
      meta: { id: "ep_01", duration: 600.0 },
      beats: [
        {
          start: 0.0,
          end: 18.0,
          zoom: { at: 0.0, scale: 1.12, x: -40, y: -20, ease: "power2.out" }
        }
      ]
    };
  </script>
</body>
</html>
```

---

## 5. Phase 4: CRITICAL Architecture Rule — Local Timestamp Normalization

### ⚠️ Why Episodes 2–11 Rendered a Blank Yellow Screen:
If a project is authored with a single monolithic timeline (0s to 6,579s):
- Episode 1 spans $0\text{s} - 600\text{s}$.
- Episode 2 spans $600\text{s} - 1200\text{s}$.
- Episode 3 spans $1200\text{s} - 1800\text{s}$.

When sliced into episode folders, if elements retain their global timestamps (`data-start="600.0"` in Episode 2):
1. HyperFrames renders each episode stage from **`0.0s` to `600.0s`**.
2. Elements starting at $t \ge 600\text{s}$ **never reach their start time**.
3. HyperFrames keeps all visual layers hidden (`display: none`).
4. Result: 10 minutes (18,000 frames) of pure `#stage` background parchment yellow `#f1e6c8` with grain noise!

### The Rule:
**Every episode HTML file must have all timestamps starting at `0.0s`.**

```python
# Formula:
offset = (episode_number - 1) * 600.0
local_time = max(0.0, global_time - offset)
```

Apply this offset to:
1. `data-start="X"` on all HTML tags inside `#stage`.
2. All timestamp fields in `window.ROME_DATA` (`beats`, `cast`, `teach`, `captions`, `banners`, `routes`, `maps`).
3. All audio cues in `audio_cues.json`.

---

## 6. Phase 5: Cloud Rendering Pipeline (GitHub Actions $0 Cost)

Render all 11 episodes simultaneously in ~15 minutes using GitHub's free Ubuntu runners.

### Workflow Configuration: `.github/workflows/render.yml`

```yaml
name: Render Rome Episodes (HyperFrames)

on:
  workflow_dispatch:
    inputs:
      quality:
        description: 'Render Quality'
        required: true
        default: 'draft'
        type: choice
        options:
          - draft
          - high

jobs:
  render_episodes:
    name: Render Episode ${{ matrix.episode }}
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        episode: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Setup FFmpeg (Static Precompiled Binary)
        uses: federicocarboni/setup-ffmpeg@v3

      - name: Install Browser Dependencies & HyperFrames
        run: |
          npx playwright install-deps chromium
          npm install -g hyperframes@0.8.198
          hyperframes browser ensure

      - name: Render Episode ${{ matrix.episode }}
        run: |
          cd "RomeDocumentary/rome_ep${{ matrix.episode }}"
          hyperframes render --quality ${{ github.event.inputs.quality || 'draft' }} --output "../../rome_ep${{ matrix.episode }}_silent.mp4"

      - name: Upload Rendered Video Artifact
        uses: actions/upload-artifact@v4
        with:
          name: rome_ep${{ matrix.episode }}_silent
          path: rome_ep${{ matrix.episode }}_silent.mp4
          retention-days: 7
```

---

## 7. Phase 6: Automated Download with Python

Run this single command on your local machine to automatically query GitHub's API, download all latest episode artifacts, and unzip them into `rendered_outputs/`:

```bash
python3 download_artifacts.py
```

### Standalone Python Script: `download_artifacts.py`

```python
#!/usr/bin/env python3
import os, sys, re, json, zipfile, subprocess, urllib.request

OUTPUT_DIR = os.path.abspath("rendered_outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 1. Fetch GitHub Token from local Keychain
token = os.environ.get("GITHUB_TOKEN")
if not token:
    try:
        token = subprocess.check_output(
            "printf 'protocol=https\\nhost=github.com\\n\\n' | git credential fill 2>/dev/null | grep '^password=' | cut -d= -f2",
            shell=True
        ).decode().strip()
    except Exception:
        pass

if not token:
    print("❌ Error: GitHub Token could not be retrieved.")
    sys.exit(1)

# 2. Get repository slug
remote_url = subprocess.check_output("git config --get remote.origin.url", shell=True).decode().strip()
repo = re.sub(r"^(https://github\.com/|git@github\.com:)", "", remote_url).replace(".git", "")

# 3. Query GitHub Actions Artifacts API
print(f"📡 Querying GitHub Artifacts for {repo}...")
req = urllib.request.Request(
    f"https://api.github.com/repos/{repo}/actions/artifacts?per_page=100",
    headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"}
)
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())

# 4. Filter for latest artifact per episode
latest = {}
for a in data.get("artifacts", []):
    if a["name"] not in latest or a["created_at"] > latest[a["name"]]["created_at"]:
        latest[a["name"]] = a

sorted_names = sorted(latest.keys(), key=lambda n: int(re.search(r'\d+', n).group() if re.search(r'\d+', n) else 999))
print(f"📦 Found {len(sorted_names)} episode artifacts to download.\n")

# 5. Download and extract
for idx, name in enumerate(sorted_names, 1):
    art = latest[name]
    aid = art["id"]
    dest_mp4 = os.path.join(OUTPUT_DIR, f"{name}.mp4")
    tmp_zip = f"/tmp/{name}_{aid}.zip"

    print(f"[{idx}/{len(sorted_names)}] Downloading {name} ({art['size_in_bytes'] / 1e6:.1f} MB)...")
    dl_req = urllib.request.Request(
        f"https://api.github.com/repos/{repo}/actions/artifacts/{aid}/zip",
        headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"}
    )
    with urllib.request.urlopen(dl_req) as dl_resp, open(tmp_zip, "wb") as f_out:
        f_out.write(dl_resp.read())

    with zipfile.ZipFile(tmp_zip, "r") as z:
        z.extractall(OUTPUT_DIR)
    if os.path.exists(tmp_zip):
        os.remove(tmp_zip)

print(f"\n🎉 All {len(sorted_names)} episodes saved to {OUTPUT_DIR}/")
```

---

## 8. Phase 7: Final Lossless Video Stitching

Once all 11 episodes are in `rendered_outputs/`, merge them instantly into a single continuous 110-minute MP4 without re-encoding:

1. Create `concat_list.txt`:
```plaintext
file 'rendered_outputs/rome_ep1_silent.mp4'
file 'rendered_outputs/rome_ep2_silent.mp4'
file 'rendered_outputs/rome_ep3_silent.mp4'
file 'rendered_outputs/rome_ep4_silent.mp4'
file 'rendered_outputs/rome_ep5_silent.mp4'
file 'rendered_outputs/rome_ep6_silent.mp4'
file 'rendered_outputs/rome_ep7_silent.mp4'
file 'rendered_outputs/rome_ep8_silent.mp4'
file 'rendered_outputs/rome_ep9_silent.mp4'
file 'rendered_outputs/rome_ep10_silent.mp4'
file 'rendered_outputs/rome_ep11_silent.mp4'
```

2. Run Lossless Stitch:
```bash
ffmpeg -f concat -safe 0 -i concat_list.txt -c copy full_documentary_silent.mp4
```

3. Mux Final Narration Track:
```bash
ffmpeg -i full_documentary_silent.mp4 -i audio_full_master.m4a -c:v copy -c:a aac -b:a 320k full_documentary_final.mp4
```

---

## Quality & Integrity Validation Test

To verify any rendered episode video has active visual graphics and is NOT a blank/yellow screen, sample a frame and test its unique color diversity:

```bash
ffmpeg -ss 00:00:15 -i rendered_outputs/rome_ep2_silent.mp4 -vframes 1 -q:v 2 /tmp/test_frame.jpg -y
python3 -c "
from PIL import Image
im = Image.open('/tmp/test_frame.jpg')
colors = len(set(im.getdata()))
print(f'Unique colors: {colors}')
if colors < 500:
    print('❌ ERROR: Static or blank screen detected!')
else:
    print('✅ SUCCESS: Rich animated graphics verified!')
"
```
