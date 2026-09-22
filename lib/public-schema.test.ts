import { describe, expect, it } from "vitest";
import { publicPersonSchema } from "@/lib/public-schema";

describe("public schema", () => {
  it("rejects unknown keys so private survey fields cannot hitchhike", () => {
    expect(() => publicPersonSchema.parse({
      id: "safe-public-id",
      name: "Researcher",
      institutes: [],
      topics: [],
      hobbies: [],
      links: {},
      emailAddress: "private@example.com"
    })).toThrow();
  });

  it("accepts the optional public background fields and RUG profile", () => {
    expect(publicPersonSchema.parse({
      id: "safe-public-id",
      name: "Researcher",
      homeCountry: "Greece",
      languages: ["English", "Greek"],
      institutes: ["CLCG"],
      topics: [],
      hobbies: [],
      links: { rug: "https://www.rug.nl/staff/researcher/" }
    })).toMatchObject({
      homeCountry: "Greece",
      languages: ["English", "Greek"]
    });
  });
});
