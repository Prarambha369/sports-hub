#!/usr/bin/env python3
"""Build data/news.json from public sports RSS feeds (BBC Sport, ESPN).

Only headlines, a short summary and a link back to the original story are
kept; full articles are never copied. Runs on a schedule in GitHub Actions
(.github/workflows/news-refresh.yml), because the feeds send no CORS
headers and browsers can't read them directly. Stdlib only.
"""
import email.utils
import html
import json
import os
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "news.json")
PER_FEED = 12
SUMMARY_MAX = 220

# (sport key used by the site, display label, source, feed URL)
FEEDS = [
    ("football", "Football", "BBC Sport", "https://feeds.bbci.co.uk/sport/football/rss.xml"),
    ("cricket", "Cricket", "BBC Sport", "https://feeds.bbci.co.uk/sport/cricket/rss.xml"),
    ("f1", "Formula 1", "BBC Sport", "https://feeds.bbci.co.uk/sport/formula1/rss.xml"),
    ("tennis", "Tennis", "BBC Sport", "https://feeds.bbci.co.uk/sport/tennis/rss.xml"),
    ("rugby", "Rugby", "BBC Sport", "https://feeds.bbci.co.uk/sport/rugby-union/rss.xml"),
    ("golf", "Golf", "BBC Sport", "https://feeds.bbci.co.uk/sport/golf/rss.xml"),
    ("boxing", "Boxing", "BBC Sport", "https://feeds.bbci.co.uk/sport/boxing/rss.xml"),
    ("ufc", "UFC", "BBC Sport", "https://feeds.bbci.co.uk/sport/mixed-martial-arts/rss.xml"),
    ("nba", "NBA", "ESPN", "https://www.espn.com/espn/rss/nba/news"),
    ("nfl", "NFL", "ESPN", "https://www.espn.com/espn/rss/nfl/news"),
    ("hockey", "Hockey", "ESPN", "https://www.espn.com/espn/rss/nhl/news"),
]


def text(el, tag):
    found = el.find(tag)
    return (found.text or "").strip() if found is not None and found.text else ""


def clean(s):
    s = html.unescape(re.sub(r"<[^>]+>", " ", s or ""))
    s = re.sub(r"\s+", " ", s).strip()
    return s if len(s) <= SUMMARY_MAX else s[: SUMMARY_MAX - 1].rsplit(" ", 1)[0] + "…"


def iso(pub):
    try:
        return email.utils.parsedate_to_datetime(pub).astimezone(timezone.utc).isoformat()
    except (TypeError, ValueError):
        return None


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; kick-sports-news/1.0)"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def main():
    items, seen = [], set()
    for sport, label, source, url in FEEDS:
        try:
            root = ET.fromstring(fetch(url))
        except Exception as e:  # one bad feed must not empty the page
            print(f"skip {url}: {e}", file=sys.stderr)
            continue
        for it in root.iter("item"):
            link = text(it, "link")
            title = clean(text(it, "title"))
            if not link or not title or link in seen:
                continue
            seen.add(link)
            items.append({
                "title": title,
                "summary": clean(text(it, "description")),
                "link": link,
                "published": iso(text(it, "pubDate")),
                "source": source,
                "sport": sport,
                "sportLabel": label,
            })
            if sum(1 for x in items if x["sport"] == sport) >= PER_FEED:
                break

    if not items:
        print("No items fetched; leaving existing data untouched", file=sys.stderr)
        return 1

    items.sort(key=lambda x: x["published"] or "", reverse=True)

    # Skip the write when headlines are unchanged, so the job doesn't commit
    # (and redeploy) just because the timestamp moved.
    try:
        with open(OUT, encoding="utf-8") as f:
            if json.load(f).get("items") == items:
                print("No changes")
                return 0
    except (OSError, ValueError):
        pass

    data = {"fetchedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"), "items": items}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    print(f"Wrote {len(items)} headlines")
    return 0


if __name__ == "__main__":
    sys.exit(main())
