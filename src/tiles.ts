const TOMTOM_KEY = import.meta.env.VITE_TOMTOM_API_KEY?.trim() ?? "";

const OSM_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const TOMTOM_ATTR = '&copy; <a href="https://www.tomtom.com">TomTom</a>';

export function hasTomTomKey(): boolean {
  return Boolean(TOMTOM_KEY);
}

export function displayTileUrl(dark: boolean): string {
  if (!TOMTOM_KEY) {
    return OSM_URL;
  }

  const style = dark ? "street-dark" : "street-light";
  return `https://api.tomtom.com/maps/orbis/display/raster/tile/{z}/{x}/{y}?apiVersion=2&style=${style}&key=${encodeURIComponent(TOMTOM_KEY)}`;
}

export function displayAttribution(): string {
  return TOMTOM_KEY ? `${TOMTOM_ATTR} | ${OSM_ATTR}` : OSM_ATTR;
}

export function flowTileUrl(dark: boolean): string {
  const style = dark ? "dark" : "light";
  return `https://api.tomtom.com/maps/orbis/traffic/flow/raster/tile/{z}/{x}/{y}?apiVersion=2&style=${style}&key=${encodeURIComponent(TOMTOM_KEY)}`;
}

export function incidentTileUrl(dark: boolean): string {
  const style = dark ? "dark" : "light";
  return `https://api.tomtom.com/maps/orbis/traffic/incidents/raster/tile/{z}/{x}/{y}?apiVersion=2&style=${style}&key=${encodeURIComponent(TOMTOM_KEY)}`;
}

export function probeTileUrl(kind: "flow" | "incidents"): string {
  const template = kind === "flow" ? flowTileUrl(false) : incidentTileUrl(false);
  return template.replace("{z}", "12").replace("{x}", "1149").replace("{y}", "1503");
}
