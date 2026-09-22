import { parseCsv } from "@/lib/csv";
import { cleanText } from "@/lib/normalization";

export type ApprovedSheetRow = {
  sourceTimestamp: unknown;
  name: unknown;
  location: unknown;
  startDate: unknown;
  submittedYear: unknown;
  topics: unknown;
  institutes: unknown;
  hobbies: unknown;
  linkedin: unknown;
  orcid: unknown;
  homeCountry: unknown;
  rug: unknown;
  languages: unknown;
  consent: unknown;
};

type Field = keyof ApprovedSheetRow;

const HEADER_ALIASES: Record<Exclude<Field, "consent">, string[]> = {
  sourceTimestamp: ["Timestamp"],
  submittedYear: ["In which year of the PhD are you?"],
  name: ["What's your name?", "What is your name?"],
  location: ["In which City/Country are you based in? (e.g., Groningen, Netherlands)"],
  startDate: ["When did you start your PhD?"],
  topics: [
    "What are some keywords describing your research topic? Separate with semicolons. (e.g., poetry; language acquisition; history)",
    "What are some keywords describing your research topic? Separate multiple keywords using semicolons (e.g., Poetry; Language acquisition; History)."
  ],
  institutes: ["In which Research Institute do you belong?"],
  hobbies: [
    "Are there any hobbies you would like to share? Separate with semicolons. (e.g., knitting; cycling; cooking)",
    "Are there any hobbies you would like to share? Separate multiple hobbies using semicolons (e.g., Knitting; Cycling; Cooking).",
    "Are there any hobbies you would like to share? Separate multiple languages using semicolons (e.g., Knitting; Cycling; Cooking)."
  ],
  linkedin: ["LinkedIn: If you want to share your LinkedIn profile, you can add it here. (e.g., https://www.linkedin.com/in/...)"],
  orcid: ["ORCID: If you want to share your ORCID profile, you can add it here. (e.g., https://orcid.org/0009-0005-7512-7799)"],
  homeCountry: ["What is your home country?"],
  rug: ["RUG Profile: If you want to share your RUG profile, you can add it here. (e.g., https://www.rug.nl/staff/...)"],
  languages: ["What languages do you speak? Separate multiple languages using semicolons (e.g., English; Lithuanian; Dutch)."]
};

type ParseOptions = {
  consentHeader: string;
  requireConsent: boolean;
};

function normalizeHeader(value: unknown): string {
  return cleanText(value, 600).replace(/\s+/g, " ").toLocaleLowerCase("en");
}

function resolveApprovedHeaders(headers: unknown[], options: ParseOptions): Map<Field, number> {
  const normalizedHeaders = headers.map(normalizeHeader);
  const definitions: Array<[Field, string[]]> = [
    ...(Object.entries(HEADER_ALIASES) as Array<[Exclude<Field, "consent">, string[]]>),
    ["consent", [options.consentHeader]]
  ];
  const resolved = new Map<Field, number>();

  for (const [field, aliases] of definitions) {
    const normalizedAliases = aliases.map(normalizeHeader);
    const matches = normalizedHeaders.flatMap((header, index) => normalizedAliases.includes(header) ? [index] : []);
    if (matches.length > 1) throw new Error(`duplicate_approved_header:${field}`);
    if (matches.length === 1) resolved.set(field, matches[0]);
  }
  if (!resolved.has("sourceTimestamp")) throw new Error("required_header_missing:sourceTimestamp");
  if (options.requireConsent && !resolved.has("consent")) throw new Error("required_header_missing:consent");
  return resolved;
}

function approvedRow(values: unknown[], resolved: Map<Field, number>): ApprovedSheetRow {
  const value = (field: Field) => {
    const index = resolved.get(field);
    return index === undefined ? undefined : values[index];
  };
  return {
    sourceTimestamp: value("sourceTimestamp"),
    name: value("name"),
    location: value("location"),
    startDate: value("startDate"),
    submittedYear: value("submittedYear"),
    topics: value("topics"),
    institutes: value("institutes"),
    hobbies: value("hobbies"),
    linkedin: value("linkedin"),
    orcid: value("orcid"),
    homeCountry: value("homeCountry"),
    rug: value("rug"),
    languages: value("languages"),
    consent: value("consent")
  };
}

export function parseApprovedSheetCsv(body: string, options: ParseOptions): ApprovedSheetRow[] {
  const matrix = parseCsv(body.replace(/^\uFEFF/, ""));
  const headers = matrix.shift();
  if (!headers) throw new Error("public_sheet_empty");
  const resolved = resolveApprovedHeaders(headers, options);
  return matrix
    .filter((values) => values.some((entry) => entry.trim() !== ""))
    .map((values) => approvedRow(values, resolved));
}
