import { useParams } from 'react-router';
import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, User as UserIcon, Mail, Phone, MessageCircle } from 'lucide-react';
import { User } from '../context/AuthContext';
import { PetCard } from '../components/pet-card';
import { Pet } from '../types/pet';
import { usersApi, petsApi } from '../api/client';
import { useI18n } from '../context/I18nContext';

const getRoleName = (role: User['role'], t: any): string => {
  const roleNames = {
    user: t.userProfile.user,
    volunteer: t.userProfile.volunteer,
    shelter: t.userProfile.shelter,
    admin: t.userProfile.admin
  };
  return roleNames[role];
};

const getRoleColor = (role: User['role']): string => {
  const roleColors = {
    user: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    volunteer: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
    shelter: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    admin: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
  };
  return roleColors[role];
};

const getRoleIcon = (role: User['role']): string => {
  const icons = {
    user: '👤',
    volunteer: '🤝',
    shelter: '🏠',
    admin: '⚙️'
  };
  return icons[role];
};

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();
  const [user, setUser] = useState<User | null>(null);
  const [userPets, setUserPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(false);

    Promise.all([
      usersApi.get(id).catch(() => null),
      petsApi.list({ author_id: id, moderation_status: 'approved' }).catch(() => []),
    ])
      .then(([userData, petsData]) => {
        setUser(userData);
        setUserPets(petsData);
        if (!userData) setError(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const activePets = useMemo(() => userPets.filter(p => !p.isArchived), [userPets]);
  const archivedPets = useMemo(() => userPets.filter(p => p.isArchived), [userPets]);

  const handlePetClick = (pet: Pet) => {
    window.open(`/pet/${pet.id}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">{t.userProfile.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center gap-4 p-4">
        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <UserIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-lg">{t.userProfile.notFound}</p>
        <a
          href="/"
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.userProfile.toMain}
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <a
            href="/"
            className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">{t.userProfile.toMain}</span>
          </a>

          <h1 className="text-lg text-gray-900 dark:text-white truncate px-4">
            {t.userProfile.profileTitle}
          </h1>

          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Banner */}
          <div className="h-24 md:h-32 bg-gradient-to-r from-blue-500 via-blue-400 to-sky-400" />

          {/* Avatar & Info */}
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row gap-5 -mt-10 sm:-mt-12">
              {/* Avatar */}
              <div className="shrink-0">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-100 dark:bg-gray-700 border-4 border-white dark:border-gray-700 shadow-md flex items-center justify-center">
                    <UserIcon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                  </div>
                )}
              </div>

              {/* Name & Role */}
              <div className="flex-1 pt-2 sm:pt-4">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-2xl text-gray-900 dark:text-white">{user.name}</h1>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm rounded-full border ${getRoleColor(user.role)}`}>
                    <span>{getRoleIcon(user.role)}</span>
                    {getRoleName(user.role, t)}
                  </span>
                </div>

                {user.isBlocked && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg text-sm mb-3">
                    🚫 {t.userProfile.blocked}{user.blockedReason && `: ${user.blockedReason}`}
                  </div>
                )}
              </div>
            </div>

            {/* Info Grid */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {user.email && (
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <div className="w-9 h-9 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span className="text-sm truncate">{user.email}</span>
                </div>
              )}
            </div>

            {/* Contacts */}
            {(user.contacts?.phone || user.contacts?.telegram || user.contacts?.viber) && (
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{t.userProfile.contactInfo}</p>
                <div className="flex flex-wrap gap-3">
                  {user.contacts.phone && (
                    <a
                      href={`tel:${user.contacts.phone}`}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Phone className="w-4 h-4" />
                      {user.contacts.phone}
                    </a>
                  )}
                  {user.contacts.telegram && (
                    <a
                      href={`https://t.me/${user.contacts.telegram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-500 text-white rounded-xl hover:bg-sky-600 transition-colors text-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {t.profile.telegram}
                    </a>
                  )}
                  {user.contacts.viber && (
                    <a
                      href={`viber://chat?number=${user.contacts.viber.replace(/\D/g, '')}`}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {t.profile.viber}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
            <p className="text-2xl text-gray-900 dark:text-white">{userPets.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t.userProfile.totalAds}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
            <p className="text-2xl text-blue-600">{activePets.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t.userProfile.active}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
            <p className="text-2xl text-green-600">{archivedPets.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t.userProfile.archived}</p>
          </div>
        </div>

        {/* Active Pets */}
        <div className="mt-8">
          <h2 className="text-xl text-gray-900 dark:text-white mb-4">
            Активные объявления
            <span className="text-gray-400 dark:text-gray-500 ml-2">({activePets.length})</span>
          </h2>

          {activePets.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">У пользователя нет активных объявлений</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activePets.map(pet => (
                <PetCard
                  key={pet.id}
                  pet={pet}
                  onClick={() => handlePetClick(pet)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Archived Pets */}
        {archivedPets.length > 0 && (
          <div className="mt-8 mb-8">
            <h2 className="text-xl text-gray-900 dark:text-white mb-4">
              {t.userProfile.archive}
              <span className="text-gray-400 dark:text-gray-500 ml-2">({archivedPets.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-70">
              {archivedPets.map(pet => (
                <PetCard
                  key={pet.id}
                  pet={pet}
                  onClick={() => handlePetClick(pet)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
