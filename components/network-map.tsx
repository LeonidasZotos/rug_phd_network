"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map as MapLibreMap, Marker } from "maplibre-gl";
import { MapPin, RotateCcw, Users } from "lucide-react";
import { initials } from "@/lib/client-data";
import type { LocationGroup, PublicPerson } from "@/lib/types";

type Props = {
  groups: LocationGroup[];
  selectedGroupKey?: string;
  selectedPersonId?: string;
  onSelectGroup: (group: LocationGroup | undefined) => void;
  onSelectPerson: (person: PublicPerson) => void;
};

const SOURCE_ID = "phd-cities";
const MAPLIBRE_WORKER_URL = "/maplibre/maplibre-gl-worker.mjs";
const MAP_LOAD_TIMEOUT_MS = 12_000;
const FALLBACK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: "fallback-background", type: "background", paint: { "background-color": "rgba(232,237,242,0.72)" } }]
};

const DEFAULT_MAP_STYLE_URL = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

function graticuleGeoJson(): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  for (let longitude = -150; longitude <= 180; longitude += 30) {
    features.push({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [[longitude, -80], [longitude, 80]] } });
  }
  for (let latitude = -60; latitude <= 60; latitude += 30) {
    features.push({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [[-180, latitude], [180, latitude]] } });
  }
  return { type: "FeatureCollection", features };
}

function toGeoJson(groups: LocationGroup[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: groups.map((group) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [group.location.longitude, group.location.latitude]
      },
      properties: {
        key: group.key,
        count: group.people.length,
        label: `${group.location.city}, ${group.location.country}`
      }
    }))
  };
}

