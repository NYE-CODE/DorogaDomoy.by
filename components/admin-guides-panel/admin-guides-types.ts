export type AdminGuidesPanelView = 'videos' | 'categories';

export type AdminGuidesCategoryEdit = { mode: 'create' } | { mode: 'edit'; id: string };

export type AdminGuidesVideoEdit = { mode: 'create' } | { mode: 'edit'; id: string };
