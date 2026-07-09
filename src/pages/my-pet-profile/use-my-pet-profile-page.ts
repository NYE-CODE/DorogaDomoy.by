import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useI18n } from '@/app/providers/I18nContext';
import { useAuth } from '@/app/providers/AuthContext';
import { profilePetsApi, partnersApi, type ProfilePetResponse, type Partner } from '@/shared/api/client';

export function useMyPetProfilePage() {
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
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('input, textarea, select, [contenteditable="true"]')) return;
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

  const pageLoading = authLoading || loading || !pet || !id;

  return {
    id: id!,
    navigate,
    t,
    locale,
    user,
    f,
    op,
    pp,
    pet: pet!,
    pageLoading,
    photoIndex,
    setPhotoIndex,
    goPrevPhoto,
    goNextPhoto,
    thumbRefs,
    qrWrapRef,
    publicPetUrl,
    publicPetQrUrl,
    downloadQrSvg,
    sharePublicLink,
    partnersModalOpen,
    setPartnersModalOpen,
    partnersLoading,
    partnersError,
    loadPartners,
    openPartnersModal,
    medallionPartners,
  };
}
