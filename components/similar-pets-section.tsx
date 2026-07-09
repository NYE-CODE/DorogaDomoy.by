import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Sparkles } from 'lucide-react';
import { PetCard } from './pet-card';
import { petsApi } from '@/shared/api/client';
import { useI18n } from '@/app/providers/I18nContext';
import { cn } from './ui/utils';
import { typoH3 } from '@/shared/styles/typography-classes';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import {
  buildSimilarPetTooltipLines,
  fallbackMatchPercent,
  matchPercentBadgeClass,
} from '@/shared/lib/similar-pet-display';

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

interface SimilarPetsSectionProps {
  petId: string;
  className?: string;
  limit?: number;
  showTitle?: boolean;
  /** Открывать карточку объявления в новой вкладке. */
  openInNewTab?: boolean;
  /** Задержка перед первым запросом (дать время посчитать CLIP embedding). */
  initialDelayMs?: number;
  /** Повторные запросы, если ещё нет visual_similarity. */
  retryDelaysMs?: number[];
}

export function SimilarPetsSection({
  petId,
  className,
  limit = 6,
  showTitle = true,
  openInNewTab = false,
  initialDelayMs = 0,
  retryDelaysMs = [],
}: SimilarPetsSectionProps) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [items, setItems] = useState<Awaited<ReturnType<typeof petsApi.similar>>['items']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    const delays = [initialDelayMs, ...retryDelaysMs];

    async function load() {
      setLoading(true);
      setError(false);
      let lastItems: Awaited<ReturnType<typeof petsApi.similar>>['items'] = [];

      for (let i = 0; i < delays.length; i += 1) {
        if (ac.signal.aborted) return;
        if (delays[i] > 0) await sleep(delays[i]);
        try {
          const res = await petsApi.similar(petId, { limit }, { signal: ac.signal });
          lastItems = res.items;
          if (!ac.signal.aborted) setItems(res.items);
          const hasVisual = res.items.some((item) => item.reasons.includes('visual_similarity'));
          if (hasVisual || i === delays.length - 1) break;
        } catch {
          if (!ac.signal.aborted) setError(true);
          break;
        }
      }

      if (!ac.signal.aborted) {
        if (lastItems.length) setItems(lastItems);
        setLoading(false);
      }
    }

    void load();
    return () => ac.abort();
  }, [petId, limit, initialDelayMs, retryDelaysMs.join(',')]);

  if (loading) {
    return (
      <div className={cn('rounded-lg border border-border bg-card p-6', className)}>
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
        </div>
      </div>
    );
  }

  if (error) return null;

  return (
    <section className={cn('rounded-lg border border-border bg-card shadow-sm', className)}>
      <div className="border-b border-border p-6">
        {showTitle && (
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" aria-hidden />
            <h2 className={typoH3}>{t.similarPets.title}</h2>
          </div>
        )}
        <p className="text-sm text-muted-foreground">{t.similarPets.subtitle}</p>
      </div>

      {items.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground">{t.similarPets.empty}</p>
      ) : (
        <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const percent = item.matchPercent ?? fallbackMatchPercent(item.score);
            const tooltipLines = buildSimilarPetTooltipLines(item, {
              reasons: t.similarPets.reasons as Record<string, string>,
              distanceKm: t.similarPets.distanceKm,
            });

            return (
              <div key={item.pet.id} className="space-y-2">
                <PetCard
                  pet={item.pet}
                  compact
                  showFavoriteToggle
                  onClick={() => {
                    const url = `/pet/${item.pet.id}`;
                    if (openInNewTab) {
                      window.open(url, '_blank', 'noopener,noreferrer');
                    } else {
                      navigate(url);
                    }
                  }}
                />
                <div className="px-1">
                  <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
                          matchPercentBadgeClass(percent),
                        )}
                        aria-label={t.similarPets.matchTooltipTitle}
                      >
                        <span className="tabular-nums">{percent}%</span>
                        <span className="font-medium opacity-90">{t.similarPets.matchLabel}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      sideOffset={6}
                      className="max-w-[240px] space-y-1 px-3 py-2 text-left"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-wide opacity-90">
                        {t.similarPets.matchTooltipTitle}
                      </p>
                      {tooltipLines.length > 0 ? (
                        <ul className="list-inside list-disc space-y-0.5 text-xs leading-snug">
                          {tooltipLines.map((line) => (
                            <li key={line}>{line}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs leading-snug opacity-90">{t.similarPets.matchTooltipEmpty}</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
