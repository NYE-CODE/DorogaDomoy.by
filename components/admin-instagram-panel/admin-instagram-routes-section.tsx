import { Plus, Trash2 } from 'lucide-react';
import type { InstagramAccountResponse, InstagramRegionRouteResponse } from '../../api/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { adm } from '../admin-panel-chrome';

export interface AdminInstagramRoutesSectionProps {
  ig: Record<string, string>;
  accounts: InstagramAccountResponse[];
  routes: InstagramRegionRouteResponse[];
  routeRegion: string;
  setRouteRegion: (v: string) => void;
  routeAccountId: string;
  setRouteAccountId: (v: string) => void;
  routeFallback: boolean;
  setRouteFallback: (v: boolean) => void;
  busy: boolean;
  onCreateRoute: () => void;
  onDeleteRoute: (routeId: string) => void;
  onToggleFallback: (row: InstagramRegionRouteResponse, value: boolean) => void;
}

export function AdminInstagramRoutesSection({
  ig,
  accounts,
  routes,
  routeRegion,
  setRouteRegion,
  routeAccountId,
  setRouteAccountId,
  routeFallback,
  setRouteFallback,
  busy,
  onCreateRoute,
  onDeleteRoute,
  onToggleFallback,
}: AdminInstagramRoutesSectionProps) {
  return (
    <div className={adm.settingsCard}>
      <h3 className="text-lg font-semibold text-foreground">{ig.routesTitle}</h3>
      <div className="mt-4 grid gap-3">
        <input
          className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg text-sm"
          placeholder={ig.routeRegionPlaceholder}
          value={routeRegion}
          onChange={(e) => setRouteRegion(e.target.value)}
        />
        <Select value={routeAccountId} onValueChange={setRouteAccountId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={ig.routeAccountPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((acc) => (
              <SelectItem key={acc.id} value={acc.id}>
                {acc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
          <span className="text-sm font-medium text-foreground/90">{ig.routeFallbackLabel}</span>
          <Switch checked={routeFallback} onCheckedChange={setRouteFallback} />
        </label>
        <button
          type="button"
          title={ig.routeAddButton}
          className={`${adm.primaryBtn} disabled:opacity-60`}
          onClick={onCreateRoute}
          disabled={busy}
        >
          <Plus className="w-4 h-4" />
          <span className="sr-only">{ig.routeAddButton}</span>
        </button>
      </div>

      <div className={`mt-5 ${adm.tableShell}`}>
        {routes.length === 0 ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">{ig.routesEmpty}</div>
        ) : (
          <div className="divide-y divide-border">
            {routes.map((row) => (
              <div key={row.id} className="px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-foreground truncate">{row.region_key}</div>
                    <div className="text-xs text-muted-foreground truncate">{row.account_name}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-xs text-muted-foreground dark:text-muted-foreground/50">
                      <span>{ig.routeFallbackShort}</span>
                      <Switch
                        checked={row.is_fallback}
                        onCheckedChange={(value) => {
                          onToggleFallback(row, value);
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      title={ig.deleteButton}
                      className="inline-flex items-center justify-center p-2 rounded-lg border border-red-300 dark:border-red-900 text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => {
                        onDeleteRoute(row.id);
                      }}
                      disabled={busy}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="sr-only">{ig.deleteButton}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
