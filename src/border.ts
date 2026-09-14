export type AppView = "map" | "border";
export type TravelDirection = "into_us" | "into_canada";

export interface LaneWait {
  status: string;
  updateTime: string;
  delayMinutes: number | null;
  lanesOpen: number | null;
}

export interface CrossingDefinition {
  id: string;
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
  zoom: number;
}

export interface CrossingWait extends CrossingDefinition {
  portStatus: string;
  passengerStandard: LaneWait | null;
  updateTime: string;
  direction: TravelDirection;
}

export interface BorderFeed {
  lastUpdated: string;
  direction: TravelDirection;
  crossings: CrossingWait[];
}

export const BORDER_VIEW: [number, number] = [42.308, -83.07];
export const BORDER_ZOOM = 12;

export const CROSSINGS: CrossingDefinition[] = [
  {
    id: "ambassador",
    slug: "ambassador-bridge",
    name: "Ambassador Bridge",
    latitude: 42.31197,
    longitude: -83.07405,
    zoom: 14,
  },
  {
    id: "gordie-howe",
    slug: "gordie-howe-international-bridge",
    name: "Gordie Howe International Bridge",
    latitude: 42.2868,
    longitude: -83.0962,
    zoom: 14,
  },
  {
    id: "windsor-tunnel",
    slug: "windsor-and-detroit-tunnel",
    name: "Windsor Tunnel",
    latitude: 42.3246,
    longitude: -83.0403,
    zoom: 15,
  },
];

const BAROMETER_URL = "https://transitbarometer.com/api/border.json";

export function borderFeedUrl(): string {
  return import.meta.env.DEV ? "/transit-barometer/api/border.json" : BAROMETER_URL;
}

export function crossingById(id: string): CrossingDefinition | undefined {
  return CROSSINGS.find((crossing) => crossing.id === id);
}

export function directionLabel(direction: TravelDirection): string {
  return direction === "into_canada" ? "Into Canada" : "Into the U.S.";
}

export function directionArrowLabel(direction: TravelDirection): string {
  return direction === "into_canada" ? "U.S. → Canada" : "Canada → U.S.";
}

export function travelDirectionFromLocation(
  location: { latitude: number; longitude: number } | null | undefined,
): TravelDirection {
  if (!location) {
    return "into_us";
  }

  return isLikelyInCanada(location.latitude, location.longitude) ? "into_us" : "into_canada";
}

export function isLikelyInCanada(lat: number, lng: number): boolean {
  if (lng >= -83.35 && lng <= -82.85 && lat >= 42.15 && lat <= 42.45) {
    return lat < detroitRiverLatitude(lng);
  }

  if (lng > -82.85 && lng < -66 && lat > 41.6) {
    if (lat < 43.3 && lng > -79.08) {
      return false;
    }

    if (lat >= 41.7 && lng <= -79.08) {
      return true;
    }

    return lat >= 45;
  }

  return lat >= 49;
}

function detroitRiverLatitude(lng: number): number {
  if (lng <= -83.074) {
    const t = (lng + 83.096) / 0.022;
    return 42.29 + t * 0.027;
  }

  const t = (lng + 83.074) / 0.034;
  return 42.317 + t * 0.007;
}

export function formatRelativeUpdated(iso: string, now = Date.now()): string {
  const from = Date.parse(iso);
  if (!Number.isFinite(from)) {
    return "";
  }

  const diffMs = now - from;
  const elapsed = Math.abs(diffMs);
  const minutes = Math.floor(elapsed / 60_000);
  const hours = Math.floor(elapsed / 3_600_000);
  const days = Math.floor(elapsed / 86_400_000);

  if (diffMs < 0 && elapsed < 120_000) {
    return "just now";
  }

  if (minutes < 1) {
    return "just now";
  }

  if (minutes < 60) {
    return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  }

  if (hours < 24) {
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  }

  return days === 1 ? "1 day ago" : `${days} days ago`;
}

export function formatMinutes(minutes: number | null): string {
  if (minutes == null) {
    return "—";
  }

  if (minutes <= 0) {
    return "No delay";
  }

  return `${minutes} min`;
}

export function shortWait(lane: LaneWait | null | undefined): string {
  if (!lane) {
    return "—";
  }

  if (/closed/i.test(lane.status)) {
    return "Closed";
  }

  if (!lane.status || /^n\/a$/i.test(lane.status) || /^unknown$/i.test(lane.status)) {
    return "N/A";
  }

  return formatMinutes(lane.delayMinutes);
}

