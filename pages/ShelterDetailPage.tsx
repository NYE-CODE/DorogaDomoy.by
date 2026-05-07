import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import {
  ExternalLink,
  Globe,
  Heart,
  Home,
  Mail,
  MapPin,
  MoreVertical,
  PawPrint,
  Phone,
  Send,
  Building2,
  Bell,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { PageLoader } from '../components/ui/page-loader';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useI18n } from '../context/I18nContext';
import { sheltersApi, type ShelterResponse } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useAuthenticatedAction } from '../utils/use-authenticated-action';
import {
  shelterAnimalFocusLabel,
  shelterKindLabel,
  shelterLogoSrc,
} from '../utils/shelter-public';
import {
  applySeo,
  canonicalUrlFromPath,
  SEO_KEYWORDS,
  SEO_ROBOTS_PRIVATE,
  SEO_ROBOTS_PUBLIC,
  truncateMetaDescription,
} from '../utils/seo';
import { ShelterPetsSection } from '../components/shelter-pets-section';
import { ScrollToTop } from '../components/scroll-to-top';
import type { Pet } from '../types/pet';
import { BackQuickMenu } from '../components/navigation/BackQuickMenu';

export default function ShelterDetailPage() {
  const { shelterId } = useParams<{ shelterId: string }>();
  const { t } = useI18n();
  const s = t.landing.shelters;
  const { user, isLoading: authLoading } = useAuth();
  const { runWhenAuthed } = useAuthenticatedAction();

  const [row, setRow] = useState<ShelterResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [shelterPets, setShelterPets] = useState<Pet[]>([]);
  const [activeTab, setActiveTab] = useState<'pets' | 'fundraisers'>('pets');
  const [mobileTab, setMobileTab] = useState<'about' | 'pets' | 'fundraisers'>('about');
  const [aboutMenuOpen, setAboutMenuOpen] = useState(false);
  const aboutMenuRef = useRef<HTMLDivElement | null>(null);

  const [subCount, setSubCount] = useState<number | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [subBusy, setSubBusy] = useState(false);

  const loadSubStatus = useCallback(() => {
    const id = row?.id;
    if (!id?.trim()) {
      setSubCount(null);
      setSubscribed(false);
      return;
    }
    setSubLoading(true);
    sheltersApi
      .subscriptionStatus(id)
      .then((st) => {
        setSubCount(st.subscriber_count);
        setSubscribed(st.subscribed);
      })
      .catch(() => {
        setSubCount(null);
        setSubscribed(false);
      })
      .finally(() => setSubLoading(false));
  }, [row?.id]);

  useEffect(() => {
    loadSubStatus();
  }, [loadSubStatus, user?.id]);

  const handleSubscribeToggle = useCallback(() => {
    runWhenAuthed(async () => {
      const id = row?.id?.trim();
      if (!id) return;
      if (user?.telegramId == null) {
        toast.error(s.detailSubscribeNeedTelegram, {
          action: {
            label: s.detailSubscribeOpenProfile,
            onClick: () => {
              window.location.href = '/profile?tab=notifications';
            },
          },
        });
        return;
      }
      setSubBusy(true);
      try {
        if (subscribed) {
          await sheltersApi.unsubscribe(id);
          toast.success(s.detailUnsubscribeSuccess);
        } else {
          await sheltersApi.subscribe(id);
          toast.success(s.detailSubscribeSuccess);
        }
        await sheltersApi.subscriptionStatus(id).then((st) => {
          setSubCount(st.subscriber_count);
          setSubscribed(st.subscribed);
        });
      } catch {
        toast.error(s.detailSubscribeError);
      } finally {
        setSubBusy(false);
      }
    });
  }, [
    row?.id,
    runWhenAuthed,
    s.detailSubscribeError,
    s.detailSubscribeNeedTelegram,
    s.detailSubscribeOpenProfile,
    s.detailSubscribeSuccess,
    s.detailUnsubscribeSuccess,
    subscribed,
    user?.telegramId,
  ]);

  const load = useCallback(() => {
    if (!shelterId?.trim()) {
      setNotFound(true);
      setRow(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setNotFound(false);
    sheltersApi
      .get(shelterId.trim())
      .then((r) => {
        setRow(r);
        setNotFound(false);
      })
      .catch(() => {
        setRow(null);
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [shelterId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (loading || !shelterId) return;
    const path = `/shelters/${shelterId}`;
    if (notFound || !row) {
      applySeo({
        title: `${s.detailNotFound} | DorogaDomoy.by`,
        description: truncateMetaDescription(`${s.detailNotFoundHint} DorogaDomoy.by.`),
        canonicalUrl: canonicalUrlFromPath(path),
        robots: SEO_ROBOTS_PRIVATE,
        keywords: SEO_KEYWORDS,
      });
      return;
    }
    const kind = shelterKindLabel(row.kind, s);
    const loc = [row.city, row.address].filter(Boolean).join(', ');
    const title = `${row.name} — ${kind} | DorogaDomoy.by`;
    const descSource = row.description?.trim() || `${row.name}. ${loc}. ${s.pageTitle}.`;
    applySeo({
      title,
      description: truncateMetaDescription(descSource),
      canonicalUrl: canonicalUrlFromPath(path),
      robots: SEO_ROBOTS_PUBLIC,
      keywords: SEO_KEYWORDS,
    });
  }, [loading, notFound, row, shelterId, s]);

  useEffect(() => {
    if (!row?.id) {
      setShelterPets([]);
      return;
    }
    sheltersApi
      .listPets(row.id, {
        is_archived: false,
        limit: 300,
      })
      .then((pets) => setShelterPets(pets))
      .catch(() => setShelterPets([]));
  }, [row?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (aboutMenuRef.current && !aboutMenuRef.current.contains(event.target as Node)) {
        setAboutMenuOpen(false);
      }
    };
    if (aboutMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [aboutMenuOpen]);

  const handleShare = useCallback(async () => {
    if (!row) return;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const title = row.name;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success(s.detailShareCopied);
      }
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(url);
          toast.success(s.detailShareCopied);
        } else {
          toast.error(t.common.error);
        }
      } catch {
        toast.error(t.common.error);
      }
    }
  }, [row, s.detailShareCopied, t.common.error]);

  const logo = row ? shelterLogoSrc(row.logo_url) : undefined;
  const cover = row?.cover_url ? shelterLogoSrc(row.cover_url) : undefined;
  const mapHref = row
    ? `https://www.google.com/maps?q=${row.location_lat},${row.location_lng}`
    : '#';
  const c = row?.contacts || {};
  const locationLine = row?.address?.trim() || '';
  const websiteHref =
    c.website && String(c.website).trim()
      ? String(c.website).trim().startsWith('http')
        ? String(c.website).trim()
        : `https://${String(c.website).trim()}`
      : null;
  const hasAnyContact = Boolean(
    c.phone?.trim() || c.telegram?.trim() || c.email?.trim() || c.website?.trim(),
  );
  const totalPets = shelterPets.length;
  const foundPets = shelterPets.filter((p) => p.adoptionStatus === 'adopted').length;
  const searchingPets = shelterPets.filter((p) => (p.adoptionStatus ?? 'available') !== 'adopted').length;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header showCitySelector={false} />
      <main className="overflow-x-clip overflow-y-visible pt-0 pb-0">
        {loading ? (
          <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 sm:pt-10 lg:px-8">
            <div className="mb-6">
              <BackQuickMenu />
            </div>
            <PageLoader />
          </div>
        ) : notFound || !row ? (
          <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 sm:pt-10 lg:px-8">
            <div className="mb-6">
              <BackQuickMenu />
            </div>
            <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-8 text-center">
              <Building2 className="mx-auto size-12 text-muted-foreground opacity-50" aria-hidden />
              <h1 className="text-xl font-semibold text-foreground">{s.detailNotFound}</h1>
              <p className="mx-auto max-w-md text-sm text-muted-foreground">{s.detailNotFoundHint}</p>
              <Button asChild className="mt-2 w-full sm:w-auto">
                <Link to="/shelters">{s.detailBack}</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-muted/30">
            <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
              <div className="mb-4 sm:mb-6">
                <BackQuickMenu />
              </div>
              <section className="relative overflow-hidden rounded-2xl border border-border/60">
                <div className="h-64 overflow-hidden bg-muted md:h-80 lg:h-96">
                  {cover ? (
                    <img
                      src={cover}
                      alt={row.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div
                      className="size-full bg-gradient-to-br from-muted via-muted/80 to-background"
                      aria-hidden
                    />
                  )}
                </div>

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent">
                  <div className="flex items-end gap-4 px-5 pb-5 pt-6 md:gap-6 md:px-6 md:pb-6 md:pt-8">
                    <div className="shrink-0">
                      <div className="flex size-20 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/95 bg-card shadow-lg md:size-30 lg:size-36">
                        {logo ? (
                          <img
                            src={logo}
                            alt={`${row.name} logo`}
                            className="size-full object-cover"
                          />
                        ) : (
                          <Building2 className="size-10 text-muted-foreground opacity-60 md:size-14 lg:size-16" aria-hidden />
                        )}
                      </div>
                      <p className="mt-2 text-center text-xs font-medium text-white/80 md:text-sm">
                        {subLoading && subCount === null
                          ? '…'
                          : s.detailSubscribeCount.replace('{n}', String(subCount ?? 0))}
                      </p>
                    </div>

                    <div className="min-w-0 pr-12 sm:pr-0">
                      <h1 className="text-balance text-2xl font-bold tracking-tight text-white md:text-3xl lg:text-4xl">
                        {row.name}
                      </h1>
                      {row.city ? (
                        <p className="mt-1 text-sm text-white/90 md:text-base">{row.city}</p>
                      ) : null}
                      <div className="mt-3.5 flex flex-wrap items-center gap-2">
                        <Badge className="max-w-[min(12rem,calc(100vw-4rem))] truncate border-white/25 bg-black/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white sm:max-w-[14rem] sm:text-xs">
                          {shelterKindLabel(row.kind, s)}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={`max-w-[min(12rem,calc(100vw-4rem))] truncate px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white sm:max-w-[14rem] sm:text-xs ${
                            row.animal_focus === 'mixed'
                              ? 'border-white/25 bg-transparent'
                              : 'border-white/20 bg-white/20'
                          }`}
                          title={s.detailAnimalFocus}
                        >
                          {shelterAnimalFocusLabel(row.animal_focus, s)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="absolute right-4 bottom-4 md:right-6 md:bottom-6">
                    <Button
                      type="button"
                      variant="secondary"
                      className="size-9 shrink-0 border-white/20 bg-white/15 p-0 text-white hover:bg-white/25 sm:h-9 sm:w-auto sm:px-3 sm:py-2"
                      aria-label={s.detailSubscribeAria}
                      disabled={subBusy || subLoading || authLoading}
                      onClick={handleSubscribeToggle}
                    >
                      <Bell className="size-4 shrink-0" aria-hidden />
                      <span className="hidden sm:inline">
                        {subscribed ? s.detailUnsubscribe : s.detailSubscribe}
                      </span>
                    </Button>
                  </div>
                </div>
              </section>
            </div>

            <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 md:py-7 lg:px-8 lg:py-10">
              <div className="mb-5 inline-flex w-full rounded-lg border border-border bg-card p-1 lg:hidden">
                <button
                  type="button"
                  onClick={() => setMobileTab('about')}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    mobileTab === 'about' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  О нас
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTab('pets')}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    mobileTab === 'pets' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {s.tabPets}
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTab('fundraisers')}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    mobileTab === 'fundraisers' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {s.detailTabFundraisers}
                </button>
              </div>

              <div className="mb-8 space-y-4 lg:hidden">
                {mobileTab === 'about' ? (
                  <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="mb-4 text-xl font-bold tracking-tight text-foreground">
                      О нас
                    </h2>
                    {row.description?.trim() ? (
                      <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                        {row.description.trim()}
                      </p>
                    ) : (
                      <p className="text-muted-foreground">{s.detailNotFoundHint}</p>
                    )}

                    <div className="mt-6 space-y-4 border-t border-border/60 pt-6">
                      {locationLine ? (
                        <div className="flex items-start gap-3">
                          <MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                          <div>
                            <p className="text-sm text-muted-foreground">{t.pet.address}</p>
                            <p className="text-foreground">{locationLine}</p>
                          </div>
                        </div>
                      ) : null}
                      {c.phone ? (
                        <div className="flex items-start gap-3">
                          <Phone className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                          <div>
                            <p className="text-sm text-muted-foreground">Телефон</p>
                            <a href={`tel:${String(c.phone).replace(/\s/g, '')}`} className="text-foreground transition-colors hover:text-primary">
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
                            <a href={`mailto:${c.email}`} className="break-all text-foreground transition-colors hover:text-primary">
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
                        <p className="text-sm text-muted-foreground">{s.detailNoContacts}</p>
                      ) : null}
                    </div>
                  </section>
                ) : null}

                {mobileTab === 'pets' ? (
                  <ShelterPetsSection shelterId={row.id} initialPets={shelterPets} />
                ) : null}

                {mobileTab === 'fundraisers' ? (
                  <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="text-xl font-bold tracking-tight text-foreground">
                      {s.detailFundraisersTitle}
                    </h2>
                    <p className="mt-3 text-sm text-muted-foreground">{s.detailFundraisersEmpty}</p>
                  </section>
                ) : null}
              </div>

              <div className="mb-8 hidden items-start gap-6 lg:grid lg:grid-cols-3">
                <section className="self-start rounded-2xl border border-border bg-card p-6 shadow-sm lg:col-span-1">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
                      О нас
                    </h2>
                    <div className="relative" ref={aboutMenuRef}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Открыть меню действий"
                        aria-expanded={aboutMenuOpen}
                        onClick={() => setAboutMenuOpen((v) => !v)}
                      >
                        <MoreVertical className="size-4 shrink-0" aria-hidden />
                      </Button>
                      {aboutMenuOpen ? (
                        <div className="absolute right-0 z-50 mt-1 min-w-[11rem] rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                          <button
                            type="button"
                            className="focus:bg-accent focus:text-accent-foreground relative flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-accent"
                            onClick={() => {
                              setAboutMenuOpen(false);
                              void handleShare();
                            }}
                          >
                            <Share2 className="size-4 shrink-0" aria-hidden />
                            {s.detailShare}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  {row.description?.trim() ? (
                    <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                      {row.description.trim()}
                    </p>
                  ) : (
                    <p className="text-muted-foreground">{s.detailNotFoundHint}</p>
                  )}

                  <div className="mt-6 space-y-4 border-t border-border/60 pt-6">
                    {locationLine ? (
                      <div className="flex items-start gap-3">
                        <MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                        <div>
                          <p className="text-sm text-muted-foreground">{t.pet.address}</p>
                          <p className="text-foreground">{locationLine}</p>
                        </div>
                      </div>
                    ) : null}
                    {c.phone ? (
                      <div className="flex items-start gap-3">
                        <Phone className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                        <div>
                          <p className="text-sm text-muted-foreground">Телефон</p>
                          <a href={`tel:${String(c.phone).replace(/\s/g, '')}`} className="text-foreground transition-colors hover:text-primary">
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
                          <a href={`mailto:${c.email}`} className="break-all text-foreground transition-colors hover:text-primary">
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
                      <p className="text-sm text-muted-foreground">{s.detailNoContacts}</p>
                    ) : null}
                  </div>

                </section>

                <aside className="space-y-4 lg:col-span-2">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-xl border border-border/80 bg-card p-4 text-center shadow-sm">
                      <div className="mx-auto mb-2 hidden size-9 items-center justify-center rounded-full bg-primary/8 sm:flex">
                        <PawPrint className="size-4 text-primary/90" aria-hidden />
                      </div>
                      <p className="text-xl font-bold text-foreground md:text-2xl">{totalPets}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">Всего питомцев</p>
                    </div>
                    <div className="rounded-xl border border-border/80 bg-card p-4 text-center shadow-sm">
                      <div className="mx-auto mb-2 hidden size-9 items-center justify-center rounded-full bg-primary/8 sm:flex">
                        <Heart className="size-4 text-primary/90" aria-hidden />
                      </div>
                      <p className="text-xl font-bold text-foreground md:text-2xl">{foundPets}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">Нашли дом</p>
                    </div>
                    <div className="rounded-xl border border-border/80 bg-card p-4 text-center shadow-sm">
                      <div className="mx-auto mb-2 hidden size-9 items-center justify-center rounded-full bg-primary/8 sm:flex">
                        <Home className="size-4 text-primary/90" aria-hidden />
                      </div>
                      <p className="text-xl font-bold text-foreground md:text-2xl">{searchingPets}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">Ищут дом</p>
                    </div>
                  </div>

                  <div className="inline-flex w-full rounded-lg border border-border bg-card p-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('pets')}
                      className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'pets' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {s.tabPets}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('fundraisers')}
                      className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'fundraisers' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {s.detailTabFundraisers}
                    </button>
                  </div>

                  {activeTab === 'pets' ? (
                    <ShelterPetsSection shelterId={row.id} initialPets={shelterPets} />
                  ) : (
                    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                      <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
                        {s.detailFundraisersTitle}
                      </h2>
                      <p className="mt-3 text-sm text-muted-foreground">{s.detailFundraisersEmpty}</p>
                    </section>
                  )}
                </aside>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
