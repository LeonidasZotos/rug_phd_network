import { describe, expect, it } from "vitest";
import { demoDataset } from "@/lib/demo-data";
import { publicDatasetSchema } from "@/lib/public-schema";

describe("demonstration dataset", () => {
  it("contains 40 valid, uniquely identified profiles", () => {
    expect(() => publicDatasetSchema.parse(demoDataset)).not.toThrow();
    expect(demoDataset.people).toHaveLength(40);
    expect(new Set(demoDataset.people.map((person) => person.id)).size).toBe(40);
  });

  it("includes 23 located profiles in Groningen", () => {
    const groningenProfiles = demoDataset.people.filter(
      (person) => person.location?.locationKey === "groningen-netherlands"
    );

    expect(groningenProfiles).toHaveLength(23);
  });

  it("includes a location on every continent", () => {
    const cities = new Set(
      demoDataset.people.map((person) => person.location?.city).filter(Boolean)
    );

    for (const city of [
      "Groningen",
      "Cairo",
      "Tokyo",
      "New York",
      "São Paulo",
      "Sydney",
      "McMurdo Station"
    ]) {
      expect(cities).toContain(city);
    }
  });
});
