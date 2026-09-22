import "server-only";

import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

const envSchema = z.object({
  GOOGLE_SHEET_ID: z.string().trim().optional(),
  GOOGLE_SHEET_TAB: z.string().trim().default("Form Responses 1"),
  SHEET_CONSENT_HEADER: z.string().trim().default("I consent to sharing this information publicly on the PhD network website."),
  REQUIRE_EXPLICIT_CONSENT: z.enum(["true", "false"]).default("true"),
  PUBLIC_ID_SECRET: z.string().min(32).optional(),
  SUPPRESSED_PUBLIC_IDS: z.string().optional(),
  DATA_DIR: z.string().default("./data"),
  CACHE_TTL_SECONDS: z.coerce.number().int().min(60).max(3600).default(300),
  GEOCODING_ENABLED: z.enum(["true", "false"]).default("false"),
  GEOCODER_USER_AGENT: z.string().trim().default("rug-phd-network/0.1 (phd.council.hum@rug.nl)")
});

export type AppConfig = ReturnType<typeof getConfig>;

let cached: z.infer<typeof envSchema> | undefined;

export function getConfig() {
  cached ??= envSchema.parse(process.env);
  return {
    ...cached,
    dataDir: path.resolve(cached.DATA_DIR),
    liveMode: Boolean(cached.GOOGLE_SHEET_ID),
    requireConsent: cached.REQUIRE_EXPLICIT_CONSENT === "true",
    geocodingEnabled: cached.GEOCODING_ENABLED === "true",
    suppressedIds: new Set((cached.SUPPRESSED_PUBLIC_IDS ?? "").split(",").map((item) => item.trim()).filter(Boolean))
  };
}

export function readSuppressedIds(): Set<string> {
  const config = getConfig();
  const ids = new Set(config.suppressedIds);
  const file = path.join(config.dataDir, "suppressions.json");
  try {
    const parsed = JSON.parse(fs.readFileSync(/* turbopackIgnore: true */ file, "utf8")) as unknown;
    if (Array.isArray(parsed)) {
      for (const item of parsed) if (typeof item === "string" && item.length <= 64) ids.add(item);
    }
  } catch {
    // A missing or invalid optional file does not make the directory unavailable.
  }
  return ids;
}
