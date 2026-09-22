import type { InstituteCode } from "@/lib/types";

export const INSTITUTES: Record<
  InstituteCode,
  { name: string; shortName: string; href: string }
> = {
  GIA: {
    name: "Groningen Institute of Archaeology",
    shortName: "Archaeology",
    href: "https://www.rug.nl/research/groningen-institute-of-archaeology/"
  },
  CLCG: {
    name: "Centre for Language and Cognition Groningen",
    shortName: "Language & cognition",
    href: "https://www.rug.nl/research/clcg/"
  },
  ICOG: {
    name: "Groningen Research Institute for the Study of Culture",
    shortName: "Culture",
    href: "https://www.rug.nl/research/icog/"
  }
};
