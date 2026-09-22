export const INSTITUTE_CODES = ["GIA", "CLCG", "ICOG"] as const;

export type InstituteCode = (typeof INSTITUTE_CODES)[number];

export type PublicLocation = {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  locationKey: string;
};

export type PublicPerson = {
  id: string;
  name?: string;
  location?: PublicLocation;
  phd?: {
    startMonth?: string;
    currentYearLabel?: string;
  };
  homeCountry?: string;
  languages?: string[];
  institutes: InstituteCode[];
  topics: string[];
  hobbies: string[];
  links: {
    linkedin?: string;
    orcid?: string;
    rug?: string;
  };
};

export type PublicDataset = {
  schemaVersion: 1;
  mode: "live" | "demo";
  lastUpdated: string;
  people: PublicPerson[];
};

export type LocationGroup = {
  key: string;
  location: PublicLocation;
  people: PublicPerson[];
};
