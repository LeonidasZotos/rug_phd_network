import "server-only";

import { createHmac, randomUUID } from "node:crypto";
import { getConfig } from "@/lib/server/config";
import { publicPersonSchema } from "@/lib/public-schema";
import { acquireSyncLease, metadata, releaseSyncLease, replaceSnapshot } from "@/lib/server/db";
import { beginGeocodingBatch, resolveCoordinates } from "@/lib/server/geocode";
import { readApprovedSheetRows, type ApprovedSheetRow } from "@/lib/server/sheets";
import {
  calculatePhdYear,
  cleanText,
  isAffirmativeConsent,
  normalizeCountry,
  normalizeFallbackYear,
  normalizeLinkedIn,
  normalizeOrcid,
  normalizeRugProfile,
  parseInstitutes,
  parseLocation,
  parseTags,
  sheetsSerialToMonth
} from "@/lib/normalization";
import type { PublicPerson } from "@/lib/types";

let activeSync: Promise<void> | undefined;

function publicId(row: ApprovedSheetRow, secret: string): string {
  return createHmac("sha256", secret)
    .update(String(row.sourceTimestamp ?? "missing-timestamp"))
    .digest("base64url")
    .slice(0, 18);
}

async function toPublicPerson(row: ApprovedSheetRow, now: Date, secret: string): Promise<PublicPerson | undefined> {
  const config = getConfig();
  if (config.requireConsent && !isAffirmativeConsent(row.consent)) return undefined;
  const name = cleanText(row.name, 120) || undefined;
  const topics = parseTags(row.topics);
  const hobbies = parseTags(row.hobbies);
  const languages = parseTags(row.languages);
  const homeCountry = normalizeCountry(row.homeCountry);
  const institutes = parseInstitutes(row.institutes);
  const startMonth = sheetsSerialToMonth(row.startDate);
  const currentYearLabel = calculatePhdYear(startMonth, now) ?? normalizeFallbackYear(row.submittedYear);
  const linkedin = normalizeLinkedIn(row.linkedin);
  const orcid = normalizeOrcid(row.orcid);
  const rug = normalizeRugProfile(row.rug);
  const parsedLocation = parseLocation(row.location);
  const coordinates = parsedLocation ? await resolveCoordinates(parsedLocation) : undefined;
  const hasContent = Boolean(name || topics.length || hobbies.length || languages.length || homeCountry || institutes.length || startMonth || currentYearLabel || linkedin || orcid || rug || parsedLocation);
  if (!hasContent) return undefined;

  return publicPersonSchema.parse({
    id: publicId(row, secret),
    ...(name ? { name } : {}),
    ...(parsedLocation && coordinates ? {
      location: {
        city: parsedLocation.city,
        country: parsedLocation.country,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        locationKey: parsedLocation.key.replace("|", "-")
      }
    } : {}),
    ...(startMonth || currentYearLabel ? { phd: { ...(startMonth ? { startMonth } : {}), ...(currentYearLabel ? { currentYearLabel } : {}) } } : {}),
    ...(homeCountry ? { homeCountry } : {}),
    ...(languages.length ? { languages } : {}),
    institutes,
    topics,
    hobbies,
    links: { ...(linkedin ? { linkedin } : {}), ...(orcid ? { orcid } : {}), ...(rug ? { rug } : {}) }
  });
}

async function performSync(persist: boolean): Promise<PublicPerson[]> {
  const config = getConfig();
  if (!config.liveMode) return [];
  if (!config.PUBLIC_ID_SECRET) throw new Error("public_id_secret_missing");
  const owner = randomUUID();
  if (persist && !acquireSyncLease(owner)) return [];
  try {
    const rows = await readApprovedSheetRows();
    if (persist) {
      const previousCount = Number(metadata("last_row_count") ?? "0");
      if (previousCount >= 10 && rows.length < previousCount * 0.5) throw new Error("suspicious_row_count_collapse");
    }
    const now = new Date();
    const people: PublicPerson[] = [];
    beginGeocodingBatch();
    for (const row of rows) {
      const person = await toPublicPerson(row, now, config.PUBLIC_ID_SECRET);
      if (person && !config.suppressedIds.has(person.id)) people.push(person);
    }
    const unique = new Map(people.map((person) => [person.id, person]));
    const validated = [...unique.values()];
    if (persist) replaceSnapshot(validated, now.toISOString());
    return validated;
  } finally {
    if (persist) releaseSyncLease(owner);
  }
}

export function syncSheet(): Promise<void> {
  activeSync ??= performSync(true).then(() => undefined).finally(() => { activeSync = undefined; });
  return activeSync;
}

export function previewSheetSync(): Promise<PublicPerson[]> {
  return performSync(false);
}
