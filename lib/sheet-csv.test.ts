import { describe, expect, it } from "vitest";
import { parseApprovedSheetCsv } from "@/lib/sheet-csv";

const consentHeader = "I consent to sharing this information publicly on the PhD network website.";

describe("parseApprovedSheetCsv", () => {
  it("maps approved headers and excludes unknown private columns", () => {
    const csv = [
      `Timestamp,What is your name?,Private council answer,${consentHeader}`,
      "2026-09-22T11:48:12.000Z,Leonidas Zotos,confidential,Yes"
    ].join("\n");

    const [row] = parseApprovedSheetCsv(csv, { consentHeader, requireConsent: true });

    expect(row).toMatchObject({
      sourceTimestamp: "2026-09-22T11:48:12.000Z",
      name: "Leonidas Zotos",
      consent: "Yes"
    });
    expect(row).not.toHaveProperty("Private council answer");
    expect(Object.values(row)).not.toContain("confidential");
  });

  it("requires a timestamp header", () => {
    expect(() => parseApprovedSheetCsv("What is your name?\nAda", {
      consentHeader,
      requireConsent: false
    })).toThrow("required_header_missing:sourceTimestamp");
  });

  it("requires the configured consent header when consent is enabled", () => {
    expect(() => parseApprovedSheetCsv("Timestamp\n2026-09-22", {
      consentHeader,
      requireConsent: true
    })).toThrow("required_header_missing:consent");
  });

  it("rejects duplicate approved headers", () => {
    expect(() => parseApprovedSheetCsv("Timestamp,What is your name?,What's your name?\n1,Ada,Ada", {
      consentHeader,
      requireConsent: false
    })).toThrow("duplicate_approved_header:name");
  });
});
