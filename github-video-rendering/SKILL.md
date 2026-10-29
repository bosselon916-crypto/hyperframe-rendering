---
name: github-video-rendering
description: Universal blueprint for cloud rendering ANY automated video project (Python, OpenCV, MoviePy, Remotion, HyperFrames, FFmpeg, brush/canvas animations) on GitHub Actions with parallel matrix runners, dependency handling, automatic Fastly CDN releases for outputs > 1 GB, and high-speed local downloading.
---

# Universal GitHub Actions Cloud Video Rendering Blueprint

Use this skill whenever you need to render **any video project** (Python render scripts, MoviePy, OpenCV, HyperFrames, Remotion, Manim, or complex FFmpeg pipelines) in the cloud using **GitHub Actions free compute** ($0 cost), without slowing down your local machine.

---

## 1. Why Render Videos on GitHub Actions?

| Feature | Local Machine | GitHub Actions Cloud |
|---|---|---|
| **Cost** | Free (uses your hardware) | **100% Free** (GitHub provides 2,000 free min/month on private repos, unlimited on public repos) |
| **Concurrency** | 1 video at a time | **Up to 20 parallel runners simultaneously** |
| **System Load** | Fans spin, high CPU/RAM usage | **Zero load on your computer** |
| **Speed** | 10 episodes = 3–4 hours | 10 episodes in parallel = **15 minutes total** |

---

## 2. Universal Video Architecture Pipeline

```mermaid
graph TD
    A[Video Codebase: Python / Node / HTML5] --> B[Slice Timeline into Segments or Parallel Chunks]
    B --> C[Push Code & Assets to GitHub in Batches < 130MB]
    C --> D[Trigger GitHub Actions Matrix Workflow]
    D --> E[Parallel Cloud Runners Render Chunks Concurrently]
    E --> F{Total Output Size > 1 GB?}
    F -- Yes: Mandatory CDN Step --> G[Auto-Publish Cloud Artifacts to GitHub Release]
    F -- No --> H[Download Raw Artifacts]
    G --> I[Download at 30 MB/s Line Speed via Fastly CDN]
    H --> I
    I --> J[Lossless FFmpeg Stitching into Master Video]
```

---

## 3. The 3 Non-Negotiable Cloud Rendering Rules

### Rule 1: Every Video Chunk Must Use Local Timestamps ($t = 0.0\text{s}$)
If dividing a long video (e.g. 1 hour) into chunks:
* **The Error**: Keeping global timestamps (Chunk 2 starting at $t=600\text{s}$). The renderer evaluates from $t=0$ to $600$, sees no elements scheduled in that window, and renders a **solid blank/yellow video**.
* **The Fix**: Every segment's renderer clock must start at **$0.0\text{s}$**. Always subtract `(chunk_number - 1) * duration` from all element start times, animation triggers, and audio cues.

### Rule 2: Never Use `apt-get install ffmpeg` on Ubuntu Runners
Ubuntu 24.04 runner images frequently fail during `apt-get install` due to package renames (`libasound2` -> `libasound2t64`, exit code 100).
* **Always use the precompiled static binary action**:
  ```yaml
  - name: Setup FFmpeg (Static Binary)
    uses: federicocarboni/setup-ffmpeg@v3
  ```

### Rule 3: The > 1 GB Rule — Always Use GitHub Releases for Large Outputs
* **The Problem**: Raw GitHub Actions artifacts are hosted on raw Microsoft Azure Blob Storage (`*.blob.core.windows.net`), which throttles direct terminal downloads to **~1 KB/s** on cross-region connections (taking 90+ hours for 3 GB).
* **The Architecture**: When total video output exceeds 1 GB, **always package the outputs into a GitHub Release** in the cloud. Releases are served by **Fastly / GitHub Global CDN (`github.com/releases/download/...`)**, delivering at **25–35 MB/s line speed** anywhere in the world with resumable (`curl -C -`) downloads.

---

## 4. Universal Workflow Templates

### Template A: For Python Video Renderers (MoviePy, OpenCV, Canvas, Custom Scripts)
Save as `.github/workflows/render_python.yml`:

