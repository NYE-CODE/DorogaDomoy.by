import { useParams, Link } from 'react-router';
import { useState, useEffect, useMemo } from 'react';
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
import { User, useAuth } from '../context/AuthContext';
import { Pet } from '../types/pet';
import { API_BASE, usersApi, petsApi, profilePetsApi } from '../api/client';
import { useI18n } from '../context/I18nContext';
import { toast } from 'sonner';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { profilePetToListCard, type ProfilePetListCard } from '../utils/profile-pet-display';
import { dateLocaleForUi } from '../utils/profile-pet-text';
import { copyText } from '../utils/copy-text';
import {
  applySeo,
  canonicalUrlFromPath,
  SEO_KEYWORDS,
  SEO_ROBOTS_PRIVATE,
  SEO_ROBOTS_PUBLIC,
  truncateMetaDescription,
} from '../utils/seo';

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
    setLoading(true);
    setError(false);
    setUser(null);

    Promise.all([
      usersApi.get(id).catch(() => null),
      petsApi.list({ author_id: id }).catch(() => []),
    ])
      .then(([userData, petsData]) => {
        setUser(userData);
        setAllPets(petsData);
        if (!userData) setError(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const form = t.myPets.form;
    profilePetsApi
      .list({ owner_id: id })
      .then((arr) => setProfilePets(arr.map((pet) => profilePetToListCard(pet, form))))
      .catch(() => setProfilePets([]));
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
          'Профиль не существует или недоступен. Поиск пропавших и найденных питомцев на DorogaDomoy.by.',
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
        `Профиль ${user.name} (${role}) на DorogaDomoy.by. Объявления о пропавших и найденных питомцах.${geo ? ` ${geo}.` : ''}`,
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
      setTimeout(() => setIsCopied(false), 2000);
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
      <div className="min-h-screen bg-gray-50 dark:bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-[#FF9800]/30 border-t-[#FF9800] rounded-full animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-black dark:text-white mb-2">
              {(t.userProfile as { notFound?: string }).notFound ?? 'Пользователь не найден'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              К сожалению, профиль пользователя не существует.
            </p>
            <Link
              to="/"
              className="inline-flex items-center justify-center h-12 px-6 bg-[#FF9800] text-white rounded-lg hover:bg-[#F57C00] transition-colors font-medium text-lg"
            >
              {(t.userProfile as { toMain?: string }).toMain ?? 'На главную'}
            </Link>
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
    <div className="min-h-screen bg-gray-50 dark:bg-background flex flex-col">
      <Header />

      <main className="flex-1 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <div className="bg-white dark:bg-card rounded-2xl shadow-sm border border-gray-200 dark:border-border p-6 sm:p-8 mb-6 relative">
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
                className="p-2 text-[#FF9800] hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-lg transition-colors"
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
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-[#FDB913]"
                />
              </div>

              {/* User Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-white mb-2">
                  {user.name}
                </h1>
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-[#FDB913] text-black rounded-full font-medium text-sm">
                    {getRoleName(user.role, t)}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 text-gray-600 dark:text-gray-400 mb-4">
                  {location && (
                    <div className="flex items-center gap-2">
                      <MapPin size={18} className="text-[#FF9800]" />
                      <span className="text-sm sm:text-base">{location}</span>
                    </div>
                  )}
                  {joinDate && (
                    <div className="flex items-center gap-2">
                      <Calendar size={18} className="text-[#FF9800]" />
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
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FF9800] text-white rounded-lg hover:bg-[#F57C00] transition-colors font-medium text-sm sm:text-base"
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
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-transparent border-2 border-[#FF9800] text-[#FF9800] rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors font-medium text-sm sm:text-base"
                    >
                      <MessageCircle size={18} />
                      {t.userProfile.contact}
                    </a>
                  )}
                  {!user.contacts?.telegram && user.contacts?.viber && /\d/.test(user.contacts.viber) && (
                    <a
                      href={`viber://chat?number=${user.contacts.viber.replace(/\D/g, '')}`}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-transparent border-2 border-[#FF9800] text-[#FF9800] rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors font-medium text-sm sm:text-base"
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
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-transparent border-2 border-[#FF9800] text-[#FF9800] rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors font-medium text-sm sm:text-base"
                      >
                        <Mail size={18} />
                        {t.userProfile.writeEmail}
                      </a>
                    )}
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-border">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-[#FF9800] mb-1">{stats.total}</div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {t.userProfile.statAds}
                </div>
              </div>
              <div className="text-center md:border-x border-gray-200 dark:border-border">
                <div className="text-2xl sm:text-3xl font-bold text-[#FF9800] mb-1">{stats.active}</div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {t.userProfile.statActive}
                </div>
              </div>
              <div className="text-center md:border-r border-gray-200 dark:border-border">
                <div className="text-2xl sm:text-3xl font-bold text-[#FDB913] mb-1">{stats.successful}</div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {t.userProfile.statReturned}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-[#FF9800] mb-1">{stats.pets}</div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {t.userProfile.statPets}
                </div>
              </div>
            </div>
          </div>

          {/* Питомцы профиля (карточки «мои питомцы», не объявления) */}
          <div className="bg-white dark:bg-card rounded-2xl shadow-sm border border-gray-200 dark:border-border overflow-hidden mb-6">
            <div className="border-b border-gray-200 dark:border-border px-6 py-4">
              <h2 className="text-xl font-bold text-black dark:text-white">{t.userProfile.userPetsTitle}</h2>
            </div>
            <div className="p-4 sm:p-6">
              {profilePets.length === 0 ? (
                <p className="text-center text-gray-600 dark:text-gray-400 py-8">{t.userProfile.noUserPets}</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {profilePets.map((pet) => (
                    <div
                      key={pet.id}
                      className="bg-white dark:bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group border border-gray-200 dark:border-border"
                    >
                      <div className="relative overflow-hidden">
                        <img
                          src={pet.photo}
                          alt={pet.name}
                          className="w-full h-32 sm:h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#FDB913] flex items-center justify-center">
                          <PawPrint size={14} className="text-black" strokeWidth={2} />
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-bold text-black dark:text-white mb-1 text-sm sm:text-base truncate">
                          {pet.name}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm truncate">
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
          <div className="bg-white dark:bg-card rounded-2xl shadow-sm border border-gray-200 dark:border-border overflow-hidden">
            <div className="border-b border-gray-200 dark:border-border px-6 py-4">
              <h2 className="text-xl font-bold text-black dark:text-white">{t.userProfile.activeAdsTitle}</h2>
            </div>

            <div className="p-4 sm:p-6">
              {activePets.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400">
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
                        className="bg-white dark:bg-transparent rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group block"
                      >
                        <div className="relative overflow-hidden">
                          <img
                            src={photoUrl}
                            alt={getStatusTitle(pet)}
                            className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div
                            className={`absolute top-4 right-4 px-4 py-2 rounded-full font-bold ${
                              pet.status === 'searching'
                                ? 'bg-gray-800 text-white'
                                : 'bg-[#FDB913] text-black'
                            }`}
                          >
                            {pet.status === 'searching' ? t.userProfile.lostBadge : t.userProfile.foundBadge}
                          </div>
                        </div>
                        <div className="p-6">
                          <h3 className="text-xl font-bold text-black dark:text-white mb-2">
                            {getStatusTitle(pet)}
                          </h3>
                          {colorsStr && (
                            <p className="text-gray-600 dark:text-gray-400 mb-4">{colorsStr}</p>
                          )}
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2 text-sm">
                            <MapPin size={16} />
                            <span>{pet.city}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
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
              to="/"
              className="inline-flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors font-medium"
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
