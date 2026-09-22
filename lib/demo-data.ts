import type { PublicDataset, PublicPerson } from "@/lib/types";

const groningenDemoProfiles: PublicDataset["people"] = ([
  {
    id: "demo-groningen-01",
    name: "Groningen demo researcher 01",
    phd: { startMonth: "2026-09", currentYearLabel: "Year 1" },
    institutes: ["CLCG"],
    topics: ["Syntax", "Language variation"],
    hobbies: ["Cycling", "Board games"]
  },
  {
    id: "demo-groningen-02",
    name: "Groningen demo researcher 02",
    phd: { startMonth: "2025-09", currentYearLabel: "Year 2" },
    institutes: ["ICOG"],
    topics: ["Digital humanities", "Book history"],
    hobbies: ["Reading", "Bouldering"]
  },
  {
    id: "demo-groningen-03",
    name: "Groningen demo researcher 03",
    phd: { startMonth: "2024-09", currentYearLabel: "Year 3" },
    institutes: ["GIA"],
    topics: ["Landscape archaeology", "Remote sensing"],
    hobbies: ["Hiking", "Photography"]
  },
  {
    id: "demo-groningen-04",
    name: "Groningen demo researcher 04",
    phd: { startMonth: "2023-09", currentYearLabel: "Year 4" },
    institutes: ["CLCG", "ICOG"],
    topics: ["Discourse analysis", "Political communication"],
    hobbies: ["Choir", "Cooking"]
  },
  {
    id: "demo-groningen-05",
    name: "Groningen demo researcher 05",
    phd: { startMonth: "2022-02", currentYearLabel: "Year 5+" },
    institutes: ["ICOG"],
    topics: ["Cultural memory", "Heritage studies"],
    hobbies: ["Gardening", "Podcasts"]
  },
  {
    id: "demo-groningen-06",
    name: "Groningen demo researcher 06",
    phd: { startMonth: "2026-03", currentYearLabel: "Year 1" },
    institutes: ["GIA", "ICOG"],
    topics: ["Museum collections", "Material culture"],
    hobbies: ["Ceramics", "Swimming"]
  },
  {
    id: "demo-groningen-07",
    name: "Groningen demo researcher 07",
    phd: { startMonth: "2025-01", currentYearLabel: "Year 2" },
    institutes: ["CLCG"],
    topics: ["Psycholinguistics", "Bilingualism"],
    hobbies: ["Running", "Piano"]
  },
  {
    id: "demo-groningen-08",
    name: "Groningen demo researcher 08",
    phd: { startMonth: "2024-04", currentYearLabel: "Year 3" },
    institutes: ["ICOG"],
    topics: ["Film studies", "Visual culture"],
    hobbies: ["Cinema", "Bread baking"]
  },
  {
    id: "demo-groningen-09",
    name: "Groningen demo researcher 09",
    phd: { startMonth: "2023-02", currentYearLabel: "Year 4" },
    institutes: ["GIA"],
    topics: ["Bioarchaeology", "Ancient health"],
    hobbies: ["Kayaking", "Sketching"]
  },
  {
    id: "demo-groningen-10",
    name: "Groningen demo researcher 10",
    phd: { startMonth: "2021-11", currentYearLabel: "Year 5+" },
    institutes: ["CLCG", "GIA"],
    topics: ["Epigraphy", "Historical linguistics"],
    hobbies: ["Chess", "Calligraphy"]
  },
  {
    id: "demo-groningen-11",
    name: "Groningen demo researcher 11",
    phd: { startMonth: "2026-01", currentYearLabel: "Year 1" },
    institutes: ["ICOG"],
    topics: ["Modern literature", "Ecocriticism"],
    hobbies: ["Creative writing", "Birdwatching"]
  },
  {
    id: "demo-groningen-12",
    name: "Groningen demo researcher 12",
    phd: { startMonth: "2025-05", currentYearLabel: "Year 2" },
    institutes: ["CLCG"],
    topics: ["Speech technology", "Phonetics"],
    hobbies: ["Music production", "Table tennis"]
  },
  {
    id: "demo-groningen-13",
    name: "Groningen demo researcher 13",
    phd: { startMonth: "2024-01", currentYearLabel: "Year 3" },
    institutes: ["GIA"],
    topics: ["Maritime archaeology", "Ancient trade"],
    hobbies: ["Sailing", "Woodworking"]
  },
  {
    id: "demo-groningen-14",
    name: "Groningen demo researcher 14",
    phd: { startMonth: "2023-06", currentYearLabel: "Year 4" },
    institutes: ["ICOG", "CLCG"],
    topics: ["Narrative theory", "Digital storytelling"],
    hobbies: ["Theatre", "Cycling"]
  },
  {
    id: "demo-groningen-15",
    name: "Groningen demo researcher 15",
    phd: { startMonth: "2022-09", currentYearLabel: "Year 5+" },
    institutes: ["ICOG"],
    topics: ["Religious history", "Archival studies"],
    hobbies: ["Knitting", "Museum visits"]
  },
  {
    id: "demo-groningen-16",
    name: "Groningen demo researcher 16",
    phd: { startMonth: "2026-08", currentYearLabel: "Year 1" },
    institutes: ["GIA"],
    topics: ["Archaeobotany", "Food history"],
    hobbies: ["Cooking", "Urban gardening"]
  },
  {
    id: "demo-groningen-17",
    name: "Groningen demo researcher 17",
    phd: { startMonth: "2025-03", currentYearLabel: "Year 2" },
    institutes: ["CLCG"],
    topics: ["Sign language", "Multimodality"],
    hobbies: ["Dance", "Illustration"]
  },
  {
    id: "demo-groningen-18",
    name: "Groningen demo researcher 18",
    phd: { startMonth: "2024-07", currentYearLabel: "Year 3" },
    institutes: ["ICOG"],
    topics: ["Musicology", "Sound studies"],
    hobbies: ["Guitar", "Record collecting"]
  },
  {
    id: "demo-groningen-19",
    name: "Groningen demo researcher 19",
    phd: { startMonth: "2023-01", currentYearLabel: "Year 4" },
    institutes: ["GIA", "ICOG"],
    topics: ["Conflict archaeology", "Public history"],
    hobbies: ["Climbing", "Documentaries"]
  },
  {
    id: "demo-groningen-20",
    name: "Groningen demo researcher 20",
    phd: { startMonth: "2021-09", currentYearLabel: "Year 5+" },
    institutes: ["CLCG", "ICOG"],
    topics: ["Language policy", "Minority languages"],
    hobbies: ["Volunteering", "Cycling"]
  }
] satisfies Array<Omit<PublicPerson, "location" | "links">>).map((person) => ({
  ...person,
  location: {
    city: "Groningen",
    country: "Netherlands",
    latitude: 53.2194,
    longitude: 6.5665,
    locationKey: "groningen-netherlands"
  },
  links: {}
}));

