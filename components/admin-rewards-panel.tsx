import { useState } from 'react';
import type { Pet } from '../types/pet';
import type { User } from '../context/AuthContext';
import type { PointsTransactionItem } from '../api/client';
import { formatDate } from '../utils/pet-helpers';
import { useI18n } from '../context/I18nContext';
import { adm } from './admin-panel-chrome';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export interface AdminRewardsPanelProps {
  pets: Pet[];
  users: User[];
  pointsTransactions: PointsTransactionItem[];
  onRefresh: () => void;
}

export function AdminRewardsPanel({
  pets,
  users,
  pointsTransactions,
  onRefresh,
}: AdminRewardsPanelProps) {
  const { t } = useI18n();
  const ap = t.adminPanel;
  const rl = ap.rewardsLog;

  const [rewardsKindFilter, setRewardsKindFilter] = useState<string>('all');

  const txRows = pointsTransactions
    .filter((tx) => (rewardsKindFilter === 'all' ? true : tx.kind === rewardsKindFilter))
    .slice(0, 300);

  return (
    <div className={adm.page}>
      <div className={adm.headerRow}>
        <div className={adm.headerText}>
          <h2 className={adm.title}>{rl.title}</h2>
          <p className={adm.subtitle}>{rl.subtitle}</p>
        </div>
      </div>
      <div className={adm.filtersCard}>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-foreground/90 shrink-0">{rl.filterKind}</label>
          <Select value={rewardsKindFilter} onValueChange={setRewardsKindFilter}>
            <SelectTrigger className="w-[min(100%,240px)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{rl.filterAll}</SelectItem>
              <SelectItem value="helper_reward">{rl.filterHelper}</SelectItem>
              <SelectItem value="manual_adjustment">{rl.filterManual}</SelectItem>
            </SelectContent>
          </Select>
          <button type="button" onClick={onRefresh} className={`${adm.primaryBtn} ml-auto`}>
            {rl.refresh}
          </button>
        </div>
      </div>

      <div className={adm.tableShell}>
        <div className={adm.tableWrap}>
          <table className={`${adm.table} min-w-[860px]`}>
            <thead className={adm.thead}>
              <tr>
                <th className={adm.th}>{rl.colDate}</th>
                <th className={adm.th}>{rl.colUser}</th>
                <th className={adm.th}>{rl.colPet}</th>
                <th className={adm.th}>{rl.colPoints}</th>
                <th className={adm.th}>{rl.colKind}</th>
                <th className={adm.th}>{rl.colNote}</th>
              </tr>
            </thead>
            <tbody className={adm.tbody}>
              {txRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className={adm.tdEmpty}>
                    {rl.empty}
                  </td>
                </tr>
              ) : (
                txRows.map((tx) => {
                  const rewardUser = users.find((u) => u.id === tx.user_id);
                  const rewardPet = tx.pet_id ? pets.find((p) => p.id === tx.pet_id) : undefined;
                  return (
                    <tr key={tx.id} className={adm.tr}>
                      <td className="px-4 py-3 text-sm text-foreground/90">
                        {formatDate(new Date(tx.created_at))}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <a
                          href={`/user/${tx.user_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {rewardUser?.name || tx.user_id}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {tx.pet_id ? (
                          <a
                            href={`/pet/${tx.pet_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {rewardPet?.breed || tx.pet_id}
                          </a>
                        ) : (
                          <span className="text-muted-foreground/80">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground/90">{tx.amount}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{tx.kind}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{tx.note || '—'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
