#!/usr/bin/env python3
"""Build data/news.json from ESPN's sports RSS feeds.

ESPN's RSS terms (https://www.espn.com/espn/news/story?page=rssinfo) allow
showing a feed on a website if we display only what the feed provides,
don't modify headlines, summaries or URLs, link to the full article with
the feed's URL, credit ESPN, and don't put advertising into the feed
content. So titles, descriptions and links are stored exactly as published.

Runs on a schedule in GitHub Actions (.github/workflows/news-refresh.yml),
because the feeds send no CORS headers and browsers can't read them
directly. Stdlib only.
"""
import email.utils
import json
import os
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "news.json")
PER_FEED = 12

# (sport key used by the site, display label, feed URL)
FEEDS = [
    ("football", "Football", "https://www.espn.com/espn/rss/soccer/news"),
    ("cricket", "Cricket", "https://www.espn.com/espn/rss/cricket/news"),
    ("nba", "NBA", "https://www.espn.com/espn/rss/nba/news"),
    ("nfl", "NFL", "https://www.espn.com/espn/rss/nfl/news"),
    ("f1", "Formula 1", "https://www.espn.com/espn/rss/f1/news"),
    ("ufc", "UFC", "https://www.espn.com/espn/rss/mma/news"),
    ("tennis", "Tennis", "https://www.espn.com/espn/rss/tennis/news"),
    ("rugby", "Rugby", "https://www.espn.com/espn/rss/rugby/news"),
    ("golf", "Golf", "https://www.espn.com/espn/rss/golf/news"),
    ("motorsport", "Motorsport", "https://www.espn.com/espn/rss/rpm/news"),
    ("boxing", "Boxing", "https://www.espn.com/espn/rss/boxing/news"),
    ("hockey", "Hockey", "https://www.espn.com/espn/rss/nhl/news"),
]
SOURCE = "ESPN"


def text(el, tag):
    found = el.find(tag)
    return (found.text or "").strip() if found is not None and found.text else ""


def exact(s):
    # ESPN's terms forbid modifying feed content, so only surrounding
    # whitespace is trimmed; the text is otherwise stored as published.
    return (s or "").strip()


def iso(pub):
    try:
        return email.utils.parsedate_to_datetime(pub).astimezone(timezone.utc).isoformat()
    except (TypeError, ValueError):
        return None


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; kick-sports-news/1.0)"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def load_previous():
    try:
        with open(OUT, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def main():
    previous = load_previous()
    prev_items = previous.get("items") or []
    items, seen = [], set()
    for sport, label, url in FEEDS:
        try:
            root = ET.fromstring(fetch(url))
        except Exception as e:
            # Keep this sport's last good headlines instead of emptying its page.
            kept = [x for x in prev_items if x.get("sport") == sport]
            print(f"skip {url}: {e}; keeping {len(kept)} previous items", file=sys.stderr)
            items.extend(kept)
            seen.update(x["link"] for x in kept)
            continue
        count = 0
        for it in root.iter("item"):
            link = exact(text(it, "link"))
            title = exact(text(it, "title"))
            if not link or not title or link in seen:
                continue
            seen.add(link)
            items.append({
                "title": title,
                "summary": exact(text(it, "description")),
                "link": link,
                "published": iso(text(it, "pubDate")),
                "source": SOURCE,
                "sport": sport,
                "sportLabel": label,
            })
            count += 1
            if count >= PER_FEED:
                break

    if not items:
        print("No items fetched; leaving existing data untouched", file=sys.stderr)
        return 1

    items.sort(key=lambda x: x["published"] or "", reverse=True)

    # Skip the write when headlines are unchanged, so the job doesn't commit
    # (and redeploy) just because the timestamp moved.
    if prev_items == items:
        print("No changes")
        return 0

    data = {"fetchedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"), "items": items}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    print(f"Wrote {len(items)} headlines")
    return 0


if __name__ == "__main__":
    sys.exit(main())
