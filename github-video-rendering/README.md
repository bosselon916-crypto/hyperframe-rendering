# Universal GitHub Actions Video Cloud Rendering Toolkit

A complete, self-contained toolkit to cloud render **ANY automated video project** (Python render scripts, MoviePy, OpenCV, PIL/Canvas, HyperFrames, Remotion, Manim, FFmpeg) on **GitHub Actions for $0 cost** across up to **20 parallel runners**.

---

## Folder Structure

```text
github-video-rendering/
├── SKILL.md                          # Global AI Agent Skill (triggers automated cloud workflow)
├── GUIDE.md                          # Master 7-Section Cloud Rendering Documentation
├── README.md                         # Quick reference cheat sheet & commands
├── scripts/
│   ├── download_rendered_videos.py   # High-speed Fastly CDN Downloader (25-35 MB/s)
│   └── normalize_timestamps.py       # Fixes yellow/blank screen bug by resetting chunk timelines to 0.0s
└── templates/
    ├── render_python.yml             # Workflow template for Python/MoviePy/OpenCV renders
    ├── render_web.yml                # Workflow template for HyperFrames/Remotion renders
    ├── publish_release.yml           # Auto-publishes cloud artifacts to Fastly CDN Release (> 1 GB)
    └── concat_list.txt               # FFmpeg lossless stitching template
```

---

## 🚀 Quick Reference Commands

### 1. Fix Timestamps Before Render (Prevents Blank/Yellow Screen Bug)
```bash
python3 github-video-rendering/scripts/normalize_timestamps.py
```

### 2. High-Speed Download from Fastly CDN Release (For Batches > 1 GB)
```bash
python3 github-video-rendering/scripts/download_rendered_videos.py [RELEASE_TAG]
```

### 3. Losslessly Merge All Rendered Chunks into Final Master Video
```bash
ffmpeg -f concat -safe 0 -i github-video-rendering/templates/concat_list.txt -c copy master_full_video.mp4
```

### 4. Verify Video Quality & Frame Diversity
```bash
ffmpeg -ss 00:00:15 -i rendered_outputs/part_1.mp4 -vframes 1 -q:v 2 /tmp/test_frame.jpg -y && \
python3 -c "from PIL import Image; im=Image.open('/tmp/test_frame.jpg'); colors=len(set(im.getdata())); print(f'Unique colors: {colors}'); assert colors > 5000, 'FAIL: Blank canvas detected!'"
```
*(> 10,000 unique colors = rich graphics; < 500 = blank canvas failure)*
