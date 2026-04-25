import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import QRCode from 'react-qr-code';
import {
  ArrowLeft,
  MoreVertical,
  Download,
  Share2,
  PawPrint,
  MessageCircle,
  ExternalLink,
  Pencil,
  Eye,
  FilePlus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import { profilePetsApi, partnersApi, type ProfilePetResponse, type Partner } from '../api/client';
import { resolveProfilePetSpecies, speciesPlainLabel } from '../utils/profile-pet-display';
import { dateLocaleForUi, formatPetAgeDisplay, genderLabel, temperamentLabel } from '../utils/profile-pet-text';
import { PageLoader } from '../components/ui/page-loader';
import { Button, buttonVariants } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { cn } from '../components/ui/utils';
import { appOutlineCtaClass, appPrimaryCtaClass } from '../styles/cta-classes';

export default function MyPetProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const { user, isLoading: authLoading } = useAuth();
  const f = t.myPets.form;
  const op = t.myPets.ownerProfile;
  const pp = t.publicPetProfile;

  const [pet, setPet] = useState<ProfilePetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [partnersModalOpen, setPartnersModalOpen] = useState(false);
  const [partnersLoading, setPartnersLoading] = useState(false);
  const [partnersError, setPartnersError] = useState('');
  const [partnersList, setPartnersList] = useState<Partner[] | null>(null);
  const qrWrapRef = useRef<HTMLDivElement | null>(null);
  const thumbRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const publicPetUrl =
    typeof window !== 'undefined' && id ? `${window.location.origin}/pet-profile/${id}` : '';
  const publicPetQrUrl =
    typeof window !== 'undefined' && id ? `${window.location.origin}/pet-profile/${id}?src=qr` : '';

  useEffect(() => {
    if (!id) {
      navigate('/my-pets', { replace: true });
      return;
    }
    if (authLoading) return;
    if (!user) {
      toast.error(op.needAuth);
      navigate('/my-pets', { replace: true });
      return;
    }
    setLoading(true);
    profilePetsApi
      .get(id)
      .then((p) => {
        if (p.owner_id !== user.id) {
          navigate(`/pet-profile/${encodeURIComponent(id)}`, { replace: true });
          return;
        }
        setPet(p);
        setPhotoIndex(0);
      })
      .catch(() => {
        toast.error(op.loadError);
        navigate('/my-pets', { replace: true });
      })
      .finally(() => setLoading(false));
  }, [id, user?.id, authLoading]);

  const photosLength = pet?.photos?.length ?? 0;
  useEffect(() => {
    setPhotoIndex((i) => {
      if (photosLength === 0) return 0;
      return Math.min(i, photosLength - 1);
    });
  }, [photosLength]);

  const goPrevPhoto = useCallback(() => {
    setPhotoIndex((i) => {
      const n = pet?.photos?.length ?? 0;
      if (n <= 1) return i;
      return i <= 0 ? n - 1 : i - 1;
    });
  }, [pet?.photos?.length]);

  const goNextPhoto = useCallback(() => {
    setPhotoIndex((i) => {
      const n = pet?.photos?.length ?? 0;
      if (n <= 1) return i;
      return i >= n - 1 ? 0 : i + 1;
    });
  }, [pet?.photos?.length]);

  useEffect(() => {
    const el = thumbRefs.current[photoIndex];
    requestAnimationFrame(() => {
      el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
  }, [photoIndex]);

  useEffect(() => {
    if (photosLength <= 1) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (t.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrevPhoto();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNextPhoto();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [photosLength, goPrevPhoto, goNextPhoto]);

  const downloadQrSvg = () => {
    const svg = qrWrapRef.current?.querySelector('svg');
    if (!svg) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-${(pet?.name ?? 'pet').replace(/\s+/g, '-')}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sharePublicLink = async () => {
    try {
      await navigator.clipboard.writeText(publicPetUrl);
      toast.success(op.linkCopied);
    } catch {
      toast.error(t.common.error);
    }
  };

  const loadPartners = async (force = false) => {
    if (partnersLoading) return;
    if (!force && partnersList !== null) return;
    setPartnersLoading(true);
    setPartnersError('');
    try {
      const list = await partnersApi.list();
      setPartnersList(Array.isArray(list) ? list : []);
    } catch {
      setPartnersError(op.partnersLoadError);
    } finally {
      setPartnersLoading(false);
    }
  };

  const openPartnersModal = () => {
    setPartnersModalOpen(true);
    void loadPartners(false);
  };

  const medallionPartners = (partnersList ?? []).filter((partner) => partner.is_medallion_partner);

  if (authLoading || loading || !pet || !id) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <PageLoader label={t.common.loading} className="flex-1 bg-muted/30" />
        <Footer />
      </div>
    );
  }

  const photos = pet.photos?.length ? pet.photos : [];
  const mainPhoto = photos[photoIndex] ?? photos[0];
  const ageDisplay = formatPetAgeDisplay(pet.age, locale, pp);
  const colorsLine = (pet.colors ?? []).filter(Boolean).join(', ') || '—';
  const resolvedSpecies = resolveProfilePetSpecies(pet.species, pet.breed);
  const speciesLine = `${speciesPlainLabel(resolvedSpecies, f)}${pet.breed ? ` · ${pet.breed}` : ''}`;
  const addedAt = pet.created_at
    ? new Date(pet.created_at).toLocaleDateString(dateLocaleForUi(locale), {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '—';

  const fieldClass = 'rounded-xl border border-border/70 bg-muted/25 p-4 transition-colors hover:bg-muted/40';
  const sectionTitleClass = 'text-xl font-semibold tracking-tight text-foreground';

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-muted/45 via-background to-background">
      <Header />
      <main className="flex-1 py-6 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 sm:mb-8">
            <Button variant="ghost" size="sm" className="-ml-2 gap-2 text-muted-foreground hover:text-foreground" asChild>
              <Link to="/my-pets">
                <ArrowLeft size={18} />
                <span>{op.backToPets}</span>
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
            <div className="space-y-6 lg:col-span-2">
              {user != null && user.telegramId == null && (
                <Card className="border-amber-200/80 bg-amber-50/90 shadow-sm dark:border-amber-800/40 dark:bg-amber-950/35">
                  <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15">
                        <MessageCircle className="text-primary" size={20} />
                      </div>
                      <div>
                        <h2 className="mb-1 text-base font-semibold text-foreground">{op.telegramFoundSignalTitle}</h2>
                        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">{op.telegramFoundSignalHint}</p>
                      </div>
                    </div>
                    <Link
                      to="/profile?tab=notifications"
                      className={cn(appPrimaryCtaClass, 'inline-flex shrink-0 gap-2')}
                    >
                      <MessageCircle size={18} />
                      {op.linkTelegramCta}
                    </Link>
                  </CardContent>
                </Card>
              )}

              {/* Обложка + шапка профиля; миниатюры сразу под фото — без скролла к галерее */}
              <Card className="gap-0 overflow-hidden border-border/80 shadow-md ring-1 ring-border/50">
                <div className="relative bg-muted">
                  {photos.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={goPrevPhoto}
                        className="absolute left-2 top-1/2 z-20 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/95 text-foreground shadow-md backdrop-blur-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:left-3"
                        aria-label={op.photoPrev}
                      >
                        <ChevronLeft size={22} />
                      </button>
                      <button
                        type="button"
                        onClick={goNextPhoto}
                        className="absolute right-2 top-1/2 z-20 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/95 text-foreground shadow-md backdrop-blur-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:right-3"
                        aria-label={op.photoNext}
                      >
                        <ChevronRight size={22} />
                      </button>
                    </>
                  )}
                  <div className="flex min-h-[220px] items-center justify-center px-4 py-8 sm:min-h-[280px] sm:py-10">
                    {mainPhoto ? (
                      <img
                        src={mainPhoto}
                        alt={pet.name}
                        className="max-h-[min(52vh,480px)] w-full max-w-3xl object-contain object-center"
                      />
                    ) : (
                      <PawPrint className="text-muted-foreground/35" size={72} strokeWidth={1.25} />
                    )}
                  </div>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card/90 to-transparent sm:h-20" />
                </div>

                {photos.length > 1 && (
                  <div className="border-t border-border/60 bg-card px-2 py-3 sm:px-3">
                    <div className="mb-2 flex items-center justify-between gap-2 px-1">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{op.photosTitle}</span>
                      <span className="tabular-nums text-xs text-muted-foreground">
                        {photoIndex + 1} / {photos.length}
                      </span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto overflow-y-hidden scroll-smooth pb-1 pt-0.5 [scrollbar-width:thin]">
                      {photos.map((src, i) => (
                        <button
                          key={src + i}
                          type="button"
                          ref={(el) => {
                            thumbRefs.current[i] = el;
                          }}
                          onClick={() => setPhotoIndex(i)}
                          className={cn(
                            'relative size-[4.5rem] shrink-0 snap-start overflow-hidden rounded-xl border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:size-20',
                            i === photoIndex
                              ? 'border-primary ring-2 ring-primary/30'
                              : 'border-border/80 opacity-90 hover:border-primary/50 hover:opacity-100',
                          )}
                        >
                          <img src={src} alt={`${pet.name} ${i + 1}`} className="size-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <CardHeader className="relative z-10 border-t border-border/60 bg-card pb-6 pt-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <CardTitle className="text-3xl font-bold leading-tight tracking-tight text-foreground">
                        {pet.name}
                      </CardTitle>
                      <CardDescription className="pb-5 text-base text-muted-foreground sm:pb-6">
                        {speciesLine}
                      </CardDescription>
                    </div>
                    <DropdownMenu modal={false}>
                    <DropdownMenuTrigger
                      type="button"
                      className={cn(
                        buttonVariants({ variant: 'outline', size: 'icon' }),
                        'relative z-20 shrink-0 cursor-pointer',
                      )}
                      aria-label={op.menuOpen}
                      aria-haspopup="menu"
                    >
                      <MoreVertical size={20} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={8} className="z-[110] w-52">
                      <DropdownMenuItem
                        className="cursor-pointer gap-2"
                        onSelect={() => navigate(`/my-pets/${id}/edit`)}
                      >
                        <Pencil size={16} className="opacity-70" />
                        {t.myPets.menuEdit}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer gap-2"
                        onSelect={(e) => {
                          e.preventDefault();
                          window.open(`/pet-profile/${encodeURIComponent(id)}`, '_blank', 'noopener,noreferrer');
                        }}
                      >
                        <Eye size={16} className="opacity-70" />
                        {op.menuPublicPage}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer gap-2"
                        onSelect={() => navigate(`/create?petId=${encodeURIComponent(id)}`)}
                      >
                        <FilePlus size={16} className="opacity-70" />
                        {t.myPets.menuCreateAd}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  </div>
                </CardHeader>
              </Card>

              <Card className="border-border/80 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className={sectionTitleClass}>{op.mainInfoTitle}</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className={fieldClass}>
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{f.labelGender}</dt>
                      <dd className="mt-1.5 text-base font-medium text-foreground">{genderLabel(pet.gender, f)}</dd>
                    </div>
                    <div className={fieldClass}>
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{f.labelAge}</dt>
                      <dd className="mt-1.5 text-base font-medium text-foreground">{ageDisplay}</dd>
                    </div>
                    <div className={fieldClass}>
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{f.labelColors}</dt>
                      <dd className="mt-1.5 text-base font-medium text-foreground">{colorsLine}</dd>
                    </div>
                    <div className={fieldClass}>
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{f.labelTemperament}</dt>
                      <dd className="mt-1.5 text-base font-medium text-foreground">{temperamentLabel(pet.temperament, f)}</dd>
                    </div>
                    <div className={fieldClass}>
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{f.labelChipped}</dt>
                      <dd className="mt-1.5 text-base font-medium text-foreground">
                        {pet.is_chipped && pet.chip_number?.trim()
                          ? op.chipYesWithNumber.replace('{number}', pet.chip_number)
                          : pet.is_chipped
                            ? f.yes
                            : f.no}
                      </dd>
                    </div>
                    <div className={fieldClass}>
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{f.labelRespondsToName}</dt>
                      <dd className="mt-1.5 text-base font-medium text-foreground">{pet.responds_to_name ? f.yes : f.no}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {pet.special_marks?.trim() && (
                <Card className="border-border/80 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className={sectionTitleClass}>{op.specialMarksTitle}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="leading-relaxed text-foreground/90">{pet.special_marks}</p>
                  </CardContent>
                </Card>
              )}

              {pet.medical_info?.trim() && (
                <Card className="border-border/80 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className={sectionTitleClass}>{op.medicalTitle}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="leading-relaxed text-foreground/90">{pet.medical_info}</p>
                  </CardContent>
                </Card>
              )}

              <Card className="border-border/80 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className={sectionTitleClass}>{op.extraInfoTitle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {pet.favorite_treats?.trim() && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{f.labelTreats}</p>
                      <p className="mt-1.5 leading-relaxed text-foreground/90">{pet.favorite_treats}</p>
                    </div>
                  )}
                  {pet.favorite_walks?.trim() && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{f.labelWalks}</p>
                      <p className="mt-1.5 leading-relaxed text-foreground/90">{pet.favorite_walks}</p>
                    </div>
                  )}
                  <div className="border-t border-border/60 pt-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{op.dateAdded}</p>
                    <p className="mt-1.5 font-medium text-foreground">{addedAt}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-20 border-primary/15 bg-card/95 shadow-lg ring-1 ring-border/60 backdrop-blur-sm supports-[backdrop-filter]:bg-card/85 lg:top-24 lg:self-start">
                <CardHeader className="pb-3">
                  <CardTitle className={sectionTitleClass}>{op.qrTitle}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">{op.qrDescription}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    ref={qrWrapRef}
                    className="flex items-center justify-center rounded-2xl border-2 border-dashed border-primary/25 bg-muted/30 p-6 dark:bg-background/80"
                  >
                    <QRCode value={publicPetQrUrl || publicPetUrl} size={220} level="M" />
                  </div>
                  <div className="rounded-xl border border-border/80 bg-muted/25 p-4">
                    <p className="text-sm font-semibold text-foreground">{op.freeOptionTitle}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{op.freeOptionHint}</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Button type="button" className={cn(appPrimaryCtaClass, 'h-12 w-full text-base')} onClick={downloadQrSvg}>
                      <Download size={20} />
                      <span>{op.downloadQr}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(appOutlineCtaClass, 'h-12 w-full text-base')}
                      onClick={() => void sharePublicLink()}
                    >
                      <Share2 size={20} />
                      <span>{op.shareLink}</span>
                    </Button>
                  </div>
                  <div className="rounded-xl border border-border/80 bg-muted/25 p-4">
                    <p className="text-sm font-semibold text-foreground">{op.partnerOptionTitle}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{op.partnerOptionHint}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-full gap-2 border-primary/40 text-base text-primary hover:bg-primary/10"
                    onClick={openPartnersModal}
                  >
                    <ExternalLink size={18} />
                    {op.orderFromPartners}
                  </Button>
                  <div className="rounded-xl border border-amber-200/70 bg-amber-50/80 p-4 dark:border-amber-800/50 dark:bg-amber-950/30">
                    <p className="text-sm leading-relaxed text-amber-950 dark:text-amber-100">
                      <strong>{op.qrTipBold}</strong> {op.qrTip}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={partnersModalOpen} onOpenChange={setPartnersModalOpen}>
        <DialogContent className="flex max-h-[min(90vh,720px)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl" showCloseButton>
          <DialogHeader className="sticky top-0 z-10 border-b border-border bg-background px-6 py-4 text-left">
            <DialogTitle>{op.partnersModalTitle}</DialogTitle>
            <DialogDescription>{op.partnersModalSubtitle}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 overflow-y-auto px-6 py-4">
            {partnersLoading ? (
              <p className="text-sm text-muted-foreground">{t.common.loading}</p>
            ) : partnersError ? (
              <div className="space-y-3">
                <p className="text-sm text-destructive">{partnersError}</p>
                <Button type="button" onClick={() => void loadPartners(true)}>
                  {op.partnersRetry}
                </Button>
              </div>
            ) : medallionPartners.length === 0 ? (
              <p className="text-sm text-muted-foreground">{op.partnersEmpty}</p>
            ) : (
              medallionPartners.map((partner) => (
                <div
                  key={partner.id}
                  className="flex flex-col gap-3 rounded-xl border border-border/80 bg-muted/20 p-4 sm:flex-row sm:items-center"
                >
                  {partner.logo_url ? (
                    <img
                      src={partner.logo_url}
                      alt={partner.name}
                      className="size-12 shrink-0 rounded-lg border border-border object-cover"
                    />
                  ) : (
                    <div className="size-12 shrink-0 rounded-lg border border-border bg-muted" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{partner.name}</p>
                  </div>
                  {partner.link ? (
                    <a
                      href={partner.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(appPrimaryCtaClass, 'inline-flex shrink-0 text-sm')}
                    >
                      {op.partnersOpenLink}
                      <ExternalLink className="size-4" />
                    </a>
                  ) : (
                    <Button type="button" disabled variant="secondary" size="sm" className="shrink-0">
                      {op.partnersNoLink}
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
