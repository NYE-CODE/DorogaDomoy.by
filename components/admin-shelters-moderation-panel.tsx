import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, EyeOff, MapPin, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { User } from '../context/AuthContext';
import { sheltersApi } from '../api/client';
import { formatDate } from '../utils/pet-helpers';
import { useI18n } from '../context/I18nContext';
import { adm } from './admin-panel-chrome';
import {
  shelterAnimalFocusAdminLabel,
  shelterKindLabel,
} from './admin-panel-helpers';

export interface AdminSheltersModerationPanelProps {
  users: User[];
  onPendingCountChange?: (count: number) => void;
}

export function AdminSheltersModerationPanel({
  users,
  onPendingCountChange,
}: AdminSheltersModerationPanelProps) {
  const { t } = useI18n();
  const ap = t.adminPanel;
  const sp = ap.shelters;

  const [shelterPendingList, setShelterPendingList] = useState<Awaited<
    ReturnType<typeof sheltersApi.adminPending>
  >>([]);
  const [shelterListLoading, setShelterListLoading] = useState(false);
  const [shelterReasons, setShelterReasons] = useState<Record<string, string>>({});

  const fetchShelterPending = useCallback(() => {
    setShelterListLoading(true);
    sheltersApi
      .adminPending()
      .then((rows) => {
        setShelterPendingList(rows);
        onPendingCountChange?.(rows.length);
      })
      .catch(() => {
        setShelterPendingList([]);
        onPendingCountChange?.(0);
      })
      .finally(() => setShelterListLoading(false));
  }, [onPendingCountChange]);

  useEffect(() => {
    fetchShelterPending();
  }, [fetchShelterPending]);

  const handleShelterModerate = (id: string, action: 'approve' | 'reject' | 'hide') => {
    const reasonRaw = (shelterReasons[id] ?? '').trim();
    const reason = action === 'approve' ? undefined : reasonRaw || undefined;
    sheltersApi
      .moderate(id, { action, reason })
      .then(() => {
        if (action === 'approve') toast.success(ap.toasts.shelterApproved);
        else if (action === 'reject') toast.success(ap.toasts.shelterRejected);
        else toast.success(ap.toasts.shelterHidden);
        setShelterReasons((prev) => ({ ...prev, [id]: '' }));
        fetchShelterPending();
      })
      .catch(() => {
        toast.error(ap.toasts.shelterModerateError);
      });
  };

  return (
    <div className={adm.page}>
      <div className={adm.headerRow}>
        <div className={adm.headerText}>
          <h2 className={adm.title}>{sp.title}</h2>
          <p className={adm.subtitle}>{sp.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => fetchShelterPending()}
          disabled={shelterListLoading}
          className={adm.ghostBtn}
        >
          {sp.refresh}
        </button>
      </div>

      {shelterListLoading && shelterPendingList.length === 0 ? (
        <p className={adm.lead}>{sp.loading}</p>
      ) : shelterPendingList.length === 0 ? (
        <div className={adm.emptyBox}>
          <p>{sp.empty}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {shelterPendingList.map((row) => {
            const owner = users.find((u) => u.id === row.owner_user_id);
            const mapHref = `https://www.google.com/maps?q=${row.location_lat},${row.location_lng}`;
            return (
              <div key={row.id} className={`${adm.listCard} space-y-4`}>
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-lg font-semibold text-foreground">{row.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {row.city}
                      {row.address ? ` · ${row.address}` : ''}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {shelterKindLabel(row.kind, sp)}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-muted text-foreground font-medium">
                        {shelterAnimalFocusAdminLabel(row.animal_focus, sp)}
                      </span>
                      <span className="text-muted-foreground">
                        {sp.colUpdated}: {formatDate(new Date(row.updated_at))}
                      </span>
                    </div>
                    {row.description ? (
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap pt-2">{row.description}</p>
                    ) : null}
                    <p className="text-sm text-muted-foreground pt-1">
                      {sp.colOwner}:{' '}
                      {owner ? (
                        <a
                          href={`/user/${owner.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-medium"
                        >
                          {owner.name}
                        </a>
                      ) : (
                        <span className="font-mono text-xs">{row.owner_user_id}</span>
                      )}
                    </p>
                  </div>
                  <a
                    href={mapHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={sp.openMap}
                    className="inline-flex items-center justify-center p-2 rounded-lg text-primary hover:bg-primary/10 dark:hover:bg-primary/20 shrink-0"
                  >
                    <MapPin className="w-5 h-5" />
                    <span className="sr-only">{sp.openMap}</span>
                  </a>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground/90 mb-1">{sp.reasonLabel}</label>
                  <input
                    type="text"
                    value={shelterReasons[row.id] ?? ''}
                    onChange={(e) => setShelterReasons((prev) => ({ ...prev, [row.id]: e.target.value }))}
                    placeholder={sp.reasonPlaceholder}
                    className="w-full max-w-xl px-3 py-2 text-sm border border-border dark:bg-muted dark:text-white rounded-lg"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleShelterModerate(row.id, 'approve')}
                    title={sp.approve}
                    className="inline-flex items-center justify-center p-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="sr-only">{sp.approve}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShelterModerate(row.id, 'reject')}
                    title={sp.reject}
                    className="inline-flex items-center justify-center p-2.5 rounded-lg border border-amber-600 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                  >
                    <XCircle className="w-5 h-5" />
                    <span className="sr-only">{sp.reject}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShelterModerate(row.id, 'hide')}
                    title={sp.hide}
                    className="inline-flex items-center justify-center p-2.5 rounded-lg border border-border dark:border-border text-foreground hover:bg-muted"
                  >
                    <EyeOff className="w-5 h-5" />
                    <span className="sr-only">{sp.hide}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
