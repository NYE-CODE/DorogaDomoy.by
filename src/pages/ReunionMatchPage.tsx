import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { Header } from '@/widgets/layout/Header';
import { ReunionMatchView } from '../../components/reunion/reunion-match-view';
import { petsApi } from '@/shared/api/client';
import { useAuth } from '@/app/providers/AuthContext';
import { useI18n } from '@/app/providers/I18nContext';
import type { Pet } from '@/entities/pet/model/types';
import { fallbackMatchPercent } from '@/shared/lib/similar-pet-display';
import { PageLoader } from '@/shared/ui/page-loader';
import { EmptyState } from '@/shared/ui/empty-state';
import { Button } from '@/shared/ui/button';
import { applySeo, SEO_ROBOTS_PRIVATE } from '@/shared/lib/seo';

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export default function ReunionMatchPage() {
  const { sourceId, matchId } = useParams<{ sourceId: string; matchId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const [sourcePet, setSourcePet] = useState<Pet | null>(null);
  const [matchPet, setMatchPet] = useState<Pet | null>(null);
  const [matchMeta, setMatchMeta] = useState<{
    matchPercent: number;
    distanceKm: number | null;
    reasons: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    applySeo({
      title: `${t.reunion.pageTitle} | DorogaDomoy.by`,
      robots: SEO_ROBOTS_PRIVATE,
    });
  }, [t.reunion.pageTitle]);

  useEffect(() => {
    if (!sourceId || !matchId) {
      navigate('/search', { replace: true });
      return;
    }

    const ac = new AbortController();
    const delays = [0, 2000, 3000];

    async function load() {
      setLoading(true);
      setError(false);
      try {
        const [source, candidate] = await Promise.all([
          petsApi.get(sourceId, { signal: ac.signal }),
          petsApi.get(matchId, { signal: ac.signal }),
        ]);
        if (ac.signal.aborted) return;
        setSourcePet(source);
        setMatchPet(candidate);

        let resolvedMeta: typeof matchMeta = null;
        for (let i = 0; i < delays.length; i += 1) {
          if (ac.signal.aborted) return;
          if (delays[i] > 0) await sleep(delays[i]);
          const similar = await petsApi.similar(sourceId, { limit: 20 }, { signal: ac.signal });
          const item = similar.items.find((entry) => entry.pet.id === matchId);
          if (item) {
            resolvedMeta = {
              matchPercent: item.matchPercent ?? fallbackMatchPercent(item.score),
              distanceKm: item.distanceKm,
              reasons: item.reasons,
            };
            const hasVisual = item.reasons.includes('visual_similarity');
            if (hasVisual || i === delays.length - 1) break;
          }
        }

        if (!resolvedMeta) {
          resolvedMeta = {
            matchPercent: 50,
            distanceKm: null,
            reasons: [],
          };
        }
        if (!ac.signal.aborted) setMatchMeta(resolvedMeta);
      } catch {
        if (!ac.signal.aborted) setError(true);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => ac.abort();
  }, [sourceId, matchId, navigate]);

  const labels = useMemo(() => {
    if (!sourcePet || !matchPet) return { source: undefined, match: undefined };
    const sourceIsMine = user?.id === sourcePet.authorId;
    const matchIsMine = user?.id === matchPet.authorId;
    return {
      source: sourceIsMine
        ? t.reunion.yourListing
        : `${t.pet.status[sourcePet.status]} · ${t.pet.animalType[sourcePet.animalType]}`,
      match: matchIsMine
        ? t.reunion.yourListing
        : `${t.pet.status[matchPet.status]} · ${t.pet.animalType[matchPet.animalType]}`,
    };
  }, [sourcePet, matchPet, user?.id, t]);

  const backHref = sourceId ? `/pet/${sourceId}` : '/search';

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
        <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
          <Link to={backHref}>
            <ChevronLeft className="mr-1 h-4 w-4" aria-hidden />
            {t.reunion.backToListing}
          </Link>
        </Button>

        {loading && <PageLoader />}

        {!loading && error && (
          <EmptyState
            title={t.reunion.notFound}
            description={t.reunion.notFound}
            action={
              <Button asChild variant="outline">
                <Link to={backHref}>{t.reunion.backToListing}</Link>
              </Button>
            }
          />
        )}

        {!loading && !error && sourcePet && matchPet && matchMeta && (
          <ReunionMatchView
            sourcePet={sourcePet}
            matchPet={matchPet}
            match={matchMeta}
            backHref={backHref}
            sourceLabel={labels.source}
            matchLabel={labels.match}
          />
        )}
      </main>
    </div>
  );
}
