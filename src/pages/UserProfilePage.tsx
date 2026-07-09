import { useParams, Link } from 'react-router';
import { useState, useEffect, useMemo, useRef } from 'react';
import {
  MapPin,
  Calendar,
  Phone,
  Mail,
  MessageCircle,
  Share2,
  Clock,
  ShieldBan,
  ShieldCheck,
  PawPrint,
} from 'lucide-react';
import { User, useAuth } from '@/app/providers/AuthContext';
import { Pet } from '@/entities/pet/model/types';
import { API_BASE, usersApi, petsApi, profilePetsApi } from '@/shared/api/client';
import { useI18n } from '@/app/providers/I18nContext';
import { RewardBadge } from '../../components/reward-badge';
import { toast } from 'sonner';
import { getHomePath } from '@/shared/lib/home-route';
import { Header } from '@/widgets/layout/Header';
import { Footer } from '@/widgets/layout/Footer';
import { profilePetToListCard, type ProfilePetListCard } from '@/shared/lib/profile-pet-display';
import { dateLocaleForUi } from '@/shared/lib/profile-pet-text';
import { copyText } from '@/shared/lib/copy-text';
import { petStatusPhotoPillClass } from '@/shared/lib/pet-helpers';
import { cn } from '@/shared/ui/utils';
import { Button } from '@/shared/ui/button';
import { appPrimaryCtaClass } from '@/shared/styles/cta-classes';
import { surfaceCardPaddedClass, surfacePanelClass } from '@/shared/styles/surface-classes';
import { typoH3, typoH4 } from '@/shared/styles/typography-classes';
import {
  applySeo,
  canonicalUrlFromPath,
  SEO_KEYWORDS,
  SEO_ROBOTS_PRIVATE,
  SEO_ROBOTS_PUBLIC,
  truncateMetaDescription,
} from '@/shared/lib/seo';

const ARCHIVE_SUCCESS_REASONS = [
  'Питомец вернулся домой / найден хозяин',
  'Питомец пристроен в новую семью',
  'Питомец передан в приют',
];