```yaml
name: Render Python Video Project

on:
  workflow_dispatch:
    inputs:
      resolution:
        description: 'Output Resolution (e.g. 1080p, 720p)'
        required: true
        default: '1080p'

permissions:
  contents: write

jobs:
  render_chunks:
    name: Render Scene ${{ matrix.chunk }}
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        # Run up to 20 segments in parallel
        chunk: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Setup FFmpeg (Static Binary)
        uses: federicocarboni/setup-ffmpeg@v3

      - name: Install Python Dependencies
        run: |
          pip install --upgrade pip
          if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
          pip install opencv-python-headless pillow moviepy numpy

      - name: Execute Render Script
        run: |
          # Pass the chunk/scene ID to your script
          python render_script.py --chunk ${{ matrix.chunk }} --res ${{ github.event.inputs.resolution }} --output "part_${{ matrix.chunk }}.mp4"

      - name: Upload Video Artifact
        uses: actions/upload-artifact@v4
        with:
          name: video_part_${{ matrix.chunk }}
          path: part_${{ matrix.chunk }}.mp4
          retention-days: 7
```

---

### Template B: For Web / Headless Browser Renderers (HyperFrames, Remotion, Playwright)
Save as `.github/workflows/render_web.yml`:

```yaml
name: Render Web Animations (HyperFrames / Remotion)

on:
  workflow_dispatch:
    inputs:
      quality:
        description: 'Quality (draft or high)'
        required: true
        default: 'draft'

permissions:
  contents: write

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

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Setup FFmpeg
        uses: federicocarboni/setup-ffmpeg@v3

      - name: Install Chromium & Playwright
        run: |
          npx playwright install-deps chromium
          npm install -g hyperframes@0.8.198
          hyperframes browser ensure

      - name: Render Episode
        run: |
          cd "episodes/ep${{ matrix.episode }}"
          hyperframes render --quality ${{ github.event.inputs.quality }} --output "../../ep_${{ matrix.episode }}_silent.mp4"

      - name: Upload Video Artifact
        uses: actions/upload-artifact@v4
        with:
          name: ep_${{ matrix.episode }}_silent
          path: ep_${{ matrix.episode }}_silent.mp4
          retention-days: 7
```

---

### Template C: Cloud Release Packaging Workflow (Mandatory for Batches > 1 GB)
Save as `.github/workflows/publish_release.yml`:

```yaml
name: Publish Rendered Videos to Fastly CDN Release

on:
  workflow_dispatch:
    inputs:
      run_id:
        description: 'Completed Render Run ID'
        required: true
      tag_name:
        description: 'Release Tag'
        required: true
        default: 'v1.0.0-video-release'

permissions:
  contents: write

jobs:
  publish_release:
    name: Package Cloud Release
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Pull Cloud Artifacts at 10 Gbps Cloud Speed
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          echo "Pulling artifacts from run ${{ github.event.inputs.run_id }}..."
          gh run download ${{ github.event.inputs.run_id }} --dir ./artifacts_in
          mkdir -p ./release_videos
          find ./artifacts_in -name "*.mp4" -exec cp {} ./release_videos/ \;
          ls -lh ./release_videos/

      - name: Publish to GitHub Global CDN Release
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          TAG="${{ github.event.inputs.tag_name }}"
          gh release delete "$TAG" -y 2>/dev/null || true
          git tag -d "$TAG" 2>/dev/null || true
          git push origin :refs/tags/"$TAG" 2>/dev/null || true

          gh release create "$TAG" ./release_videos/*.mp4 \
            --title "Rendered Videos ($TAG)" \
            --notes "Full videos rendered via GitHub Actions cloud. Downloadable at 30 MB/s via Fastly CDN."
```

---

## 5. Universal High-Speed Python Downloader

Save this as `download_rendered_videos.py` in your project root:

