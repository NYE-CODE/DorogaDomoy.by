import { useMemo } from 'react';
import { ArrowLeft, User as UserIcon, Mail } from 'lucide-react';
import { User } from '../context/AuthContext';
import { Pet } from '../types/pet';
import { PetCard } from './pet-card';

interface UserProfilePageProps {
  userId: string | null;
  onBack: () => void;
  onPetClick?: (pet: Pet) => void;
  users: User[];
  pets: Pet[];
}

const getRoleName = (role: User['role']): string => {
  const roleNames = {
    user: 'Пользователь',
    volunteer: 'Волонтёр',
    shelter: 'Приют / САХ',
    admin: 'Администратор'
  };
  return roleNames[role];
};

const getRoleColor = (role: User['role']): string => {
  const roleColors = {
    user: 'bg-blue-100 text-blue-700',
    volunteer: 'bg-green-100 text-green-700',
    shelter: 'bg-purple-100 text-purple-700',
    admin: 'bg-red-100 text-red-700'
  };
  return roleColors[role];
};

export function UserProfilePage({ userId, onBack, onPetClick, users, pets }: UserProfilePageProps) {
  const user = useMemo(() => (userId ? users.find((x) => x.id === userId) ?? null : null), [userId, users]);
  const userPets = useMemo(() => (userId ? pets.filter((p) => p.authorId === userId) : []), [userId, pets]);

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Пользователь не найден</p>
          <button onClick={onBack} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Вернуться назад
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Пользователь не найден</p>
          <button onClick={onBack} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Вернуться назад
          </button>
        </div>
      </div>
    );
  }
  const activePets = userPets.filter(p => !p.isArchived);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Назад
          </button>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <div className="space-y-6">
          {/* User Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Avatar */}
              <div className="shrink-0">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                    <UserIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h1 className="text-2xl font-semibold text-gray-900">{user.name}</h1>
                  <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                    {getRoleName(user.role)}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  {user.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{user.email}</span>
                    </div>
                  )}
                </div>

                {/* Contact Buttons */}
                {(user.contacts?.phone || user.contacts?.telegram || user.contacts?.viber) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Контакты:</p>
                    <div className="flex flex-wrap gap-2">
                      {user.contacts.phone && (
                        <a
                          href={`tel:${user.contacts.phone}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          📞 Телефон
                        </a>
                      )}
                      {user.contacts.telegram && (
                        <a
                          href={`https://t.me/${user.contacts.telegram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                        >
                          ✈️ Telegram
                        </a>
                      )}
                      {user.contacts.viber && (
                        <a
                          href={`viber://chat?number=${user.contacts.viber.replace(/\D/g, '')}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                        >
                          📱 Viber
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Pets Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Активные объявления ({activePets.length})
            </h2>
            
            {activePets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">У пользователя нет активных объявлений</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activePets.map(pet => (
                  <PetCard
                    key={pet.id}
                    pet={pet}
                    onClick={() => onPetClick && onPetClick(pet)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Всего объявлений</p>
              <p className="text-2xl font-bold text-gray-900">{userPets.length}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Активных</p>
              <p className="text-2xl font-bold text-blue-600">{activePets.length}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">В архиве</p>
              <p className="text-2xl font-bold text-gray-600">{userPets.filter(p => p.isArchived).length}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Успешно</p>
              <p className="text-2xl font-bold text-green-600">
                {userPets.filter(p => p.status === 'found').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}