import { INSTITUTE_CODES, type InstituteCode } from "@/lib/types";

const CONTROL_OR_BIDI = /[\u0000-\u001F\u007F-\u009F\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;

export function cleanText(value: unknown, maxLength = 240): string {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value)
    .normalize("NFC")
    .replace(CONTROL_OR_BIDI, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function foldText(value: string): string {
  return cleanText(value)
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("en");
}

export function parseTags(value: unknown): string[] {
  if (typeof value !== "string" && typeof value !== "number") return [];
  const text = String(value).normalize("NFC").replace(/\r\n?/g, "\n").slice(0, 2_000);
  if (!text.trim()) return [];
  const separator = text.includes(";") ? /;/ : /\n/;
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of text.split(separator)) {
    const item = cleanText(raw.replace(/[;,]+$/g, ""), 80);
    const key = foldText(item);
    if (!item || !key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
    if (result.length === 20) break;
  }
  return result;
}

const INSTITUTE_PATTERNS: Array<[InstituteCode, RegExp]> = [
  ["GIA", /\bGIA\b|Groningen Institute of Archaeology/i],
  ["CLCG", /\bCLCG\b|Centre (?:for|of) Language and Cognition Groningen/i],
  ["ICOG", /\bICOG\b|Groningen Research Institute for the Study of Culture|Instituut voor Cultuurwetenschappelijk Onderzoek Groningen/i]
];

export function parseInstitutes(value: unknown): InstituteCode[] {
  const text = cleanText(value, 1_000);
  if (!text) return [];
  return INSTITUTE_PATTERNS.filter(([, pattern]) => pattern.test(text))
    .map(([code]) => code)
    .filter((code): code is InstituteCode => INSTITUTE_CODES.includes(code));
}

function safeHttpsUrl(raw: unknown): URL | undefined {
  const value = cleanText(raw, 500);
  if (!value || /[%\s][0-9a-f]{0,1}$/i.test(value)) return undefined;
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return undefined;
    url.search = "";
    url.hash = "";
    return url;
  } catch {
    return undefined;
  }
}

export function normalizeLinkedIn(value: unknown): string | undefined {
  const url = safeHttpsUrl(value);
  if (!url) return undefined;
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host !== "linkedin.com" && !host.endsWith(".linkedin.com")) return undefined;
  const match = url.pathname.match(/^\/in\/([^/]+)\/?$/i);
  if (!match || !match[1] || /%2f|%5c/i.test(match[1])) return undefined;
  return `https://www.linkedin.com/in/${match[1]}`;
}

export function normalizeRugProfile(value: unknown): string | undefined {
  const url = safeHttpsUrl(value);
  if (!url) return undefined;
  const host = url.hostname.toLowerCase();
  if (host !== "rug.nl" && host !== "www.rug.nl") return undefined;
  const match = url.pathname.match(/^\/staff\/([^/]+)\/?$/i);
  if (!match || !match[1] || /%2f|%5c/i.test(match[1])) return undefined;
  return `https://www.rug.nl/staff/${match[1]}/`;
}

function orcidChecksumIsValid(orcid: string): boolean {
  const compact = orcid.replaceAll("-", "").toUpperCase();
  if (!/^\d{15}[\dX]$/.test(compact)) return false;
  let total = 0;
  for (const digit of compact.slice(0, 15)) total = (total + Number(digit)) * 2;
  const remainder = total % 11;
  const result = (12 - remainder) % 11;
  const check = result === 10 ? "X" : String(result);
  return check === compact.at(-1);
}

export function normalizeOrcid(value: unknown): string | undefined {
  const raw = cleanText(value, 200);
  if (!raw) return undefined;
  let candidate = raw;
  if (/^https?:\/\//i.test(raw) || raw.toLowerCase().startsWith("orcid.org")) {
    const url = safeHttpsUrl(raw);
    if (!url || url.hostname.toLowerCase().replace(/^www\./, "") !== "orcid.org") return undefined;
    candidate = url.pathname.replace(/^\//, "").replace(/\/$/, "");
  }
  const normalized = candidate.toUpperCase();
  if (!/^\d{4}-\d{4}-\d{4}-[\dX]{4}$/.test(normalized) || !orcidChecksumIsValid(normalized)) return undefined;
  return `https://orcid.org/${normalized}`;
}

const COUNTRY_ALIASES = new Map([
  ["nl", "Netherlands"],
  ["the netherlands", "Netherlands"],
  ["netherlands", "Netherlands"],
  ["uk", "United Kingdom"],
  ["u.k.", "United Kingdom"],
  ["united kingdom", "United Kingdom"],
  ["us", "United States"],
  ["u.s.", "United States"],
  ["usa", "United States"],
  ["u.s.a.", "United States"],
  ["united states of america", "United States"]
]);

const LOCATION_ALIASES = new Map<string, { city: string; country: string }>([
  ["new york", { city: "New York", country: "United States" }],
  ["new york city", { city: "New York", country: "United States" }],
  ["nyc", { city: "New York", country: "United States" }],
  ["new york, ny", { city: "New York", country: "United States" }],
  ["new york, new york", { city: "New York", country: "United States" }]
]);

export function normalizeCountry(value: unknown): string | undefined {
  const country = cleanText(value, 80);
  if (!country) return undefined;
  return COUNTRY_ALIASES.get(foldText(country)) ?? country;
}

export function parseLocation(value: unknown): { city: string; country: string; key: string } | undefined {
  const text = cleanText(value, 180);
  const alias = LOCATION_ALIASES.get(foldText(text));
  if (alias) {
    return {
      ...alias,
      key: `${foldText(alias.city)}|${foldText(alias.country)}`
    };
  }
  const separator = text.lastIndexOf(",");
  if (separator <= 0 || separator >= text.length - 1) return undefined;
  const city = cleanText(text.slice(0, separator), 90);
  const countryRaw = cleanText(text.slice(separator + 1), 80);
  if (!city || !countryRaw) return undefined;
  const country = normalizeCountry(countryRaw) ?? countryRaw;
  return { city, country, key: `${foldText(city)}|${foldText(country)}` };
}

export function sheetsSerialToMonth(value: unknown): string | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    const wholeDays = Math.floor(value);
    const date = new Date(Date.UTC(1899, 11, 30 + wholeDays));
    if (!Number.isNaN(date.valueOf())) return date.toISOString().slice(0, 7);
  }
  if (typeof value === "string") {
    const iso = value.match(/^(\d{4})-(\d{2})(?:-\d{2})?/);
    if (iso) return `${iso[1]}-${iso[2]}`;
  }
  return undefined;
}

export function calculatePhdYear(startMonth: string | undefined, now = new Date()): string | undefined {
  if (!startMonth || !/^\d{4}-\d{2}$/.test(startMonth)) return undefined;
  const [year, month] = startMonth.split("-").map(Number);
  const months = (now.getUTCFullYear() - year) * 12 + (now.getUTCMonth() + 1 - month);
  if (months < 0 || months > 20 * 12) return undefined;
  const current = Math.floor(months / 12) + 1;
  return current >= 5 ? "Year 5+" : `Year ${current}`;
}

export function normalizeFallbackYear(value: unknown): string | undefined {
  const match = cleanText(value, 40).match(/year\s*(\d+)/i);
  if (!match) return undefined;
  const year = Number(match[1]);
  if (year < 1 || year > 20) return undefined;
  return year >= 5 ? "Year 5+" : `Year ${year}`;
}

export function isAffirmativeConsent(value: unknown): boolean {
  return ["yes", "true", "i agree", "consent", "1"].includes(foldText(String(value ?? "")));
}
