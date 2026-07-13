# Gulf Bite — Corpus Christi Inshore Tracker (Phase A)

A clean, fully-static fishing-conditions dashboard for the Corpus Christi bay system:
live wind/pressure/water-temp, NOAA tides, solunar tables, and species-specific
best-bite scores for **Speckled Trout**, **Redfish**, and **Black Drum** — plus a
Leaflet hotspot map.

**Stack:** Vite + React 18 + CSS Modules. No backend, no Tailwind. Deploys to Vercel.

## Data sources (all browser-side, CORS-friendly)
- **Open-Meteo** forecast + marine API — wind, pressure, air & sea-surface temp.
- **NOAA CO-OPS** tide predictions — stations 8775238 (Aransas Pass) & 8779770 (Packery Channel).
- **Solunar** — pure astronomical calculation (no API).
- **Bite score** — heuristic over the above, per species.

## Scripts
```bash
npm install
npm run dev      # local dev server
npm run build    # production build -> dist/
npm run preview  # preview the build
```

## Project layout
```
src/
  services/   weather.js · tides.js · solunar.js · biteScore.js
  components/ Header · ConditionsDashboard · BiteCard · TideChart · HotspotMap · BlogStub
  App.jsx     hash-router: / (dashboard+map) · /hotspots · /blog (stub)
```

Phase B: Supabase auth + persisted hotspots/reports.
