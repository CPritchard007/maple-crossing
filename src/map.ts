import L from "leaflet";
import type { UserLocation } from "./location";
import { CROSSINGS, crossingById, BORDER_ZOOM, type CrossingDefinition } from "./border";
import { probeTrafficApis, type TrafficAvailability } from "./traffic";
import { displayAttribution, displayTileUrl, flowTileUrl, hasTomTomKey, incidentTileUrl } from "./tiles";

const DEFAULT_VIEW: L.LatLngExpression = [43.6532, -79.3832];
const DEFAULT_ZOOM = 12;
const LOCATED_ZOOM = 16;

export interface CrossingMarkerData {
  id: string;
  name: string;
  waitLabel: string;
}

export interface MapController {
  setUserLocation: (location: UserLocation, options?: { follow?: boolean }) => void;
  enableTrafficIfAvailable: (dark: boolean) => Promise<TrafficAvailability>;
  setFlowVisible: (visible: boolean) => void;
  setIncidentsVisible: (visible: boolean) => void;
  setIncidentTheme: (dark: boolean) => void;
  setCrossingMarkers: (
    markers: CrossingMarkerData[],
    selectedId: string | null,
    onSelect: (id: string) => void,
  ) => void;
  clearCrossingMarkers: () => void;
  focusCrossing: (id: string) => void;
  focusBorderOverview: () => void;
  focusHome: (location: UserLocation | null) => void;
  setFollowUser: (follow: boolean) => void;
  invalidateSize: () => void;
  destroy: () => void;
}

function crossingIcon(selected: boolean, waitLabel: string): L.DivIcon {
  return L.divIcon({
    className: `crossing-marker${selected ? " is-selected" : ""}`,
    html: `<span class="crossing-marker__pin"></span><span class="crossing-marker__wait">${waitLabel}</span>`,
    iconSize: [92, 28],
    iconAnchor: [10, 26],
  });
}

