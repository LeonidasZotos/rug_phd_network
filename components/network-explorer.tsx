"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Filter, Info, List, Map as MapIcon, Search, SlidersHorizontal, Users, X } from "lucide-react";
import { groupByLocation, initials, searchPeople } from "@/lib/client-data";
import { INSTITUTES } from "@/lib/institutes";
import { INSTITUTE_CODES, type InstituteCode, type LocationGroup, type PublicDataset, type PublicPerson } from "@/lib/types";
import { ProfilePanel } from "@/components/profile-panel";

const NetworkMap = dynamic(() => import("@/components/network-map").then((mod) => mod.NetworkMap), {
  ssr: false,
  loading: () => <div className="map-shell map-placeholder">Preparing the map…</div>
});

const YEAR_OPTIONS = ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5+"];

export function NetworkExplorer({ initialDataset }: { initialDataset: PublicDataset }) {
  const [dataset, setDataset] = useState(initialDataset);
  const [query, setQuery] = useState("");
  const [institutes, setInstitutes] = useState<Set<InstituteCode>>(new Set());
  const [years, setYears] = useState<Set<string>>(new Set());
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [mobileView, setMobileView] = useState<"map" | "list">("map");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [selectedGroupKey, setSelectedGroupKey] = useState<string>();
  const [selectedPerson, setSelectedPerson] = useState<PublicPerson>();
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let etag: string | undefined;
    const controller = new AbortController();
    async function refresh() {
      try {
        const response = await fetch("/api/people", {
          cache: "no-store",
          signal: controller.signal,
          headers: etag ? { "If-None-Match": etag } : undefined
        });
        if (response.status === 304) return;
        if (!response.ok) return;
        etag = response.headers.get("etag") ?? undefined;
        setDataset((await response.json()) as PublicDataset);
      } catch {
        // Keep the last good client snapshot when offline or during refresh failure.
      }
    }
    const interval = window.setInterval(refresh, 300_000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      controller.abort();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (infoOpen) setInfoOpen(false);
      else if (mobileFiltersOpen) setMobileFiltersOpen(false);
      else if (selectedPerson) closeProfile();
      else if (selectedGroupKey) setSelectedGroupKey(undefined);
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  });

  const filteredPeople = useMemo(() => {
    return searchPeople(dataset.people, query).filter((person) => {
      const instituteMatch = institutes.size === 0 || person.institutes.some((code) => institutes.has(code));
      const yearMatch = years.size === 0 || (person.phd?.currentYearLabel && years.has(person.phd.currentYearLabel));
      return instituteMatch && yearMatch;
    });
  }, [dataset.people, institutes, query, years]);

  const groups = useMemo(() => groupByLocation(filteredPeople), [filteredPeople]);
  const located = filteredPeople.filter((person) => person.location);
  const unlocated = filteredPeople.filter((person) => !person.location);
  const selectedGroup = groups.find((group) => group.key === selectedGroupKey);

  useEffect(() => {
    if (selectedPerson && !filteredPeople.some((person) => person.id === selectedPerson.id)) {
      setSelectedPerson(undefined);
    }
    if (selectedGroupKey && !groups.some((group) => group.key === selectedGroupKey)) {
      setSelectedGroupKey(undefined);
    }
  }, [filteredPeople, groups, selectedGroupKey, selectedPerson]);

  const selectGroup = useCallback((group: LocationGroup | undefined) => {
    setSelectedGroupKey(group?.key);
  }, []);
  const selectPerson = useCallback((person: PublicPerson) => {
    if (document.activeElement instanceof HTMLElement) returnFocusRef.current = document.activeElement;
    setSelectedPerson(person);
    setSelectedGroupKey(undefined);
  }, []);

  function closeProfile() {
    setSelectedPerson(undefined);
    setSelectedGroupKey(undefined);
    window.requestAnimationFrame(() => returnFocusRef.current?.focus());
  }

  function toggleInstitute(code: InstituteCode) {
    setInstitutes((current) => {
      const next = new Set(current);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function toggleYear(year: string) {
    setYears((current) => {
      const next = new Set(current);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  }

  function clearFilters() {
    setQuery("");
    setInstitutes(new Set());
    setYears(new Set());
  }

  const filtersActive = Boolean(query || institutes.size || years.size);
  const updated = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(dataset.lastUpdated));

  const filtersContent = (
    <>
      <div className="filter-panel-heading">
        <div>
          <span className="eyebrow">Explore the network</span>
          <h2>Find researchers</h2>
        </div>
        <button className="mobile-only icon-button" type="button" aria-label="Close filters" onClick={() => setMobileFiltersOpen(false)}><X /></button>
      </div>
      <label className="search-field">
        <Search size={18} aria-hidden="true" />
        <span className="sr-only">Search people, topics, languages, hobbies, or locations</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, topic, language…" />
        {query ? <button type="button" aria-label="Clear search" onClick={() => setQuery("")}><X size={16} /></button> : null}
      </label>

      <fieldset className="filter-group">
        <legend>Research institute</legend>
        {INSTITUTE_CODES.map((code) => (
          <label key={code} className="check-row">
            <input type="checkbox" checked={institutes.has(code)} onChange={() => toggleInstitute(code)} />
            <span className="fake-check" aria-hidden="true" />
            <span><strong>{code}</strong><small>{INSTITUTES[code].shortName}</small></span>
          </label>
        ))}
      </fieldset>

      <fieldset className="filter-group compact-options">
        <legend>PhD year</legend>
        <div>
          {YEAR_OPTIONS.map((year) => (
            <label key={year}>
              <input type="checkbox" checked={years.has(year)} onChange={() => toggleYear(year)} />
              <span>{year.replace("Year ", "")}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="filter-summary" aria-live="polite">
        <span><strong>{filteredPeople.length}</strong> {filteredPeople.length === 1 ? "person" : "people"}</span>
        {filtersActive ? <button type="button" onClick={clearFilters}>Clear filters</button> : null}
      </div>

      <PeopleList people={filteredPeople} selectedPersonId={selectedPerson?.id} onSelect={selectPerson} />
    </>
  );

  return (
    <main className={`app-shell ${filtersCollapsed ? "filters-collapsed" : ""} ${selectedPerson ? "profile-open" : ""}`}>
      <a className="skip-link" href="#people-results">Skip to people</a>
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>
        <div className="brand-copy">
          <h1>{process.env.NEXT_PUBLIC_SITE_NAME || "PhD Network Map"}</h1>
          <p>{dataset.people.length} researchers · Updated {updated}</p>
        </div>
        {dataset.mode === "demo" ? <span className="demo-badge">Demonstration data</span> : null}
        <button className="about-button" type="button" onClick={() => setInfoOpen(true)}><Info size={17} /> <span>About</span></button>
      </header>

      <aside className="filter-panel" aria-label="Search and filters">
        <button
          className="filter-collapse"
          type="button"
          aria-expanded={!filtersCollapsed}
          aria-controls="desktop-filters"
          onClick={() => setFiltersCollapsed((value) => !value)}
        >
          {filtersCollapsed ? <ChevronRight /> : <ChevronLeft />}
          <span className="sr-only">{filtersCollapsed ? "Show" : "Hide"} filters</span>
        </button>
        {filtersCollapsed ? <SlidersHorizontal className="collapsed-icon" aria-hidden="true" /> : <div id="desktop-filters" className="filter-panel-inner">{filtersContent}</div>}
      </aside>

      <div className="mobile-toolbar" aria-label="View and filter controls">
        <div className="view-switcher">
          <button type="button" className={mobileView === "map" ? "is-active" : ""} onClick={() => setMobileView("map")}><MapIcon size={16} /> Map</button>
          <button type="button" className={mobileView === "list" ? "is-active" : ""} onClick={() => setMobileView("list")}><List size={16} /> List</button>
        </div>
        <button type="button" onClick={() => setMobileFiltersOpen(true)}><Filter size={17} /> Filters {filtersActive ? <span className="active-dot" /> : null}</button>
      </div>

      <div className={`map-region ${mobileView === "list" ? "mobile-hidden" : ""}`}>
        <NetworkMap
          groups={groups}
          selectedGroupKey={selectedGroupKey}
          selectedPersonId={selectedPerson?.id}
          onSelectGroup={selectGroup}
          onSelectPerson={selectPerson}
        />
      </div>

      <section className={`mobile-list-view ${mobileView === "map" ? "mobile-hidden" : ""}`} aria-label="People list">
        <div className="mobile-list-summary"><strong>{located.length}</strong> on the map · <strong>{unlocated.length}</strong> without a location</div>
        <PeopleList people={filteredPeople} selectedPersonId={selectedPerson?.id} onSelect={selectPerson} expanded />
      </section>

      {selectedPerson ? <ProfilePanel person={selectedPerson} onClose={closeProfile} /> : null}

      {mobileFiltersOpen ? <div className="mobile-filter-sheet" role="dialog" aria-modal="true" aria-label="Filters"><div>{filtersContent}</div></div> : null}
      {infoOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setInfoOpen(false)}>
          <section className="info-modal" role="dialog" aria-modal="true" aria-labelledby="info-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" aria-label="Close information" onClick={() => setInfoOpen(false)}><X /></button>
            <span className="eyebrow">About this map</span>
            <h2 id="info-title">A view of our PhD community</h2>
            <p>This directory shows information that PhD researchers chose to share. Locations are shown at city level only, and profiles update from the council survey approximately every five minutes.</p>
            <p>To correct or remove your information, contact <a href="mailto:phd.council.hum@rug.nl">phd.council.hum@rug.nl</a>.</p>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function PeopleList({ people, selectedPersonId, onSelect, expanded = false }: { people: PublicPerson[]; selectedPersonId?: string; onSelect: (person: PublicPerson) => void; expanded?: boolean }) {
  const ordered = [...people].sort((a, b) => {
    if (Boolean(a.location) !== Boolean(b.location)) return a.location ? -1 : 1;
    return (a.name ?? "").localeCompare(b.name ?? "");
  });
  return (
    <div id="people-results" className={`people-list ${expanded ? "is-expanded" : ""}`}>
      {ordered.length ? ordered.map((person, index) => {
        const previous = ordered[index - 1];
        const startsUnlocated = !person.location && (index === 0 || previous?.location);
        return (
          <div key={person.id}>
            {startsUnlocated ? <div className="list-section-label">Location not provided</div> : null}
            <button type="button" className={person.id === selectedPersonId ? "person-row is-selected" : "person-row"} onClick={() => onSelect(person)}>
              <span className="person-avatar">{initials(person.name)}</span>
              <span className="person-copy">
                <strong>{person.name ?? "Unnamed profile"}</strong>
                <small>{person.location ? `${person.location.city}, ${person.location.country}` : person.institutes.join(" · ") || "Profile"}</small>
              </span>
              <ChevronRight size={17} aria-hidden="true" />
            </button>
          </div>
        );
      }) : (
        <div className="empty-results"><Users aria-hidden="true" /><strong>No matching researchers</strong><span>Try removing a filter or using a broader search.</span></div>
      )}
    </div>
  );
}
