import { Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { API_BASE, usersApi } from '../api/client';
import { useI18n } from '../context/I18nContext';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from './ui/dialog';
import { cn } from '@/shared/lib/classNames';
import {
  surfaceCtaOutline,
  surfaceCtaPrimary,
  surfaceFieldLabel,
  surfaceIconButton,
  surfaceInput,
} from '@/shared/styles/surface-classes';
import '../landing/styles/theme-scoped.css';

interface DeleteReasonModalProps {
  onClose: () => void;
  onConfirm: (payload: { reason: string; rewardHelperCode?: string }) => void;
  petDescription?: string;
  enableRewardSection?: boolean;
  rewardPoints?: number;
}

const fieldInput = cn(surfaceInput, 'h-11 rounded-lg py-0 text-sm');
const fieldTextarea = cn(surfaceInput, 'min-h-[5.5rem] resize-none rounded-lg py-3 text-sm');

export function DeleteReasonModal({
  onClose,
  onConfirm,
  petDescription,
  enableRewardSection = false,
  rewardPoints = 50,
}: DeleteReasonModalProps) {
  const { t } = useI18n();

  const deleteReasons = [
    { id: 'returned', label: t.deleteReason.reasons.returned },
    { id: 'adopted', label: t.deleteReason.reasons.adopted },
    { id: 'transferred', label: t.deleteReason.reasons.transferred },
    { id: 'mistake', label: t.deleteReason.reasons.mistake },
    { id: 'duplicate', label: t.deleteReason.reasons.duplicate },
    { id: 'other', label: t.deleteReason.reasons.other },
  ];
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [awardPoints, setAwardPoints] = useState(false);
  const [helperCode, setHelperCode] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [candidate, setCandidate] = useState<null | {
    id: string;
    name: string;
    avatar?: string | null;
    helper_code: string;
    helper_confirmed_count: number;
  }>(null);

  const archiveReasonIds = new Set(['returned', 'adopted', 'transferred']);
  const isArchiveReason = archiveReasonIds.has(selectedReason);
  const canShowRewardToggle = enableRewardSection && isArchiveReason;
  const normalizedCode = helperCode.trim().toUpperCase();

  const candidateAvatar = useMemo(() => {
    if (!candidate?.avatar) return null;
    return candidate.avatar.startsWith('http') || candidate.avatar.startsWith('data:')
      ? candidate.avatar
      : `${API_BASE}${candidate.avatar}`;
  }, [candidate?.avatar]);

  const handleLookup = async () => {
    if (!normalizedCode) return;
    setLookupLoading(true);
    setLookupError(null);
    setCandidate(null);
    try {
      const found = await usersApi.findByHelperCode(normalizedCode);
      setCandidate(found);
    } catch (e) {
      setLookupError(e instanceof Error ? e.message : 'Не удалось найти пользователя');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedReason) return;

    const finalReason =
      selectedReason === 'other' && customReason
        ? customReason
        : deleteReasons.find((r) => r.id === selectedReason)?.label || selectedReason;

    onConfirm({
      reason: finalReason,
      rewardHelperCode: canShowRewardToggle && awardPoints ? candidate?.helper_code : undefined,
    });
  };

  const canConfirm =
    selectedReason &&
    (selectedReason !== 'other' || customReason.trim().length > 0) &&
    (!canShowRewardToggle || !awardPoints || !!candidate);

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="landing-theme max-w-md gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-card"
      >
        <div className="border-b border-border/80 bg-card px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <DialogTitle className="typo-h2 font-display text-foreground">
                {t.deleteReason.title}
              </DialogTitle>
              {petDescription ? (
                <p className="mt-1 text-sm text-muted-foreground">{petDescription}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className={surfaceIconButton}
              aria-label={t.common.close}
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
        </div>

        <div className="max-h-[min(70vh,32rem)] space-y-4 overflow-y-auto bg-landing px-5 py-5 sm:px-6">
          <p className="text-sm text-muted-foreground">{t.deleteReason.prompt}</p>

          <div className="rounded-xl border border-border bg-card px-3 py-3 text-xs text-foreground">
            <strong>{t.deleteReason.goodNews}</strong> {t.deleteReason.goodNewsHint}
          </div>

          <div className="space-y-1.5">
            {deleteReasons.map((reason) => {
                const active = selectedReason === reason.id;
                return (
                  <label
                    key={reason.id}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition-colors',
                      active
                        ? 'border-primary/45 bg-primary/12 text-primary shadow-sm'
                        : 'border-border bg-card text-foreground hover:bg-muted/80',
                    )}
                  >
                    <input
                      type="radio"
                      name="deleteReason"
                      value={reason.id}
                      checked={active}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="mt-0.5 size-4 accent-primary"
                    />
                    <span className="text-sm">{reason.label}</span>
                  </label>
                );
              })}
          </div>

          {selectedReason === 'other' ? (
            <div className="space-y-1.5">
              <label htmlFor="delete-custom-reason" className={surfaceFieldLabel}>
                {t.deleteReason.descPlaceholder}
              </label>
              <textarea
                id="delete-custom-reason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder={t.deleteReason.descPlaceholder}
                rows={3}
                className={fieldTextarea}
                autoFocus
              />
            </div>
          ) : null}

          {canShowRewardToggle ? (
            <div className="space-y-3 rounded-xl border border-border bg-card p-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={awardPoints}
                  onChange={(e) => {
                    setAwardPoints(e.target.checked);
                    if (!e.target.checked) {
                      setLookupError(null);
                      setCandidate(null);
                    }
                  }}
                  className="size-4 accent-primary"
                />
                Начислить очки за помощь (+{rewardPoints})
              </label>

              {awardPoints ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={helperCode}
                      onChange={(e) => {
                        setHelperCode(e.target.value);
                        setLookupError(null);
                        setCandidate(null);
                      }}
                      placeholder="ID получателя очков (DD-XXXXXXXX)"
                      className={cn(fieldInput, 'flex-1')}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        void handleLookup();
                      }}
                      disabled={!normalizedCode || lookupLoading}
                      className={cn(surfaceCtaOutline, 'w-auto shrink-0 px-3')}
                      aria-label={t.common.search}
                    >
                      {lookupLoading ? (
                        <span
                          className="size-4 animate-spin rounded-full border-2 border-border border-t-transparent"
                          aria-hidden
                        />
                      ) : (
                        <Search className="size-4" aria-hidden />
                      )}
                    </button>
                  </div>
                  {lookupError ? <p className="text-xs text-destructive">{lookupError}</p> : null}
                  {candidate ? (
                    <div className="rounded-xl border border-shelter-border bg-shelter-soft px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="size-9 overflow-hidden rounded-full border border-shelter-border bg-card">
                          {candidateAvatar ? (
                            <img
                              src={candidateAvatar}
                              alt={candidate.name}
                              className="size-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{candidate.name}</div>
                          <div className="text-xs text-muted-foreground">{candidate.helper_code}</div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border/80 bg-landing px-5 py-4 sm:flex-row sm:px-6">
          <button type="button" onClick={onClose} className={cn(surfaceCtaOutline, 'sm:flex-1')}>
            {t.common.cancel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={cn(
              surfaceCtaPrimary,
              'sm:flex-1',
              'bg-destructive text-destructive-foreground hover:bg-destructive/90',
              'disabled:bg-muted disabled:text-muted-foreground',
            )}
          >
            {t.deleteReason.deleteAd}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
