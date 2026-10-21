import { useState } from 'react';
import type { ShelterCampaignResponse } from '@/shared/api/client';
import { formatCalendarDate } from '@/shared/lib/pet-helpers';
import { appOutlineCtaClass } from '@/shared/styles/cta-classes';
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

  const activePanel = isLg ? fundraisingPanel : mobileTab;
  const showCampaign = activePanel === 'fundraising';
  const showHistory = activePanel === 'fundraising_history';

  return (
    <>
      <div
        className="mb-5 inline-flex rounded-full border border-border bg-landing-muted/50 p-1"
        role="radiogroup"
        aria-label="Сборы"
      >
        <button
          type="button"
          role="radio"
          aria-checked={fundraisingPanel === 'fundraising'}
          onClick={() => setFundraisingPanel('fundraising')}
          className={cn(
            'rounded-full px-4 py-2 text-sm font-medium transition-colors',
            fundraisingPanel === 'fundraising'
              ? 'bg-landing-dark text-on-landing-dark shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Сбор
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={fundraisingPanel === 'fundraising_history'}
          onClick={() => setFundraisingPanel('fundraising_history')}
          className={cn(
            'rounded-full px-4 py-2 text-sm font-medium transition-colors',
            fundraisingPanel === 'fundraising_history'
              ? 'bg-landing-dark text-on-landing-dark shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          История сборов
        </button>
      </div>

      {showCampaign ? (
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground sm:text-xl">Текущий сбор</h2>
          {campaignsLoading ? (
            <p className="mt-3 text-sm text-muted-foreground">Загрузка сбора...</p>
          ) : currentCampaign ? (
            <div className="mt-4 space-y-4 rounded-2xl bg-landing-muted/50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{currentCampaign.title}</h3>
                  {currentCampaign.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">{currentCampaign.description}</p>
                  ) : null}
                </div>
                <span className="rounded-full border border-shelter-border bg-shelter-soft px-3 py-1 text-xs font-semibold text-shelter-foreground">
                  Активный
                </span>
              </div>
              <div className="grid gap-2 text-sm sm:grid-cols-3">
                <p>
                  <span className="text-muted-foreground">Цель: </span>
                  {currentCampaign.goal_amount} BYN
                </p>
                <p>
                  <span className="text-muted-foreground">Собрано: </span>
                  {currentCampaign.collected_amount} BYN
                </p>
                <p>
                  <span className="text-muted-foreground">Прогресс: </span>
                  {progressPercent}%
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Обновлено: {formatCalendarDate(new Date(currentCampaign.updated_at))}
              </p>
              <div className="h-2 rounded-full bg-landing-muted">
                <div
                  className="h-2 rounded-full bg-shelter transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {hasValidCurrentCampaignEndsAt && currentCampaignEndsAt ? (
                <p className="text-xs text-muted-foreground">
                  Срок: до {formatCalendarDate(currentCampaignEndsAt)}
                </p>
              ) : null}
              <Button
                type="button"
                className={cn(appOutlineCtaClass, 'w-full sm:w-auto')}
                onClick={() => setShowHelpDetails((v) => !v)}
              >
                {showHelpDetails ? 'Скрыть реквизиты' : 'Как помочь'}
              </Button>
              {showHelpDetails ? (
                <div className="rounded-2xl border border-border bg-card p-4 text-sm whitespace-pre-line">
                  {currentCampaign.help_details?.trim() ||
                    'Реквизиты пока не указаны организацией.'}
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
          <h2 className="font-display text-lg font-semibold text-foreground sm:text-xl">
            История сборов
          </h2>
          {historyCampaigns.length === 0 ? (
            <p className="mt-3 text-muted-foreground">{t.petDetail.shelterCampaignHistoryEmpty}</p>
          ) : (
            <div className="mt-4 space-y-3">
              {historyCampaigns.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border bg-landing-muted/40 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-medium text-foreground">{item.title}</p>
                    <span className="text-xs text-muted-foreground">Закрыт</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.collected_amount} / {item.goal_amount} BYN
                  </p>
                  {item.close_reason ? (
                    <p className="mt-1 text-xs text-muted-foreground">Причина: {item.close_reason}</p>
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
