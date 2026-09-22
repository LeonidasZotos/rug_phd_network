import { describe, expect, it } from "vitest";
import { groupByLocation, searchPeople } from "@/lib/client-data";
import { demoDataset } from "@/lib/demo-data";

describe("client dataset helpers", () => {
  it("groups identical city coordinates once", () => {
    const groningen = groupByLocation(demoDataset.people).find((group) => group.key === "groningen-netherlands");
    expect(groningen?.people).toHaveLength(23);
  });

  it("finds topics and hobbies with typo tolerance", () => {
    expect(searchPeople(demoDataset.people, "cocktials").map((person) => person.name)).toContain("Leonidas Zotos");
    expect(searchPeople(demoDataset.people, "multilingualism").map((person) => person.name)).toContain("Sample researcher D");
  });

  it("does not confuse cycling with sociolinguistics", () => {
    const matches = searchPeople(demoDataset.people, "cycling").map((person) => person.name);

    expect(matches).toContain("Leonidas Zotos");
    expect(matches).not.toContain("Demo researcher K");
  });

  it("finds home countries and spoken languages", () => {
    expect(searchPeople(demoDataset.people, "Greece").map((person) => person.name)).toContain("Leonidas Zotos");
    expect(searchPeople(demoDataset.people, "Greek").map((person) => person.name)).toContain("Leonidas Zotos");
  });
});
