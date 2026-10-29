#!/usr/bin/env python3
"""
Downloads all 11 rendered episodes from GitHub Release CDN directly to rendered_outputs/.
Supports resume (-C -) so already downloaded parts are not re-downloaded.
"""

import os
import sys
import subprocess
import urllib.request
import json
import re

OUTPUT_DIR = os.path.abspath("rendered_outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

RELEASE_TAG = "v1.0.0-rome-documentary"
REPO = "bosselon916-crypto/hyperframe-rendering"

print(f"📡 Fetching Release assets from {REPO} ({RELEASE_TAG})...")
api_url = f"https://api.github.com/repos/{REPO}/releases/tags/{RELEASE_TAG}"

req = urllib.request.Request(api_url, headers={"User-Agent": "Mozilla/5.0"})
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
except Exception as e:
    print(f"Error fetching release: {e}")
    sys.exit(1)

assets = data.get("assets", [])

def ep_sort(a):
    nums = re.findall(r'\d+', a["name"])
    return int(nums[0]) if nums else 999

sorted_assets = sorted(assets, key=ep_sort)
print(f"Found {len(sorted_assets)} MP4 episode files in release.\n")

for idx, a in enumerate(sorted_assets, 1):
    name = a["name"]
    url = a["browser_download_url"]
    expected_size = a["size"]
    dest_path = os.path.join(OUTPUT_DIR, name)

    # Check if already fully downloaded
    if os.path.exists(dest_path) and os.path.getsize(dest_path) >= expected_size:
        print(f"[{idx}/{len(sorted_assets)}] ✅ {name} already complete ({os.path.getsize(dest_path)/1e6:.1f} MB). Skipping.")
        continue

    print(f"\n[{idx}/{len(sorted_assets)}] ⬇️ Downloading {name} ({expected_size / 1e6:.1f} MB)...")
    
    # Use curl with -L (follow redirect) and -C - (resume if partial)
    cmd = [
        "curl", "-L", "-C", "-",
        "--progress-bar",
        url,
        "-o", dest_path
    ]
    res = subprocess.run(cmd)
    if res.returncode == 0 and os.path.exists(dest_path):
        print(f"    ✅ Finished {name} ({os.path.getsize(dest_path) / 1e6:.1f} MB)")
    else:
        print(f"    ⚠️ Download interrupted for {name}")

print("\n=======================================================")
print(f"🎉 All {len(sorted_assets)} episodes processed in {OUTPUT_DIR}/!")
print("=======================================================")
