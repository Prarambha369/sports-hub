# Sports Hub

A sports news and fixtures website with live match integration and TV schedule listings.

## Features

- **Sports News**: Breaking news, top stories and daily updates across football, cricket, NBA, NFL, F1 and more
- **Live Match Integration**: 24/7 sports channels from sportsonline.st with fetch status and refresh capability
- **Live On TV Today**: TV fixture listings from kokasports.com with broadcast information
- **Auto-Updated News**: Every 3 hours with fresh/cached badge
- **REA-analyzed**: Public sports data only - no video streams, no unlicensed content

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

### kokasports.com

- Fetches "On TV Today" section with fixture listings
- Extracts: competition names, broadcast channels, times
- Display with sport icons (⚽/🏏/🏀/etc.) and broadcast info
- Play buttons open kokasports.com scheduling URLs in new tab
- Fetch status: cached every 6 hours with Refresh button

## REA Framework

This hub showcases **public sports data only** — fixtures, results, and scores from officially accessible APIs and public sources.

- **No video streams**, no unlicensed content
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