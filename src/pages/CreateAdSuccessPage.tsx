import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { CheckCircle2, List } from 'lucide-react';
import { Header } from '@/widgets/layout/Header';
import { SimilarPetsSection } from '../../components/similar-pets-section';
import { useI18n } from '@/app/providers/I18nContext';
import { petsApi } from '@/shared/api/client';
import type { Pet } from '@/entities/pet/model/types';
import { getHomePath } from '@/shared/lib/home-route';
import { cn } from '@/shared/lib/classNames';
import { surfaceCtaOutline, surfaceCtaPrimary, surfacePage, surfacePanel } from '@/shared/styles/surface-classes';
import '../../landing/styles/theme-scoped.css';

export default function CreateAdSuccessPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [pet, setPet] = useState<Pet | null>(null);

  const moderation = searchParams.get('moderation') ?? 'approved';

  useEffect(() => {
    if (!id) {
      navigate('/my-ads', { replace: true });
      return;
    }
    let cancelled = false;
    petsApi
      .get(id)
      .then((pet) => {
        if (!cancelled) setPet(pet);
      })
      .catch(() => {
        if (!cancelled) navigate('/my-ads', { replace: true });
      });
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  return (
    <div className={cn('landing-theme min-h-screen', surfacePage)}>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <div className={cn(surfacePanel, 'mb-8 px-6 py-8 text-center sm:px-8')}>
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-shelter-soft text-shelter">
            <CheckCircle2 className="size-7" aria-hidden />
          </div>
          <h1 className="typo-h2 font-display text-foreground">
            {moderation === 'pending'
              ? t.createAd.success.sentModerationTitle
              : t.createAd.success.publishedTitle}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {moderation === 'pending'
              ? t.createAd.success.sentModerationDesc
              : t.createAd.success.publishedDesc}
          </p>
          {pet ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {pet.status === 'searching' ? t.createAd.success.hintLost : t.createAd.success.hintFound}
            </p>
          ) : null}
        </div>

        {id ? (
          <SimilarPetsSection
            petId={id}
            className="mb-8"
            limit={6}
            openInNewTab
            initialDelayMs={2000}
            retryDelaysMs={[3000]}
            highlightTopMatch
          />
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to="/my-ads" className={cn(surfaceCtaPrimary, 'w-full sm:w-auto sm:min-w-[12rem] px-7')}>
            <List className="size-4" aria-hidden />
            {t.app.myAds}
          </Link>
          <Link to={getHomePath()} className={cn(surfaceCtaOutline, 'w-full sm:w-auto sm:min-w-[12rem] px-7')}>
            {t.petDetail.toMain}
          </Link>
        </div>
      </main>
    </div>
  );
}
