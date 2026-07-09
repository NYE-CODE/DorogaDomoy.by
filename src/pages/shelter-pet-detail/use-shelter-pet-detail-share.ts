import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { API_V1_BASE } from '@/shared/api/client';
import type { Pet } from '@/entities/pet/model/types';
import type { Locale } from '@/shared/i18n/translations';
import { copyText as copyToClipboard } from '@/shared/lib/copy-text';
import { buildShelterPetShareBundle, type ShelterPetShareBundle } from '@/shared/lib/shelter-pet-share';
import { compressImageBlobForShare, tryShareImageFile } from '@/shared/lib/web-share-image';
import type { ShelterPetDetailT } from './shelter-pet-detail-glyphs';

export type ShelterInstagramGuideState = {
  variant: 'post' | 'story';
  openPath: string;
  cardUrl: string | null;
} | null;

export function useShelterPetDetailShare(
  pet: Pet,
  locale: Locale,
  t: ShelterPetDetailT,
  title: string,
  adoption: string,
  shelterName?: string,
) {
  const [cardLoading, setCardLoading] = useState<null | 'feed' | 'story'>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const [copiedKind, setCopiedKind] = useState<null | 'link' | 'full'>(null);
  const [instagramGuide, setInstagramGuide] = useState<ShelterInstagramGuideState>(null);
  const copyResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const instagramCardUrlRef = useRef<string | null>(null);

  const cardLang = locale === 'be' ? 'be' : 'ru';

  const shareBundle: ShelterPetShareBundle = buildShelterPetShareBundle({
    petId: pet.id,
    title,
    animalLabel: t.pet.animalType[pet.animalType],
    breedParen: pet.breed?.trim()
      ? t.petDetail.shareBreedParen.replace('{breed}', pet.breed.trim())
      : '',
    city: pet.city?.trim() || '?',
    statusLabel: adoption,
    shelterName,
    description: pet.description?.trim() ?? '',
    headline: t.petDetail.shareShelterHeadline,
    lineTemplate: t.petDetail.shareShelterLine,
    shelterPrefix: t.petDetail.shareShelterShelterPrefix,
    moreOn: t.petDetail.shareShelterMoreOn,
    cta: t.petDetail.shareCta,
    origin: typeof window !== 'undefined' ? window.location.origin : '',
  });

  useEffect(() => {
    instagramCardUrlRef.current = instagramGuide?.cardUrl ?? null;
  }, [instagramGuide?.cardUrl]);

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current);
      const u = instagramCardUrlRef.current;
      if (u) URL.revokeObjectURL(u);
    };
  }, []);

  const resetCopiedKindLater = useCallback(() => {
    if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current);
    copyResetTimerRef.current = setTimeout(() => {
      copyResetTimerRef.current = null;
      setCopiedKind(null);
    }, 2500);
  }, []);

  const fetchCardBlob = async (format: 'feed' | 'story'): Promise<Blob | null> => {
    try {
      const url = `${API_V1_BASE}/pets/${pet.id}/social-card?format=${format}&lang=${cardLang}&contacts=1&_=${Date.now()}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return null;
      return await res.blob();
    } catch {
      return null;
    }
  };

  const handleCopyPostText = async () => {
    if (await copyToClipboard(shareBundle.textFull)) {
      toast.success(t.petDetail.shareCopiedFull);
      setCopiedKind('full');
      resetCopiedKindLater();
    } else toast.error(t.common.error);
    setShowShareMenu(false);
  };

  const handleCopyLinkOnly = async () => {
    if (await copyToClipboard(shareBundle.url)) {
      toast.success(t.petDetail.shareCopiedLink);
      setCopiedKind('link');
      resetCopiedKindLater();
    } else toast.error(t.common.error);
    setShowShareMenu(false);
  };

  const handleShareTelegram = () => {
    const u = `https://t.me/share/url?url=${encodeURIComponent(shareBundle.url)}&text=${encodeURIComponent(shareBundle.textForMessenger)}`;
    window.open(u, '_blank', 'noopener,noreferrer,width=600,height=520');
    setShowShareMenu(false);
  };

  const finishInstagramShare = async (variant: 'post' | 'story', openPath: string) => {
    setShowShareMenu(false);
    const cardFormat = variant === 'story' ? 'story' : 'feed';
    setCardLoading(cardFormat);
    const blob = await fetchCardBlob(cardFormat);
    setCardLoading(null);
    if (!blob) {
      toast.error(t.petDetail.shareCardError);
      return;
    }
    const shareBlob =
      (await compressImageBlobForShare(blob, {
        maxLongSide: variant === 'story' ? 1080 : 1080,
        maxSizeBytes: variant === 'story' ? 1_800_000 : 1_500_000,
      })) ?? blob;
    if (variant !== 'story') {
      void copyToClipboard(shareBundle.textFull);
    }
    const out = await tryShareImageFile(
      shareBlob,
      `dorogadomoy-${pet.id}-${cardFormat}.${shareBlob.type === 'image/jpeg' ? 'jpg' : 'png'}`,
      variant === 'story'
        ? {}
        : { text: shareBundle.textFull, url: shareBundle.url, title: shareBundle.vkTitle },
      { fileOnly: variant === 'story' },
    );
    if (out === 'shared') {
      toast.success(t.petDetail.shareInstagramSystemOk, {
        description: t.petDetail.shareInstagramSystemOkDesc,
        duration: 9000,
      });
      return;
    }
    if (out === 'aborted') return;
    const cardUrl = URL.createObjectURL(blob);
    setInstagramGuide((prev) => {
      if (prev?.cardUrl) URL.revokeObjectURL(prev.cardUrl);
      return { variant, openPath, cardUrl };
    });
  };

  const handleShareInstagramPost = () => void finishInstagramShare('post', '/');
  const handleShareInstagramStory = () => void finishInstagramShare('story', '/');

  const closeInstagramGuide = () => {
    if (instagramGuide?.cardUrl) URL.revokeObjectURL(instagramGuide.cardUrl);
    setInstagramGuide(null);
  };

  return {
    cardLoading,
    showShareMenu,
    setShowShareMenu,
    shareMenuRef,
    copiedKind,
    instagramGuide,
    shareBundle,
    handleCopyPostText,
    handleCopyLinkOnly,
    handleShareTelegram,
    handleShareInstagramPost,
    handleShareInstagramStory,
    closeInstagramGuide,
  };
}
