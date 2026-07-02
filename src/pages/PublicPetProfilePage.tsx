import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router';
import {
  Phone,
  MapPin,
  User,
  PawPrint,
  Calendar,
  Palette,
  Tag,
  MessageCircle,
  Mail,
  AlertTriangle,
} from 'lucide-react';
import { useI18n } from '@/app/providers/I18nContext';
import { profilePetsApi, type ProfilePetResponse } from '@/shared/api/client';
import { resolveProfilePetSpecies, speciesFullLabel } from '@/shared/lib/profile-pet-display';
import {
  applySeo,
  canonicalUrlFromPath,
  SEO_KEYWORDS,
  SEO_ROBOTS_PRIVATE,
  SEO_ROBOTS_PUBLIC,
  truncateMetaDescription,
} from '@/shared/lib/seo';
import { getHomePath } from '@/shared/lib/home-route';
import { formatPetAgeDisplay, genderLabel, temperamentLabel } from '@/shared/lib/profile-pet-text';
import { toast } from 'sonner';
import { Header } from '@/widgets/layout/Header';
import { Footer } from '@/widgets/layout/Footer';
import { PageLoader } from '@/shared/ui/page-loader';
import { EmptyState } from '@/shared/ui/empty-state';
import { Button } from '@/shared/ui/button';
import { appPrimaryCtaClass } from '@/shared/styles/cta-classes';
import { surfacePanelClass } from '@/shared/styles/surface-classes';
import { cn } from '@/shared/ui/utils';
import { BackQuickMenu } from '../../components/navigation/BackQuickMenu';