export function NetworkMap({
  groups,
  selectedGroupKey,
  selectedPersonId,
  onSelectGroup,
  onSelectPerson
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const spiderMarkersRef = useRef<Marker[]>([]);
  const fallbackMarkersRef = useRef<Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [fallbackMap, setFallbackMap] = useState(false);
  const groupLookupRef = useRef(new Map<string, LocationGroup>());
  const selectedGroup = useMemo(
    () => groups.find((group) => group.key === selectedGroupKey),
    [groups, selectedGroupKey]
  );

  useEffect(() => {
    groupLookupRef.current = new Map(groups.map((group) => [group.key, group]));
  }, [groups]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    maplibregl.setWorkerUrl(MAPLIBRE_WORKER_URL);
    const externalStyle =
      process.env.NEXT_PUBLIC_MAP_STYLE_URL || DEFAULT_MAP_STYLE_URL;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: externalStyle,
      center: [7, 35],
      zoom: 1.35,
      minZoom: 1,
      attributionControl: false
    });
    mapRef.current = map;
    let fallbackApplied = false;
    let mapLoadComplete = false;
    let layersInitialized = false;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");

    map.on("click", (event) => {
      const cityLayers = ["city-clusters", "city-points"].filter((layerId) => map.getLayer(layerId));
      const clickedCity = cityLayers.length > 0
        && map.queryRenderedFeatures(event.point, { layers: cityLayers }).length > 0;
      if (!clickedCity) onSelectGroup(undefined);
    });

    const initializeLocationLayers = () => {
      if (layersInitialized) return;
      layersInitialized = true;
      if (!map.getSource("graticule")) {
        map.addSource("graticule", { type: "geojson", data: graticuleGeoJson() });
        map.addLayer({
          id: "graticule-lines",
          type: "line",
          source: "graticule",
          paint: { "line-color": "#c9d2dc", "line-width": 1, "line-opacity": 0.7 }
        });
      }
      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: toGeoJson([...groupLookupRef.current.values()]),
        cluster: true,
        clusterRadius: 52,
        clusterMaxZoom: 8,
        clusterProperties: {
          people: ["+", ["get", "count"]]
        }
      });
      map.addLayer({
        id: "city-clusters",
        type: "circle",
        source: SOURCE_ID,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#152238",
          "circle-radius": ["step", ["get", "point_count"], 19, 8, 23, 24, 28],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 3
        }
      });
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: SOURCE_ID,
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["to-string", ["get", "people"]],
          "text-size": 13,
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"]
        },
        paint: { "text-color": "#ffffff" }
      });
      map.addLayer({
        id: "city-points",
        type: "circle",
        source: SOURCE_ID,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#d7374a",
          "circle-radius": ["interpolate", ["linear"], ["get", "count"], 1, 9, 4, 13, 12, 17],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 3
        }
      });
      map.addLayer({
        id: "city-count",
        type: "symbol",
        source: SOURCE_ID,
        filter: ["all", ["!", ["has", "point_count"]], [">", ["get", "count"], 1]],
        layout: {
          "text-field": ["to-string", ["get", "count"]],
          "text-size": 11,
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"]
        },
        paint: { "text-color": "#ffffff" }
      });

      map.on("click", "city-clusters", async (event) => {
        const feature = event.features?.[0];
        const clusterId = feature?.properties?.cluster_id;
        const coordinates = feature?.geometry.type === "Point" ? feature.geometry.coordinates : undefined;
        if (clusterId === undefined || !coordinates) return;
        onSelectGroup(undefined);
        const source = map.getSource(SOURCE_ID) as GeoJSONSource;
        const zoom = await source.getClusterExpansionZoom(clusterId);
        map.easeTo({ center: coordinates as [number, number], zoom });
      });

      map.on("click", "city-points", (event) => {
        const key = String(event.features?.[0]?.properties?.key ?? "");
        const group = groupLookupRef.current.get(key);
        if (!group) return;
        if (group.people.length === 1) onSelectPerson(group.people[0]);
        else onSelectGroup(group);
      });

      for (const layer of ["city-clusters", "city-points"]) {
        map.on("mouseenter", layer, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layer, () => {
          map.getCanvas().style.cursor = "";
        });
      }

      setMapReady(true);
    };

    const applyFallbackStyle = () => {
      if (fallbackApplied || mapLoadComplete) return;
      fallbackApplied = true;
      setFallbackMap(true);
      map.once("style.load", () => {
        mapLoadComplete = true;
        setMapReady(true);
      });
      try {
        map.setStyle(FALLBACK_STYLE);
      } catch (error) {
        console.error("Unable to apply the fallback map style.", error);
        setMapFailed(true);
      }
    };

    const loadTimeout = window.setTimeout(applyFallbackStyle, MAP_LOAD_TIMEOUT_MS);

    map.on("load", () => {
      window.clearTimeout(loadTimeout);
      if (fallbackApplied) {
        mapLoadComplete = true;
        setMapReady(true);
        return;
      }
      try {
        initializeLocationLayers();
        mapLoadComplete = true;
      } catch (error) {
        console.error("Unable to initialize the location layers.", error);
        applyFallbackStyle();
      }
    });
    map.on("error", (event) => {
      console.error("MapLibre reported an error.", event.error);
    });

    return () => {
      window.clearTimeout(loadTimeout);
      spiderMarkersRef.current.forEach((marker) => marker.remove());
      fallbackMarkersRef.current.forEach((marker) => marker.remove());
      map.remove();
      mapRef.current = null;
    };
  }, [onSelectGroup, onSelectPerson]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
    source?.setData(toGeoJson(groups));
  }, [groups, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    fallbackMarkersRef.current.forEach((marker) => marker.remove());
    fallbackMarkersRef.current = [];
    if (!map || !mapReady || !fallbackMap) return;
    for (const group of groups) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "fallback-city-marker";
      button.textContent = String(group.people.length);
      button.setAttribute("aria-label", `${group.people.length} ${group.people.length === 1 ? "researcher" : "researchers"} in ${group.location.city}, ${group.location.country}`);
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        if (group.people.length === 1) onSelectPerson(group.people[0]);
        else onSelectGroup(group);
      });
      fallbackMarkersRef.current.push(
        new maplibregl.Marker({ element: button })
          .setLngLat([group.location.longitude, group.location.latitude])
          .addTo(map)
      );
    }
  }, [fallbackMap, groups, mapReady, onSelectGroup, onSelectPerson]);

  useEffect(() => {
    const map = mapRef.current;
    spiderMarkersRef.current.forEach((marker) => marker.remove());
    spiderMarkersRef.current = [];
    if (!map || !selectedGroup || selectedGroup.people.length < 2) return;

    const people = selectedGroup.people.slice(0, 12);
    const count = people.length;
    const radius = count <= 6 ? 48 : 66;
    people.forEach((person, index) => {
      const angle = -Math.PI / 2 + (Math.PI * 2 * index) / count;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "spider-person" + (person.id === selectedPersonId ? " is-selected" : "");
      button.textContent = initials(person.name);
      button.setAttribute("aria-label", `Open profile for ${person.name ?? "unnamed researcher"}`);
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        onSelectPerson(person);
      });
      const marker = new maplibregl.Marker({
        element: button,
        anchor: "center",
        offset: [Math.cos(angle) * radius, Math.sin(angle) * radius]
      })
        .setLngLat([selectedGroup.location.longitude, selectedGroup.location.latitude])
        .addTo(map);
      spiderMarkersRef.current.push(marker);
    });

    map.easeTo({
      center: [selectedGroup.location.longitude, selectedGroup.location.latitude],
      zoom: Math.max(map.getZoom(), 7),
      offset: [0, 70],
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 500
    });
  }, [onSelectPerson, selectedGroup, selectedPersonId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !selectedPersonId) return;

    const personGroup = groups.find((group) =>
      group.people.some((person) => person.id === selectedPersonId)
    );
    if (!personGroup) return;

    const desktopProfileOffset = window.innerWidth > 980 ? -195 : -175;
    const offset: [number, number] = window.innerWidth > 760
      ? [desktopProfileOffset, 0]
      : [0, 0];
    const zoom = Math.max(7, Math.min(map.getZoom(), 9));

    map.easeTo({
      center: [personGroup.location.longitude, personGroup.location.latitude],
      zoom,
      offset,
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 600
    });
  }, [groups, mapReady, selectedPersonId]);

  function resetView() {
    onSelectGroup(undefined);
    mapRef.current?.easeTo({ center: [7, 35], zoom: 1.35 });
  }

  return (
    <section className="map-shell" aria-label="Map of PhD researchers">
      <div ref={containerRef} className="map-canvas" aria-hidden="true" />
      {!mapReady && !mapFailed ? <div className="map-status">Preparing the map…</div> : null}
      {mapFailed ? (
        <div className="map-status map-error">
          <MapPin aria-hidden="true" />
          <strong>The map is unavailable.</strong>
          <span>You can still browse every profile in the people list.</span>
        </div>
      ) : null}
      {fallbackMap && mapReady ? <div className="map-fallback-note">Basemap unavailable · locations still shown</div> : null}
      <button className="map-reset" type="button" onClick={resetView}>
        <RotateCcw size={16} aria-hidden="true" />
        World view
      </button>
      {selectedGroup ? (
        <aside className="city-card" aria-label={`People in ${selectedGroup.location.city}`}>
          <div className="city-card-heading">
            <div>
              <span className="eyebrow">Selected city</span>
              <h2>{selectedGroup.location.city}</h2>
              <p>{selectedGroup.location.country}</p>
            </div>
            <span className="city-total"><Users size={15} /> {selectedGroup.people.length}</span>
          </div>
          <div className="city-people">
            {selectedGroup.people.map((person) => (
              <button
                key={person.id}
                type="button"
                className={person.id === selectedPersonId ? "is-selected" : ""}
                onClick={() => onSelectPerson(person)}
              >
                <span className="mini-avatar">{initials(person.name)}</span>
                <span>{person.name ?? "Unnamed profile"}</span>
              </button>
            ))}
          </div>
        </aside>
      ) : null}
    </section>
  );
}
