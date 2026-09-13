export type AppView = "map" | "border";

export interface LaneWait {
  status: string;
  updateTime: string;
  delayMinutes: number | null;
  lanesOpen: number | null;
}

export interface CrossingDefinition {
  id: string;
  portNumber: string;
  name: string;
  latitude: number;
  longitude: number;
  zoom: number;
}

export interface CrossingWait extends CrossingDefinition {
  portStatus: string;
  hours: string;
  date: string;
  passengerStandard: LaneWait | null;
  passengerNexus: LaneWait | null;
  passengerReady: LaneWait | null;
  commercialStandard: LaneWait | null;
  commercialFast: LaneWait | null;
  pedestrianStandard: LaneWait | null;
  notice: string;
  updateTime: string;
}

export interface BorderFeed {
  lastUpdated: string;
  crossings: CrossingWait[];
}

export const BORDER_VIEW: [number, number] = [42.308, -83.07];
export const BORDER_ZOOM = 12;

export const CROSSINGS: CrossingDefinition[] = [
  {
    id: "ambassador",
    portNumber: "380001",
    name: "Ambassador Bridge",
    latitude: 42.31197,
    longitude: -83.07405,
    zoom: 14,
  },
  {
    id: "gordie-howe",
    portNumber: "380102",
    name: "Gordie Howe International Bridge",
    latitude: 42.2868,
    longitude: -83.0962,
    zoom: 14,
  },
  {
    id: "windsor-tunnel",
    portNumber: "380002",
    name: "Windsor Tunnel",
    latitude: 42.3246,
    longitude: -83.0403,
    zoom: 15,
  },
];

const CBP_XML_URL = "https://bwt.cbp.gov/xml/bwt.xml";

export function borderFeedUrl(): string {
  return import.meta.env.DEV ? "/cbp-bwt/xml/bwt.xml" : CBP_XML_URL;
}

export function crossingById(id: string): CrossingDefinition | undefined {
  return CROSSINGS.find((crossing) => crossing.id === id);
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

  if (!lane.status || /^n\/a$/i.test(lane.status)) {
    return "N/A";
  }

  return formatMinutes(lane.delayMinutes);
}

export function passengerWaitMinutes(crossing?: CrossingWait): number | null {
  const lane = crossing?.passengerStandard;
  if (!lane || /closed/i.test(lane.status) || /^n\/a$/i.test(lane.status)) {
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

function textOf(parent: ParentNode, tag: string): string {
  return parent.getElementsByTagName(tag)[0]?.textContent?.trim() ?? "";
}

function childOf(parent: ParentNode, tag: string): Element | null {
  return parent.getElementsByTagName(tag)[0] ?? null;
}

function parseOptionalInt(value: string): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function readLane(parent: Element | null, tag: string): LaneWait | null {
  const node = parent ? childOf(parent, tag) : null;
  if (!node) {
    return null;
  }

  const status = textOf(node, "operational_status");
  if (!status) {
    return null;
  }

  return {
    status,
    updateTime: textOf(node, "update_time"),
    delayMinutes: parseOptionalInt(textOf(node, "delay_minutes")),
    lanesOpen: parseOptionalInt(textOf(node, "lanes_open")),
  };
}

function cleanNotice(value: string): string {
  return value.replace(/^<!\[CDATA\[/i, "").replace(/\]\]>$/i, "").trim();
}

function matchCrossing(port: Element): CrossingDefinition | undefined {
  const portNumber = textOf(port, "port_number");
  const crossingName = textOf(port, "crossing_name").replace(/\s+/g, " ").trim().toLowerCase();

  return (
    CROSSINGS.find((crossing) => crossing.portNumber === portNumber) ??
    CROSSINGS.find((crossing) => crossingName.includes(crossing.name.toLowerCase().replace(" international", "")))
  );
}

export function parseBorderFeed(xml: string): BorderFeed {
  const document = new DOMParser().parseFromString(xml, "application/xml");
  if (document.querySelector("parsererror")) {
    throw new Error("CBP wait-time feed was not valid XML.");
  }

  const lastUpdated = [textOf(document, "last_updated_date"), textOf(document, "last_updated_time")]
    .filter(Boolean)
    .join(" ");

  const crossings: CrossingWait[] = [];

  for (const port of Array.from(document.getElementsByTagName("port"))) {
    const definition = matchCrossing(port);
    if (!definition) {
      continue;
    }

    const passenger = childOf(port, "passenger_vehicle_lanes");
    const commercial = childOf(port, "commercial_vehicle_lanes");
    const pedestrian = childOf(port, "pedestrian_lanes");
    const passengerStandard = readLane(passenger, "standard_lanes");
    const commercialStandard = readLane(commercial, "standard_lanes");

    crossings.push({
      ...definition,
      portStatus: textOf(port, "port_status"),
      hours: textOf(port, "hours"),
      date: textOf(port, "date"),
      passengerStandard,
      passengerNexus: readLane(passenger, "NEXUS_SENTRI_lanes"),
      passengerReady: readLane(passenger, "ready_lanes"),
      commercialStandard,
      commercialFast: readLane(commercial, "FAST_lanes"),
      pedestrianStandard: readLane(pedestrian, "standard_lanes"),
      notice: cleanNotice(textOf(port, "construction_notice")),
      updateTime: passengerStandard?.updateTime || commercialStandard?.updateTime || "",
    });
  }

  crossings.sort(
    (left, right) => CROSSINGS.findIndex((item) => item.id === left.id) - CROSSINGS.findIndex((item) => item.id === right.id),
  );

  return { lastUpdated, crossings };
}

export async function fetchBorderFeed(): Promise<BorderFeed> {
  const response = await fetch(borderFeedUrl(), { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`CBP wait-time feed returned ${response.status}.`);
  }

  return parseBorderFeed(await response.text());
}
