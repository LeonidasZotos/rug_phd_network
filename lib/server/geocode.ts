import "server-only";

import fs from "node:fs";
import path from "node:path";
import { getConfig } from "@/lib/server/config";
import { readCachedLocation, writeCachedLocation } from "@/lib/server/db";
import { foldText } from "@/lib/normalization";

type LocationInput = { city: string; country: string; key: string };
type Coordinates = { latitude: number; longitude: number };
let remainingNetworkLookups = 4;
let lastNetworkLookupAt = 0;

export function beginGeocodingBatch(): void {
  remainingNetworkLookups = 4;
  lastNetworkLookupAt = 0;
}

function manualOverride(location: LocationInput): Coordinates | undefined {
  const files = [
    path.join(getConfig().dataDir, "location-overrides.json"),
    path.join(process.cwd(), "config", "location-overrides.json")
  ];
  for (const file of files) {
    if (!fs.existsSync(/* turbopackIgnore: true */ file)) continue;
    try {
      const overrides = JSON.parse(fs.readFileSync(/* turbopackIgnore: true */ file, "utf8")) as Record<string, Coordinates>;
      const item = overrides[location.key];
      if (item && Number.isFinite(item.latitude) && Number.isFinite(item.longitude) && Math.abs(item.latitude) <= 90 && Math.abs(item.longitude) <= 180) return item;
    } catch {
      // Try the next source. Invalid overrides never reach the public dataset.
    }
  }
  return undefined;
}

export async function resolveCoordinates(location: LocationInput): Promise<Coordinates | undefined> {
  const override = manualOverride(location);
  if (override) return override;
  const cached = readCachedLocation(location.key);
  if (cached?.status === "success" && cached.latitude !== undefined && cached.longitude !== undefined) {
    return { latitude: cached.latitude, longitude: cached.longitude };
  }
  if (cached && cached.status !== "error") return undefined;

  const config = getConfig();
  if (!config.geocodingEnabled) return undefined;
  if (remainingNetworkLookups <= 0) return undefined;
  remainingNetworkLookups -= 1;
  const waitMs = Math.max(0, 15_100 - (Date.now() - lastNetworkLookupAt));
  if (waitMs) await new Promise((resolve) => setTimeout(resolve, waitMs));
  lastNetworkLookupAt = Date.now();
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("q", `${location.city}, ${location.country}`);
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "5");

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": config.GEOCODER_USER_AGENT, Accept: "application/json" },
      signal: AbortSignal.timeout(12_000)
    });
    if (!response.ok) throw new Error("provider_unavailable");
    const results = (await response.json()) as Array<{ lat?: string; lon?: string; addresstype?: string; address?: { country?: string } }>;
    const acceptedTypes = new Set(["city", "town", "village", "municipality", "administrative"]);
    const matches = results.filter((result) => {
      const sameCountry = foldText(result.address?.country ?? "") === foldText(location.country);
      return sameCountry && acceptedTypes.has(result.addresstype ?? "");
    });
    if (matches.length !== 1) {
      writeCachedLocation({ ...location, status: matches.length ? "ambiguous" : "not_found", provider: "nominatim" });
      return undefined;
    }
    const latitude = Number(matches[0].lat);
    const longitude = Number(matches[0].lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) throw new Error("invalid_coordinates");
    writeCachedLocation({ ...location, status: "success", latitude, longitude, provider: "nominatim" });
    return { latitude, longitude };
  } catch {
    writeCachedLocation({ ...location, status: "error", provider: "nominatim" });
    return undefined;
  }
}
