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
  ChevronLeft,
} from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { profilePetsApi, type ProfilePetResponse } from '../api/client';
import { resolveProfilePetSpecies, speciesFullLabel } from '../utils/profile-pet-display';
import { formatPetAgeDisplay, genderLabel, temperamentLabel } from '../utils/profile-pet-text';
import { toast } from 'sonner';

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
    setMainPhotoIndex(0);
    profilePetsApi
      .get(id)
      .then((p) => setPet(p))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const photosLength = pet?.photos?.length ?? 0;
  useEffect(() => {
    setMainPhotoIndex((i) => {
      if (photosLength === 0) return 0;
      return Math.min(i, photosLength - 1);
    });
  }, [photosLength]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-[#FF9800]/30 border-t-[#FF9800] rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !pet) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background py-8 px-4 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-14 h-14 bg-[#FDB913]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <PawPrint className="text-[#FF9800]" size={28} />
          </div>
          <h1 className="text-xl font-bold text-black dark:text-white mb-2">{pp.notFound}</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">{pp.notFoundDesc}</p>
          <Link
            to="/"
            className="inline-flex items-center justify-center h-12 px-6 bg-[#FF9800] text-white rounded-lg hover:bg-[#F57C00] transition-colors font-medium"
          >
            {pp.backHome}
          </Link>
        </div>
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
      toast.error(pp.signalSendError);
    } finally {
      setSendingFoundSignal(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background py-6 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-[#FF9800] transition-colors"
          >
            <ChevronLeft size={20} />
            {pp.backHome}
          </Link>
        </div>
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2 space-y-6">
              {showFoundSignalCta && (
                <div className="rounded-2xl bg-[#FDB913]/10 dark:bg-[#FDB913]/15 border border-[#FDB913]/30 dark:border-[#FDB913]/25 p-4 md:p-6">
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-[#FF9800] rounded-full flex items-center justify-center shrink-0">
                      <PawPrint size={20} className="text-white md:w-6 md:h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-black dark:text-white mb-1 text-base md:text-lg">
                        {pp.bannerTitle}
                      </p>
                      <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">{pp.bannerText}</p>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-5">
                    <button
                      type="button"
                      onClick={handleFoundSignal}
                      disabled={sendingFoundSignal}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#FF9800] text-white hover:bg-[#F57C00] disabled:opacity-60 disabled:cursor-not-allowed rounded-lg h-11 px-5 text-sm md:text-base font-medium transition-colors"
                    >
                      {sendingFoundSignal ? pp.signalSending : pp.signalCta}
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-card rounded-2xl shadow-sm border border-gray-200 dark:border-border overflow-hidden">
                {mainPhoto && (
                  <div className="aspect-[4/3] md:aspect-[16/9] overflow-hidden bg-gray-100 dark:bg-muted">
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
                        className={`w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-muted shrink-0 ring-2 transition-shadow ${
                          i === mainPhotoIndex
                            ? 'ring-[#FF9800] shadow-md'
                            : 'ring-transparent opacity-90 hover:opacity-100'
                        }`}
                      >
                        <img src={photo} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                <div className="p-5 md:p-6 lg:p-8 pb-0">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black dark:text-white">
                    {pet.name}
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400 mt-2 text-base md:text-lg">
                    {speciesFullLabel(resolvedSpecies, f)}{pet.breed ? ` · ${pet.breed}` : ''}
                  </p>
                </div>

                <div className="p-5 md:p-6 lg:p-8 grid grid-cols-2 gap-3 md:gap-4">
                  <div className="bg-[#FDB913]/5 dark:bg-[#FDB913]/10 rounded-xl p-3 md:p-4 flex items-center gap-2.5 md:gap-3">
                    <User size={18} className="text-[#FF9800] shrink-0 md:w-5 md:h-5" />
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm text-gray-400 dark:text-gray-500">{f.labelGender}</p>
                      <p className="text-sm md:text-base font-medium text-black dark:text-white truncate">
                        {genderLabel(pet.gender, f)}
                      </p>
                    </div>
                  </div>
                  <div className="bg-[#FDB913]/5 dark:bg-[#FDB913]/10 rounded-xl p-3 md:p-4 flex items-center gap-2.5 md:gap-3">
                    <Calendar size={18} className="text-[#FF9800] shrink-0 md:w-5 md:h-5" />
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm text-gray-400 dark:text-gray-500">{f.labelAge}</p>
                      <p className="text-sm md:text-base font-medium text-black dark:text-white truncate">
                        {ageDisplay}
                      </p>
                    </div>
                  </div>
                  <div className="bg-[#FDB913]/5 dark:bg-[#FDB913]/10 rounded-xl p-3 md:p-4 flex items-center gap-2.5 md:gap-3">
                    <Palette size={18} className="text-[#FF9800] shrink-0 md:w-5 md:h-5" />
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm text-gray-400 dark:text-gray-500">{f.labelColors}</p>
                      <p className="text-sm md:text-base font-medium text-black dark:text-white truncate">
                        {colorsLine || '—'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-[#FDB913]/5 dark:bg-[#FDB913]/10 rounded-xl p-3 md:p-4 flex items-center gap-2.5 md:gap-3">
                    <Tag size={18} className="text-[#FF9800] shrink-0 md:w-5 md:h-5" />
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm text-gray-400 dark:text-gray-500">{f.labelTemperament}</p>
                      <p className="text-sm md:text-base font-medium text-black dark:text-white truncate">
                        {temperamentLabel(pet.temperament, f)}
                      </p>
                    </div>
                  </div>
                </div>

                {pet.responds_to_name && (
                  <div className="px-5 md:px-6 lg:px-8 pb-4">
                    <div className="bg-[#FDB913]/10 dark:bg-[#FDB913]/15 border border-[#FDB913]/20 dark:border-[#FDB913]/30 rounded-xl px-4 py-3 md:px-5 md:py-4 text-sm md:text-base text-gray-700 dark:text-gray-300">
                      <span className="font-medium">{pp.respondsLine.replace('{name}', pet.name)}</span>
                    </div>
                  </div>
                )}

                {pet.special_marks?.trim() && (
                  <div className="px-5 md:px-6 lg:px-8 pb-4">
                    <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800/40 rounded-xl px-4 py-3 md:px-5 md:py-4">
                      <p className="text-xs md:text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1 flex items-center gap-2">
                        <AlertTriangle size={16} className="shrink-0" />
                        {pp.specialMarksTitle}
                      </p>
                      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">{pet.special_marks}</p>
                    </div>
                  </div>
                )}

                {pet.favorite_treats?.trim() && (
                  <div className="px-5 md:px-6 lg:px-8 pb-5 md:pb-6 lg:pb-8">
                    <div className="bg-gray-50 dark:bg-muted/50 rounded-xl px-4 py-3 md:px-5 md:py-4 border border-gray-100 dark:border-border">
                      <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        {f.labelTreats}
                      </p>
                      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">{pet.favorite_treats}</p>
                    </div>
                  </div>
                )}

                {pet.medical_info?.trim() && (
                  <div className="px-5 md:px-6 lg:px-8 pb-5 md:pb-6 lg:pb-8">
                    <div className="bg-gray-50 dark:bg-muted/50 rounded-xl px-4 py-3 md:px-5 md:py-4 border border-gray-100 dark:border-border">
                      <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        {f.labelMedical}
                      </p>
                      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">{pet.medical_info}</p>
                    </div>
                  </div>
                )}

                {pet.favorite_walks?.trim() && (
                  <div className="px-5 md:px-6 lg:px-8 pb-5 md:pb-6 lg:pb-8">
                    <div className="bg-gray-50 dark:bg-muted/50 rounded-xl px-4 py-3 md:px-5 md:py-4 border border-gray-100 dark:border-border">
                      <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        {f.labelWalks}
                      </p>
                      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">{pet.favorite_walks}</p>
                    </div>
                  </div>
                )}

                {pet.is_chipped && pet.chip_number?.trim() && (
                  <div className="px-5 md:px-6 lg:px-8 pb-5 md:pb-6 lg:pb-8">
                    <div className="bg-gray-50 dark:bg-muted/50 rounded-xl px-4 py-3 md:px-5 md:py-4 border border-gray-100 dark:border-border">
                      <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        {pp.chipTitle}
                      </p>
                      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">{pet.chip_number}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white dark:bg-card rounded-2xl shadow-sm border border-gray-200 dark:border-border overflow-hidden lg:sticky lg:top-24">
                <div className="bg-[#FF9800] px-5 md:px-6 py-4 md:py-5">
                  <h2 className="text-white font-bold text-lg md:text-xl flex items-center gap-2">
                    <Phone size={20} className="md:w-6 md:h-6" />
                    {pp.contactTitle}
                  </h2>
                  <p className="text-white/90 text-sm md:text-base mt-1">{pp.contactSubtitle}</p>
                </div>

                <div className="p-5 md:p-6 space-y-4">
                  {ownerName && (
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-border">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-[#FDB913]/15 dark:bg-[#FDB913]/20 rounded-full flex items-center justify-center shrink-0">
                        <User size={20} className="text-[#FF9800] md:w-6 md:h-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs md:text-sm text-gray-400 dark:text-gray-500">{pp.owner}</p>
                        <p className="font-medium text-black dark:text-white text-base md:text-lg truncate">
                          {ownerName}
                        </p>
                      </div>
                    </div>
                  )}

                  {ownerCity && (
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-border">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-[#FDB913]/15 dark:bg-[#FDB913]/20 rounded-full flex items-center justify-center shrink-0">
                        <MapPin size={20} className="text-[#FF9800] md:w-6 md:h-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs md:text-sm text-gray-400 dark:text-gray-500">{pp.city}</p>
                        <p className="font-medium text-black dark:text-white text-base md:text-lg truncate">
                          {ownerCity}
                        </p>
                      </div>
                    </div>
                  )}

                  {ownerPhone && (
                    <a
                      href={`tel:${ownerPhone.replace(/[\s-]/g, '')}`}
                      className="flex items-center justify-center gap-2 bg-[#FF9800] text-white hover:bg-[#F57C00] rounded-lg h-12 text-base md:text-lg transition-colors font-medium w-full"
                    >
                      <Phone size={20} />
                      <span className="truncate">{pp.callWith.replace('{phone}', ownerPhone)}</span>
                    </a>
                  )}

                  {ownerViber && (
                    <a
                      href={`viber://chat?number=${ownerViber.replace(/\D/g, '')}`}
                      className="flex items-center justify-center gap-2 bg-[#625BA1] text-white hover:bg-[#514DA1] rounded-lg h-12 text-base md:text-lg transition-colors font-medium w-full"
                    >
                      <MessageCircle size={20} />
                      <span>{pp.viberCta}</span>
                    </a>
                  )}

                  {ownerEmail && (
                    <a
                      href={`mailto:${ownerEmail}`}
                      className="flex items-center justify-center gap-2 bg-white dark:bg-transparent border-2 border-[#FF9800] text-[#FF9800] hover:bg-orange-50 dark:hover:bg-orange-950/20 rounded-lg h-12 text-base md:text-lg transition-colors font-medium w-full"
                    >
                      <Mail size={20} />
                      <span>{pp.writeEmail}</span>
                    </a>
                  )}

                  {!ownerPhone && !ownerViber && !ownerEmail && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-2 text-sm">
                      {pp.contactSubtitle}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border shadow-sm p-5 md:p-6 text-center">
                <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mb-1">{pp.promoService}</p>
                <p className="font-medium text-black dark:text-white mb-4 text-sm md:text-base">{pp.promoText}</p>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-2 bg-[#FF9800] text-white hover:bg-[#F57C00] rounded-lg px-6 h-12 text-base md:text-lg transition-colors font-medium w-full md:w-auto"
                >
                  <PawPrint size={18} />
                  <span>{pp.promoCta}</span>
                </Link>
              </div>
            </div>
          </div>

        <p className="text-center text-xs md:text-sm text-gray-400 dark:text-gray-500 mt-6 md:mt-8">
          {pp.idLine.replace('{id}', id ?? '')}
        </p>
      </div>
    </div>
  );
}
