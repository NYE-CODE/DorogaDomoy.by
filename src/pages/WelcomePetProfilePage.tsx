import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ArrowRight, ClipboardList, Megaphone, PawPrint, QrCode } from 'lucide-react';
import { Header } from '@/widgets/layout/Header';
import { Footer } from '@/widgets/layout/Footer';
import { PageLoader } from '@/shared/ui/page-loader';
import { useAuth } from '@/app/providers/AuthContext';
import { useI18n } from '@/app/providers/I18nContext';
import { profilePetsApi } from '@/shared/api/client';
import { getHomePath } from '@/shared/lib/home-route';
import { getSafeReturnPath } from '@/shared/lib/auth-return-path';
import {
  dismissPetProfileOnboarding,
  shouldShowPetProfileOnboarding,
} from '@/shared/lib/pet-profile-onboarding';
import { cn } from '@/shared/lib/classNames';
import { surfaceCtaOutline, surfaceCtaPrimary, surfacePage, surfacePanel } from '@/shared/styles/surface-classes';
import '../../landing/styles/theme-scoped.css';

export default function WelcomePetProfilePage() {
  const { t } = useI18n();
  const tip = t.onboarding.petProfile;
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnPath = getSafeReturnPath(
    (location.state as { fromProtected?: string } | null)?.fromProtected,
  );
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const finish = (path: string) => {
      if (!cancelled) {
        navigate(path, { replace: true });
      }
    };

    if (user.role === 'volunteer' || user.role === 'admin' || user.registeredAsVolunteer) {
      if (!cancelled) {
        navigate('/welcome/shelter-org', {
          replace: true,
          state: returnPath ? { fromProtected: returnPath } : undefined,
        });
      }
      return;
    }

    if (!shouldShowPetProfileOnboarding(user.id)) {
      finish(returnPath ?? getHomePath());
      return;
    }

    profilePetsApi
      .my()
      .then((pets) => {
        if (cancelled) return;
        if (pets.length > 0) {
          dismissPetProfileOnboarding(user.id);
          finish(returnPath ?? getHomePath());
          return;
        }
        setChecking(false);
      })
      .catch(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, navigate, returnPath]);

  const handleLater = () => {
    if (!user) return;
    dismissPetProfileOnboarding(user.id);
    navigate(returnPath ?? getHomePath(), { replace: true });
  };

  const handleCreate = () => {
    if (!user) return;
    dismissPetProfileOnboarding(user.id);
    navigate('/my-pets/add', {
      replace: true,
      state: returnPath ? { fromProtected: returnPath } : undefined,
    });
  };

  if (!user || checking) {
    return (
      <div className={cn('landing-theme min-h-screen', surfacePage)}>
        <PageLoader />
      </div>
    );
  }

  const benefits = [
    { icon: QrCode, text: tip.benefitQr },
    { icon: Megaphone, text: tip.benefitAd },
    { icon: ClipboardList, text: tip.benefitInfo },
  ];

  return (
    <div className={cn('landing-theme flex min-h-screen flex-col', surfacePage)}>
      <Header showCitySelector />
      <main className="flex-1 px-4 py-8 sm:py-10">
        <div className={cn(surfacePanel, 'mx-auto max-w-lg overflow-hidden')}>
          <div className="border-b border-border/80 bg-card px-5 py-6 text-center sm:px-8">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <PawPrint className="size-7" aria-hidden />
            </div>
            <h1 className="typo-h2 font-display text-foreground">{tip.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{tip.subtitle}</p>
          </div>

          <div className="bg-landing px-5 py-6 sm:px-8">
            <ul className="space-y-3">
              {benefits.map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card px-3 py-3 text-sm text-foreground"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-4" aria-hidden />
                  </div>
                  <span className="pt-1.5">{text}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 space-y-3">
              <button type="button" onClick={handleCreate} className={surfaceCtaPrimary}>
                {tip.create}
                <ArrowRight className="size-4" aria-hidden />
              </button>
              <button type="button" onClick={handleLater} className={surfaceCtaOutline}>
                {tip.later}
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
