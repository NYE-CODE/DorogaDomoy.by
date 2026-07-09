export type ProfileTab = 'personal' | 'security' | 'notifications';

export type ProfileRoleDraft = 'user' | 'volunteer';

export type ProfileTranslations = {
  roleFieldLabel?: string;
  roleHintRegVolunteer?: string;
  roleUpgradeHint?: string;
  volunteerUpgradeTitle?: string;
  volunteerUpgradeBody?: string;
  volunteerUpgradeConfirm?: string;
  volunteerUpgradeCancel?: string;
  roles?: { user: string; volunteer: string; admin: string };
};
