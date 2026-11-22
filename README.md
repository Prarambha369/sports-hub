# Kick Sports

A sports news and scores hub built on public, licensed data only: headlines that link to the original stories, fixtures and results from an open sports API, and highlights from the leagues' own YouTube channels.

Live at **https://prarambha369.github.io/sports-hub/**

## Features

- **Latest headlines**: football, cricket, NBA, NFL, F1, tennis, rugby, golf, boxing, UFC and hockey, from BBC Sport and ESPN RSS. Only the headline and a short summary are shown; every card links to the original article.
- **Scores & fixtures**: the latest result and next match for the Premier League, La Liga, NBA, NFL, NHL and MLB, from [TheSportsDB](https://www.thesportsdb.com), shown in the reader's local time.
- **Official highlights**: a multi-source player for league YouTube channels that allow embedding (Premier League, Bundesliga, Serie A, ICC, NHL, ATP, WTA, Wimbledon, World Rugby, MotoGP, UFC), via YouTube's privacy-enhanced embed.
- **Browse by sport**: each sport tile opens `news.html?sport=<key>`.

No live streams are hosted, linked or embedded.

## Pages

| Page | What it shows |
|---|---|
| `index.html` | Sport tiles, scores & fixtures, official highlights, latest headlines |
| `news.html` | All headlines, filterable by `?sport=` |
| `partnership.html`, `contact.html` | Advertising standards and contact |
| `legal/` | Privacy, cookies, disclaimer and DMCA |

## How the data flows

| Data | Source | How it reaches the page |
|---|---|---|
| Headlines | BBC Sport + ESPN RSS | `scripts/fetch_news.py` runs every 3 hours in `.github/workflows/news-refresh.yml` and commits `data/news.json`; `assets/js/news.js` renders it. RSS feeds send no CORS headers, so the browser can't read them directly. |
| Scores & fixtures | TheSportsDB API | `assets/js/scores.js` calls the API from the browser. |
| Highlights | League YouTube channels | `assets/js/watch.js` embeds each channel's long-form uploads playlist. |

After each headlines refresh, `.github/workflows/static.yml` redeploys GitHub Pages.

## Run locally

It's a static site, so any static server works:

```bash
git clone https://github.com/Prarambha369/sports-hub.git
cd sports-hub
python3 -m http.server 8000   # → http://localhost:8000
```

Refresh the headlines by hand with `python3 scripts/fetch_news.py` (Python 3.8+, standard library only).

## Configuration

- **TheSportsDB key**: `assets/js/scores.js` uses the free public key `123`, which returns one event per call. Get your own key at [thesportsdb.com/api.php](https://www.thesportsdb.com/api.php) for fuller lists.
- **Feeds**: add or remove sports in the `FEEDS` list in `scripts/fetch_news.py`.
- **Highlight channels**: edit `SOURCES` in `assets/js/watch.js`. Only channels that allow embedding will play.

## License

MIT
