export interface AdminInstagramManualModalProps {
  open: boolean;
  ig: Record<string, string>;
  manualPetId: string;
  setManualPetId: (v: string) => void;
  busy: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export function AdminInstagramManualModal({
  open,
  ig,
  manualPetId,
  setManualPetId,
  busy,
  onClose,
  onSubmit,
}: AdminInstagramManualModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-card border border-border rounded-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-foreground">{ig.manualModalTitle}</h3>
        <div className="mt-4 space-y-3">
          <input
            className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg text-sm"
            placeholder={ig.manualPetIdPlaceholder}
            value={manualPetId}
            onChange={(e) => setManualPetId(e.target.value)}
          />
          <div className="text-sm text-muted-foreground">
            {ig.manualFormatLabel}: <span className="font-medium text-foreground">{ig.manualFormatValue}</span>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              className="px-3 py-2 border border-border rounded-lg text-sm hover:bg-accent dark:hover:bg-accent"
              onClick={onClose}
              disabled={busy}
            >
              {ig.cancelButton}
            </button>
            <button
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 disabled:opacity-60"
              onClick={onSubmit}
              disabled={busy}
            >
              {ig.manualAddButton}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
