import { X } from 'lucide-react';
import type { GuideCategory } from '../../api/client';
import { adm, admFieldClass } from '../admin-panel-chrome';
import type { AdminGuidesVideoEdit } from './admin-guides-types';

export interface AdminGuidesVideoModalProps {
  edit: AdminGuidesVideoEdit;
  g: Record<string, string>;
  categories: GuideCategory[];
  vidTitle: string;
  setVidTitle: (v: string) => void;
  vidDesc: string;
  setVidDesc: (v: string) => void;
  vidUrl: string;
  setVidUrl: (v: string) => void;
  vidCategory: string;
  setVidCategory: (v: string) => void;
  vidSort: number;
  setVidSort: (v: number) => void;
  vidStatus: 'draft' | 'published';
  setVidStatus: (v: 'draft' | 'published') => void;
  vidSaving: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function AdminGuidesVideoModal({
  edit,
  g,
  categories,
  vidTitle,
  setVidTitle,
  vidDesc,
  setVidDesc,
  vidUrl,
  setVidUrl,
  vidCategory,
  setVidCategory,
  vidSort,
  setVidSort,
  vidStatus,
  setVidStatus,
  vidSaving,
  onClose,
  onSave,
}: AdminGuidesVideoModalProps) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b px-6 py-4 dark:border-border">
          <h3 className="font-semibold text-foreground">
            {edit.mode === 'create' ? g.videoModalNew : g.videoModalEdit}
          </h3>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-accent">
            <X className="size-5 dark:text-muted-foreground/80" />
          </button>
        </div>
        <div className="space-y-4 px-6 py-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground/90">{g.fieldTitle}</label>
            <input className={admFieldClass} value={vidTitle} onChange={(e) => setVidTitle(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground/90">{g.fieldYoutube}</label>
            <input
              className={admFieldClass}
              value={vidUrl}
              onChange={(e) => setVidUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground/90">{g.fieldCategory}</label>
            <select
              className={admFieldClass}
              value={vidCategory}
              onChange={(e) => setVidCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground/90">{g.fieldDescription}</label>
            <textarea
              className={admFieldClass}
              rows={3}
              value={vidDesc}
              onChange={(e) => setVidDesc(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground/90">{g.sortLabel}</label>
              <input
                type="number"
                className={admFieldClass}
                value={vidSort}
                onChange={(e) => setVidSort(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground/90">{g.fieldStatus}</label>
              <select
                className={admFieldClass}
                value={vidStatus}
                onChange={(e) => setVidStatus(e.target.value as 'draft' | 'published')}
              >
                <option value="draft">{g.statusDraft}</option>
                <option value="published">{g.statusPublished}</option>
              </select>
            </div>
          </div>
          <button type="button" disabled={vidSaving} onClick={onSave} className={adm.primaryBtn}>
            {vidSaving ? g.saving : g.save}
          </button>
        </div>
      </div>
    </div>
  );
}
