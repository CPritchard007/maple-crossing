import { hasTomTomKey, probeTileUrl } from "./tiles";

export interface TrafficAvailability {
  flow: boolean;
  incidents: boolean;
  error?: string;
}

function loadTile(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image.naturalWidth > 0);
    image.onerror = () => resolve(false);
    image.src = url;
  });
}

export async function probeTrafficApis(): Promise<TrafficAvailability> {
  if (!hasTomTomKey()) {
    return { flow: false, incidents: false };
  }

  const [flow, incidents] = await Promise.all([
    loadTile(probeTileUrl("flow")),
    loadTile(probeTileUrl("incidents")),
  ]);

  if (!flow && !incidents) {
    return {
      flow: false,
      incidents: false,
      error:
        "TomTom is still blocking Orbis traffic tiles on this key. Confirm Orbis Traffic Flow/Incidents Extended tiles are enabled, wait a minute, then refresh.",
    };
  }

  return { flow, incidents };
}
