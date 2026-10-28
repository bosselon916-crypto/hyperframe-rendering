import os
import json
import re

def main():
    base_dir = "/Users/moji/video gen testiing/RomeDocumentary"

    for ep in range(2, 12):
        offset = (ep - 1) * 600.0
        ep_dir = os.path.join(base_dir, f"rome_ep{ep}")
        html_path = os.path.join(ep_dir, "index.html")
        cues_path = os.path.join(ep_dir, "audio_cues.json")
        
        if not os.path.exists(html_path):
            print(f"Skipping Ep {ep}: {html_path} not found")
            continue

        print(f"\n--- Processing Episode {ep} (offset = -{offset}s) ---")
        
        # 1. Process index.html
        with open(html_path, "r", encoding="utf-8") as f:
            html = f.read()

        # Preserve opening <div id="stage" ...> tag
        stage_idx = html.find('id="stage"')
        if stage_idx == -1:
            raise ValueError(f"Could not find #stage in {html_path}")
        close_stage = html.find('>', stage_idx)
        head_part = html[:close_stage + 1]
        body_part = html[close_stage + 1:]

        # Replace data-start attributes on elements inside stage
        start_count = 0
        def repl_start(m):
            nonlocal start_count
            val = float(m.group(1))
            new_val = max(0.0, round(val - offset, 2))
            start_count += 1
            return f'data-start="{new_val:.2f}"'

        body_part = re.sub(r'data-start="([\d\.]+)"', repl_start, body_part)

        # Normalize window.ROME_DATA
        json_m = re.search(r'window\.ROME_DATA=(\{.*?\});</script>', body_part)
        if not json_m:
            raise ValueError(f"Could not find window.ROME_DATA in {html_path}")
        
        data = json.loads(json_m.group(1))
        
        json_ts_count = 0
        def normalize_json_obj(obj):
            nonlocal json_ts_count
            if isinstance(obj, dict):
                for k, v in list(obj.items()):
                    if k in ["start", "end", "at", "until"] and isinstance(v, (int, float)):
                        if v >= offset * 0.5:
                            obj[k] = round(max(0.0, v - offset), 2)
                            json_ts_count += 1
                    else:
                        normalize_json_obj(v)
            elif isinstance(obj, list):
                for item in obj:
                    normalize_json_obj(item)

        normalize_json_obj(data)

        new_json_str = "window.ROME_DATA=" + json.dumps(data, separators=(',', ':')) + ";</script>"
        body_part = body_part[:json_m.start()] + new_json_str + body_part[json_m.end():]

        new_html = head_part + body_part
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(new_html)

        print(f"Ep {ep} index.html: updated {start_count} data-start tags, {json_ts_count} JSON timestamps.")

        # 2. Process audio_cues.json if present
        if os.path.exists(cues_path):
            with open(cues_path, "r", encoding="utf-8") as f:
                cues = json.load(f)
            cues_count = 0
            for item in cues:
                if "t" in item and isinstance(item["t"], (int, float)):
                    if item["t"] >= offset * 0.5:
                        item["t"] = round(max(0.0, item["t"] - offset), 2)
                        cues_count += 1
            with open(cues_path, "w", encoding="utf-8") as f:
                json.dump(cues, f, indent=1)
            print(f"Ep {ep} audio_cues.json: updated {cues_count} cues.")

    print("\nAll episodes 2 through 11 normalized successfully!")

if __name__ == "__main__":
    main()
