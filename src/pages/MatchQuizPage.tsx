import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '@/widgets/layout/Header';
import { Footer } from '@/widgets/layout/Footer';
import { Button } from '@/shared/ui/button';
import { PageLoader } from '@/shared/ui/page-loader';
import { BackQuickMenu } from '../../components/navigation/BackQuickMenu';
import { useCityOptional } from '@/app/providers/CityContext';
import { useAuth } from '@/app/providers/AuthContext';
import { useI18n } from '@/app/providers/I18nContext';
import type { AdopterProfile } from '@/entities/adopter-profile/model/types';
import type { TraitLevel } from '@/entities/pet/model/types';
import { adopterProfileScope, saveAdopterProfile, readAdopterProfile } from '@/shared/lib/adopter-profile-storage';
import { applySeo, canonicalUrlFromPath, SEO_ROBOTS_PRIVATE } from '@/shared/lib/seo';
import { appPrimaryCtaClass } from '@/shared/styles/cta-classes';
import { matchChoiceActiveClass, matchProgressBarClass } from '@/shared/styles/match-styles';
import { cn } from '@/shared/ui/utils';

const TOTAL_STEPS = 7;

function ChoiceBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md border px-4 py-3 text-left text-sm font-medium transition-colors',
        active ? matchChoiceActiveClass : 'border-border bg-background text-foreground hover:bg-muted',
      )}
    >
      {children}
    </button>
  );
}

