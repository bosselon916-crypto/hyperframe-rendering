#!/bin/bash
# Dynamic Downloader for GitHub Action Artifacts
# Fetches the latest rendered episodes directly using GitHub API

OUTPUT_DIR="$(pwd)/rendered_outputs"
mkdir -p "$OUTPUT_DIR"

echo "Fetching GitHub credentials from Keychain..."
TOKEN=$(printf "protocol=https\nhost=github.com\n\n" | git credential fill 2>/dev/null | grep "^password=" | cut -d= -f2)

if [ -z "$TOKEN" ]; then
  echo "Error: Could not retrieve GitHub token."
  exit 1
fi

python3 - <<EOF
import os
import sys
import json
import urllib.request
import zipfile

token = "$TOKEN"
out_dir = "$OUTPUT_DIR"
repo = "bosselon916-crypto/hyperframe-rendering"

print(f"Connecting to GitHub API for {repo}...")
req = urllib.request.Request(
    f"https://api.github.com/repos/{repo}/actions/artifacts?per_page=100",
    headers={
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json"
    }
)

try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
except Exception as e:
    print(f"Failed to fetch artifacts: {e}")
    sys.exit(1)

artifacts = data.get("artifacts", [])
print(f"Found {len(artifacts)} total artifacts on GitHub.")

# Group by name, pick latest created_at
latest_by_name = {}
for a in artifacts:
    name = a["name"]
    created_at = a["created_at"]
    if name not in latest_by_name or created_at > latest_by_name[name]["created_at"]:
        latest_by_name[name] = a

# Sort by episode number
def get_ep_num(name):
    try:
        return int(name.replace("rome_ep", "").replace("_silent", ""))
    except:
        return 999

sorted_names = sorted(latest_by_name.keys(), key=get_ep_num)

print("\n=======================================================")
print(f" Latest Rendered Artifacts Available ({len(sorted_names)} found):")
print("=======================================================")
for name in sorted_names:
    a = latest_by_name[name]
    print(f" - {name} (ID: {a['id']}, Created: {a['created_at']}, Size: {a['size_in_bytes'] / 1e6:.1f} MB)")

for idx, name in enumerate(sorted_names, 1):
    a = latest_by_name[name]
    aid = a["id"]
    dest_mp4 = os.path.join(out_dir, f"{name}.mp4")
    tmp_zip = f"/tmp/{name}.zip"

    print(f"\n[{idx}/{len(sorted_names)}] Downloading {name} (ID: {aid})...")
    dl_req = urllib.request.Request(
        f"https://api.github.com/repos/{repo}/actions/artifacts/{aid}/zip",
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json"
        }
    )
    
    with urllib.request.urlopen(dl_req) as resp, open(tmp_zip, "wb") as f_out:
        f_out.write(resp.read())

    print(f"Extracting to {dest_mp4}...")
    with zipfile.ZipFile(tmp_zip, "r") as z:
        z.extractall(out_dir)
    if os.path.exists(tmp_zip):
        os.remove(tmp_zip)
    print(f"Successfully saved {dest_mp4}!")

print("\n=======================================================")
print(" All latest artifacts downloaded into rendered_outputs/!")
print("=======================================================")
EOF

ls -lh "$OUTPUT_DIR"
