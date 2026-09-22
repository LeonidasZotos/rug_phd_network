# PhD Network Map — Implementation Plan

Status: implemented; retained as the architecture and product reference  
Initial delivery: local development on a laptop  
Production target: a public website running in an LXC on the home server

## 1. Product definition

The site is a public, map-first directory of Faculty of Arts PhD students. Its primary job is to help visitors discover where students are based and learn about their research, trajectory, institute, hobbies, and academic profiles.

The first screen is the working surface, not a marketing page:

- a compact header with the site name, number of visible people, and last update time;
- a collapsible filter/search panel on the left;
- a global interactive map in the centre;
- a profile panel on the right when a person is selected;
- an accessible list for people without a valid location.

All student information is optional. A profile may therefore contain only the fields the student chose to share. The public correction/removal contact is `phd.council.hum@rug.nl`.

## 2. Confirmed requirements

- The site is publicly accessible and may be indexed by search engines.
- Only city-level locations are collected and displayed.
- The original form-response Sheet remains private. A separate sanitized Sheet contains only public profile fields and is link-accessible for server-side CSV reads.
- Public data is refreshed from the sheet at least every five minutes while the site is in use.
- People may belong to multiple research institutes.
- Supported academic links in the first release are LinkedIn and ORCID.
- There are no profile photos.
- Students without a usable location remain discoverable in an unlocated-people list.
- Search covers names, topics, hobbies, institutes, cities, and countries.
- Filters cover research institute and PhD year/stage; location filtering can be added as a compact country selector if the real dataset makes it useful.
- Selecting a person opens the right-hand profile panel.
- Multiple people in one city can be expanded/scattered from their shared point.
- The site must work with pointer, touch, and keyboard input; hover is an enhancement, not the only route to information.

## 3. Recommended architecture

```text
Sanitized public Google Sheet
        |
        | server-side CSV download
        v
Import + validation + normalization
        |
        +----> geocoding cache / manual location overrides
        |
        v
SQLite last-known-good public projection
        |
        +----> public JSON endpoint (allowlisted fields only)
        |
        v
Server-rendered app + interactive map/search/profile UI
```

### Application stack

- **Next.js + React + TypeScript** for one full-stack application, server rendering, metadata, API routes, and a polished responsive interface.
- **MapLibre GL JS** for the interactive map, GeoJSON sources, clustering, and map controls.
- **SQLite** for the last-known-good public dataset, geocoding cache, sync metadata, and location overrides. It is appropriate for one LXC and avoids operating a separate database server.
- **Zod** (or an equivalent schema validator) at every external-data boundary.
- **Fuse.js or a small deterministic search index** for accent-insensitive and typo-tolerant client-side search. The expected dataset is small enough that a dedicated search server is unnecessary.
- **Vitest** for parsing/normalization tests and **Playwright** for the main browser flows.

Exact package versions will be pinned when implementation starts rather than embedded in this plan.

### Why not read the Sheet directly in the browser?

The browser must never receive the Sheet ID as a data source, ignored columns, or raw rows. Only the server reads the sanitized Sheet and emits a deliberately constructed public record. The original response Sheet, which contains confidential council-survey answers, is never connected to the application.

## 4. Google Sheets integration

### Source access

The application supports one source: a separate sanitized Sheet shared as **Anyone with the link: Viewer**. The server downloads its CSV representation using `GOOGLE_SHEET_ID` and `GOOGLE_SHEET_TAB`; no additional Google integration or credentials are used.

Because the sanitized Sheet is link-accessible, it must contain only fields already intended for the public website. Editors remain restricted to trusted administrators, and the original response Sheet stays private.

### Header-based mapping

The importer maps exact configured headers to internal field names. It does not depend on column positions and does not use an “everything except these fields” rule.

| Sheet field | Internal/public use |
|---|---|
| `Timestamp` | Internal source identity and ordering; never public |
| `What's your name?` | Public display name and search |
| `In which City/Country are you based in?` | Normalize and geocode to a city centre; original is not returned verbatim unless validated |
| `When did you start your PhD?` | Canonical start date and dynamically calculated PhD year |
| `In which year of the PhD are you?` | Fallback only if the start date is missing or invalid |
| Research-topic keywords | Public display and search tags |
| Research institute | Public institute codes and labels; supports multiple values |
| Hobbies | Public display and search tags |
| LinkedIn | Validated and normalized public link |
| ORCID | Validated and normalized public link |

Every council-focused question—struggles, things going well, council priorities, and activity suggestions—is absent from both the public schema and diagnostic logs.

### Date handling

The sanitized start-date column is formatted as `yyyy-mm-dd`, giving the CSV importer an unambiguous value to normalize.

The displayed trajectory is calculated from the start month:

`PhD year = floor(whole months since start / 12) + 1`

