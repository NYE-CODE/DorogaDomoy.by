import { api } from '@/shared/api/http';

export interface FeatureFlags {
  ff_landing_show_stats: string;
  ff_landing_show_help: string;
  /** Отсутствует в ответе старых бэкендов до миграции — клиент трактует как true */
  ff_landing_show_pets_feature?: string;
  /** FAQ на лендинге; до миграции — true */
  ff_landing_show_faq?: string;
  /** Продвижение в Instagram Stories из «Мои объявления»; до миграции — true */
  ff_instagram_boost_stories?: string;
  /** Рекламные баннеры партнёров; до миграции — false */
  ff_partner_ads_enabled?: string;
  /** Включена ли система наград */
  ff_reward_enabled?: string;
  /** Разрешен ли денежный тип награды */
  ff_reward_money_enabled?: string;
}

export const featureFlagsApi = {
  get: () => api<FeatureFlags>('/feature-flags'),

  update: (data: {
    ff_landing_show_stats?: boolean;
    ff_landing_show_help?: boolean;
    ff_landing_show_pets_feature?: boolean;
    ff_landing_show_faq?: boolean;
    ff_instagram_boost_stories?: boolean;
    ff_partner_ads_enabled?: boolean;
    ff_reward_enabled?: boolean;
    ff_reward_money_enabled?: boolean;
  }) =>
    api<FeatureFlags>('/feature-flags', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

