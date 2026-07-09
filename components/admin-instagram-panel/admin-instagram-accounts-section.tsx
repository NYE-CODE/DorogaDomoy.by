import { Pencil, Plus, Save } from 'lucide-react';
import type { InstagramAccountResponse } from '../../api/client';
import { Switch } from '../ui/switch';
import { adm } from '../admin-panel-chrome';
import type { AccountFormState } from './admin-instagram-types';

export interface AdminInstagramAccountsSectionProps {
  ig: Record<string, string>;
  accounts: InstagramAccountResponse[];
  editingAccountId: string | null;
  accountForm: AccountFormState;
  setAccountForm: React.Dispatch<React.SetStateAction<AccountFormState>>;
  busy: boolean;
  onResetForm: () => void;
  onSubmit: () => void;
  onEdit: (row: InstagramAccountResponse) => void;
}

export function AdminInstagramAccountsSection({
  ig,
  accounts,
  editingAccountId,
  accountForm,
  setAccountForm,
  busy,
  onResetForm,
  onSubmit,
  onEdit,
}: AdminInstagramAccountsSectionProps) {
  return (
    <div className={adm.settingsCard}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">{ig.accountsTitle}</h3>
        <button
          className="rounded-lg border border-border px-3 py-1.5 text-xs dark:border-border dark:text-foreground"
          onClick={onResetForm}
          disabled={busy}
        >
          {ig.clearForm}
        </button>
      </div>
      <div className="mt-4 grid gap-3">
        <input
          className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg text-sm"
          placeholder={ig.accountNamePlaceholder}
          value={accountForm.name}
          onChange={(e) => setAccountForm((prev) => ({ ...prev, name: e.target.value }))}
        />
        <input
          className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg text-sm"
          placeholder={ig.accountBusinessIdPlaceholder}
          value={accountForm.instagramBusinessId}
          onChange={(e) =>
            setAccountForm((prev) => ({ ...prev, instagramBusinessId: e.target.value }))
          }
        />
        <input
          className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg text-sm"
          placeholder={ig.accountFacebookPageIdPlaceholder}
          value={accountForm.facebookPageId}
          onChange={(e) => setAccountForm((prev) => ({ ...prev, facebookPageId: e.target.value }))}
        />
        <input
          className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg text-sm"
          placeholder={editingAccountId ? ig.accountTokenUpdatePlaceholder : ig.accountTokenPlaceholder}
          value={accountForm.accessToken}
          onChange={(e) => setAccountForm((prev) => ({ ...prev, accessToken: e.target.value }))}
        />
        <label className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
          <span className="text-sm font-medium text-foreground/90">{ig.accountActiveLabel}</span>
          <Switch
            checked={accountForm.isActive}
            onCheckedChange={(value) => setAccountForm((prev) => ({ ...prev, isActive: value }))}
          />
        </label>
        <button
          type="button"
          title={editingAccountId ? ig.accountSaveButton : ig.accountAddButton}
          className={`${adm.primaryBtn} disabled:opacity-60`}
          onClick={onSubmit}
          disabled={busy}
        >
          {editingAccountId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span className="sr-only">{editingAccountId ? ig.accountSaveButton : ig.accountAddButton}</span>
        </button>
      </div>

      <div className={`mt-5 ${adm.tableShell}`}>
        {accounts.length === 0 ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">{ig.accountsEmpty}</div>
        ) : (
          <div className="divide-y divide-border">
            {accounts.map((row) => (
              <div key={row.id} className="px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-foreground truncate">{row.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {ig.accountBusinessIdLabel}: {row.instagram_business_id}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {ig.accountTokenLabel}: {row.has_access_token ? ig.accountTokenConfigured : ig.accountTokenMissing} | {row.is_active ? ig.accountStateActive : ig.accountStateInactive}
                    </div>
                  </div>
                  <button
                    type="button"
                    title={ig.editButton}
                    className="inline-flex items-center justify-center p-2 rounded-lg border border-border hover:bg-accent dark:hover:bg-accent"
                    onClick={() => onEdit(row)}
                    disabled={busy}
                  >
                    <Pencil className="w-4 h-4" />
                    <span className="sr-only">{ig.editButton}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
