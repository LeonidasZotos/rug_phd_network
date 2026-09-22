import Fuse from "fuse.js";
import type { LocationGroup, PublicPerson } from "@/lib/types";

export function groupByLocation(people: PublicPerson[]): LocationGroup[] {
  const groups = new Map<string, LocationGroup>();
  for (const person of people) {
    if (!person.location) continue;
    const existing = groups.get(person.location.locationKey);
    if (existing) {
      existing.people.push(person);
    } else {
      groups.set(person.location.locationKey, {
        key: person.location.locationKey,
        location: person.location,
        people: [person]
      });
    }
  }
  return [...groups.values()].map((group) => ({
    ...group,
    people: [...group.people].sort((a, b) =>
      (a.name ?? "").localeCompare(b.name ?? "")
    )
  }));
}

export function searchPeople(people: PublicPerson[], query: string): PublicPerson[] {
  const trimmed = query.trim();
  if (!trimmed) return people;

  const fuse = new Fuse(people, {
    threshold: 0.28,
    ignoreDiacritics: true,
    minMatchCharLength: 2,
    keys: [
      { name: "name", weight: 0.4 },
      { name: "topics", weight: 0.23 },
      { name: "hobbies", weight: 0.18 },
      { name: "languages", weight: 0.14 },
      { name: "homeCountry", weight: 0.1 },
      { name: "institutes", weight: 0.1 },
      { name: "location.city", weight: 0.05 },
      { name: "location.country", weight: 0.04 }
    ]
  });
  return fuse.search(trimmed).map((result) => result.item);
}

export function initials(name?: string): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