This keeps the profile current automatically. The submitted `Year 3`-style answer is used only as a fallback. Future or implausibly old dates are flagged and omitted rather than displayed incorrectly.

### Refresh behavior

- The first request after startup performs a sheet sync before returning data.
- The public endpoint uses a five-minute freshness window and a process-level lock, so only one Google request occurs when many visitors arrive together.
- The open website checks for a refreshed dataset every five minutes.
- Successful imports are committed to SQLite atomically.
- If Google is unavailable or a new import is invalid, the site serves the previous successful dataset and logs the failure without exposing details to visitors.
- The header shows the time of the last successful refresh.

This design does not require a permanent background worker. An optional systemd timer can later warm the cache, but correctness does not depend on it.

### Stable records and duplicate responses

The source timestamp is used internally to derive a non-reversible record identifier. It is not sent to the browser. A collision guard includes the source row number only when necessary.

The initial importer will flag probable duplicate profiles (same normalized name plus matching institute or LinkedIn/ORCID) rather than silently deleting one. Corrections can be made in the existing sheet row. If duplicate submissions become common, a non-public university email or generated profile key should be added as the deduplication key in a later form revision.

## 5. Public data contract

Only this shape may leave the server:

```ts
type PublicPerson = {
  id: string;
  name?: string;
  location?: {
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    locationKey: string;
  };
  phd?: {
    startMonth: string; // YYYY-MM
    currentYearLabel: string;
  };
  institutes: Array<"GIA" | "CLCG" | "ICOG">;
  topics: string[];
  hobbies: string[];
  links: {
    linkedin?: string;
    orcid?: string;
  };
};
```

The response also contains `lastUpdated`, a schema version, and aggregate counts. Raw Sheet values, source row numbers, timestamps, source configuration, import warnings, and ignored answers are never serialized.

Empty fields are omitted. If a response has no usable public fields, it is not published. A locationless profile is published in the list but has no coordinates.

## 6. Normalization and validation

### Research institutes

Canonical values:

- `GIA` — Groningen Institute of Archaeology
- `CLCG` — Centre for Language and Cognition Groningen
- `ICOG` — Groningen Research Institute for the Study of Culture

The Google Form should remain a checkbox question. The importer maps full labels and known variants to the codes above. In particular, both “Centre **of** Language and Cognition Groningen” and “Centre **for** Language and Cognition Groningen” map to `CLCG`.

Unknown values are logged for review and not invented as new institutes.

### Topics and hobbies

- Semicolons are the canonical separator.
- New lines are accepted as a fallback.
- Leading/trailing whitespace, duplicate items, repeated punctuation, and casing are normalized for search.
- The student's wording and capitalization are preserved for display where possible.
- Diacritics are preserved visually and folded only in the search index.
- Fuzzy search handles small spelling differences; no AI-generated topic classification is needed for the first release.
- A small, transparent alias dictionary may map obvious equivalents after real data demonstrates a need. It must never rewrite the displayed wording.

### LinkedIn

- Accept `linkedin.com/in/...`, `www.linkedin.com/in/...`, or a full HTTPS URL.
- Add `https://` when omitted.
- Permit only `linkedin.com` and its subdomains, with an `/in/` profile path.
- Remove tracking query parameters and trailing noise.
- Open in a new tab with safe external-link attributes.

### ORCID

- Accept either the 16-character ORCID identifier or an `orcid.org/...` URL.
- Normalize it to `https://orcid.org/####-####-####-####`.
- Validate the ORCID checksum; omit and log invalid values.

No raw HTML from the sheet is ever rendered.

## 7. Location processing and geocoding

### Parsing

- Expect `City, Country`; split on the final comma so names containing punctuation remain usable.
- Normalize known country aliases such as `The Netherlands`, `Netherlands`, and `NL` to `Netherlands`.
- Normalize whitespace and case while retaining proper display names.
- Treat missing, ambiguous, or failed locations as unlocated rather than guessing.

### Geocoding

- Geocoding runs only on the server.
- Each unique normalized `city + country` is geocoded once and cached persistently.
- Queries request city/locality results and store city-centre coordinates only.
- A versioned manual-override file or SQLite command supports corrections for ambiguous places.
- Changing geocoding providers does not affect the public data model.

For a small dataset, the public OpenStreetMap Nominatim service is viable only with deliberate rate limiting, identifying headers, attribution, and permanent caching. Recurring/bulk use is heavily constrained, so the geocoder will be behind an adapter and production use will be confirmed before launch. A paid or university-provided geocoder can be substituted without touching the UI.

### Map tiles

MapLibre is the renderer, not the tile service. The map style URL and optional API key will be configuration values. Development can use a suitable development style; production must use a tile provider whose terms allow the expected public traffic and display the required attribution. The application will not silently depend on a demo tile endpoint.

## 8. User experience specification

