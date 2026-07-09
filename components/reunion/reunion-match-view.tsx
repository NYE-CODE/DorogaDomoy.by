import { Link } from 'react-router';
import { ArrowLeftRight, Check, ExternalLink, MapPin } from 'lucide-react';
import type { Pet } from '@/entities/pet/model/types';
import { useI18n } from '@/app/providers/I18nContext';
import { cn } from '@/shared/ui/utils';
import { typoH2, typoH3, typoH4 } from '@/shared/styles/typography-classes';
import { Button } from '@/shared/ui/button';
import {
  buildSimilarPetTooltipLines,
  matchPercentBadgeClass,
} from '@/shared/lib/similar-pet-display';
import {
  buildReunionAttributeRows,
  reunionConfidence,
  reunionConfidenceBadgeClass,
} from '@/shared/lib/reunion-display';
import { ImageCarousel } from '@/pages/pet-detail/pet-detail-image-carousel';

export type ReunionMatchData = {
  matchPercent: number;
  distanceKm: number | null;
  reasons: string[];
};

type ReunionMatchViewProps = {
  sourcePet: Pet;
  matchPet: Pet;
  match: ReunionMatchData;
  backHref: string;
  sourceLabel?: string;
  matchLabel?: string;
};

function PetColumn({
  pet,
  title,
  statusClassName,
}: {
  pet: Pet;
  title: string;
  statusClassName: string;
}) {
  const { t } = useI18n();
  const animal = t.pet.animalType[pet.animalType];
  const status = t.pet.status[pet.status];

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', statusClassName)}>
            {status}
          </span>
          <span className={typoH4}>
            {animal}
            {pet.breed ? ` · ${pet.breed}` : ''}
          </span>
        </div>
      </div>
      <ImageCarousel
        photos={pet.photos}
        alt={`${animal} ${pet.breed ?? ''}`.trim()}
      />
      <div className="space-y-2 p-4 text-sm">
        <p className="line-clamp-4 text-muted-foreground">{pet.description || t.pet.notSpecified}</p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {pet.city || t.pet.notSpecified}
        </p>
      </div>
      <div className="mt-auto border-t border-border p-4">
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link to={`/pet/${pet.id}`}>
            <ExternalLink className="mr-2 h-4 w-4" aria-hidden />
            {t.reunion.viewListing}
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function ReunionMatchView({
  sourcePet,
  matchPet,
  match,
  backHref,
  sourceLabel,
  matchLabel,
}: ReunionMatchViewProps) {
  const { t } = useI18n();
  const confidence = reunionConfidence(match.matchPercent);
  const reasonLines = buildSimilarPetTooltipLines(
    { reasons: match.reasons, distanceKm: match.distanceKm },
    {
      reasons: t.similarPets.reasons as Record<string, string>,
      distanceKm: t.similarPets.distanceKm,
    },
  );
  const attributeRows = buildReunionAttributeRows(sourcePet, matchPet, {
    breed: t.reunion.attributeLabels.breed,
    colors: t.reunion.attributeLabels.colors,
    gender: t.reunion.attributeLabels.gender,
    age: t.reunion.attributeLabels.age,
    city: t.reunion.attributeLabels.city,
    colorMap: t.pet.color as Record<string, string>,
    genderMap: t.pet.gender as Record<string, string>,
    notSpecified: t.pet.notSpecified,
  });

  const sourceStatusClass =
    sourcePet.status === 'searching'
      ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
      : 'bg-sky-500/15 text-sky-800 dark:text-sky-300';
  const matchStatusClass =
    matchPet.status === 'searching'
      ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
      : 'bg-sky-500/15 text-sky-800 dark:text-sky-300';

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm sm:p-8">
        <div className="mb-3 flex justify-center">
          <ArrowLeftRight className="h-8 w-8 text-primary" aria-hidden />
        </div>
        <h1 className={typoH2}>{t.reunion.pageTitle}</h1>
        <p className="mt-2 text-muted-foreground">{t.reunion.subtitle}</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <span
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ring-1 ring-inset tabular-nums',
              matchPercentBadgeClass(match.matchPercent),
            )}
          >
            {t.reunion.matchPercent.replace('{percent}', String(match.matchPercent))}
          </span>
          <span
            className={cn(
              'inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset',
              reunionConfidenceBadgeClass(confidence),
            )}
          >
            {t.reunion.confidence[confidence]}
          </span>
        </div>
        <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">
          {t.reunion.confidenceHint[confidence]}
        </p>
        {match.distanceKm != null && (
          <p className="mt-2 text-sm text-muted-foreground">
            {t.reunion.distance.replace('{km}', String(match.distanceKm))}
          </p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <PetColumn
          pet={sourcePet}
          title={sourceLabel ?? t.reunion.yourListing}
          statusClassName={sourceStatusClass}
        />
        <PetColumn
          pet={matchPet}
          title={matchLabel ?? t.reunion.candidateListing}
          statusClassName={matchStatusClass}
        />
      </div>

      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className={cn(typoH3, 'mb-4')}>{t.reunion.reasonsTitle}</h2>
        {reasonLines.length > 0 ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {reasonLines.map((line) => (
              <li
                key={line}
                className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{t.similarPets.matchTooltipEmpty}</p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className={cn(typoH3, 'mb-4')}>{t.reunion.attributesTitle}</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">{t.reunion.attributeLabels.breed}</th>
                <th className="pb-3 pr-4 font-medium">{sourceLabel ?? t.reunion.yourListing}</th>
                <th className="pb-3 font-medium">{matchLabel ?? t.reunion.candidateListing}</th>
              </tr>
            </thead>
            <tbody>
              {attributeRows.map((row) => (
                <tr key={row.key} className="border-b border-border/70 last:border-0">
                  <td className="py-3 pr-4 font-medium text-muted-foreground">
                    {t.reunion.attributeLabels[row.key as keyof typeof t.reunion.attributeLabels]}
                  </td>
                  <td className={cn('py-3 pr-4', row.aligned && 'font-medium text-foreground')}>
                    {row.sourceValue}
                  </td>
                  <td
                    className={cn(
                      'py-3',
                      row.aligned && 'font-medium text-emerald-700 dark:text-emerald-400',
                    )}
                  >
                    {row.aligned && (
                      <Check className="mr-1 inline h-3.5 w-3.5" aria-hidden />
                    )}
                    {row.matchValue}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-center text-xs text-muted-foreground">{t.reunion.disclaimer}</p>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild variant="outline">
          <Link to={backHref}>{t.reunion.backToSource}</Link>
        </Button>
        <Button asChild>
          <Link to={`/pet/${matchPet.id}`}>{t.reunion.viewListing}</Link>
        </Button>
      </div>
    </div>
  );
}
