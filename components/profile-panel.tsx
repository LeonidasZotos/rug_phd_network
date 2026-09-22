"use client";

import { BookOpen, CalendarDays, ExternalLink, Globe2, Heart, Landmark, Languages, MapPin, X } from "lucide-react";
import { INSTITUTES } from "@/lib/institutes";
import type { PublicPerson } from "@/lib/types";

type Props = {
  person: PublicPerson;
  onClose: () => void;
};

function Detail({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <section className="profile-detail">
      <div className="profile-detail-label">
        {icon}
        <h3>{label}</h3>
      </div>
      {children}
    </section>
  );
}

export function ProfilePanel({ person, onClose }: Props) {
  const name = person.name ?? "Unnamed profile";
  return (
    <aside className="profile-panel" aria-labelledby="profile-heading">
      <div className="profile-topbar">
        <span>Researcher profile</span>
        <button type="button" onClick={onClose} aria-label="Close profile">
          <X aria-hidden="true" />
        </button>
      </div>
      <div className="profile-intro">
        <div className="profile-monogram" aria-hidden="true">
          {(person.name ?? "?").split(/\s+/).slice(0, 2).map((part) => part[0]).join("")}
        </div>
        <h2 id="profile-heading">
          {person.links.rug ? (
            <a
              className="profile-name-link"
              href={person.links.rug}
              target="_blank"
              rel="noopener noreferrer"
            >
              {name}
              <ExternalLink size={16} aria-hidden="true" />
            </a>
          ) : name}
        </h2>
        {person.location ? (
          <p><MapPin size={16} aria-hidden="true" /> {person.location.city}, {person.location.country}</p>
        ) : (
          <p><MapPin size={16} aria-hidden="true" /> Location not provided</p>
        )}
      </div>

      <div className="profile-content">
        {person.institutes.length ? (
          <Detail icon={<Landmark aria-hidden="true" />} label={person.institutes.length > 1 ? "Research institutes" : "Research institute"}>
            <div className="institute-stack">
              {person.institutes.map((code) => (
                <a key={code} href={INSTITUTES[code].href} target="_blank" rel="noopener noreferrer">
                  <strong>{code}</strong>
                  <span>{INSTITUTES[code].name}</span>
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              ))}
            </div>
          </Detail>
        ) : null}

        {person.phd?.currentYearLabel || person.phd?.startMonth ? (
          <Detail icon={<CalendarDays aria-hidden="true" />} label="PhD trajectory">
            <p className="detail-copy">
              {person.phd.currentYearLabel}
              {person.phd.currentYearLabel && person.phd.startMonth ? " · " : ""}
              {person.phd.startMonth ? `Started ${new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${person.phd.startMonth}-01T00:00:00Z`))}` : null}
            </p>
          </Detail>
        ) : null}

        {person.homeCountry ? (
          <Detail icon={<Globe2 aria-hidden="true" />} label="Home country">
            <p className="detail-copy">{person.homeCountry}</p>
          </Detail>
        ) : null}

        {person.languages?.length ? (
          <Detail icon={<Languages aria-hidden="true" />} label="Languages spoken">
            <div className="tag-list">{person.languages.map((language) => <span key={language}>{language}</span>)}</div>
          </Detail>
        ) : null}

        {person.topics.length ? (
          <Detail icon={<BookOpen aria-hidden="true" />} label="Research topics">
            <div className="tag-list">{person.topics.map((topic) => <span key={topic}>{topic}</span>)}</div>
          </Detail>
        ) : null}

        {person.hobbies.length ? (
          <Detail icon={<Heart aria-hidden="true" />} label="Outside the PhD">
            <div className="tag-list hobby-tags">{person.hobbies.map((hobby) => <span key={hobby}>{hobby}</span>)}</div>
          </Detail>
        ) : null}

        {person.links.linkedin || person.links.orcid || person.links.rug ? (
          <Detail icon={<ExternalLink aria-hidden="true" />} label="Academic profiles">
            <div className="external-links">
              {person.links.rug ? <a href={person.links.rug} target="_blank" rel="noopener noreferrer">{name}&apos;s RUG profile <ExternalLink size={14} /></a> : null}
              {person.links.linkedin ? <a href={person.links.linkedin} target="_blank" rel="noopener noreferrer">{name} on LinkedIn <ExternalLink size={14} /></a> : null}
              {person.links.orcid ? <a href={person.links.orcid} target="_blank" rel="noopener noreferrer">{name} on ORCID <ExternalLink size={14} /></a> : null}
            </div>
          </Detail>
        ) : null}
      </div>
    </aside>
  );
}
