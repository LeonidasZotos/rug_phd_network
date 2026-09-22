import { describe, expect, it } from "vitest";
import { parseCsv } from "@/lib/csv";

describe("parseCsv", () => {
  it("handles quoted commas, quotes, newlines, and CRLF rows", () => {
    expect(parseCsv('Name,Topics,Note\r\n"Doe, Jane","AI; NLP","Line 1\nLine ""2"""\r\n')).toEqual([
      ["Name", "Topics", "Note"],
      ["Doe, Jane", "AI; NLP", 'Line 1\nLine "2"']
    ]);
  });

  it("preserves empty cells", () => {
    expect(parseCsv("A,B,C\n1,,3")).toEqual([
      ["A", "B", "C"],
      ["1", "", "3"]
    ]);
  });

  it("rejects malformed quoted input", () => {
    expect(() => parseCsv('A\n"unfinished')).toThrow("public_sheet_csv_unclosed_quote");
  });
});
