# History Vox-Style Video Production Toolkit

A complete, self-contained package for generating, animating, and rendering 4K/1080p **Vox/Johnny Harris-style historical animated documentaries** using HyperFrames, GSAP, SVG parchment maps, and GitHub Actions parallel cloud rendering with automatic GitHub Global CDN publishing for batches > 1 GB.

---

## Folder Contents

```text
history-vox-style-skill-guide/
├── SKILL.md                          # Global AI Agent Skill (triggers automated workflow)
├── GUIDE.md                          # Master 9-Section Production Documentation
├── README.md                         # This quickstart cheat sheet
├── scripts/
│   ├── normalize_timestamps.py       # Fixes yellow-screen bug by normalizing timelines to 0.0s
│   ├── download_release_episodes.py  # Fast CDN Downloader (25-35 MB/s) for batches > 1 GB
│   ├── download_artifacts.py         # Direct GitHub Actions API downloader
│   └── download_from_github.sh       # Fast bash downloader wrapper
└── templates/
    ├── render.yml                    # 11-way parallel GitHub Actions render matrix ($0 cost)
    ├── publish_release.yml           # Auto-packages cloud artifacts into GitHub Release CDN
    ├── concat_list.txt               # FFmpeg lossless concatenation template
    └── sample_episode/
        ├── index.html                # Working Vox-style DOM template with film grain & GSAP
        └── audio_cues.json           # Sound effects cue sheet
```

---

## 🚀 Quick Reference Commands

### 1. Fix Timestamps Before Render (Prevents Yellow Screen Bug)
```bash
python3 history-vox-style-skill-guide/scripts/normalize_timestamps.py
```

### 2. Fast Download from GitHub Global CDN (For Batches > 1 GB)
```bash
python3 history-vox-style-skill-guide/scripts/download_release_episodes.py
```

### 3. Losslessly Merge All Episodes into Master 110-Min Video
```bash
ffmpeg -f concat -safe 0 -i history-vox-style-skill-guide/templates/concat_list.txt -c copy full_documentary_silent.mp4
```

### 4. Quality Check Video Frames (Verify Graphics vs. Blank Yellow)
```bash
ffmpeg -ss 00:00:25 -i rendered_outputs/rome_ep2_silent.mp4 -vframes 1 -q:v 2 /tmp/test.jpg -y && \
python3 -c "from PIL import Image; im=Image.open('/tmp/test.jpg'); colors=len(set(im.getdata())); print(f'Unique colors: {colors}'); assert colors > 5000, 'FAILED: Yellow screen!'"
```
*(> 10,000 unique colors = rich graphics; < 500 = blank canvas failure)*
