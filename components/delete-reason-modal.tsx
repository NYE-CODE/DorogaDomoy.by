import { Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { API_BASE, usersApi } from '../api/client';
import { useI18n } from '../context/I18nContext';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

interface DeleteReasonModalProps {
  onClose: () => void;
  onConfirm: (payload: { reason: string; rewardHelperCode?: string }) => void;
  petDescription?: string;
  enableRewardSection?: boolean;
  rewardPoints?: number;
}

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
    
    const finalReason = selectedReason === 'other' && customReason 
      ? customReason 
      : deleteReasons.find(r => r.id === selectedReason)?.label || selectedReason;

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
      <DialogContent className="max-w-md rounded-2xl p-0" showCloseButton={false}>
        <DialogHeader className="border-b border-border p-4">
          <div className="flex items-start justify-between gap-4">
          <div>
              <DialogTitle className="text-lg">{t.deleteReason.title}</DialogTitle>
            {petDescription && (
                <p className="mt-1 text-sm text-muted-foreground">{petDescription}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent dark:hover:bg-accent rounded-lg transition-colors"
          >
              <X className="w-5 h-5 text-muted-foreground" />
          </button>
          </div>
        </DialogHeader>

        <div className="p-6">
          <p className="mb-4 text-sm text-muted-foreground">
            {t.deleteReason.prompt}
          </p>
          
          <div className="bg-muted border border-border rounded-lg p-3 mb-4">
            <p className="text-xs text-foreground">
              <strong>{t.deleteReason.goodNews}</strong> {t.deleteReason.goodNewsHint}
            </p>
          </div>

          <div className="space-y-2">
            {deleteReasons.map((reason) => (
              <label
                key={reason.id}
                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedReason === reason.id
                    ? 'bg-primary/10 border-primary/30'
                    : 'bg-card border-border hover:bg-accent'
                }`}
              >
                <input
                  type="radio"
                  name="deleteReason"
                  value={reason.id}
                  checked={selectedReason === reason.id}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="mt-0.5 w-4 h-4 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-900 dark:text-white">{reason.label}</span>
              </label>
            ))}
          </div>

          {selectedReason === 'other' && (
            <div className="mt-4">
              <Textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder={t.deleteReason.descPlaceholder}
                rows={3}
                autoFocus
              />
            </div>
          )}

          {canShowRewardToggle && (
            <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-3">
              <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-white cursor-pointer">
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
                  className="w-4 h-4 text-primary focus:ring-primary"
                />
                Начислить очки за помощь (+{rewardPoints})
              </label>

              {awardPoints && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={helperCode}
                      onChange={(e) => {
                        setHelperCode(e.target.value);
                        setLookupError(null);
                        setCandidate(null);
                      }}
                      placeholder="ID получателя очков (DD-XXXXXXXX)"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={() => { void handleLookup(); }}
                      disabled={!normalizedCode || lookupLoading}
                      variant="outline"
                      className="h-11 px-3"
                    >
                      {lookupLoading
                        ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        : <Search className="w-4 h-4" />}
                    </Button>
                  </div>
                  {lookupError && <p className="text-xs text-red-500">{lookupError}</p>}
                  {candidate && (
                    <div className="border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-white border border-green-200 dark:border-green-800">
                          {candidateAvatar ? (
                            <img src={candidateAvatar} alt={candidate.name} className="w-full h-full object-cover" />
                          ) : null}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{candidate.name}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">{candidate.helper_code}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border p-4">
          <Button
            onClick={onClose}
            variant="ghost"
          >
            {t.common.cancel}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm}
            variant="destructive"
          >
            {t.deleteReason.deleteAd}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}