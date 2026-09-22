import "server-only";

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { publicPersonSchema } from "@/lib/public-schema";
import { getConfig } from "@/lib/server/config";
import type { PublicDataset, PublicPerson } from "@/lib/types";

let database: Database.Database | undefined;

export function getDatabase(): Database.Database {
  if (database) return database;
  const { dataDir } = getConfig();
  fs.mkdirSync(dataDir, { recursive: true, mode: 0o750 });
  database = new Database(path.join(dataDir, "phd-network.sqlite"));
  database.pragma("journal_mode = WAL");
  database.pragma("busy_timeout = 5000");
  database.pragma("foreign_keys = ON");
  database.exec(`
    CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS public_people (
      id TEXT PRIMARY KEY,
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS location_cache (
      location_key TEXT PRIMARY KEY,
      city TEXT NOT NULL,
      country TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      status TEXT NOT NULL CHECK(status IN ('success', 'not_found', 'ambiguous', 'error')),
      provider TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sync_lease (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      owner TEXT NOT NULL,
      locked_until INTEGER NOT NULL
    );
    PRAGMA user_version = 1;
  `);
  return database;
}

export function metadata(key: string): string | undefined {
  const row = getDatabase().prepare("SELECT value FROM metadata WHERE key = ?").get(key) as { value: string } | undefined;
  return row?.value;
}

export function readSnapshot(): PublicDataset | undefined {
  const lastUpdated = metadata("last_successful_sync");
  if (!lastUpdated) return undefined;
  const rows = getDatabase().prepare("SELECT payload FROM public_people ORDER BY id").all() as Array<{ payload: string }>;
  return {
    schemaVersion: 1,
    mode: "live",
    lastUpdated,
    people: rows.map((row) => publicPersonSchema.parse(JSON.parse(row.payload)))
  };
}

export function replaceSnapshot(people: PublicPerson[], syncedAt: string): void {
  const db = getDatabase();
  const insert = db.prepare("INSERT INTO public_people (id, payload) VALUES (?, ?)");
  const setMeta = db.prepare("INSERT INTO metadata (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");
  db.transaction(() => {
    db.prepare("DELETE FROM public_people").run();
    for (const person of people) insert.run(person.id, JSON.stringify(person));
    setMeta.run("last_successful_sync", syncedAt);
    setMeta.run("last_row_count", String(people.length));
    setMeta.run("snapshot_version", crypto.randomUUID());
  })();
  db.pragma("optimize");
}

export function acquireSyncLease(owner: string, now = Date.now(), durationMs = 120_000): boolean {
  const db = getDatabase();
  return db.transaction(() => {
    const row = db.prepare("SELECT owner, locked_until FROM sync_lease WHERE id = 1").get() as { owner: string; locked_until: number } | undefined;
    if (row && row.locked_until > now && row.owner !== owner) return false;
    db.prepare("INSERT INTO sync_lease (id, owner, locked_until) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET owner = excluded.owner, locked_until = excluded.locked_until").run(owner, now + durationMs);
    return true;
  })();
}

export function releaseSyncLease(owner: string): void {
  getDatabase().prepare("DELETE FROM sync_lease WHERE id = 1 AND owner = ?").run(owner);
}

export type CachedLocation = {
  status: "success" | "not_found" | "ambiguous" | "error";
  latitude?: number;
  longitude?: number;
};

export function readCachedLocation(key: string): CachedLocation | undefined {
  const row = getDatabase().prepare("SELECT status, latitude, longitude FROM location_cache WHERE location_key = ?").get(key) as { status: CachedLocation["status"]; latitude: number | null; longitude: number | null } | undefined;
  if (!row) return undefined;
  return { status: row.status, latitude: row.latitude ?? undefined, longitude: row.longitude ?? undefined };
}

export function writeCachedLocation(input: { key: string; city: string; country: string; status: CachedLocation["status"]; latitude?: number; longitude?: number; provider: string }): void {
  getDatabase().prepare(`
    INSERT INTO location_cache (location_key, city, country, latitude, longitude, status, provider, updated_at)
    VALUES (@key, @city, @country, @latitude, @longitude, @status, @provider, @updatedAt)
    ON CONFLICT(location_key) DO UPDATE SET city=excluded.city, country=excluded.country,
      latitude=excluded.latitude, longitude=excluded.longitude, status=excluded.status,
      provider=excluded.provider, updated_at=excluded.updated_at
  `).run({ ...input, latitude: input.latitude ?? null, longitude: input.longitude ?? null, updatedAt: new Date().toISOString() });
}
