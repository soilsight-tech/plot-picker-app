# Plot picker (חלקה על מפה)

Minimal single-page app: search an Israeli settlement, draw a plot polygon on satellite imagery, approve, then view area/perimeter/vertices and **corner coordinates** `[longitude, latitude]` in the success panel. No authentication.

Derived from the SoilSight web-app polygon question (Leaflet + Turf + Esri imagery).

## Local development

```bash
cd plot-picker-app
npm install
npm run dev
```

## Deploy on Vercel

1. Push this folder as its **own** Git repository (or use a monorepo with root directory `plot-picker-app`).
2. Import the project in Vercel; framework **Vite**, build `npm run build`, output `dist`.
3. No environment variables are required.

## Data

- `src/data/israeliCities.json` — local city list for search (no external API).
