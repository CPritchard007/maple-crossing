# Maple Crossing

A Vue 3 + TypeScript + SCSS map that shows your current location on standard OpenStreetMap tiles. Built with Vite and PrimeVue, and deployed to GitHub Pages.

## Local development

```bash
npm install
npm run dev
```

The app asks for location access, then places you on the map.

A chart in the lower-left corner shows live U.S.-bound wait times for the Ambassador Bridge, Gordie Howe International Bridge, and Windsor Tunnel from the [CBP Border Wait Times XML](https://bwt.cbp.gov/xml/bwt.xml). The slowest crossing is highlighted. Click a row to fly the map there.

To show TomTom map tiles and traffic, copy `.env.example` to `.env` and add a TomTom API key:

```bash
cp .env.example .env
```

## Deploy

Pushes to `main` run GitHub Actions, build the app, and publish `dist` to the `gh-pages` branch.

1. Add `VITE_TOMTOM_API_KEY` if you want TomTom tiles in production:
   - **Settings → Secrets and variables → Actions → Repository secrets** (preferred), or
   - the **Variables** tab on that same page.
   - Do **not** put it under **Environments** / Environment secrets. Those are only visible to jobs that set `environment:`, and this workflow does not.
2. Enable **Settings → Pages → Source: Deploy from a branch**, then choose `gh-pages` / `/ (root)`.
3. Push to `main`. The site will be at `https://<user>.github.io/maple-crossing/`.
