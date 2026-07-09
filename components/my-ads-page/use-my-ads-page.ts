import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { sightingsApi } from '../../api/client';
import { LISTING_EXPIRED_ARCHIVE_REASON } from '@/shared/lib/listing-expiry';
import type { ModerationStatus, Pet } from '../types/pet';
import type { MyAdsPageProps } from './my-ads-types';
import { myAdsDateLocale } from './my-ads-helpers';

export function useMyAdsPage({
  pets,
  onEditPet,
  onDeletePet,
  onBoostPet,
  onRenewPet,
}: Pick<
  MyAdsPageProps,
  'pets' | 'onEditPet' | 'onDeletePet' | 'onBoostPet' | 'onRenewPet'
>) {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const dateLocale = myAdsDateLocale(locale);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [hoveredTooltipId, setHoveredTooltipId] = useState<string | null>(null);

  const myAds = useMemo(
    () =>
      pets.filter(
        (pet) =>
          user &&
          (pet.authorId === user.id ||
            (user.id === 'user-demo' && pet.authorId === 'current-user')) &&
          (!pet.isArchived || pet.archiveReason === LISTING_EXPIRED_ARCHIVE_REASON),
      ),
    [pets, user],
  );

  const [statusTab, setStatusTab] = useState<ModerationStatus>('approved');

  const filteredAds = useMemo(
    () => myAds.filter((p) => p.moderationStatus === statusTab),
    [myAds, statusTab],
  );

  const searchPetIds = useMemo(
    () =>
      pets
        .filter(
          (p) =>
            user &&
            (p.authorId === user.id ||
              (user.id === 'user-demo' && p.authorId === 'current-user')) &&
            !p.isArchived &&
            p.status === 'searching',
        )
        .map((p) => p.id),
    [pets, user],
  );

  const [sightingCounts, setSightingCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (searchPetIds.length === 0) return;
    sightingsApi
      .getCounts(searchPetIds)
      .then(setSightingCounts)
      .catch(() => setSightingCounts({}));
  }, [searchPetIds.join(',')]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-my-ads-menu]')) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  const publishedCount = myAds.filter((a) => a.moderationStatus === 'approved').length;
  const pendingCount = myAds.filter((a) => a.moderationStatus === 'pending').length;
  const rejectedCount = myAds.filter((a) => a.moderationStatus === 'rejected').length;
  const totalActive = publishedCount + pendingCount + rejectedCount;

  const handleEdit = (e: React.MouseEvent, pet: Pet) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(null);
    onEditPet(pet);
  };

  const handleDelete = (e: React.MouseEvent, pet: Pet) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(null);
    onDeletePet(pet);
  };

  const handleBoost = (e: React.MouseEvent, pet: Pet) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(null);
    onBoostPet(pet);
  };

  const handleRenew = (e: React.MouseEvent, pet: Pet) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(null);
    onRenewPet?.(pet);
  };

  return {
    t,
    dateLocale,
    myAds,
    statusTab,
    setStatusTab,
    filteredAds,
    sightingCounts,
    openMenuId,
    setOpenMenuId,
    hoveredTooltipId,
    setHoveredTooltipId,
    publishedCount,
    pendingCount,
    rejectedCount,
    totalActive,
    handleEdit,
    handleDelete,
    handleBoost,
    handleRenew,
    onRenewPet,
  };
}