### Desktop

1. **Header:** concise title, visible-result count, last-updated time, and an information/help button.
2. **Left panel (about 320 px):**
   - collapsible;
   - one search field across names, topics, hobbies, institutes, cities, and countries;
   - institute checkboxes;
   - PhD-year/stage checkboxes;
   - “Clear filters” action;
   - matching people list, including a clearly labelled “Location not provided” group.
3. **Map:** occupies the remaining viewport, starts at a global extent that includes all valid locations, and updates immediately when filters change.
4. **Right profile panel (about 380 px):** opens on selection without navigating away; it contains only non-empty fields and clearly labelled external links.

Closing the profile returns focus to the selected person or marker. Collapsing the filter panel expands the map.

### Shared cities and clusters

There are two distinct cases:

- **Different nearby cities at a low zoom:** MapLibre clustering shows an aggregate count; selecting it zooms to reveal its cities.
- **Several people at exactly the same city coordinate:** selecting or hovering the city marker expands people radially (“spiderfies” them) and also opens a compact, scrollable city list. Selecting either a radial marker or a list row opens that person's profile.

Click/tap pins the expanded state. Pointer hover may preview it. Escape or clicking elsewhere collapses it. The list provides the accessible keyboard equivalent and keeps large Groningen cohorts usable.

### Mobile

- The map remains the main surface.
- Filters open as a full-height or near-full-height sheet from the bottom/side.
- Profiles open as a bottom sheet with a visible close control.
- A map/list toggle provides a usable alternative to dense marker interaction.
- Touch targets are at least 44 px and no interaction requires hover.

### Visual direction

The direction is a **contemporary academic atlas**: crisp cartographic surfaces, restrained institutional red as an accent, deep ink/navy text, clear typography, and compact information cards. The map—not decorative photography—is the visual centrepiece. No RUG logo or claim of official branding is used unless the faculty supplies an approved asset and permission.

The implementation includes responsive layouts, visible focus states, reduced-motion support, sufficient contrast, a map-specific favicon, and a text/list route through all information shown graphically.

## 9. Search behavior

Search is deterministic and explainable:

1. Normalize case, accents, punctuation, and whitespace.
2. Search each field with field-aware weights: name highest, then topic/hobby, then institute/location.
3. Prefer exact token and prefix matches.
4. Use restrained fuzzy matching for typographical errors.
5. Combine text search with filters using AND between filter groups and OR within a group.

Examples:

- Search `poetry` + filter `ICOG` returns ICOG profiles containing poetry-related text.
- Selecting both `GIA` and `CLCG` returns people belonging to either institute.
- A multi-affiliated person appears once.
- Clearing all filters restores every profile and refits the map only when appropriate; it does not unexpectedly reset a currently open profile.

## 10. Privacy and security controls

- Add explicit form consent stating that submitted profile fields are displayed publicly and that correction/removal requests go to `phd.council.hum@rug.nl`.
- Use a strict server-side allowlist for both input headers and output fields.
- Keep runtime configuration and database files outside the public directory and out of Git.
- Keep the sanitized Sheet limited to approved public columns and its editors limited to trusted administrators.
- Sanitize and validate every URL; allow only HTTPS public links.
- Use a Content Security Policy compatible with the chosen tile provider and no inline raw content from the sheet.
- Apply sensible API rate limits, response-size limits, security headers, and dependency updates.
- Do not log raw rows. Diagnostics contain row identifiers and field-level error codes, not sensitive answers.
- Back up the SQLite database for operational continuity, while treating the sheet as the authoritative profile source.
- Publish a short privacy/information panel explaining the source, public nature, city-level precision, update interval, and correction/removal contact.

Institutional privacy review remains advisable before public launch because the directory combines names, locations, interests, and academic profiles.

## 11. Reliability and observability

- `/health` verifies that the app can read its database; it does not expose source configuration or student data.
- Structured server logs cover sync success/failure, counts, validation warnings, and geocoding status without raw confidential values.
- Each sync is all-or-nothing: a malformed sheet cannot partially replace the good dataset.
- Column-header drift causes a visible operator error in logs and preserves the last good version.
- Removed rows disappear after the next successful sync.
- A local dry-run command prints aggregate import results and warnings without updating production data.
- Operational documentation covers Sheet access, database backup/restore, manual location overrides, and rollback.

## 12. Testing and acceptance strategy

### Unit tests

- Exact header mapping and ignored-column exclusion.
- ISO date parsing, legacy serial-date conversion, and PhD-year calculation.
- Institute aliases and multi-select parsing.
- Semicolon/newline tag parsing, deduplication, and accent folding.
- Country aliases and city parsing.
- LinkedIn normalization and domain/path rejection.
- ORCID formatting and checksum validation.
- Public serializer proving that private fields cannot escape.

### Integration tests

