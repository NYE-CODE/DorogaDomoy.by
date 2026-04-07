import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import QRCode from 'react-qr-code';
import {
  ArrowLeft,
  MoreVertical,
  Download,
  Share2,
  PawPrint,
  MessageCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import { profilePetsApi, type ProfilePetResponse } from '../api/client';
import { resolveProfilePetSpecies, speciesPlainLabel } from '../utils/profile-pet-display';
import { dateLocaleForUi, formatPetAgeDisplay, genderLabel, temperamentLabel } from '../utils/profile-pet-text';

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const qrWrapRef = useRef<HTMLDivElement>(null);

  const publicPetUrl =
    typeof window !== 'undefined' && id ? `${window.location.origin}/pet-profile/${id}` : '';
  const publicPetQrUrl =
    typeof window !== 'undefined' && id ? `${window.location.origin}/pet-profile/${id}?src=qr` : '';

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

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

  if (authLoading || loading || !pet || !id) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-[#FF9800]/30 border-t-[#FF9800] rounded-full animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  const photos = pet.photos?.length ? pet.photos : [];
  const mainPhoto = photos[photoIndex] ?? photos[0];
  const ageDisplay = formatPetAgeDisplay(pet.age, locale, pp);
  const colorsLine = (pet.colors ?? []).filter(Boolean).join(', ') || '—';
  const resolvedSpecies = resolveProfilePetSpecies(pet.species, pet.breed);
  const speciesLine = `${speciesPlainLabel(resolvedSpecies, f)}${pet.breed ? ` • ${pet.breed}` : ''}`;
  const addedAt = pet.created_at
    ? new Date(pet.created_at).toLocaleDateString(dateLocaleForUi(locale), {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '—';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link
              to="/my-pets"
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#FF9800] transition-colors"
            >
              <ArrowLeft size={20} />
              <span>{op.backToPets}</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {user != null && user.telegramId == null && (
                <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/30 p-5 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#FF9800]/20 flex items-center justify-center shrink-0">
                        <MessageCircle className="text-[#FF9800]" size={20} />
                      </div>
                      <div>
                        <h2 className="font-bold text-gray-900 dark:text-white text-lg mb-1">
                          {op.telegramFoundSignalTitle}
                        </h2>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          {op.telegramFoundSignalHint}
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/profile?tab=notifications"
                      className="inline-flex items-center justify-center gap-2 shrink-0 bg-[#FF9800] text-white hover:bg-[#F57C00] rounded-lg h-11 px-5 text-sm font-medium transition-colors whitespace-nowrap"
                    >
                      <MessageCircle size={18} />
                      {op.linkTelegramCta}
                    </Link>
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-card rounded-xl shadow-md border border-gray-200 dark:border-border p-5 relative">
                <div className="absolute top-4 right-4" ref={menuRef}>
                  <button
                    type="button"
                    className="p-2 hover:bg-gray-100 dark:hover:bg-muted rounded-lg transition-colors"
                    aria-expanded={menuOpen}
                    aria-label={op.menuOpen}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen((v) => !v);
                    }}
                  >
                    <MoreVertical size={20} className="text-gray-600 dark:text-gray-400" />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-card rounded-lg shadow-lg border border-gray-200 dark:border-border py-1 z-20">
                      <Link
                        to={`/my-pets/${id}/edit`}
                        className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-muted"
                        onClick={() => setMenuOpen(false)}
                      >
                        {t.myPets.menuEdit}
                      </Link>
                      <Link
                        to={`/pet-profile/${id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-muted"
                        onClick={() => setMenuOpen(false)}
                      >
                        {op.menuPublicPage}
                      </Link>
                      <Link
                        to={`/create?petId=${encodeURIComponent(id)}`}
                        className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-muted"
                        onClick={() => setMenuOpen(false)}
                      >
                        {t.myPets.menuCreateAd}
                      </Link>
                    </div>
                  )}
                </div>
                <div className="pr-10">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{pet.name}</h1>
                  <p className="text-base text-gray-600 dark:text-gray-400">{speciesLine}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-card rounded-xl shadow-md border border-gray-200 dark:border-border p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{op.photosTitle}</h2>
                <div className="space-y-4">
                  {mainPhoto ? (
                    <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-muted">
                      <img src={mainPhoto} alt={pet.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="aspect-video rounded-lg bg-gray-100 dark:bg-muted flex items-center justify-center">
                      <PawPrint className="text-gray-300" size={64} />
                    </div>
                  )}
                  {photos.length > 1 && (
                    <div className="grid grid-cols-4 gap-3">
                      {photos.map((src, i) => (
                        <button
                          key={src + i}
                          type="button"
                          onClick={() => setPhotoIndex(i)}
                          className={`aspect-square rounded-lg overflow-hidden ${
                            i === photoIndex
                              ? 'ring-4 ring-[#FF9800]'
                              : 'ring-2 ring-gray-200 dark:ring-border hover:ring-gray-300 dark:hover:ring-gray-600'
                          }`}
                        >
                          <img src={src} alt={`${pet.name} ${i + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-card rounded-xl shadow-md border border-gray-200 dark:border-border p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{op.mainInfoTitle}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{f.labelGender}</p>
                    <p className="text-lg text-gray-900 dark:text-white font-medium">{genderLabel(pet.gender, f)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{f.labelAge}</p>
                    <p className="text-lg text-gray-900 dark:text-white font-medium">{ageDisplay}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{f.labelColors}</p>
                    <p className="text-lg text-gray-900 dark:text-white font-medium">{colorsLine}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{f.labelTemperament}</p>
                    <p className="text-lg text-gray-900 dark:text-white font-medium">
                      {temperamentLabel(pet.temperament, f)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{f.labelChipped}</p>
                    <p className="text-lg text-gray-900 dark:text-white font-medium">
                      {pet.is_chipped && pet.chip_number?.trim()
                        ? op.chipYesWithNumber.replace('{number}', pet.chip_number)
                        : pet.is_chipped
                          ? f.yes
                          : f.no}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{f.labelRespondsToName}</p>
                    <p className="text-lg text-gray-900 dark:text-white font-medium">
                      {pet.responds_to_name ? f.yes : f.no}
                    </p>
                  </div>
                </div>
              </div>

              {pet.special_marks?.trim() && (
                <div className="bg-white dark:bg-card rounded-xl shadow-md border border-gray-200 dark:border-border p-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{op.specialMarksTitle}</h2>
                  <p className="text-gray-700 dark:text-gray-300">{pet.special_marks}</p>
                </div>
              )}

              {pet.medical_info?.trim() && (
                <div className="bg-white dark:bg-card rounded-xl shadow-md border border-gray-200 dark:border-border p-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{op.medicalTitle}</h2>
                  <p className="text-gray-700 dark:text-gray-300">{pet.medical_info}</p>
                </div>
              )}

              <div className="bg-white dark:bg-card rounded-xl shadow-md border border-gray-200 dark:border-border p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{op.extraInfoTitle}</h2>
                <div className="space-y-4">
                  {pet.favorite_treats?.trim() && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{f.labelTreats}</p>
                      <p className="text-gray-700 dark:text-gray-300">{pet.favorite_treats}</p>
                    </div>
                  )}
                  {pet.favorite_walks?.trim() && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{f.labelWalks}</p>
                      <p className="text-gray-700 dark:text-gray-300">{pet.favorite_walks}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{op.dateAdded}</p>
                    <p className="text-gray-700 dark:text-gray-300">{addedAt}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-card rounded-xl shadow-md border border-gray-200 dark:border-border p-6 sticky top-8 lg:top-24">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{op.qrTitle}</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{op.qrDescription}</p>
                <div
                  ref={qrWrapRef}
                  className="bg-white dark:bg-background p-6 rounded-lg border-2 border-gray-200 dark:border-border mb-6 flex items-center justify-center"
                >
                  <QRCode value={publicPetQrUrl || publicPetUrl} size={220} level="M" />
                </div>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={downloadQrSvg}
                    className="w-full flex items-center justify-center gap-2 bg-[#FF9800] text-white hover:bg-[#F57C00] rounded-lg h-12 text-lg transition-colors font-medium"
                  >
                    <Download size={20} />
                    <span>{op.downloadQr}</span>
                  </button>
                  <button
                    type="button"
                    onClick={sharePublicLink}
                    className="w-full flex items-center justify-center gap-2 bg-gray-200 dark:bg-muted text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-muted/80 rounded-lg h-12 text-lg transition-colors font-medium"
                  >
                    <Share2 size={20} />
                    <span>{op.shareLink}</span>
                  </button>
                </div>
                <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950/25 border border-yellow-200 dark:border-yellow-800/40 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>{op.qrTipBold}</strong> {op.qrTip}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