export function passengerWaitMinutes(crossing?: CrossingWait): number | null {
  const lane = crossing?.passengerStandard;
  if (!lane || /closed/i.test(lane.status) || /^n\/a$/i.test(lane.status) || /^unknown$/i.test(lane.status)) {
    return null;
  }

  return lane.delayMinutes ?? 0;
}

export interface CrossingChartRow {
  id: string;
  name: string;
  minutes: number | null;
  label: string;
  percent: number;
  slowest: boolean;
}

const CHART_NAMES: Record<string, string> = {
  ambassador: "Ambassador Bridge",
  "gordie-howe": "Gordie Howe Bridge",
  "windsor-tunnel": "Windsor Tunnel",
};

export function crossingChartRows(waits: CrossingWait[]): CrossingChartRow[] {
  const rows = CROSSINGS.map((definition) => {
    const wait = waits.find((item) => item.id === definition.id);
    return {
      id: definition.id,
      name: CHART_NAMES[definition.id] ?? definition.name,
      minutes: passengerWaitMinutes(wait),
      label: shortWait(wait?.passengerStandard),
    };
  });

  const measured = rows.map((row) => row.minutes).filter((value): value is number => value != null);
  const peak = measured.length ? Math.max(...measured) : 0;

  return rows.map((row) => ({
    ...row,
    percent: peak <= 0 || row.minutes == null ? 14 : Math.max(16, Math.round((row.minutes / peak) * 100)),
    slowest: row.minutes != null && peak > 0 && row.minutes === peak,
  }));
}

interface BarometerLane {
  text?: string;
  minutes?: number | null;
  kind?: string;
  severity?: string;
}

interface BarometerDirection {
  cars?: BarometerLane | null;
  trucks?: BarometerLane | null;
  status?: string | null;
  updated?: string | null;
  source?: string;
}

interface BarometerCrossing {
  slug?: string;
  name?: string;
  into_canada?: BarometerDirection | null;
  into_us?: BarometerDirection | null;
}

export interface BarometerFeed {
  generated_at?: string;
  generated_at_utc?: string;
  crossings?: BarometerCrossing[];
}

function readLane(direction: BarometerDirection | null | undefined): LaneWait | null {
  const cars = direction?.cars;
  if (!cars) {
    return null;
  }

  const kind = cars.kind?.trim() ?? "";
  const status = /closed/i.test(kind) || /closed/i.test(cars.text ?? "")
    ? "Closed"
    : kind || direction?.status || cars.text || "Open";

  return {
    status,
    updateTime: direction?.updated?.trim() ?? "",
    delayMinutes: typeof cars.minutes === "number" && Number.isFinite(cars.minutes) ? cars.minutes : null,
    lanesOpen: null,
  };
}

function parseUpdatedAt(value: string | undefined): string {
  if (!value) {
    return "";
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : "";
}

export function crossingsFromFeed(feed: BarometerFeed, direction: TravelDirection): CrossingWait[] {
  const bySlug = new Map((feed.crossings ?? []).map((crossing) => [crossing.slug, crossing]));

  return CROSSINGS.map((definition) => {
    const remote = bySlug.get(definition.slug);
    const headed = direction === "into_canada" ? remote?.into_canada : remote?.into_us;
    const passengerStandard = readLane(headed);

    return {
      ...definition,
      portStatus: headed?.status?.trim() || (passengerStandard ? "Open" : ""),
      passengerStandard,
      updateTime: passengerStandard?.updateTime ?? "",
      direction,
    };
  });
}

export function parseBarometerFeed(feed: BarometerFeed, direction: TravelDirection): BorderFeed {
  return {
    lastUpdated: parseUpdatedAt(feed.generated_at_utc) || parseUpdatedAt(feed.generated_at),
    direction,
    crossings: crossingsFromFeed(feed, direction),
  };
}

export async function fetchBarometerFeed(): Promise<BarometerFeed> {
  const response = await fetch(borderFeedUrl(), { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Transit Barometer returned ${response.status}.`);
  }

  return (await response.json()) as BarometerFeed;
}

export async function fetchBorderFeed(direction: TravelDirection = "into_us"): Promise<BorderFeed> {
  return parseBarometerFeed(await fetchBarometerFeed(), direction);
}
