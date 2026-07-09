import { Edit2, ExternalLink, Plus, Trash2, Video } from 'lucide-react';
import type { GuideVideoAdmin } from '../../api/client';
import { adm } from '../admin-panel-chrome';
import { cn } from '../ui/utils';

export interface AdminGuidesVideosTableProps {
  g: Record<string, string>;
  videos: GuideVideoAdmin[];
  hasCategories: boolean;
  onCreate: () => void;
  onGoToCategories: () => void;
  onEdit: (row: GuideVideoAdmin) => void;
  onDelete: (id: string) => void;
}

export function AdminGuidesVideosTable({
  g,
  videos,
  hasCategories,
  onCreate,
  onGoToCategories,
  onEdit,
  onDelete,
}: AdminGuidesVideosTableProps) {
  return (
    <>
      <div className="mb-4 flex justify-end">
        <button type="button" onClick={onCreate} className={adm.primaryBtn}>
          <Plus className="size-4" /> {g.videoNew}
        </button>
      </div>
      {!hasCategories ? (
        <p className={adm.lead}>
          {g.needCategoryFirst}{' '}
          <button type="button" className="font-medium underline" onClick={onGoToCategories}>
            {g.tabCategories}
          </button>
        </p>
      ) : null}
      <div className={adm.tableShell}>
        <div className={adm.tableWrap}>
          <table className={`${adm.table} min-w-[720px]`}>
            <thead className={adm.thead}>
              <tr>
                <th className={adm.th}>{g.colOrder}</th>
                <th className={adm.th}>{g.colTitle}</th>
                <th className={adm.th}>{g.colCategory}</th>
                <th className={adm.th}>{g.colStatus}</th>
                <th className={adm.th}>{g.colActions}</th>
              </tr>
            </thead>
            <tbody className={adm.tbody}>
              {videos.length === 0 ? (
                <tr>
                  <td colSpan={5} className={adm.tdEmpty}>
                    {g.videosEmpty}
                  </td>
                </tr>
              ) : (
                videos.map((v) => (
                  <tr key={v.id} className={adm.tr}>
                    <td className="px-4 py-3 text-sm text-muted-foreground dark:text-muted-foreground/50">
                      {v.sort_order}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <Video className="size-4 shrink-0 text-muted-foreground" />
                        {v.title}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground dark:text-muted-foreground/50">
                      {v.category_title}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          v.status === 'published'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {v.status === 'published' ? g.statusPublished : g.statusDraft}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <a
                          href={v.youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted"
                          title={g.openYoutube}
                        >
                          <ExternalLink className="size-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => onEdit(v)}
                          className="rounded p-1.5 text-primary transition-colors hover:bg-primary/10"
                        >
                          <Edit2 className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void onDelete(v.id)}
                          className="rounded p-1.5 text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
