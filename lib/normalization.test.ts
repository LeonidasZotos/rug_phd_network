import { describe, expect, it } from "vitest";
import {
  calculatePhdYear,
  cleanText,
  isAffirmativeConsent,
  normalizeCountry,
  normalizeLinkedIn,
  normalizeOrcid,
  normalizeRugProfile,
  parseInstitutes,
  parseLocation,
  parseTags,
  sheetsSerialToMonth
} from "@/lib/normalization";

describe("cleanText", () => {
  it("removes control and bidi characters and caps length", () => {
    expect(cleanText("  Hello\u202E  world\n ", 20)).toBe("Hello world");
  });
});

describe("tags", () => {
  it("splits semicolons, removes duplicates, and preserves display spelling", () => {
    expect(parseTags("Poetry; education; poetry; cycling,")).toEqual(["Poetry", "education", "cycling"]);
  });

  it("uses newlines as a fallback but does not split ordinary commas", () => {
    expect(parseTags("reading, writing\nCooking")).toEqual(["reading, writing", "Cooking"]);
  });
});

describe("institutes", () => {
  it("recognizes checkbox combinations and known CLCG wording variants", () => {
    expect(parseInstitutes("GIA: Groningen Institute of Archaeology, CLCG: Centre of Language and Cognition Groningen")).toEqual(["GIA", "CLCG"]);
  });
});

describe("public profile links", () => {
  it("normalizes a LinkedIn URL without a scheme", () => {
    expect(normalizeLinkedIn("www.linkedin.com/in/leonidas-zotos/?trk=test")).toBe("https://www.linkedin.com/in/leonidas-zotos");
  });

  it("rejects deceptive LinkedIn hosts and non-profile paths", () => {
    expect(normalizeLinkedIn("https://linkedin.com.evil.example/in/person")).toBeUndefined();
    expect(normalizeLinkedIn("https://linkedin.com/company/example")).toBeUndefined();
    expect(normalizeLinkedIn("https://user@linkedin.com/in/person")).toBeUndefined();
  });

  it("validates and normalizes ORCID", () => {
    expect(normalizeOrcid("https://orcid.org/0009-0005-7512-7799")).toBe("https://orcid.org/0009-0005-7512-7799");
    expect(normalizeOrcid("0009-0005-7512-7798")).toBeUndefined();
    expect(normalizeOrcid("https://orcid.org.evil.example/0009-0005-7512-7799")).toBeUndefined();
  });

  it("validates and normalizes RUG staff profiles", () => {
    expect(normalizeRugProfile("www.rug.nl/staff/l.zotos/?lang=en")).toBe("https://www.rug.nl/staff/l.zotos/");
    expect(normalizeRugProfile("https://rug.nl/research/clcg/")).toBeUndefined();
    expect(normalizeRugProfile("https://rug.nl.evil.example/staff/l.zotos/")).toBeUndefined();
  });
});

describe("locations", () => {
  it("normalizes Netherlands aliases and splits on the last comma", () => {
    expect(parseLocation("Groningen, The Netherlands")).toEqual({ city: "Groningen", country: "Netherlands", key: "groningen|netherlands" });
    expect(parseLocation("Washington, D.C., USA")).toEqual({ city: "Washington, D.C.", country: "United States", key: "washington, d.c.|united states" });
  });

  it("normalizes standalone home-country aliases", () => {
    expect(normalizeCountry("The Netherlands")).toBe("Netherlands");
    expect(normalizeCountry("Greece")).toBe("Greece");
    expect(normalizeCountry(" ")).toBeUndefined();
  });

  it("rejects incomplete locations", () => {
    expect(parseLocation("Groningen")).toBeUndefined();
    expect(parseLocation(", Netherlands")).toBeUndefined();
  });
});

describe("dates", () => {
  it("converts a Sheets date serial to a stable month", () => {
    const serial = (Date.UTC(2023, 11, 1) - Date.UTC(1899, 11, 30)) / 86_400_000;
    expect(sheetsSerialToMonth(serial)).toBe("2023-12");
  });

  it("calculates trajectory year and caps the label at year five plus", () => {
    expect(calculatePhdYear("2023-12", new Date("2026-09-21T00:00:00Z"))).toBe("Year 3");
    expect(calculatePhdYear("2018-01", new Date("2026-09-21T00:00:00Z"))).toBe("Year 5+");
    expect(calculatePhdYear("2027-01", new Date("2026-09-21T00:00:00Z"))).toBeUndefined();
  });
});

describe("consent", () => {
  it("accepts only explicit affirmative values", () => {
    expect(isAffirmativeConsent("Yes")).toBe(true);
    expect(isAffirmativeConsent(" I AGREE ")).toBe(true);
    expect(isAffirmativeConsent("No")).toBe(false);
    expect(isAffirmativeConsent("")).toBe(false);
  });
});
