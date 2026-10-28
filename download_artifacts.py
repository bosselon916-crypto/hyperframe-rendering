#!/usr/bin/env python3
"""
Automated GitHub Actions Artifact Downloader
Downloads rendered video episodes from GitHub Actions runs directly to rendered_outputs/.
"""

import os
import sys
import re
import json
import zipfile
import subprocess
import urllib.request

OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "rendered_outputs"))
os.makedirs(OUTPUT_DIR, exist_ok=True)

def get_github_token():
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        return token
    try:
        token = subprocess.check_output(
            "printf 'protocol=https\\nhost=github.com\\n\\n' | git credential fill 2>/dev/null | grep '^password=' | cut -d= -f2",
            shell=True
        ).decode().strip()
        if token:
            return token
    except Exception:
        pass
    return None

def get_repo_slug():
    try:
        remote_url = subprocess.check_output("git config --get remote.origin.url", shell=True).decode().strip()
        # Clean remote url
        slug = re.sub(r"^git@github\.com:", "", remote_url)
        slug = re.sub(r"^https://github\.com/", "", slug)
        slug = re.sub(r"\.git$", "", slug)
        return slug
    except Exception:
        return "bosselon916-crypto/hyperframe-rendering"

def main():
    token = get_github_token()
    if not token:
        print("❌ Error: GitHub Token could not be retrieved from Keychain or GITHUB_TOKEN environment variable.")
        sys.exit(1)

    repo = get_repo_slug()
    print(f"📡 Querying GitHub Artifacts API for repository: {repo}...")
    
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
        print(f"❌ Failed to query GitHub API: {e}")
        sys.exit(1)

    artifacts = data.get("artifacts", [])
    if not artifacts:
        print("⚠️ No artifacts found on GitHub.")
        return

    # Filter and keep the latest artifact per name
    latest_by_name = {}
    for a in artifacts:
        name = a["name"]
        created_at = a["created_at"]
        if name not in latest_by_name or created_at > latest_by_name[name]["created_at"]:
            latest_by_name[name] = a

    def ep_sort_key(name):
        nums = re.findall(r'\d+', name)
        return int(nums[0]) if nums else 999

    sorted_names = sorted(latest_by_name.keys(), key=ep_sort_key)
    print(f"📦 Found {len(sorted_names)} unique episode artifacts.\n")

    for idx, name in enumerate(sorted_names, 1):
        art = latest_by_name[name]
        aid = art["id"]
        size_mb = art["size_in_bytes"] / 1e6
        dest_mp4 = os.path.join(OUTPUT_DIR, f"{name}.mp4")
        tmp_zip = f"/tmp/{name}_{aid}.zip"

        print(f"[{idx}/{len(sorted_names)}] Downloading {name} (ID: {aid}, Size: {size_mb:.1f} MB)...")
        dl_req = urllib.request.Request(
            f"https://api.github.com/repos/{repo}/actions/artifacts/{aid}/zip",
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github+json"
            }
        )

        with urllib.request.urlopen(dl_req) as dl_resp, open(tmp_zip, "wb") as f_out:
            f_out.write(dl_resp.read())

        print(f"    Extracting to {dest_mp4}...")
        with zipfile.ZipFile(tmp_zip, "r") as z:
            z.extractall(OUTPUT_DIR)

        if os.path.exists(tmp_zip):
            os.remove(tmp_zip)

        print(f"    ✅ Ready: {dest_mp4}")

    print("\n=======================================================")
    print(f"🎉 All {len(sorted_names)} episodes ready in {OUTPUT_DIR}/")
    print("=======================================================")

if __name__ == "__main__":
    main()
