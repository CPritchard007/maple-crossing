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

Pushes to `main` build and publish through GitHub Actions.

1. Enable **Settings → Pages → Source: GitHub Actions**.
2. Push this repository to GitHub.
3. The site will be available at `https://<user>.github.io/maple-crossing/`.
