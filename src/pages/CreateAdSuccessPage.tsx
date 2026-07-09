import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { CheckCircle2, List } from 'lucide-react';
import { Header } from '@/widgets/layout/Header';
import { SimilarPetsSection } from '../../components/similar-pets-section';
import { Button } from '@/shared/ui/button';
import { useI18n } from '@/app/providers/I18nContext';
import { petsApi } from '@/shared/api/client';
import type { Pet } from '@/entities/pet/model/types';
import { getHomePath } from '@/shared/lib/home-route';

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
    <div className="min-h-screen bg-muted/30 dark:bg-background">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <div className="mb-8 rounded-xl border border-border bg-card p-6 text-center shadow-sm sm:p-8">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-600 dark:text-green-400" aria-hidden />
          <h1 className="typo-h1 mb-2">
            {moderation === 'pending' ? t.createAd.success.sentModerationTitle : t.createAd.success.publishedTitle}
          </h1>
          <p className="text-muted-foreground">
            {moderation === 'pending'
              ? t.createAd.success.sentModerationDesc
              : t.createAd.success.publishedDesc}
          </p>
          {pet && (
            <p className="mt-3 text-sm text-muted-foreground">
              {pet.status === 'searching' ? t.createAd.success.hintLost : t.createAd.success.hintFound}
            </p>
          )}
        </div>

        {id && (
          <SimilarPetsSection
            petId={id}
            className="mb-8"
            limit={6}
            openInNewTab
            initialDelayMs={2000}
            retryDelaysMs={[3000]}
          />
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link to="/my-ads">
              <List className="mr-2 h-4 w-4" aria-hidden />
              {t.app.myAds}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={getHomePath()}>{t.petDetail.toMain}</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
