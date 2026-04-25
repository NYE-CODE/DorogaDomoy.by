import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Heart, Search } from 'lucide-react';
import { favoritesApi, petsApi } from '../api/client';
import { Footer } from '../components/layout/Footer';
import { Header } from '../components/layout/Header';
import { PetCard } from '../components/pet-card';
import { Button } from '../components/ui/button';
import { EmptyState } from '../components/ui/empty-state';
import { PageLoader } from '../components/ui/page-loader';
import { useAuth } from '../context/AuthContext';
import {
  readGuestFavoriteIdsFromStorage,
  useFavorites,
} from '../context/FavoritesContext';
import { useI18n } from '../context/I18nContext';
import type { Pet } from '../types/pet';
import {
  applySeo,
  canonicalUrlFromPath,
  SEO_KEYWORDS,
  SEO_ROBOTS_PRIVATE,
} from '../utils/seo';
import { appPrimaryCtaClass } from '../styles/cta-classes';

export default function FavoritesPage() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const { hydrated, favoriteIds, count } = useFavorites();
  const navigate = useNavigate();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  const idsKey = useMemo(() => [...favoriteIds].sort().join(','), [favoriteIds]);

  useEffect(() => {
    applySeo({
      title: `${t.favorites.title} — DorogaDomoy.by`,
      description: t.favorites.subtitle,
      canonicalUrl: canonicalUrlFromPath('/favorites'),
      robots: SEO_ROBOTS_PRIVATE,
      keywords: SEO_KEYWORDS,
    });
  }, [t]);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (count === 0) {
          setPets([]);
          return;
        }
        if (isAuthenticated) {
          const list = await favoritesApi.list();
          if (!cancelled) setPets(list);
        } else {
          const ordered = readGuestFavoriteIdsFromStorage();
          const batch = ordered.slice(0, 80);
          const idParam = batch.join(',');
          if (!idParam) {
            setPets([]);
            return;
          }
          const list = await petsApi.list({ ids: idParam, limit: 100 });
          if (!cancelled) {
            const orderMap = new Map(batch.map((id, i) => [id, i]));
            list.sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999));
            setPets(list);
          }
        }
      } catch {
        if (!cancelled) setPets([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, isAuthenticated, count, idsKey]);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-background">
        <Header showCitySelector={false} />
        <PageLoader />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Header showCitySelector={false} />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              <Heart className="size-7 shrink-0 text-rose-500" aria-hidden />
              {t.favorites.title}
            </h1>
            <p className="mt-2 max-w-xl text-muted-foreground">{t.favorites.subtitle}</p>
            {!isAuthenticated && count > 0 && (
              <p className="mt-3 text-sm text-amber-700 dark:text-amber-400">{t.favorites.guestHint}</p>
            )}
          </div>
          {count > 0 && (
            <p className="text-sm font-medium text-muted-foreground tabular-nums">
              {t.favorites.countLabel.replace('{n}', String(count))}
            </p>
          )}
        </div>

        {loading ? (
          <PageLoader />
        ) : count === 0 ? (
          <EmptyState
            title={t.favorites.emptyTitle}
            description={t.favorites.emptyDescription}
            icon={<Heart className="size-7 text-rose-400" aria-hidden />}
            action={
              <Button
                type="button"
                className={appPrimaryCtaClass}
                onClick={() => navigate('/search')}
              >
                <Search className="size-5 shrink-0" aria-hidden />
                {t.favorites.openSearch}
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {pets.map((pet) => (
              <PetCard
                key={pet.id}
                pet={pet}
                compact
                onClick={() => window.open(`/pet/${pet.id}`, '_blank')}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
