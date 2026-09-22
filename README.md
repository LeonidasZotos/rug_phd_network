# PhD Network Map

A public, map-first directory for Faculty of Arts PhD researchers. The application reads only approved profile columns from a sanitized Google Sheet, normalizes them on the server, and exposes a deliberately small public dataset.

The interface includes:

- a global MapLibre map with city clustering;
- persistent expansion for several researchers in one city;
- searchable and filterable semantic people lists;
- research-institute and PhD-year filters;
- right-side profiles on desktop and mobile sheets;
- a list for people whose location is missing or cannot be validated.

The full design and data decisions are in [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md).

## Local development

Requirements: Node.js 22 or newer and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Without a configured live data source the site uses clearly labelled demonstration data, including the sample response supplied during development.

Useful checks:

```bash
npm test
npm run typecheck
npm run build
```

## Connecting the public sanitized Sheet

This setup needs no Google Cloud project or credentials. The original form-response spreadsheet stays private; only the separate sanitized spreadsheet is shared as **Anyone with the link: Viewer**.

1. Keep the sanitized spreadsheet limited to the public profile columns. Do not include email or council-survey answers, and limit editors to trusted administrators.
2. Copy the spreadsheet ID from its URL: in `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`, it is the part between `/d/` and `/edit`.
3. In `.env.local`, set `GOOGLE_SHEET_ID` and set `GOOGLE_SHEET_TAB` to the exact tab name.
4. Keep `REQUIRE_EXPLICIT_CONSENT="false"`; completing the optional public-profile form section already supplies consent.
5. Run `npm run sync:dry-run`. Only after it reports the expected profile count, run `npm run sync` to publish the local snapshot, then restart the website.

The server downloads the Sheet as CSV every five minutes. It matches a strict allowlist of known question headers, ignores every unknown column, validates profile links and field sizes, and never returns source timestamps. A malformed response, suspicious row-count collapse, or upstream error leaves the previous valid snapshot in place.

The Sheet is intentionally link-accessible, so anyone who obtains its URL can read its raw sanitized contents. Only place information there that is already intended for the public website.

### Date handling

Format the sanitized start-date column as `yyyy-mm-dd` so the public CSV is unambiguous. The site stores only `YYYY-MM` and calculates the current PhD year when profiles are refreshed. The submitted “Year N” field is only a fallback.

### Location handling

Known city-centre coordinates can be added to [`config/location-overrides.json`](./config/location-overrides.json). A private override file at `DATA_DIR/location-overrides.json` takes precedence.

Network geocoding is disabled by default. When deliberately enabled, the current adapter uses Nominatim only for uncached locations, validates the result, and persists the result in SQLite. Confirm the provider policy and expected volume before production use.

### Emergency removal

To hide a public profile even when Google Sheets is unavailable, add its public ID to `DATA_DIR/suppressions.json` as a JSON array or to the comma-separated `SUPPRESSED_PUBLIC_IDS` environment value. The suppression is applied every time the public dataset is read. A sample file is provided at [`data/suppressions.example.json`](./data/suppressions.example.json).

## Production on an LXC

The reference deployment uses one Node process under systemd and Caddy as the HTTPS reverse proxy. Examples are in [`deploy/`](./deploy).

Important production rules:

- build and install dependencies on the Linux target; never copy macOS `node_modules`;
- run the service as a dedicated unprivileged account;
- keep the database in `/var/lib/rug-phd-network`, outside application releases;
- use exactly one application process, because SQLite is the local state store;
- back up the database, while treating the Google Sheet as the profile source of truth.

The application provides a side-effect-free health endpoint at `/health`.

## Privacy boundary

The public API shape is defined by a strict schema. Unknown fields fail validation. Raw Sheet rows, timestamps, source row numbers, Google error bodies, and ignored survey responses are not serialized or logged. Students can request correction or removal at `phd.council.hum@rug.nl`.