export default function PublicPetProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { t, locale } = useI18n();
  const f = t.myPets.form;
  const pp = t.publicPetProfile;

  const [pet, setPet] = useState<ProfilePetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [mainPhotoIndex, setMainPhotoIndex] = useState(0);
  const [sendingFoundSignal, setSendingFoundSignal] = useState(false);

  const signalSource = (() => {
    const s = (searchParams.get('src') || '').trim().toLowerCase();
    return s === 'qr' || s === 'nfc' ? s : 'unknown';
  })();

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setNotFound(false);
    setPet(null);
    setMainPhotoIndex(0);
    profilePetsApi
      .get(id)
      .then((p) => setPet(p))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (loading || !id) return;
    if (notFound || !pet) {
      applySeo({
        title: `${pp.notFound} | DorogaDomoy.by`,
        description: truncateMetaDescription(`${pp.notFoundDesc} DorogaDomoy.by.`),
        canonicalUrl: canonicalUrlFromPath(`/pet-profile/${id}`),
        robots: SEO_ROBOTS_PRIVATE,
        keywords: SEO_KEYWORDS,
      });
    }
  }, [loading, notFound, pet, id, pp.notFound, pp.notFoundDesc]);

  useEffect(() => {
    if (!pet) return;
    const species = speciesFullLabel(resolveProfilePetSpecies(pet.species, pet.breed), f);
    const city = (pet.owner_city ?? '').trim();
    const title = `${pet.name} Ч ${species}${city ? `, ${city}` : ''} | DorogaDomoy.by`;
    const desc = truncateMetaDescription(
      `${pet.name}, ${species}.${city ? ` ${pp.city}: ${city}.` : ''} ${pp.contactSubtitle} DorogaDomoy.by.`,
    );
    applySeo({
      title,
      description: desc,
      canonicalUrl: canonicalUrlFromPath(`/pet-profile/${pet.id}`),
      robots: SEO_ROBOTS_PUBLIC,
      keywords: SEO_KEYWORDS,
    });
  }, [pet, f, pp.city, pp.contactSubtitle, locale]);

  const photosLength = pet?.photos?.length ?? 0;
  useEffect(() => {
    setMainPhotoIndex((i) => {
      if (photosLength === 0) return 0;
      return Math.min(i, photosLength - 1);
    });
  }, [photosLength]);

  if (loading) {
    return <PageLoader label={t.common.loading} />;
  }

  if (notFound || !pet) {
    return (
      <div className="min-h-screen bg-muted/30 dark:bg-background flex flex-col">
        <Header showCitySelector={false} />
        <div className="flex-1 px-4 py-8">
          <div className="mx-auto max-w-md">
            <EmptyState
              title={pp.notFound}
              description={pp.notFoundDesc}
              icon={<PawPrint size={28} />}
              action={
                <Button asChild>
                  <Link to={getHomePath()}>{pp.backHome}</Link>
                </Button>
              }
            />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const photos = pet.photos?.length ? pet.photos : [];
  const mainPhoto = photos[mainPhotoIndex] ?? photos[0];
  const ageDisplay = formatPetAgeDisplay(pet.age, locale, pp);
  const colorsLine = (pet.colors ?? []).filter(Boolean).join(', ');
  const resolvedSpecies = resolveProfilePetSpecies(pet.species, pet.breed);

  const ownerName = (pet.owner_name ?? '').trim();
  const ownerPhone = (pet.owner_phone ?? '').trim();
  const ownerEmail = (pet.owner_email ?? '').trim();
  const ownerCity = (pet.owner_city ?? '').trim();
  const ownerViber = (pet.owner_viber ?? '').trim();
  const showFoundSignalCta = pet.owner_telegram_linked === true;

  const handleFoundSignal = async () => {
    if (!id || sendingFoundSignal) return;
    setSendingFoundSignal(true);
    try {
      const result = await profilePetsApi.sendFoundSignal(id, signalSource);
      if (result.throttled) toast.info(pp.signalAlreadySent);
      else toast.success(pp.signalSent);
    } catch (err) {
      if (import.meta.env.DEV && err instanceof Error) console.warn('[sendFoundSignal]', err);
      const msg = err instanceof Error ? err.message.toLowerCase() : '';
      if (msg.includes('своему питомцу')) {
        toast.error(pp.signalOwnPetError);
      } else {
        toast.error(pp.signalSendError);
      }
    } finally {
      setSendingFoundSignal(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background flex flex-col">
      <Header showCitySelector={false} />
      <div className="flex-1 py-6 sm:py-8">
      <div className="page-container">
        <div className="mb-6">
          <BackQuickMenu />
        </div>
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2 space-y-6">
              {showFoundSignalCta && (
                <div className="rounded-lg bg-primary-light/10 dark:bg-primary-light/15 border border-primary-light/30 dark:border-primary-light/25 p-4 md:p-6">
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-primary rounded-full flex items-center justify-center shrink-0">
                      <PawPrint size={20} className="text-white md:w-6 md:h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-black dark:text-white mb-1 text-base md:text-lg">
                        {pp.bannerTitle}
                      </p>
                      <p className="text-sm md:text-base text-muted-foreground">{pp.bannerText}</p>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-5">
                    <button
                      type="button"
                      onClick={handleFoundSignal}
                      disabled={sendingFoundSignal}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-white hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed rounded-lg h-11 px-5 text-sm md:text-base font-medium transition-colors"
                    >
                      {sendingFoundSignal ? pp.signalSending : pp.signalCta}
                    </button>
                  </div>
                </div>
              )}

              <div className={cn(surfacePanelClass)}>
                {mainPhoto && (
                  <div className="aspect-[4/3] md:aspect-[16/9] overflow-hidden bg-muted">
                    <img src={mainPhoto} alt={pet.name} className="w-full h-full object-cover" />
                  </div>
                )}

                {photos.length > 1 && (
                  <div className="px-4 md:px-6 pt-4 flex gap-2 md:gap-3 flex-wrap">
                    {photos.map((photo, i) => (
                      <button
                        key={photo + i}
                        type="button"
                        onClick={() => setMainPhotoIndex(i)}
                        className={`w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden bg-muted shrink-0 ring-2 transition-shadow ${
                          i === mainPhotoIndex
                            ? 'ring-primary shadow-md'
                            : 'ring-transparent opacity-90 hover:opacity-100'
                        }`}
                      >
                        <img src={photo} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                <div className="p-5 md:p-6 lg:p-8 pb-0">
                  <h1 className="typo-h1">
                    {pet.name}
                  </h1>
                  <p className="text-muted-foreground mt-2 text-base md:text-lg">
                    {speciesFullLabel(resolvedSpecies, f)}{pet.breed ? ` Ј ${pet.breed}` : ''}
                  </p>
                </div>

                <div className="p-5 md:p-6 lg:p-8 grid grid-cols-2 gap-3 md:gap-4">
                  <div className="bg-primary-light/5 dark:bg-primary-light/10 rounded-md p-3 md:p-4 flex items-center gap-2.5 md:gap-3">
                    <User size={18} className="text-primary shrink-0 md:w-5 md:h-5" />
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm text-muted-foreground/80">{f.labelGender}</p>
                      <p className="text-sm md:text-base font-medium text-black dark:text-white truncate">
                        {genderLabel(pet.gender, f)}
                      </p>
                    </div>
                  </div>
                  <div className="bg-primary-light/5 dark:bg-primary-light/10 rounded-md p-3 md:p-4 flex items-center gap-2.5 md:gap-3">
                    <Calendar size={18} className="text-primary shrink-0 md:w-5 md:h-5" />
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm text-muted-foreground/80">{f.labelAge}</p>
                      <p className="text-sm md:text-base font-medium text-black dark:text-white truncate">
                        {ageDisplay}
                      </p>
                    </div>
                  </div>
                  <div className="bg-primary-light/5 dark:bg-primary-light/10 rounded-md p-3 md:p-4 flex items-center gap-2.5 md:gap-3">
                    <Palette size={18} className="text-primary shrink-0 md:w-5 md:h-5" />
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm text-muted-foreground/80">{f.labelColors}</p>
                      <p className="text-sm md:text-base font-medium text-black dark:text-white truncate">
                        {colorsLine || 'Ч'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-primary-light/5 dark:bg-primary-light/10 rounded-md p-3 md:p-4 flex items-center gap-2.5 md:gap-3">
                    <Tag size={18} className="text-primary shrink-0 md:w-5 md:h-5" />
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm text-muted-foreground/80">{f.labelTemperament}</p>
                      <p className="text-sm md:text-base font-medium text-black dark:text-white truncate">
                        {temperamentLabel(pet.temperament, f)}
                      </p>
                    </div>
                  </div>
                </div>

                {pet.responds_to_name && (
                  <div className="px-5 md:px-6 lg:px-8 pb-4">
                    <div className="bg-primary-light/10 dark:bg-primary-light/15 border border-primary-light/20 dark:border-primary-light/30 rounded-md px-4 py-3 md:px-5 md:py-4 text-sm md:text-base text-foreground/90">
                      <span className="font-medium">{pp.respondsLine.replace('{name}', pet.name)}</span>
                    </div>
                  </div>
                )}

                {pet.special_marks?.trim() && (
                  <div className="px-5 md:px-6 lg:px-8 pb-4">
                    <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800/40 rounded-md px-4 py-3 md:px-5 md:py-4">
                      <p className="text-xs md:text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1 flex items-center gap-2">
                        <AlertTriangle size={16} className="shrink-0" />
                        {pp.specialMarksTitle}
                      </p>
                      <p className="text-sm md:text-base text-foreground/90">{pet.special_marks}</p>
                    </div>
                  </div>
                )}

                {pet.favorite_treats?.trim() && (
                  <div className="px-5 md:px-6 lg:px-8 pb-5 md:pb-6 lg:pb-8">
                    <div className="bg-muted/50 dark:bg-muted/50 rounded-md px-4 py-3 md:px-5 md:py-4 border border-border/60">
                      <p className="text-xs md:text-sm font-medium text-muted-foreground mb-1">
                        {f.labelTreats}
                      </p>
                      <p className="text-sm md:text-base text-foreground/90">{pet.favorite_treats}</p>
                    </div>
                  </div>
                )}

                {pet.medical_info?.trim() && (
                  <div className="px-5 md:px-6 lg:px-8 pb-5 md:pb-6 lg:pb-8">
                    <div className="bg-muted/50 dark:bg-muted/50 rounded-md px-4 py-3 md:px-5 md:py-4 border border-border/60">
                      <p className="text-xs md:text-sm font-medium text-muted-foreground mb-1">
                        {f.labelMedical}
                      </p>
                      <p className="text-sm md:text-base text-foreground/90">{pet.medical_info}</p>
                    </div>
                  </div>
                )}

                {pet.favorite_walks?.trim() && (
                  <div className="px-5 md:px-6 lg:px-8 pb-5 md:pb-6 lg:pb-8">
                    <div className="bg-muted/50 dark:bg-muted/50 rounded-md px-4 py-3 md:px-5 md:py-4 border border-border/60">
                      <p className="text-xs md:text-sm font-medium text-muted-foreground mb-1">
                        {f.labelWalks}
                      </p>
                      <p className="text-sm md:text-base text-foreground/90">{pet.favorite_walks}</p>
                    </div>
                  </div>
                )}

                {pet.is_chipped && pet.chip_number?.trim() && (
                  <div className="px-5 md:px-6 lg:px-8 pb-5 md:pb-6 lg:pb-8">
                    <div className="bg-muted/50 dark:bg-muted/50 rounded-md px-4 py-3 md:px-5 md:py-4 border border-border/60">
                      <p className="text-xs md:text-sm font-medium text-muted-foreground mb-1">
                        {pp.chipTitle}
                      </p>
                      <p className="text-sm md:text-base text-foreground/90">{pet.chip_number}</p>
                    </div>
                  </div>
                )}

                {(pet.registration_authority?.trim() || pet.registration_token_number?.trim()) && (
                  <div className="px-5 md:px-6 lg:px-8 pb-5 md:pb-6 lg:pb-8">
                    <div className="bg-muted/50 dark:bg-muted/50 rounded-md px-4 py-3 md:px-5 md:py-4 border border-border/60">
                      <p className="text-xs md:text-sm font-medium text-muted-foreground mb-2">
                        {pp.registrationTitle}
                      </p>
                      {pet.registration_authority?.trim() ? (
                        <p className="text-sm md:text-base text-foreground/90">
                          <span className="text-muted-foreground">{pp.registrationAuthority}: </span>
                          {pet.registration_authority.trim()}
                        </p>
                      ) : null}
                      {pet.registration_token_number?.trim() ? (
                        <p className="mt-2 text-sm md:text-base text-foreground/90">
                          <span className="text-muted-foreground">{pp.registrationToken}: </span>
                          <span className="font-mono">{pet.registration_token_number.trim()}</span>
                        </p>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-1 space-y-6">
              <div className={cn(surfacePanelClass, 'lg:sticky lg:top-24')}>
                <div className="bg-primary px-5 md:px-6 py-4 md:py-5">
                  <h2 className="text-white font-bold text-lg md:text-xl flex items-center gap-2">
                    <Phone size={20} className="md:w-6 md:h-6" />
                    {pp.contactTitle}
                  </h2>
                  <p className="text-white/90 text-sm md:text-base mt-1">{pp.contactSubtitle}</p>
                </div>

                <div className="p-5 md:p-6 space-y-4">
                  {ownerName && (
                    <div className="flex items-center gap-3 pb-4 border-b border-border/60">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-primary-light/15 dark:bg-primary-light/20 rounded-full flex items-center justify-center shrink-0">
                        <User size={20} className="text-primary md:w-6 md:h-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs md:text-sm text-muted-foreground/80">{pp.owner}</p>
                        <p className="font-medium text-black dark:text-white text-base md:text-lg truncate">
                          {ownerName}
                        </p>
                      </div>
                    </div>
                  )}

                  {ownerCity && (
                    <div className="flex items-center gap-3 pb-4 border-b border-border/60">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-primary-light/15 dark:bg-primary-light/20 rounded-full flex items-center justify-center shrink-0">
                        <MapPin size={20} className="text-primary md:w-6 md:h-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs md:text-sm text-muted-foreground/80">{pp.city}</p>
                        <p className="font-medium text-black dark:text-white text-base md:text-lg truncate">
                          {ownerCity}
                        </p>
                      </div>
                    </div>
                  )}

                  {ownerPhone && (
                    <a
                      href={`tel:${ownerPhone.replace(/[\s-]/g, '')}`}
                      className="flex items-center justify-center gap-2 bg-primary text-white hover:bg-primary-hover rounded-lg h-12 text-base md:text-lg transition-colors font-medium w-full"
                    >
                      <Phone size={20} />
                      <span className="truncate">{pp.callWith.replace('{phone}', ownerPhone)}</span>
                    </a>
                  )}

                  {ownerViber && (
                    <a
                      href={`viber://chat?number=${ownerViber.replace(/\D/g, '')}`}
                      className="flex items-center justify-center gap-2 bg-viber-alt text-white hover:bg-viber-alt-hover rounded-lg h-12 text-base md:text-lg transition-colors font-medium w-full"
                    >
                      <MessageCircle size={20} />
                      <span>{pp.viberCta}</span>
                    </a>
                  )}

                  {ownerEmail && (
                    <a
                      href={`mailto:${ownerEmail}`}
                      className="flex items-center justify-center gap-2 bg-white dark:bg-transparent border-2 border-primary text-primary hover:bg-orange-50 dark:hover:bg-orange-950/20 rounded-lg h-12 text-base md:text-lg transition-colors font-medium w-full"
                    >
                      <Mail size={20} />
                      <span>{pp.writeEmail}</span>
                    </a>
                  )}

                  {!ownerPhone && !ownerViber && !ownerEmail && (
                    <p className="text-center text-muted-foreground py-2 text-sm">
                      {pp.contactSubtitle}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-card rounded-lg border border-border shadow-sm p-5 md:p-6 text-center">
                <p className="text-sm md:text-base text-muted-foreground mb-1">{pp.promoService}</p>
                <p className="font-medium text-black dark:text-white mb-4 text-sm md:text-base">{pp.promoText}</p>
                <Button className={cn(appPrimaryCtaClass, 'w-full md:w-auto')} asChild>
                  <Link to={getHomePath()}>
                    <PawPrint size={18} />
                    <span>{pp.promoCta}</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>

        <p className="text-center text-xs md:text-sm text-muted-foreground/80 mt-6 md:mt-8">
          {pp.idLine.replace('{id}', id ?? '')}
        </p>
      </div>
      </div>
      <Footer />
    </div>
  );
}
