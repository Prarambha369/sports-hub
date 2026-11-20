# Sports Hub

A sports news and fixtures website with live match integration and TV schedule listings.

## Features

- **Sports News**: Breaking news, top stories and daily updates across football, cricket, NBA, NFL, F1 and more
- **Live Match Integration**: 24/7 sports channels from sportsonline.st with fetch status and refresh capability
- **Live On TV Today**: TV fixture listings from kokasports.com with broadcast information, refreshed every 3 hours by a GitHub Action
- **Watch: official highlights**: multi-source player for official league YouTube channels (Premier League, Bundesliga, Serie A, ICC, NHL, ATP, WTA, Wimbledon, World Rugby, MotoGP, UFC)
- **Auto-Updated News**: Every 3 hours with fresh/cached badge
- **REA-analyzed**: Public sports data only - no live streams hosted; video limited to official league channels via YouTube's embed player

## Pages

### Homepage (`/`)

- Sport grid with live scores widget
- "Live Match Integration" section at bottom with sportsonline.st matches
- "Live On TV Today" section with kokasports.com fixture listings
- Modern dark theme with responsive grid layout

### News Page (`news.html`)

- "Auto-Updated News (every 3 hours)" with fresh/cached badge
- "Live Match Integration: sportsonline.st (REA DOM: 8,327)" with dynamic matches
- Timestamp showing last update
- REA disclaimer with all data source philosophy

## Integration Sources

### sportsonline.st

- Fetches 24/7 sports channels schedule
- Extracts match data: time | teams | URL
- Display with sport icons, team names, and Play buttons
- Play buttons open exact match URLs in new tab
- Fetch status: "Fetched: [time]" or "never fetched"
- 6-hour caching with Refresh button

### kokasports.com ("On TV Today")

- kokasports.com sends no CORS headers, so the browser can't read it directly
- `scripts/fetch_tv.py` (stdlib Python) parses the "On TV Today" table into `data/tv-today.json`
- `.github/workflows/tv-listings.yml` runs it every 3 hours and commits the JSON; Pages redeploys after it
- The page reads the same-origin JSON: fixture, time (ET), competition and broadcaster chips
- Run locally: `python3 scripts/fetch_tv.py`

### Watch: official highlights

- `assets/js/watch.js` — one tab per official league channel, plays the channel's long-form uploads playlist
- Nothing loads from YouTube until the visitor clicks "Load player" (youtube-nocookie.com)
- Only channels that allow embedding are listed; F1, NBA, NFL, FIFA, LaLiga, UEFA, MLB, PGA Tour, IPL and MLS block playback on other sites
- Each source has an "Open on YouTube" link

## REA Framework

This hub showcases **public sports data only** — fixtures, results, and scores from officially accessible APIs and public sources.

- **No live streams hosted**, no unlicensed content; highlight videos come only from official league channels
- This integration is for **data display and score tracking only**
- All content respects copyright; links out to official sources where applicable

Data sources documented with Evidence IDs and DOM lengths for transparency.

## Technical

- **Caching**: 6-hour localStorage cache for both sportsonline.st and kokasports.com
- **Fetch status**: Automatic updates with visible timestamps
- **Refresh**: Client-side cache clearing and page reload
- **Compatibility**: Dark theme, responsive design, works on mobile and desktop

## Installation

See `scripts/install.sh` for installation instructions.

## License

MIT - free for personal and educational use.