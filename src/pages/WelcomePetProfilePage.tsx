import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { PawPrint, QrCode, Megaphone, ClipboardList, ArrowRight } from 'lucide-react';
import { Header } from '@/widgets/layout/Header';
import { Footer } from '@/widgets/layout/Footer';
import { Button } from '@/shared/ui/button';
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
      <div className="landing-theme min-h-screen bg-muted/30 dark:bg-background">
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
    <div className="landing-theme min-h-screen flex flex-col bg-muted/30 dark:bg-background">
      <Header showCitySelector />
      <main className="flex-1 px-4 py-10">
        <div className="mx-auto max-w-lg rounded-lg border border-border bg-card p-8 shadow-sm">
          <div className="mb-6 flex justify-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <PawPrint className="size-8" />
            </div>
          </div>
          <h1 className="typo-h1 text-center">{tip.title}</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">{tip.subtitle}</p>

          <ul className="mt-8 space-y-4">
            {benefits.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-foreground">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
                  <Icon className="size-4" />
                </div>
                <span className="pt-1.5">{text}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 space-y-3">
            <Button type="button" onClick={handleCreate} className="h-11 w-full">
              {tip.create}
              <ArrowRight className="size-4" />
            </Button>
            <Button type="button" variant="ghost" onClick={handleLater} className="h-11 w-full">
              {tip.later}
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
