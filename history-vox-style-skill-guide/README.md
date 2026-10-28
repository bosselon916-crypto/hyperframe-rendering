# History Vox-Style Video Production Toolkit

A complete, self-contained package for generating, animating, and rendering 4K/1080p **Vox/Johnny Harris-style historical documentaries** using HyperFrames, GSAP, SVG parchment maps, and GitHub Actions parallel cloud rendering ($0 compute cost).

---

## Folder Contents

```
history-vox-style-skill-guide/
├── SKILL.md                          # Global AI Agent Skill (triggers automated workflow)
├── GUIDE.md                          # Master 8-Phase Production Documentation
├── README.md                         # This quickstart guide
├── scripts/
│   ├── download_artifacts.py         # Auto-downloads rendered MP4s via GitHub Actions API
│   ├── download_from_github.sh       # Fast bash downloader wrapper
│   └── normalize_timestamps.py       # Fixes yellow-screen bug by normalizing timeline to 0.0s
└── templates/
    ├── render.yml                    # Parallel 11-way GitHub Actions render workflow
    ├── concat_list.txt               # FFmpeg lossless concatenation template
    └── sample_episode/
        ├── index.html                # Working Vox-style DOM template with film grain & GSAP
        └── audio_cues.json           # Sound effects cue sheet
```

---

## 🚀 Quick Reference Commands

### 1. Fix Timestamps (Prevent Yellow Screen Bug)
```bash
python3 scripts/normalize_timestamps.py
```

### 2. Auto-Download All Rendered Episodes from GitHub
```bash
python3 scripts/download_artifacts.py
```

### 3. Losslessly Merge All Episodes into Master 110-Min Video
```bash
ffmpeg -f concat -safe 0 -i templates/concat_list.txt -c copy full_documentary_silent.mp4
```

### 4. Quality Check Video Frames
```bash
ffmpeg -ss 00:00:15 -i rendered_outputs/rome_ep2_silent.mp4 -vframes 1 -q:v 2 /tmp/test.jpg -y && \
python3 -c "from PIL import Image; im=Image.open('/tmp/test.jpg'); print(f'Unique colors: {len(set(im.getdata()))}')"
```
*(> 10,000 unique colors = rich graphics; < 500 = blank canvas)*