```python
#!/usr/bin/env python3
"""
Universal Fast Video Downloader for GitHub Releases
Downloads all MP4 videos from a GitHub Release at line speed (25-35 MB/s) with Range resume.
"""

import os
import sys
import json
import re
import subprocess
import urllib.request

OUTPUT_DIR = os.path.abspath("rendered_outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def get_repo_slug():
    try:
        remote_url = subprocess.check_output("git config --get remote.origin.url", shell=True).decode().strip()
        slug = re.sub(r"^(https://github\.com/|git@github\.com:)", "", remote_url).replace(".git", "")
        return slug
    except Exception:
        return None

def main():
    repo = get_repo_slug()
    if not repo:
        repo = input("Enter GitHub repository slug (e.g. username/repo): ").strip()

    tag = sys.argv[1] if len(sys.argv) > 1 else "v1.0.0-video-release"
    print(f"📡 Fetching release assets for {repo} @ tag '{tag}'...")

    api_url = f"https://api.github.com/repos/{repo}/releases/tags/{tag}"
    req = urllib.request.Request(api_url, headers={"User-Agent": "Mozilla/5.0"})

    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
    except Exception as e:
        print(f"❌ Error fetching release '{tag}': {e}")
        sys.exit(1)

    assets = [a for a in data.get("assets", []) if a["name"].endswith(".mp4")]
    if not assets:
        print("⚠️ No .mp4 assets found in release.")
        sys.exit(0)

    def sort_key(a):
        nums = re.findall(r'\d+', a["name"])
        return int(nums[0]) if nums else 999

    sorted_assets = sorted(assets, key=sort_key)
    print(f"📦 Found {len(sorted_assets)} video files. Downloading into {OUTPUT_DIR}/...\n")

    for idx, a in enumerate(sorted_assets, 1):
        name = a["name"]
        url = a["browser_download_url"]
        expected_size = a["size"]
        dest = os.path.join(OUTPUT_DIR, name)

        if os.path.exists(dest) and os.path.getsize(dest) >= expected_size:
            print(f"[{idx}/{len(sorted_assets)}] ✅ {name} already complete. Skipping.")
            continue

        print(f"[{idx}/{len(sorted_assets)}] ⬇️ Downloading {name} ({expected_size / 1e6:.1f} MB)...")
        # curl with -L (follow redirect to CDN) and -C - (resumable)
        cmd = ["curl", "-L", "-C", "-", "--progress-bar", url, "-o", dest]
        subprocess.run(cmd)

    print("\n=======================================================")
    print(f"🎉 All {len(sorted_assets)} videos downloaded successfully to {OUTPUT_DIR}/!")
    print("=======================================================")

if __name__ == "__main__":
    main()
```

---

## 6. Stitching and Quality Verification

### 1. Lossless Concatenation (Instant Stitch)
Create `concat_list.txt`:
```plaintext
file 'rendered_outputs/part_1.mp4'
file 'rendered_outputs/part_2.mp4'
file 'rendered_outputs/part_3.mp4'
```
Merge in 5 seconds without re-encoding:
```bash
ffmpeg -f concat -safe 0 -i concat_list.txt -c copy master_full_video.mp4
```

### 2. Audio Muxing
```bash
ffmpeg -i master_full_video.mp4 -i master_voiceover.m4a -c:v copy -c:a aac -b:a 320k final_video_with_audio.mp4
```

### 3. Blank/Yellow Screen Verification Test
Ensure your render actually produced rich visual animations:
```bash
ffmpeg -ss 00:00:15 -i rendered_outputs/part_1.mp4 -vframes 1 -q:v 2 /tmp/test_frame.jpg -y && \
python3 -c "
from PIL import Image
im = Image.open('/tmp/test_frame.jpg')
colors = len(set(im.getdata()))
print(f'Frame Color Diversity: {colors} unique colors')
assert colors > 5000, 'FAIL: Blank/static canvas detected!'
print('SUCCESS: Active graphics verified!')
"
```

---

## Universal Checklist for Cloud Video Rendering

- [ ] Video chunks start at local $t = 0.0\text{s}$ (never global monolithic timestamps).
- [ ] Code & asset commits kept under 130MB per git push to prevent HTTPS payload errors.
- [ ] Workflow uses `federicocarboni/setup-ffmpeg@v3` (never apt-get).
- [ ] GitHub Actions matrix configured for parallel rendering (up to 20 jobs).
- [ ] If batch > 1 GB, trigger `publish_release.yml` to package files onto Fastly CDN.
- [ ] Run `python3 download_rendered_videos.py` to stream files at 30 MB/s.
- [ ] Concatenate losslessly with `ffmpeg -f concat -c copy`.