const getRoleName = (role: User['role'], t: any): string => {
  const roleNames = {
    user: t.userProfile.user,
    volunteer: t.userProfile.volunteer,
    shelter: t.userProfile.shelter,
    admin: t.userProfile.admin,
  };
  return roleNames[role];
};

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useI18n();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [allPets, setAllPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [profilePets, setProfilePets] = useState<ProfilePetListCard[]>([]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    setUser(null);

    Promise.all([
      usersApi.get(id).catch(() => null),
      petsApi.list({ author_id: id, limit: 500 }).catch(() => []),
    ])
      .then(([userData, petsData]) => {
        if (cancelled) return;
        setUser(userData);
        setAllPets(petsData);
        if (!userData) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const form = t.myPets.form;
    profilePetsApi
      .list({ owner_id: id })
      .then((arr) => {
        if (!cancelled) setProfilePets(arr.map((pet) => profilePetToListCard(pet, form)));
      })
      .catch(() => {
        if (!cancelled) setProfilePets([]);
      });
    return () => {
      cancelled = true;
    };
  }, [id, locale]);

  const stats = useMemo(() => {
    const active = allPets.filter((p) => !p.isArchived && p.moderationStatus === 'approved');
    const successful = allPets.filter(
      (p) => p.isArchived && p.archiveReason && ARCHIVE_SUCCESS_REASONS.includes(p.archiveReason)
    );
    return {
      total: allPets.length,
      active: active.length,
      successful: successful.length,
      pets: profilePets.length,
    };
  }, [allPets, profilePets]);

  const activePets = useMemo(
    () => allPets.filter((p) => !p.isArchived && p.moderationStatus === 'approved'),
    [allPets]
  );

  const location = useMemo(() => {
    if (activePets.length === 0) return null;
    const cities = activePets.map((p) => p.city).filter(Boolean);
    if (cities.length === 0) return 'Беларусь';
    const counts: Record<string, number> = {};
    cities.forEach((c) => { counts[c] = (counts[c] || 0) + 1; });
    const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return best ? `${best[0]}, Беларусь` : 'Беларусь';
  }, [activePets]);

  useEffect(() => {
    if (loading || !id) return;
    if (error || !user) {
      applySeo({
        title: 'Пользователь не найден | DorogaDomoy.by',
        description:
          'Профиль не существует или недоступен. DorogaDomoy.by — экосистема помощи животным в Беларуси.',
        canonicalUrl: canonicalUrlFromPath(`/user/${id}`),
        robots: SEO_ROBOTS_PRIVATE,
        keywords: SEO_KEYWORDS,
      });
      return;
    }
    const role = getRoleName(user.role, t);
    const geo = location ?? '';
    applySeo({
      title: `${user.name} — ${role} | DorogaDomoy.by`,
      description: truncateMetaDescription(
        `Профиль ${user.name} (${role}) на DorogaDomoy.by. Экосистема помощи животным: поиск, приюты, поддержка.${geo ? ` ${geo}.` : ''}`,
      ),
      canonicalUrl: canonicalUrlFromPath(`/user/${user.id}`),
      robots: SEO_ROBOTS_PUBLIC,
      keywords: SEO_KEYWORDS,
    });
  }, [loading, error, user, id, t, location]);

  const joinDate = useMemo(() => {
    if (allPets.length === 0) return null;
    const dates = allPets.map((p) => p.publishedAt.getTime());
    return new Date(Math.min(...dates));
  }, [allPets]);

  const copyResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current);
    };
  }, []);

  const handleToggleBlock = async () => {
    if (!user || !currentUser || currentUser.role !== 'admin') return;
    const newBlocked = !user.isBlocked;
    if (newBlocked && !window.confirm(t.userProfile.blockConfirm)) return;
    setBlocking(true);
    try {
      const updated = await usersApi.update(user.id, { is_blocked: newBlocked });
      setUser(updated);
      toast.success(newBlocked ? t.userProfile.blockedSuccess : t.userProfile.unblockedSuccess);
    } catch {
      toast.error(t.common.error);
    } finally {
      setBlocking(false);
    }
  };

  const copyToClipboard = async () => {
    const url = window.location.href;
    if (await copyText(url)) {
      setIsCopied(true);
      if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current);
      copyResetTimerRef.current = setTimeout(() => {
        copyResetTimerRef.current = null;
        setIsCopied(false);
      }, 2000);
    }
  };

  const getStatusTitle = (pet: Pet) => {
    const key =
      pet.status === 'searching'
        ? pet.animalType === 'dog'
          ? 'formTitleLostDog'
          : pet.animalType === 'cat'
            ? 'formTitleLostCat'
            : 'formTitleLostOther'
        : pet.animalType === 'dog'
          ? 'formTitleFoundDog'
          : pet.animalType === 'cat'
            ? 'formTitleFoundCat'
            : 'formTitleFoundOther';
    return t.petForm[key as keyof typeof t.petForm];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 dark:bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-muted/30 dark:bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12">
          <div className="text-center">
            <h1 className="typo-h1 mb-2">
              {(t.userProfile as { notFound?: string }).notFound ?? 'Пользователь не найден'}
            </h1>
            <p className="text-muted-foreground mb-6">
              К сожалению, профиль пользователя не существует.
            </p>
            <Button className={appPrimaryCtaClass} asChild>
              <Link to={getHomePath()}>
                {(t.userProfile as { toMain?: string }).toMain ?? 'На главную'}
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const avatarUrl =
    (user.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('data:')
      ? user.avatar
      : `${API_BASE}${user.avatar}`))
    || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop';

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background flex flex-col">
      <Header />

      <main className="flex-1 py-6 sm:py-8">
        <div className="page-container">
          {/* Profile Header */}
          <div className={cn(surfaceCardPaddedClass, 'mb-6 relative')}>
            {/* Share + Admin Block */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2">
              {currentUser?.role === 'admin' && currentUser.id !== user.id && (
                <button
                  onClick={handleToggleBlock}
                  disabled={blocking}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                    user.isBlocked
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}
                  title={user.isBlocked ? t.userProfile.unblock : t.userProfile.block}
                >
                  {blocking ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : user.isBlocked ? (
                    <><ShieldCheck size={16} /> {t.userProfile.unblock}</>
                  ) : (
                    <><ShieldBan size={16} /> {t.userProfile.block}</>
                  )}
                </button>
              )}
              <button
                onClick={copyToClipboard}
                className="p-2 text-primary hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-lg transition-colors"
                title={isCopied ? t.userProfile.shareCopied : t.userProfile.shareProfile}
              >
                <Share2 size={20} />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              {/* Avatar */}
              <div className="flex justify-center sm:justify-start">
                <img
                  src={avatarUrl}
                  alt={user.name}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-primary-light"
                />
              </div>

              {/* User Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="typo-h1 mb-2">
                  {user.name}
                </h1>
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-primary-light text-black rounded-full font-medium text-sm">
                    {getRoleName(user.role, t)}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 text-muted-foreground mb-4">
                  {location && (
                    <div className="flex items-center gap-2">
                      <MapPin size={18} className="text-primary" />
                      <span className="text-sm sm:text-base">{location}</span>
                    </div>
                  )}
                  {joinDate && (
                    <div className="flex items-center gap-2">
                      <Calendar size={18} className="text-primary" />
                      <span className="text-sm sm:text-base">
                        {t.userProfile.memberSince}{' '}
                        {joinDate.toLocaleDateString(dateLocaleForUi(locale), {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Contact Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {user.contacts?.phone && (
                    <a
                      href={`tel:${user.contacts.phone.replace(/\s/g, '')}`}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium text-sm sm:text-base"
                    >
                      <Phone size={18} />
                      {t.userProfile.call}
                    </a>
                  )}
                  {user.contacts?.telegram && (
                    <a
                      href={`https://t.me/${user.contacts.telegram.replace(/^@/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-transparent border-2 border-primary text-primary rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors font-medium text-sm sm:text-base"
                    >
                      <MessageCircle size={18} />
                      {t.userProfile.contact}
                    </a>
                  )}
                  {!user.contacts?.telegram && user.contacts?.viber && /\d/.test(user.contacts.viber) && (
                    <a
                      href={`viber://chat?number=${user.contacts.viber.replace(/\D/g, '')}`}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-transparent border-2 border-primary text-primary rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors font-medium text-sm sm:text-base"
                    >
                      <MessageCircle size={18} />
                      {t.userProfile.contact}
                    </a>
                  )}
                  {!user.contacts?.telegram &&
                    !(user.contacts?.viber && /\d/.test(user.contacts.viber)) &&
                    user.email && (
                      <a
                        href={`mailto:${user.email}`}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-transparent border-2 border-primary text-primary rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors font-medium text-sm sm:text-base"
                      >
                        <Mail size={18} />
                        {t.userProfile.writeEmail}
                      </a>
                    )}
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8 pt-6 border-t border-border">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-primary mb-1">{stats.total}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {t.userProfile.statAds}
                </div>
              </div>
              <div className="text-center md:border-x border-border">
                <div className="text-2xl sm:text-3xl font-bold text-primary mb-1">{stats.active}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {t.userProfile.statActive}
                </div>
              </div>
              <div className="text-center md:border-r border-border">
                <div className="text-2xl sm:text-3xl font-bold text-primary-light mb-1">{stats.successful}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {t.userProfile.statReturned}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-primary mb-1">{stats.pets}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {t.userProfile.statPets}
                </div>
              </div>
              <div className="text-center md:border-l border-border">
                <div className="text-2xl sm:text-3xl font-bold text-success mb-1">{user.helperConfirmedCount ?? 0}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {(t.userProfile as { statHelper?: string }).statHelper ?? 'Помог вернуть домой'}
                </div>
              </div>
            </div>
          </div>

          {/* Питомцы профиля (карточки «мои питомцы», не объявления) */}
          <div className={cn(surfacePanelClass, 'mb-6')}>
            <div className="border-b border-border px-6 py-4">
              <h2 className={typoH3}>{t.userProfile.userPetsTitle}</h2>
            </div>
            <div className="p-4 sm:p-6">
              {profilePets.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t.userProfile.noUserPets}</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {profilePets.map((pet) => (
                    <div
                      key={pet.id}
                      className="bg-white dark:bg-card rounded-md overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group border border-border"
                    >
                      <div className="relative overflow-hidden">
                        <img
                          src={pet.photo}
                          alt={pet.name}
                          className="w-full h-32 sm:h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary-light flex items-center justify-center">
                          <PawPrint size={14} className="text-black" strokeWidth={2} />
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className={cn(typoH4, 'mb-1 truncate')}>
                          {pet.name}
                        </h3>
                        <p className="text-muted-foreground text-xs sm:text-sm truncate">
                          {pet.subtitle}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Announcements Section */}
          <div className={surfacePanelClass}>
            <div className="border-b border-border px-6 py-4">
              <h2 className={typoH3}>{t.userProfile.activeAdsTitle}</h2>
            </div>

            <div className="p-4 sm:p-6">
              {activePets.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {(t.userProfile as { noActiveAds?: string }).noActiveAds ??
                      'У этого пользователя пока нет объявлений'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
                  {activePets.map((pet) => {
                    const photoUrl =
                      pet.photos[0] ||
                      'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop';
                    const colorsStr =
                      pet.colors.length > 0
                        ? pet.colors.map((c) => t.pet.color[c as keyof typeof t.pet.color]).join(', ')
                        : '';
                    return (
                      <Link
                        key={pet.id}
                        to={`/pet/${pet.id}`}
                        className="bg-white dark:bg-transparent rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group block"
                      >
                        <div className="relative overflow-hidden">
                          <img
                            src={photoUrl}
                            alt={getStatusTitle(pet)}
                            className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div
                            className={cn(
                              'absolute right-4 top-4 rounded-full px-4 py-2 text-sm font-bold',
                              petStatusPhotoPillClass[pet.status],
                            )}
                          >
                            {pet.status === 'searching' ? t.userProfile.lostBadge : t.userProfile.foundBadge}
                          </div>
                          <div className="absolute top-4 left-4">
                            <RewardBadge pet={pet} />
                          </div>
                        </div>
                        <div className="p-6">
                          <h3 className={`${typoH3} mb-2`}>
                            {getStatusTitle(pet)}
                          </h3>
                          {colorsStr && (
                            <p className="text-muted-foreground mb-4">{colorsStr}</p>
                          )}
                          <div className="flex items-center gap-2 text-muted-foreground mb-2 text-sm">
                            <MapPin size={16} />
                            <span>{pet.city}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Clock size={16} />
                            <span>
                              {pet.publishedAt.toLocaleDateString(dateLocaleForUi(locale), {
                                day: 'numeric',
                                month: 'long',
                              })}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-6 text-center">
            <Link
              to={getHomePath()}
              className="inline-flex items-center justify-center text-muted-foreground hover:text-black dark:hover:text-white transition-colors font-medium"
            >
              {t.userProfile.backHome}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
