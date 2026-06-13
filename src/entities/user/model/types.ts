/** Модель пользователя платформы (сессия, профиль, роли). */
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'volunteer' | 'admin';
  registeredAsVolunteer?: boolean;
  helperCode?: string | null;
  helperConfirmedCount?: number;
  pointsBalance?: number;
  pointsEarnedTotal?: number;
  contacts: {
    phone?: string;
    telegram?: string;
    viber?: string;
  };
  isBlocked?: boolean;
  blockedReason?: string;
  telegramId?: number | null;
  telegramUsername?: string | null;
  telegramLinkedAt?: string | null;
  profileCompleted?: boolean;
  passwordSet?: boolean;
}
