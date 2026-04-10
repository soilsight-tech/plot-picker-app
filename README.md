# Voices Of Soil — plot on map

Minimal single-page app: pick a country (Israel / France / Kenya), search a place, draw a plot polygon on satellite imagery (with reference labels), approve, then view area/perimeter/vertices and **corner coordinates** `[longitude, latitude]` in the success panel. No authentication.

Derived from the SoilSight web-app polygon question (Leaflet + Turf + Esri imagery).

## Local development

```bash
npm install
npm run dev
```

(Your checkout folder may still be named `plot-picker-app`; that is fine.)

## Deploy on Vercel

1. Push this folder as its **own** Git repository.
2. Import the project in Vercel; framework **Vite**, build `npm run build`, output `dist`.
3. No environment variables are required.

## Data

- `src/data/israeliCities.json` — Israeli places for search (no external API).
- `src/data/frenchCities.json`, `src/data/kenyaCities.json` — curated lists for those regions.