export function createMap(container: HTMLElement): MapController {
  const map = L.map(container, {
    zoomControl: true,
    attributionControl: true,
  }).setView(DEFAULT_VIEW, DEFAULT_ZOOM);

  map.attributionControl.setPosition("bottomleft");

  map.createPane("baseTiles");
  const basePane = map.getPane("baseTiles");
  if (basePane) {
    basePane.style.zIndex = "200";
  }

  map.createPane("trafficFlow");
  const flowPane = map.getPane("trafficFlow");
  if (flowPane) {
    flowPane.style.zIndex = "350";
    flowPane.style.pointerEvents = "none";
  }

  map.createPane("trafficIncidents");
  const incidentPane = map.getPane("trafficIncidents");
  if (incidentPane) {
    incidentPane.style.zIndex = "450";
    incidentPane.style.pointerEvents = "none";
  }

  if (hasTomTomKey()) {
    document.documentElement.dataset.basemap = "tomtom";
  }

  const baseLayer = L.tileLayer(displayTileUrl(false), {
    pane: "baseTiles",
    maxZoom: hasTomTomKey() ? 22 : 19,
    attribution: displayAttribution(),
  }).addTo(map);

  const flowLayer = L.tileLayer(flowTileUrl(false), {
    pane: "trafficFlow",
    maxZoom: 22,
    opacity: 0.6,
  });

  const incidentLayer = L.tileLayer(incidentTileUrl(false), {
    pane: "trafficIncidents",
    maxZoom: 22,
    opacity: 0.6,
  });

  const accuracyCircle = L.circle(DEFAULT_VIEW, {
    radius: 0,
    color: "#1d6b4f",
    weight: 1,
    fillColor: "#2f9e73",
    fillOpacity: 0.12,
  });

  const marker = L.marker(DEFAULT_VIEW, {
    icon: L.divIcon({
      className: "user-location",
      html: '<span class="user-location__pulse"></span><span class="user-location__dot"></span>',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    }),
    keyboard: false,
    title: "Your current location",
  });

  const crossingLayer = L.layerGroup();
  const crossingMarkers = new Map<string, L.Marker>();
  let onCrossingSelect: ((id: string) => void) | undefined;
  let flowVisible = true;
  let incidentsVisible = true;
  let hasCentered = false;
  let followUser = true;
  let trafficReady = false;

  function showFlow(visible: boolean): void {
    if (visible && trafficReady && !map.hasLayer(flowLayer)) {
      flowLayer.addTo(map);
      return;
    }

    if (!visible && map.hasLayer(flowLayer)) {
      map.removeLayer(flowLayer);
    }
  }

  function showIncidents(visible: boolean): void {
    if (visible && trafficReady && !map.hasLayer(incidentLayer)) {
      incidentLayer.addTo(map);
      return;
    }

    if (!visible && map.hasLayer(incidentLayer)) {
      map.removeLayer(incidentLayer);
    }
  }

  function placeOf(id: string): CrossingDefinition | undefined {
    return crossingById(id);
  }

  return {
    setUserLocation(location: UserLocation, options) {
      const shouldFollow = options?.follow ?? followUser;
      const latLng: L.LatLngExpression = [location.latitude, location.longitude];

      accuracyCircle.setLatLng(latLng).setRadius(location.accuracy);
      marker.setLatLng(latLng);

      if (!map.hasLayer(accuracyCircle)) {
        accuracyCircle.addTo(map);
      }

      if (!map.hasLayer(marker)) {
        marker.addTo(map);
      }

      if (!shouldFollow) {
        return;
      }

      if (!hasCentered) {
        map.flyTo(latLng, LOCATED_ZOOM, { duration: 1.1 });
        hasCentered = true;
        return;
      }

      map.panTo(latLng);
    },
    async enableTrafficIfAvailable(dark: boolean) {
      flowLayer.setUrl(flowTileUrl(dark));
      incidentLayer.setUrl(incidentTileUrl(dark));

      const available = await probeTrafficApis();
      trafficReady = available.flow || available.incidents;

      if (available.flow) {
        showFlow(flowVisible);
      }

      if (available.incidents) {
        showIncidents(incidentsVisible);
      }

      return available;
    },
    setFlowVisible(visible: boolean) {
      flowVisible = visible;
      showFlow(visible);
    },
    setIncidentsVisible(visible: boolean) {
      incidentsVisible = visible;
      showIncidents(visible);
    },
    setIncidentTheme(dark: boolean) {
      baseLayer.setUrl(displayTileUrl(dark));
      flowLayer.setUrl(flowTileUrl(dark));
      incidentLayer.setUrl(incidentTileUrl(dark));
    },
    setCrossingMarkers(markers, selectedId, onSelect) {
      onCrossingSelect = onSelect;
      crossingLayer.clearLayers();
      crossingMarkers.clear();

      for (const item of markers) {
        const place = placeOf(item.id);
        if (!place) {
          continue;
        }

        const crossingMarker = L.marker([place.latitude, place.longitude], {
          icon: crossingIcon(item.id === selectedId, item.waitLabel),
          title: `${item.name} · ${item.waitLabel}`,
          keyboard: true,
        }).on("click", () => onCrossingSelect?.(item.id));

        crossingMarker.addTo(crossingLayer);
        crossingMarkers.set(item.id, crossingMarker);
      }

      if (!map.hasLayer(crossingLayer)) {
        crossingLayer.addTo(map);
      }
    },
    clearCrossingMarkers() {
      crossingLayer.clearLayers();
      crossingMarkers.clear();
      if (map.hasLayer(crossingLayer)) {
        map.removeLayer(crossingLayer);
      }
    },
    focusCrossing(id: string) {
      const place = placeOf(id);
      if (!place) {
        return;
      }

      followUser = false;
      hasCentered = true;
      map.flyTo([place.latitude, place.longitude], place.zoom, { duration: 1 });
    },
    focusBorderOverview() {
      followUser = false;
      hasCentered = true;
      const bounds = L.latLngBounds(CROSSINGS.map((place) => [place.latitude, place.longitude]));
      map.flyToBounds(bounds.pad(0.35), { duration: 1, maxZoom: BORDER_ZOOM });
    },
    focusHome(location: UserLocation | null) {
      followUser = true;
      if (location) {
        hasCentered = true;
        map.flyTo([location.latitude, location.longitude], LOCATED_ZOOM, { duration: 1 });
        return;
      }

      hasCentered = false;
      map.flyTo(DEFAULT_VIEW, DEFAULT_ZOOM, { duration: 1 });
    },
    setFollowUser(follow: boolean) {
      followUser = follow;
      if (follow) {
        return;
      }

      hasCentered = true;
    },
    invalidateSize() {
      map.invalidateSize();
    },
    destroy() {
      map.remove();
    },
  };
}