export default function MatchQuizPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const profileScope = adopterProfileScope(user?.id);
  const { t } = useI18n();
  const q = t.match.quiz;
  const cityCtx = useCityOptional();
  const [step, setStep] = useState(1);
  const [animalType, setAnimalType] = useState<AdopterProfile['animalType']>('any');
  const [energyLevel, setEnergyLevel] = useState<TraitLevel>(3);
  const [experience, setExperience] = useState<AdopterProfile['experience']>('beginner');
  const [housing, setHousing] = useState<AdopterProfile['housing']>('apartment');
  const [hasKids, setHasKids] = useState(false);
  const [hasDogs, setHasDogs] = useState(false);
  const [hasCats, setHasCats] = useState(false);
  const [agePref, setAgePref] = useState<AdopterProfile['agePref']>('any');
  const [genderPref, setGenderPref] = useState<AdopterProfile['genderPref']>('any');
  const [acceptsTreatment, setAcceptsTreatment] = useState(false);
  const [acceptsDisability, setAcceptsDisability] = useState(false);
  const [city, setCity] = useState('');

  useEffect(() => {
    applySeo({
      title: t.match.seo.quizTitle,
      description: t.match.seo.quizDescription,
      canonicalUrl: canonicalUrlFromPath('/match/quiz'),
      robots: SEO_ROBOTS_PRIVATE,
    });
  }, [t.match.seo.quizDescription, t.match.seo.quizTitle]);

  useEffect(() => {
    const existing = readAdopterProfile(profileScope);
    if (!existing) return;
    setAnimalType(existing.animalType);
    setEnergyLevel(existing.energyLevel);
    setExperience(existing.experience);
    setHousing(existing.housing);
    setHasKids(existing.hasKids);
    setHasDogs(existing.hasDogs);
    setHasCats(existing.hasCats);
    setAgePref(existing.agePref);
    setGenderPref(existing.genderPref);
    setAcceptsTreatment(existing.acceptsTreatment);
    setAcceptsDisability(existing.acceptsDisability);
    if (existing.city) setCity(existing.city);
  }, [profileScope]);

  useEffect(() => {
    if (cityCtx?.selectedCity && !city) setCity(cityCtx.selectedCity);
  }, [cityCtx?.selectedCity, city]);

  const stepTitles = [
    q.step1Title,
    q.step2Title,
    q.step3Title,
    q.step4Title,
    q.step5Title,
    q.step6Title,
    q.step7Title,
  ];
  const stepTitle = stepTitles[step - 1] ?? q.step7Title;

  const canNext = () => true;

  const finish = () => {
    const profile: AdopterProfile = {
      animalType,
      energyLevel,
      experience,
      housing,
      hasKids,
      hasDogs,
      hasCats,
      agePref,
      genderPref,
      acceptsTreatment,
      acceptsDisability,
      city: city.trim(),
      completedAt: new Date().toISOString(),
    };
    saveAdopterProfile(profile, profileScope);
    navigate('/match', { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header showCitySelector={false} />
      <section className="border-b border-border bg-card px-4 sm:px-6">
        <div className="mx-auto max-w-lg py-4">
          <div className="mb-4 flex items-center gap-3">
            <BackQuickMenu />
            <div className="min-w-0 flex-1">
              <h1 className="typo-h1">{q.title}</h1>
              <p className="text-sm text-muted-foreground">
                {q.stepOf.replace('{step}', String(step)).replace('{total}', String(TOTAL_STEPS))}: {stepTitle}
              </p>
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div className={matchProgressBarClass} style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
          </div>
        </div>
      </section>

      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-lg rounded-lg border border-border bg-card p-6 shadow-sm">
          {step === 1 && (
            <div className="grid gap-2">
              <p className="mb-2 text-sm text-muted-foreground">{q.animalIntro}</p>
              <ChoiceBtn active={animalType === 'cat'} onClick={() => setAnimalType('cat')}>
                {q.animalCat}
              </ChoiceBtn>
              <ChoiceBtn active={animalType === 'dog'} onClick={() => setAnimalType('dog')}>
                {q.animalDog}
              </ChoiceBtn>
              <ChoiceBtn active={animalType === 'any'} onClick={() => setAnimalType('any')}>
                {q.animalAny}
              </ChoiceBtn>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="mb-4 text-sm text-muted-foreground">{q.energyIntro}</p>
              <div className="flex gap-2">
                {([1, 2, 3, 4, 5] as TraitLevel[]).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setEnergyLevel(n)}
                    className={cn(
                      'flex-1 rounded-lg border py-3 text-sm font-semibold transition-colors',
                      energyLevel === n
                        ? 'border-primary bg-primary text-white'
                        : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted',
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>{q.energyLow}</span>
                <span>{q.energyHigh}</span>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">{q.experienceLabel}</p>
                <div className="grid gap-2">
                  <ChoiceBtn active={experience === 'beginner'} onClick={() => setExperience('beginner')}>
                    {q.experienceBeginner}
                  </ChoiceBtn>
                  <ChoiceBtn active={experience === 'experienced'} onClick={() => setExperience('experienced')}>
                    {q.experienceExperienced}
                  </ChoiceBtn>
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">{q.housingLabel}</p>
                <div className="grid gap-2">
                  <ChoiceBtn active={housing === 'apartment'} onClick={() => setHousing('apartment')}>
                    {q.housingApartment}
                  </ChoiceBtn>
                  <ChoiceBtn active={housing === 'house'} onClick={() => setHousing('house')}>
                    {q.housingHouse}
                  </ChoiceBtn>
                  <ChoiceBtn active={housing === 'any'} onClick={() => setHousing('any')}>
                    {q.housingAny}
                  </ChoiceBtn>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <p className="mb-2 text-sm text-muted-foreground">{q.familyIntro}</p>
              {[
                { label: q.hasKids, value: hasKids, set: setHasKids },
                { label: q.hasDogs, value: hasDogs, set: setHasDogs },
                { label: q.hasCats, value: hasCats, set: setHasCats },
              ].map(({ label, value, set }) => (
                <label
                  key={label}
                  className="flex cursor-pointer items-center gap-3 rounded-md border border-border px-4 py-3"
                >
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => set(e.target.checked)}
                    className="size-4 rounded border-border"
                  />
                  <span className="text-sm font-medium">{label}</span>
                </label>
              ))}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">{q.ageLabel}</p>
                <div className="grid gap-2">
                  <ChoiceBtn active={agePref === 'young'} onClick={() => setAgePref('young')}>
                    {q.ageYoung}
                  </ChoiceBtn>
                  <ChoiceBtn active={agePref === 'adult'} onClick={() => setAgePref('adult')}>
                    {q.ageAdult}
                  </ChoiceBtn>
                  <ChoiceBtn active={agePref === 'senior'} onClick={() => setAgePref('senior')}>
                    {q.ageSenior}
                  </ChoiceBtn>
                  <ChoiceBtn active={agePref === 'any'} onClick={() => setAgePref('any')}>
                    {q.ageAny}
                  </ChoiceBtn>
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">{q.genderLabel}</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <ChoiceBtn active={genderPref === 'male'} onClick={() => setGenderPref('male')}>
                    {q.genderMale}
                  </ChoiceBtn>
                  <ChoiceBtn active={genderPref === 'female'} onClick={() => setGenderPref('female')}>
                    {q.genderFemale}
                  </ChoiceBtn>
                  <ChoiceBtn active={genderPref === 'any'} onClick={() => setGenderPref('any')}>
                    {q.genderAny}
                  </ChoiceBtn>
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{q.healthIntro}</p>
              {[
                {
                  label: q.acceptsTreatment,
                  hint: q.acceptsTreatmentHint,
                  value: acceptsTreatment,
                  set: setAcceptsTreatment,
                },
                {
                  label: q.acceptsDisability,
                  hint: q.acceptsDisabilityHint,
                  value: acceptsDisability,
                  set: setAcceptsDisability,
                },
              ].map(({ label, hint, value, set }) => (
                <label
                  key={label}
                  className="flex cursor-pointer items-start gap-3 rounded-md border border-border px-4 py-3"
                >
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => set(e.target.checked)}
                    className="mt-0.5 size-4 shrink-0 rounded border-border"
                  />
                  <span className="min-w-0 text-left">
                    <span className="block text-sm font-medium">{label}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>
                  </span>
                </label>
              ))}
            </div>
          )}

          {step === 7 && (
            <div>
              <p className="mb-3 text-sm text-muted-foreground">{q.cityIntro}</p>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground"
                placeholder={q.cityPlaceholder}
              />
            </div>
          )}

          <div className="mt-8 flex gap-2">
            <Button type="button" variant="outline" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>
              {t.common.back}
            </Button>
            {step < TOTAL_STEPS ? (
              <Button type="button" className="flex-1" disabled={!canNext()} onClick={() => setStep((s) => s + 1)}>
                {t.common.next}
              </Button>
            ) : (
              <Button type="button" className={cn('flex-1', appPrimaryCtaClass)} onClick={finish}>
                {q.finish}
              </Button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