export const demoDataset: PublicDataset = {
  schemaVersion: 1,
  mode: "demo",
  lastUpdated: "2026-09-21T13:19:10.000Z",
  people: [
    {
      id: "demo-leonidas",
      name: "Leonidas Zotos",
      location: {
        city: "Groningen",
        country: "Netherlands",
        latitude: 53.2194,
        longitude: 6.5665,
        locationKey: "groningen-netherlands"
      },
      phd: { startMonth: "2023-12", currentYearLabel: "Year 3" },
      homeCountry: "Greece",
      languages: ["English", "Greek"],
      institutes: ["CLCG"],
      topics: ["Education", "AI", "NLP"],
      hobbies: ["Cycling", "Cocktails", "Cooking", "Baking"],
      links: {
        linkedin: "https://www.linkedin.com/in/leonidas-zotos",
        rug: "https://www.rug.nl/staff/l.zotos/"
      }
    },
    {
      id: "demo-groningen-a",
      name: "Sample researcher A",
      location: {
        city: "Groningen",
        country: "Netherlands",
        latitude: 53.2194,
        longitude: 6.5665,
        locationKey: "groningen-netherlands"
      },
      phd: { startMonth: "2025-02", currentYearLabel: "Year 2" },
      institutes: ["ICOG"],
      topics: ["Digital heritage", "Public history"],
      hobbies: ["Film", "Running"],
      links: {}
    },
    {
      id: "demo-groningen-b",
      name: "Sample researcher B",
      location: {
        city: "Groningen",
        country: "Netherlands",
        latitude: 53.2194,
        longitude: 6.5665,
        locationKey: "groningen-netherlands"
      },
      phd: { startMonth: "2024-09", currentYearLabel: "Year 3" },
      institutes: ["GIA", "ICOG"],
      topics: ["Material culture", "Migration"],
      hobbies: ["Ceramics", "Hiking"],
      links: {}
    },
    {
      id: "demo-athens",
      name: "Sample researcher C",
      location: {
        city: "Athens",
        country: "Greece",
        latitude: 37.9838,
        longitude: 23.7275,
        locationKey: "athens-greece"
      },
      phd: { startMonth: "2024-01", currentYearLabel: "Year 3" },
      institutes: ["GIA"],
      topics: ["Mediterranean archaeology"],
      hobbies: ["Swimming", "Photography"],
      links: {}
    },
    {
      id: "demo-london",
      name: "Sample researcher D",
      location: {
        city: "London",
        country: "United Kingdom",
        latitude: 51.5072,
        longitude: -0.1276,
        locationKey: "london-united-kingdom"
      },
      phd: { startMonth: "2026-03", currentYearLabel: "Year 1" },
      institutes: ["CLCG"],
      topics: ["Language acquisition", "Multilingualism"],
      hobbies: ["Cooking", "Choir"],
      links: {}
    },
    {
      id: "demo-cairo",
      name: "Demo researcher F",
      location: {
        city: "Cairo",
        country: "Egypt",
        latitude: 30.0444,
        longitude: 31.2357,
        locationKey: "cairo-egypt"
      },
      phd: { startMonth: "2025-01", currentYearLabel: "Year 2" },
      institutes: ["GIA"],
      topics: ["Ancient trade", "Ceramic analysis"],
      hobbies: ["Sketching", "Table tennis"],
      links: {}
    },
    {
      id: "demo-cape-town",
      name: "Demo researcher G",
      location: {
        city: "Cape Town",
        country: "South Africa",
        latitude: -33.9249,
        longitude: 18.4241,
        locationKey: "cape-town-south-africa"
      },
      phd: { startMonth: "2023-08", currentYearLabel: "Year 4" },
      institutes: ["ICOG"],
      topics: ["Postcolonial memory", "Museum studies"],
      hobbies: ["Surfing", "Gardening"],
      links: {}
    },
    {
      id: "demo-new-york",
      name: "Demo researcher H",
      location: {
        city: "New York",
        country: "United States",
        latitude: 40.7128,
        longitude: -74.006,
        locationKey: "new-york-united-states"
      },
      phd: { startMonth: "2024-09", currentYearLabel: "Year 3" },
      institutes: ["ICOG", "CLCG"],
      topics: ["Digital storytelling", "Urban culture"],
      hobbies: ["Jazz", "Running"],
      links: {}
    },
    {
      id: "demo-vancouver",
      name: "Demo researcher I",
      location: {
        city: "Vancouver",
        country: "Canada",
        latitude: 49.2827,
        longitude: -123.1207,
        locationKey: "vancouver-canada"
      },
      phd: { startMonth: "2026-02", currentYearLabel: "Year 1" },
      institutes: ["CLCG"],
      topics: ["Indigenous languages", "Language revitalisation"],
      hobbies: ["Kayaking", "Board games"],
      links: {}
    },
    {
      id: "demo-mexico-city",
      name: "Demo researcher J",
      location: {
        city: "Mexico City",
        country: "Mexico",
        latitude: 19.4326,
        longitude: -99.1332,
        locationKey: "mexico-city-mexico"
      },
      phd: { startMonth: "2022-11", currentYearLabel: "Year 4" },
      institutes: ["GIA", "ICOG"],
      topics: ["Ritual landscapes", "Visual anthropology"],
      hobbies: ["Dance", "Street photography"],
      links: {}
    },
    {
      id: "demo-sao-paulo",
      name: "Demo researcher K",
      location: {
        city: "São Paulo",
        country: "Brazil",
        latitude: -23.5505,
        longitude: -46.6333,
        locationKey: "sao-paulo-brazil"
      },
      phd: { startMonth: "2025-03", currentYearLabel: "Year 2" },
      institutes: ["CLCG"],
      topics: ["Sociolinguistics", "Language and identity"],
      hobbies: ["Football", "Cooking"],
      links: {}
    },
    {
      id: "demo-buenos-aires",
      name: "Demo researcher L",
      location: {
        city: "Buenos Aires",
        country: "Argentina",
        latitude: -34.6037,
        longitude: -58.3816,
        locationKey: "buenos-aires-argentina"
      },
      phd: { startMonth: "2024-02", currentYearLabel: "Year 3" },
      institutes: ["ICOG"],
      topics: ["Performance studies", "Modern theatre"],
      hobbies: ["Tango", "Creative writing"],
      links: {}
    },
    {
      id: "demo-tokyo",
      name: "Demo researcher M",
      location: {
        city: "Tokyo",
        country: "Japan",
        latitude: 35.6762,
        longitude: 139.6503,
        locationKey: "tokyo-japan"
      },
      phd: { startMonth: "2023-10", currentYearLabel: "Year 3" },
      institutes: ["ICOG"],
      topics: ["Popular culture", "Media archaeology"],
      hobbies: ["Cinema", "Hiking"],
      links: {}
    },
    {
      id: "demo-singapore",
      name: "Demo researcher N",
      location: {
        city: "Singapore",
        country: "Singapore",
        latitude: 1.3521,
        longitude: 103.8198,
        locationKey: "singapore-singapore"
      },
      phd: { startMonth: "2026-01", currentYearLabel: "Year 1" },
      institutes: ["CLCG", "ICOG"],
      topics: ["Multilingual cities", "Digital communities"],
      hobbies: ["Badminton", "Food photography"],
      links: {}
    },
    {
      id: "demo-new-delhi",
      name: "Demo researcher O",
      location: {
        city: "New Delhi",
        country: "India",
        latitude: 28.6139,
        longitude: 77.209,
        locationKey: "new-delhi-india"
      },
      phd: { startMonth: "2022-09", currentYearLabel: "Year 5+" },
      institutes: ["GIA"],
      topics: ["Heritage policy", "Historical geography"],
      hobbies: ["Cricket", "Watercolour painting"],
      links: {}
    },
    {
      id: "demo-sydney",
      name: "Demo researcher P",
      location: {
        city: "Sydney",
        country: "Australia",
        latitude: -33.8688,
        longitude: 151.2093,
        locationKey: "sydney-australia"
      },
      phd: { startMonth: "2025-07", currentYearLabel: "Year 2" },
      institutes: ["CLCG"],
      topics: ["Language technology", "Corpus linguistics"],
      hobbies: ["Sailing", "Podcasts"],
      links: {}
    },
    {
      id: "demo-wellington",
      name: "Demo researcher Q",
      location: {
        city: "Wellington",
        country: "New Zealand",
        latitude: -41.2866,
        longitude: 174.7756,
        locationKey: "wellington-new-zealand"
      },
      phd: { startMonth: "2024-06", currentYearLabel: "Year 3" },
      institutes: ["ICOG"],
      topics: ["Environmental humanities", "Island narratives"],
      hobbies: ["Trail walking", "Knitting"],
      links: {}
    },
    {
      id: "demo-mcmurdo",
      name: "Demo researcher R",
      location: {
        city: "McMurdo Station",
        country: "Antarctica",
        latitude: -77.8419,
        longitude: 166.6863,
        locationKey: "mcmurdo-station-antarctica"
      },
      phd: { startMonth: "2023-01", currentYearLabel: "Year 4" },
      institutes: ["GIA", "ICOG"],
      topics: ["Polar heritage", "Exploration narratives"],
      hobbies: ["Nature journaling", "Chess"],
      links: {}
    },
    {
      id: "demo-nairobi",
      name: "Demo researcher S",
      location: {
        city: "Nairobi",
        country: "Kenya",
        latitude: -1.2921,
        longitude: 36.8219,
        locationKey: "nairobi-kenya"
      },
      phd: { startMonth: "2026-04", currentYearLabel: "Year 1" },
      institutes: ["GIA"],
      topics: ["Community archaeology", "Oral history"],
      hobbies: ["Birdwatching", "Cycling"],
      links: {}
    },
    ...groningenDemoProfiles,
    {
      id: "demo-unlocated",
      name: "Sample researcher E",
      phd: { startMonth: "2025-09", currentYearLabel: "Year 2" },
      institutes: ["ICOG"],
      topics: ["Contemporary literature"],
      hobbies: ["Knitting"],
      links: {}
    }
  ]
};
