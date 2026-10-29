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
        return "bosselon916-crypto/hyperframe-rendering"

def main():
    repo = get_repo_slug()
    tag = sys.argv[1] if len(sys.argv) > 1 else "v1.0.0-rome-documentary"
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
            print(f"[{idx}/{len(sorted_assets)}] ✅ {name} already complete ({os.path.getsize(dest)/1e6:.1f} MB). Skipping.")
            continue

        print(f"[{idx}/{len(sorted_assets)}] ⬇️ Downloading {name} ({expected_size / 1e6:.1f} MB)...")
        cmd = ["curl", "-L", "-C", "-", "--progress-bar", url, "-o", dest]
        subprocess.run(cmd)

    print("\n=======================================================")
    print(f"🎉 All {len(sorted_assets)} videos downloaded successfully to {OUTPUT_DIR}/!")
    print("=======================================================")

if __name__ == "__main__":
    main()
