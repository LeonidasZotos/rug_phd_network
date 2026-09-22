import "server-only";

import { demoDataset } from "@/lib/demo-data";
import { getConfig, readSuppressedIds } from "@/lib/server/config";
import { metadata, readSnapshot } from "@/lib/server/db";
import { syncSheet } from "@/lib/server/sync";
import type { PublicDataset } from "@/lib/types";

export async function getPublicDataset(): Promise<PublicDataset> {
  const config = getConfig();
  if (!config.liveMode) return demoDataset;
  const previous = readSnapshot();
  const lastUpdated = metadata("last_successful_sync");
  const stale = !lastUpdated || Date.now() - new Date(lastUpdated).valueOf() >= config.CACHE_TTL_SECONDS * 1_000;
  if (stale) {
    try {
      await syncSheet();
    } catch {
      // A stale but valid projection is safer than exposing upstream error details.
    }
  }
  const current = readSnapshot() ?? previous;
  if (!current) throw new Error("public_dataset_unavailable");
  return {
    ...current,
    people: current.people.filter((person) => !readSuppressedIds().has(person.id))
  };
}
