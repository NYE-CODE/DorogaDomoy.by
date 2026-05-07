import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Clock, Heart, MapPin, Search } from 'lucide-react';
import { favoritesApi, petsApi } from '../api/client';
import { Footer } from '../components/layout/Footer';
import { Header } from '../components/layout/Header';
import { ShelterPetCard } from '../components/shelter-pet-card';
import { FavoriteHeartButton } from '../components/favorite-heart-button';
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
import { formatRelativeTime, petStatusPhotoPillClass } from '../utils/pet-helpers';
import { appPrimaryCtaClass } from '../styles/cta-classes';

export default function FavoritesPage() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const { hydrated, favoriteIds, count } = useFavorites();
  const navigate = useNavigate();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'search' | 'shelters'>('search');

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

  const searchPets = useMemo(() => {
    return pets.filter((pet) => {
      const isShelterPet = (pet.petScope ?? 'lost_found') === 'shelter_pet' || Boolean(pet.shelterId);
      return !isShelterPet;
    });
  }, [pets]);
  const shelterPets = useMemo(() => {
    return pets.filter((pet) => {
      const isShelterPet = (pet.petScope ?? 'lost_found') === 'shelter_pet' || Boolean(pet.shelterId);
      return isShelterPet;
    });
  }, [pets]);
  const activePets = activeTab === 'search' ? searchPets : shelterPets;

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
      <main className="mx-auto max-w-5xl px-4 py-8">
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

        {count > 0 && (
          <div className="mb-6 inline-flex rounded-lg border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => setActiveTab('search')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'search' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {t.favorites.tabSearchPets}
              <span className="ml-1.5 opacity-80">{searchPets.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('shelters')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'shelters' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {t.favorites.tabShelterPets}
              <span className="ml-1.5 opacity-80">{shelterPets.length}</span>
            </button>
          </div>
        )}

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
        ) : activePets.length === 0 ? (
          <EmptyState
            title={t.favorites.emptyTitle}
            description={activeTab === 'search' ? t.favorites.emptySearchTab : t.favorites.emptyShelterTab}
            icon={<Heart className="size-7 text-rose-400" aria-hidden />}
          />
        ) : activeTab === 'search' ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {searchPets.map((pet) => (
              <div
                key={pet.id}
                onClick={() => window.open(`/pet/${pet.id}`, '_blank')}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl"
              >
                <div className="relative overflow-hidden">
                  {pet.photos?.[0] ? (
                    <img
                      src={pet.photos[0]}
                      alt={pet.name?.trim() || t.pet.animalType[pet.animalType]}
                      className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-52 w-full bg-muted" />
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${petStatusPhotoPillClass[pet.status]}`}>
                      {pet.status === 'searching' ? t.landing.announcements.lost : t.landing.announcements.found}
                    </span>
                  </div>
                </div>
                <div className="p-4 md:p-5">
                  <h3 className="mb-1 line-clamp-1 text-lg font-semibold leading-tight text-foreground">
                    {(pet.name?.trim() || t.pet.animalType[pet.animalType])} {pet.breed ? `· ${pet.breed}` : ''}
                  </h3>
                  <p className="mb-3 line-clamp-1 text-sm text-muted-foreground">
                    {pet.colors.length > 0
                      ? pet.colors.map((c) => t.pet.color[c as keyof typeof t.pet.color] || c).join(', ')
                      : t.pet.notSpecified}
                  </p>
                  <div className="flex flex-col gap-2">
                    <div className="flex max-w-full items-center gap-1.5 self-start rounded-md bg-muted/70 px-2.5 py-1 text-xs text-muted-foreground">
                      <MapPin size={14} className="shrink-0" aria-hidden />
                      <span className="min-w-0 truncate">{pet.city || '—'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 self-start rounded-md bg-muted/70 px-2.5 py-1 text-xs text-muted-foreground">
                      <Clock size={14} className="shrink-0" aria-hidden />
                      <span>{formatRelativeTime(pet.publishedAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="pointer-events-none absolute left-0 right-0 top-0 z-[5] h-52">
                  <div className="pointer-events-auto absolute bottom-3 right-3 z-[6]">
                    <FavoriteHeartButton petId={pet.id} size="sm" className="!p-1.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {shelterPets.map((pet) => (
              <li key={pet.id} className="h-full">
                <ShelterPetCard
                  pet={pet}
                  onClick={() => window.open(`/shelter-pet/${pet.id}`, '_blank')}
                />
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
}
