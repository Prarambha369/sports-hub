#!/usr/bin/env python3
"""Fetch today's "On TV Today" listings from kokasports.com and write
data/tv-today.json (same-origin JSON the site reads in the browser).

kokasports.com sends no CORS headers, so browsers cannot read it directly;
this script runs on a schedule in GitHub Actions instead. Stdlib only.
"""
import html
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timezone

URL = "https://www.kokasports.com/"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "tv-today.json")
ROW_SPLIT = '<div class="flex flex-col sm:flex-row sm:items-stretch"'
MAX_ROWS = 40


def first(pattern, text):
    m = re.search(pattern, text)
    return html.unescape(m.group(1)).strip() if m else ""


def parse(page):
    start = page.find('id="on-tv-today"')
    if start < 0:
        return "", []
    section = page[start:]
    date = first(r'<p class="text-gray-500 text-sm">([^<]+)<', section)
    fixtures = []
    for chunk in section.split(ROW_SPLIT)[1:MAX_ROWS + 1]:
        title = first(r'title="([^"]+)"', chunk)
        if not title:
            continue
        fixtures.append({
            "title": title,
            "sport": first(r'<p class="text-xs text-gray-500 truncate">([^<]*)</p>', chunk),
            "time": first(r'font-family:Rajdhani, sans-serif">([^<]+)<span', chunk),
            "day": first(r'text-\[11px\] font-medium text-gray-400">([^<]+)<', chunk),
            "competition": first(r'<span class="text-xs font-medium"[^>]*>([^<]+)<', chunk),
            "broadcasters": [html.unescape(b).strip() for b in
                             re.findall(r'<span class="px-2 py-1 text-\[11px\] font-semibold"[^>]*>([^<]+)<', chunk)],
        })
    return date.replace("·", "").strip(), fixtures


def main():
    req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0 (compatible; sports-hub-listings/1.0)"})
    with urllib.request.urlopen(req, timeout=30) as r:
        page = r.read().decode("utf-8", "replace")
    date, fixtures = parse(page)
    if not fixtures:
        # Keep the previous file rather than publishing an empty list on a markup change.
        print("No fixtures parsed; leaving existing data untouched", file=sys.stderr)
        return 1
    # Skip the write when the listings are unchanged, so the scheduled job doesn't
    # commit (and redeploy Pages) just because the timestamp moved.
    try:
        with open(OUT, encoding="utf-8") as f:
            old = json.load(f)
        if old.get("date") == date and old.get("fixtures") == fixtures:
            print("Listings unchanged; nothing to write")
            return 0
    except (OSError, ValueError):
        pass
    data = {
        "source": URL,
        "fetchedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "date": date,
        "timezone": "ET",
        "fixtures": fixtures,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    print(f"Wrote {len(fixtures)} fixtures to {os.path.normpath(OUT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
