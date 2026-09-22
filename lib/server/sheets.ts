import "server-only";

import { getConfig } from "@/lib/server/config";
import { parseApprovedSheetCsv } from "@/lib/sheet-csv";

export type { ApprovedSheetRow } from "@/lib/sheet-csv";

const MAX_PUBLIC_SHEET_BYTES = 2_000_000;

export async function readApprovedSheetRows() {
  const config = getConfig();
  if (!config.GOOGLE_SHEET_ID) throw new Error("sheet_id_missing");
  if (!/^[A-Za-z0-9_-]{20,}$/.test(config.GOOGLE_SHEET_ID)) throw new Error("sheet_id_invalid");

  const url = new URL(`https://docs.google.com/spreadsheets/d/${config.GOOGLE_SHEET_ID}/gviz/tq`);
  url.searchParams.set("tqx", "out:csv");
  url.searchParams.set("sheet", config.GOOGLE_SHEET_TAB);
  const response = await fetch(url, {
    cache: "no-store",
    redirect: "follow",
    headers: { Accept: "text/csv" },
    signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok) throw new Error("public_sheet_unavailable");
  const declaredLength = Number(response.headers.get("content-length") ?? "0");
  if (declaredLength > MAX_PUBLIC_SHEET_BYTES) throw new Error("public_sheet_too_large");
  const body = await response.text();
  if (Buffer.byteLength(body, "utf8") > MAX_PUBLIC_SHEET_BYTES) throw new Error("public_sheet_too_large");

  return parseApprovedSheetCsv(body, {
    consentHeader: config.SHEET_CONSENT_HEADER,
    requireConsent: config.requireConsent
  });
}
