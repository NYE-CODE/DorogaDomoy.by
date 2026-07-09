import { Globe, Mail, MapPin, MoreVertical, Phone, Send, Share2 } from 'lucide-react';
import type { ShelterContacts, ShelterResponse } from '@/shared/api/client';
import { Button } from '@/shared/ui/button';

export interface ShelterDetailContactsProps {
  s: Record<string, string>;
  addressLabel: string;
  locationLine: string;
  contacts: ShelterContacts;
  websiteHref: string | null;
  hasAnyContact: boolean;
  noContactsLabel: string;
}

export function ShelterDetailContacts({
  s,
  addressLabel,
  locationLine,
  contacts: c,
  websiteHref,
  hasAnyContact,
  noContactsLabel,
}: ShelterDetailContactsProps) {
  return (
    <div className="mt-6 space-y-4 border-t border-border/60 pt-6">
      {locationLine ? (
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="text-sm text-muted-foreground">{addressLabel}</p>
            <p className="text-foreground">{locationLine}</p>
          </div>
        </div>
      ) : null}
      {c.phone ? (
        <div className="flex items-start gap-3">
          <Phone className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="text-sm text-muted-foreground">Телефон</p>
            <a
              href={`tel:${String(c.phone).replace(/\s/g, '')}`}
              className="text-foreground transition-colors hover:text-primary"
            >
              {c.phone}
            </a>
          </div>
        </div>
      ) : null}
      {c.email ? (
        <div className="flex items-start gap-3">
          <Mail className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <a
              href={`mailto:${c.email}`}
              className="break-all text-foreground transition-colors hover:text-primary"
            >
              {c.email}
            </a>
          </div>
        </div>
      ) : null}
      {c.telegram ? (
        <div className="flex items-start gap-3">
          <Send className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="text-sm text-muted-foreground">{s.telegramLabel}</p>
            <a
              href={
                String(c.telegram).startsWith('http')
                  ? String(c.telegram)
                  : `https://t.me/${String(c.telegram).replace(/^@/, '')}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground transition-colors hover:text-primary"
            >
              {s.telegramLabel}
            </a>
          </div>
        </div>
      ) : null}
      {websiteHref ? (
        <div className="flex items-start gap-3">
          <Globe className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="text-sm text-muted-foreground">{s.website}</p>
            <a
              href={websiteHref}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-foreground transition-colors hover:text-primary"
            >
              {c.website}
            </a>
          </div>
        </div>
      ) : null}
      {!hasAnyContact ? (
        <p className="text-sm text-muted-foreground">{noContactsLabel}</p>
      ) : null}
    </div>
  );
}

export interface ShelterDetailAboutSectionProps {
  row: ShelterResponse;
  s: Record<string, string>;
  addressLabel: string;
  locationLine: string;
  websiteHref: string | null;
  hasAnyContact: boolean;
  headingClassName?: string;
  sectionClassName?: string;
  showShareMenu?: boolean;
  aboutMenuOpen?: boolean;
  aboutMenuRef?: React.RefObject<HTMLDivElement | null>;
  onToggleAboutMenu?: () => void;
  onShare?: () => void;
}

export function ShelterDetailAboutSection({
  row,
  s,
  addressLabel,
  locationLine,
  websiteHref,
  hasAnyContact,
  headingClassName = 'mb-4 text-xl font-bold tracking-tight text-foreground',
  sectionClassName = 'rounded-lg border border-border bg-card p-6 shadow-sm',
  showShareMenu = false,
  aboutMenuOpen = false,
  aboutMenuRef,
  onToggleAboutMenu,
  onShare,
}: ShelterDetailAboutSectionProps) {
  return (
    <section className={sectionClassName}>
      {showShareMenu ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">О нас</h2>
          {aboutMenuRef && onToggleAboutMenu && onShare ? (
          <div className="relative" ref={aboutMenuRef}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Открыть меню действий"
              aria-expanded={aboutMenuOpen}
              onClick={onToggleAboutMenu}
            >
              <MoreVertical className="size-4 shrink-0" aria-hidden />
            </Button>
            {aboutMenuOpen ? (
              <div className="absolute right-0 z-50 mt-1 min-w-[11rem] rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                <button
                  type="button"
                  className="focus:bg-accent focus:text-accent-foreground relative flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-accent"
                  onClick={() => {
                    onShare();
                  }}
                >
                  <Share2 className="size-4 shrink-0" aria-hidden />
                  {s.detailShare}
                </button>
              </div>
            ) : null}
          </div>
          ) : null}
        </div>
      ) : (
        <h2 className={headingClassName}>О нас</h2>
      )}
      {row.description?.trim() ? (
        <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
          {row.description.trim()}
        </p>
      ) : (
        <p className="text-muted-foreground">{s.detailNotFoundHint}</p>
      )}

      <ShelterDetailContacts
        s={s}
        addressLabel={addressLabel}
        locationLine={locationLine}
        contacts={row.contacts || {}}
        websiteHref={websiteHref}
        hasAnyContact={hasAnyContact}
        noContactsLabel={s.detailNoContacts}
      />
    </section>
  );
}