- Import a realistic anonymized sheet fixture, including the supplied Leonidas example.
- Sync creates an atomic database snapshot.
- Failed Google/geocoder requests retain the last-known-good snapshot.
- Duplicate and ambiguous rows produce safe warnings.
- API returns only the documented public schema with an update version/ETag.

### Browser tests

- Search by name, topic, and hobby.
- Filter by one and multiple institutes and by PhD year.
- Open/close profiles from map markers and list rows.
- Expand multiple Groningen profiles and select one.
- Discover a locationless person from the list.
- Verify mobile filter/profile sheets, keyboard navigation, Escape behavior, and focus restoration.
- Confirm filtered marker/list/count consistency.

### Security/privacy regression check

A test scans the built application, HTML, JSON responses, and logs for the exact ignored survey headings and known fixture secrets. The release fails if any appear.

### Definition of done

The first release is done when:

- a new valid form response is visible within the five-minute refresh cycle;
- the original response Sheet remains private and the sanitized Sheet contains only approved public fields;
- only allowlisted fields can be observed in browser/network responses;
- map, filters, shared-city expansion, profile panel, and unlocated list work on desktop and mobile;
- invalid optional fields degrade by omission, not page failure;
- the last good data remains available through a Google API outage;
- automated tests and a visual accessibility pass succeed;
- local setup and LXC deployment are documented and reproducible.

## 13. Delivery phases

### Phase 0 — Integration preflight (complete)

- Confirm the final sheet tab name and exact headers.
- Create and verify the public-column-only sanitized Sheet.
- Select a production tile provider and confirm geocoder policy/cost.
- Create an anonymized fixture containing valid, missing, noisy, ambiguous, and invalid values.

Exit criterion: the application can read the approved columns from a sanitized test Sheet without exposing its identifier to the browser.

### Phase 1 — Foundation and first meaningful preview (complete)

- Scaffold the TypeScript full-stack application and environment validation.
- Establish the visual theme and responsive three-surface layout.
- Build the map shell, left filters, right profile panel, representative test profiles, and favicon.
- Hand off a local preview once this recognizable slice works; do not wait for the Google integration.

Exit criterion: the intended product and interaction model are visible and usable with fixture data.

### Phase 2 — Safe data pipeline (complete)

- Implement server-side CSV retrieval and exact header mapping.
- Add validation, normalization, URL handling, institute mapping, and PhD-year calculation.
- Add SQLite snapshots, five-minute freshness logic, last-known-good behavior, and public serialization.
- Add dry-run diagnostics and tests that prove ignored columns never leave the importer.

Exit criterion: real test-sheet data appears through the safe public API, with failure recovery.

### Phase 3 — Location pipeline and complete interactions (complete)

- Add cached geocoding, country aliases, ambiguous-location handling, and overrides.
- Connect real GeoJSON data to MapLibre clustering.
- Implement shared-city spider expansion plus city list.
- Complete search, institute/year filters, unlocated people, result counts, and empty/error states.

Exit criterion: all confirmed desktop interactions work against normalized data.

### Phase 4 — Responsive, accessible, and operational polish (in progress)

- Implement mobile sheets and map/list mode.
- Complete keyboard/focus behavior, reduced motion, contrast, loading states, and map attribution.
- Add health checks, structured safe logs, security headers, CSP, and operational documentation.
- Run browser, visual, privacy-regression, and failure-recovery checks.

Exit criterion: release acceptance criteria pass locally.

### Phase 5 — LXC deployment

- Build a production Node release in the LXC under a dedicated unprivileged service account.
- Run it as a hardened systemd service bound to localhost.
- Put Caddy in front as the public reverse proxy with automatic HTTPS.
- Store runtime configuration and the SQLite path in the protected systemd environment file.
- Configure DNS, firewall rules, restart policy, log rotation, backup, and a health check.
- Perform a production smoke test without using real confidential values as test fixtures.

Exit criterion: the public HTTPS site passes the same core browser flows and survives a service restart with its cache intact.

## 14. Explicitly out of scope for the first release

- Student login or self-service profile editing.
- An administrative web dashboard.
- Exact addresses or live location tracking.
- Profile photos.
- ResearchGate support until requested again.
- AI-generated classification or recommendations.
- Per-person public profile URLs and social-preview cards.
- Analytics or third-party tracking.

These can be added later without changing the core public-person schema or map architecture.

## 15. Inputs needed before production deployment

Production deployment requires these concrete inputs:

1. The final site name and production domain.
2. The sanitized Sheet ID and tab name, provided as server environment values rather than committed files.
3. Confirmation that the sanitized Sheet contains no private response or council-survey columns.
4. A final dry-run sync with representative rows, especially multi-institute, missing-location, noisy-location, empty-field, and invalid-link cases.
5. Confirmation of the production tile provider and geocoding policy.
