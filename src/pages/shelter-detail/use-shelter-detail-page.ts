import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { toast } from 'sonner';
import { useI18n } from '@/app/providers/I18nContext';
import { sheltersApi, type ShelterResponse } from '@/shared/api/client';
import { useAuth } from '@/app/providers/AuthContext';
import { useAuthenticatedAction } from '@/shared/hooks/use-authenticated-action';
import { useClickOutside } from '@/shared/hooks/useClickOutside';
import { shelterKindLabel, shelterLogoSrc } from '@/shared/lib/shelter-public';
import {
  applySeo,
  canonicalUrlFromPath,
  SEO_KEYWORDS,
  SEO_ROBOTS_PRIVATE,
  SEO_ROBOTS_PUBLIC,
  truncateMetaDescription,
} from '@/shared/lib/seo';
import type { Pet } from '@/entities/pet/model/types';
export function useShelterDetailPage() {
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

  useClickOutside(aboutMenuRef, () => setAboutMenuOpen(false), aboutMenuOpen);

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

  return {
    t,
    s,
    row,
    loading,
    notFound,
    shelterPets,
    activeTab,
    setActiveTab,
    mobileTab,
    setMobileTab,
    aboutMenuOpen,
    setAboutMenuOpen,
    aboutMenuRef,
    subCount,
    subscribed,
    subLoading,
    subBusy,
    authLoading,
    handleSubscribeToggle,
    handleShare,
    logo,
    c,
    locationLine,
    websiteHref,
    hasAnyContact,
    totalPets,
    foundPets,
    searchingPets,
  };
}
