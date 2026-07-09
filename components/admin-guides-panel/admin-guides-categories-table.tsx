import { Edit2, Plus, Trash2 } from 'lucide-react';
import type { GuideCategory } from '../../api/client';
import { adm } from '../admin-panel-chrome';

export interface AdminGuidesCategoriesTableProps {
  g: Record<string, string>;
  categories: GuideCategory[];
  onCreate: () => void;
  onEdit: (row: GuideCategory) => void;
  onDelete: (id: string) => void;
}

export function AdminGuidesCategoriesTable({
  g,
  categories,
  onCreate,
  onEdit,
  onDelete,
}: AdminGuidesCategoriesTableProps) {
  return (
    <>
      <div className="mb-4 flex justify-end">
        <button type="button" onClick={onCreate} className={adm.primaryBtn}>
          <Plus className="size-4" /> {g.categoryNew}
        </button>
      </div>
      <div className={adm.tableShell}>
        <div className={adm.tableWrap}>
          <table className={`${adm.table} min-w-[560px]`}>
            <thead className={adm.thead}>
              <tr>
                <th className={adm.th}>{g.colOrder}</th>
                <th className={adm.th}>{g.colName}</th>
                <th className={adm.th}>{g.colSlug}</th>
                <th className={adm.th}>{g.colActions}</th>
              </tr>
            </thead>
            <tbody className={adm.tbody}>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className={adm.tdEmpty}>
                    {g.categoriesEmpty}
                  </td>
                </tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.id} className={adm.tr}>
                    <td className="px-4 py-3 text-sm text-muted-foreground dark:text-muted-foreground/50">
                      {c.sort_order}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{c.title}</td>
                    <td className="px-4 py-3 font-mono text-sm text-muted-foreground dark:text-muted-foreground/50">
                      {c.slug}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(c)}
                          className="rounded p-1.5 text-primary transition-colors hover:bg-primary/10"
                        >
                          <Edit2 className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void onDelete(c.id)}
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
