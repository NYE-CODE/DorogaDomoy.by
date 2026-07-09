import { useState } from 'react';
import type { ShelterCampaignResponse } from '@/shared/api/client';
import { formatCalendarDate } from '@/shared/lib/pet-helpers';
import { cn } from '@/shared/ui/utils';
import { Button } from '@/shared/ui/button';
import type { ShelterPetDetailT } from './shelter-pet-detail-glyphs';

export interface ShelterPetFundraisingPanelProps {
  t: ShelterPetDetailT;
  isLg: boolean;
  fundraisingPanel: 'fundraising' | 'fundraising_history';
  setFundraisingPanel: (panel: 'fundraising' | 'fundraising_history') => void;
  mobileTab: 'about' | 'fundraising' | 'fundraising_history';
  campaignsLoading: boolean;
  currentCampaign: ShelterCampaignResponse | null;
  historyCampaigns: ShelterCampaignResponse[];
  progressPercent: number;
  currentCampaignEndsAt: Date | null;
  hasValidCurrentCampaignEndsAt: boolean;
}

export function ShelterPetFundraisingPanel({
  t,
  isLg,
  fundraisingPanel,
  setFundraisingPanel,
  mobileTab,
  campaignsLoading,
  currentCampaign,
  historyCampaigns,
  progressPercent,
  currentCampaignEndsAt,
  hasValidCurrentCampaignEndsAt,
}: ShelterPetFundraisingPanelProps) {
  const [showHelpDetails, setShowHelpDetails] = useState(false);

  const showCampaign = isLg ? fundraisingPanel === 'fundraising' : mobileTab === 'fundraising';
  const showHistory = isLg ? fundraisingPanel === 'fundraising_history' : mobileTab === 'fundraising_history';

  return (
    <>
      <div className="mb-5 hidden lg:inline-flex rounded-md border border-border bg-background p-1">
        <button
          type="button"
          onClick={() => setFundraisingPanel('fundraising')}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            fundraisingPanel === 'fundraising'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted',
          )}
        >
          Сбор
        </button>
        <button
          type="button"
          onClick={() => setFundraisingPanel('fundraising_history')}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            fundraisingPanel === 'fundraising_history'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted',
          )}
        >
          История сборов
        </button>
      </div>

      {showCampaign ? (
        <div>
          <h2 className="typo-h2">Текущий сбор</h2>
          {campaignsLoading ? (
            <p className="mt-3 text-sm text-muted-foreground">Загрузка сбора...</p>
          ) : currentCampaign ? (
            <div className="mt-4 space-y-4 rounded-md border border-border/70 bg-muted/20 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{currentCampaign.title}</h3>
                  {currentCampaign.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">{currentCampaign.description}</p>
                  ) : null}
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Активный</span>
              </div>
              <div className="grid gap-2 text-sm sm:grid-cols-3">
                <p><span className="text-muted-foreground">Цель: </span>{currentCampaign.goal_amount} BYN</p>
                <p><span className="text-muted-foreground">Собрано: </span>{currentCampaign.collected_amount} BYN</p>
                <p><span className="text-muted-foreground">Прогресс: </span>{progressPercent}%</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Обновлено: {formatCalendarDate(new Date(currentCampaign.updated_at))}
              </p>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
              {hasValidCurrentCampaignEndsAt && currentCampaignEndsAt ? (
                <p className="text-xs text-muted-foreground">
                  Срок: до {formatCalendarDate(currentCampaignEndsAt)}
                </p>
              ) : null}
              <Button type="button" variant="outline" onClick={() => setShowHelpDetails((v) => !v)}>
                {showHelpDetails ? 'Скрыть реквизиты' : 'Как помочь'}
              </Button>
              {showHelpDetails ? (
                <div className="rounded-lg border border-border bg-background p-3 text-sm whitespace-pre-line">
                  {currentCampaign.help_details?.trim() || 'Реквизиты пока не указаны организацией.'}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <p className="text-muted-foreground">Активного сбора пока нет.</p>
            </div>
          )}
        </div>
      ) : null}
      {showHistory ? (
        <div>
          <h2 className="typo-h2">История сборов</h2>
          {historyCampaigns.length === 0 ? (
            <p className="mt-3 text-muted-foreground">
              {t.petDetail.shelterCampaignHistoryEmpty}
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {historyCampaigns.map((item) => (
                <div key={item.id} className="rounded-md border border-border/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-medium">{item.title}</p>
                    <span className="text-xs text-muted-foreground">Завершён</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.collected_amount} / {item.goal_amount} BYN
                  </p>
                  {item.close_reason ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Причина: {item.close_reason}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}
