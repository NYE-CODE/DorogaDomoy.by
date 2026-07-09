import { X } from 'lucide-react';
import { adm, admFieldClass } from '../admin-panel-chrome';
import { slugFromTitle } from './admin-guides-helpers';
import type { AdminGuidesCategoryEdit } from './admin-guides-types';

export interface AdminGuidesCategoryModalProps {
  edit: AdminGuidesCategoryEdit;
  g: Record<string, string>;
  catTitle: string;
  setCatTitle: (v: string) => void;
  catSlug: string;
  setCatSlug: (v: string) => void;
  catSort: number;
  setCatSort: (v: number) => void;
  catSaving: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function AdminGuidesCategoryModal({
  edit,
  g,
  catTitle,
  setCatTitle,
  catSlug,
  setCatSlug,
  catSort,
  setCatSort,
  catSaving,
  onClose,
  onSave,
}: AdminGuidesCategoryModalProps) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b px-6 py-4 dark:border-border">
          <h3 className="font-semibold text-foreground">
            {edit.mode === 'create' ? g.categoryModalNew : g.categoryModalEdit}
          </h3>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-accent">
            <X className="size-5 dark:text-muted-foreground/80" />
          </button>
        </div>
        <div className="space-y-4 px-6 py-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground/90">{g.nameLabel}</label>
            <input
              className={admFieldClass}
              value={catTitle}
              onChange={(e) => setCatTitle(e.target.value)}
            />
          </div>
          {edit.mode === 'create' ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground/90">{g.slugLabel}</label>
              <div className="flex gap-2">
                <input
                  className={admFieldClass}
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  placeholder={g.slugPlaceholder}
                />
                <button
                  type="button"
                  className={adm.ghostBtn}
                  onClick={() => setCatSlug(slugFromTitle(catTitle))}
                >
                  {g.slugFromTitle}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {g.slugLabel}: <code>{catSlug}</code>
            </p>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground/90">{g.sortLabel}</label>
            <input
              type="number"
              className={admFieldClass}
              value={catSort}
              onChange={(e) => setCatSort(Number(e.target.value))}
            />
          </div>
          <button
            type="button"
            disabled={catSaving}
            onClick={onSave}
            className={adm.primaryBtn}
          >
            {catSaving ? g.saving : g.save}
          </button>
        </div>
      </div>
    </div>
  );
}
