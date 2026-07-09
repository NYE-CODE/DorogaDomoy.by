import { useEffect, useState } from 'react';
import type { ReadonlyURLSearchParams } from 'react-router';
import { campaignsApi, petsApi, sheltersApi, type ShelterCampaignResponse, type ShelterResponse } from '@/shared/api/client';
import type { Pet } from '@/entities/pet/model/types';
import { applySeo, canonicalUrlFromPath, SEO_KEYWORDS } from '@/shared/lib/seo';
import {
  browseSearchFromParams,
  parseBrowseContext,
  resolveShelterPetBrowseIds,
} from '@/shared/lib/shelter-pet-browse';
import { useShelterPetBrowse } from '@/app/providers/ShelterPetBrowseContext';
import type { ShelterPetDetailT } from './shelter-pet-detail-glyphs';
import { getShelterPetAdoptionLabel } from './shelter-pet-detail-glyphs';

export function useShelterPetDetailData(
  id: string | undefined,
  searchParams: ReadonlyURLSearchParams,
  t: ShelterPetDetailT,
) {
  const browseQueryKey = searchParams.toString();
  const { setBrowseNav, goPrev, goNext } = useShelterPetBrowse();
  const [loading, setLoading] = useState(true);
  const [pet, setPet] = useState<Pet | null>(null);
  const [shelter, setShelter] = useState<ShelterResponse | null>(null);
  const [campaigns, setCampaigns] = useState<ShelterCampaignResponse[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isLg, setIsLg] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => setIsLg(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!id) return;

    const ctx = parseBrowseContext(searchParams);
    const needsPetForFallback = !ctx;
    if (needsPetForFallback && (!pet || pet.id !== id)) return;

    const browseQuery = browseSearchFromParams(searchParams);
    setBrowseNav({ petIds: [], currentId: id, browseQuery, loading: true });

    let cancelled = false;
    const shelterFallback = ctx?.source === 'shelter' ? ctx.shelterId : pet?.shelterId;

    void resolveShelterPetBrowseIds(ctx, shelterFallback)
      .then((petIds) => {
        if (cancelled) return;
        let ids = petIds.length > 0 ? petIds : [id];
        if (!ids.includes(id)) ids = [id, ...ids];
        setBrowseNav({ petIds: ids, currentId: id, browseQuery, loading: false });
      })
      .catch(() => {
        if (cancelled) return;
        setBrowseNav({ petIds: [id], currentId: id, browseQuery, loading: false });
      });

    return () => {
      cancelled = true;
      setBrowseNav(null);
    };
  }, [id, pet, browseQueryKey, searchParams, setBrowseNav]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goPrev, goNext]);

  useEffect(() => {
    if (!id) return;
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    setShelter(null);
    petsApi
      .get(id, { signal: ac.signal })
      .then(async (row) => {
        if (ac.signal.aborted) return;
        let nextPet = row;
        if (row.shelterId) {
          try {
            const org = await sheltersApi.get(row.shelterId);
            if (!ac.signal.aborted) setShelter(org);
            const shelterPets = await sheltersApi.listPets(row.shelterId, { is_archived: false, limit: 300 });
            const exact = shelterPets.find((p) => p.id === row.id);
            if (exact) {
              petsApi.get(id, { signal: ac.signal });
              nextPet = {
                ...row,
                name: exact.name?.trim() || row.name,
                colors: exact.colors?.length ? exact.colors : row.colors,
                healthStatus: exact.healthStatus ?? row.healthStatus,
                coatType: exact.coatType ?? row.coatType,
                energyLevel: exact.energyLevel ?? row.energyLevel,
                friendlinessLevel: exact.friendlinessLevel ?? row.friendlinessLevel,
                trainingLevel: exact.trainingLevel ?? row.trainingLevel,
                independenceLevel: exact.independenceLevel ?? row.independenceLevel,
                goodWithKids: exact.goodWithKids ?? row.goodWithKids,
                goodWithDogs: exact.goodWithDogs ?? row.goodWithDogs,
                goodWithCats: exact.goodWithCats ?? row.goodWithCats,
              };
            }
          } catch {
            if (!ac.signal.aborted) setShelter(null);
          }
        }
        if (!ac.signal.aborted) setPet(nextPet);
      })
      .catch((e: unknown) => {
        if (ac.signal.aborted) return;
        setError(e instanceof Error ? e.message : t.common.error);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
  }, [id, t.common.error]);

  useEffect(() => {
    if (!pet) return;
    const adoptionSeo = getShelterPetAdoptionLabel(pet, t);
    const title = `${pet.name?.trim() || pet.breed || t.pet.animalType[pet.animalType]} — ищет дом`;
    const description = `${adoptionSeo} · ${pet.city}. Узнайте больше о питомце на DorogaDomoy.by`;
    applySeo({
      title,
      description,
      canonicalUrl: canonicalUrlFromPath(`/shelter-pet/${pet.id}`),
      keywords: SEO_KEYWORDS,
    });
  }, [pet, t]);

  useEffect(() => {
    setPhotoIndex(0);
  }, [pet?.id]);

  useEffect(() => {
    if (!id) return;
    const ac = new AbortController();
    setCampaignsLoading(true);
    campaignsApi
      .listByPet(id)
      .then((rows) => {
        if (ac.signal.aborted) return;
        setCampaigns(rows);
      })
      .catch(() => {
        if (ac.signal.aborted) return;
        setCampaigns([]);
      })
      .finally(() => {
        if (!ac.signal.aborted) setCampaignsLoading(false);
      });
    return () => ac.abort();
  }, [id]);

  return {
    loading,
    pet,
    shelter,
    campaigns,
    campaignsLoading,
    error,
    photoIndex,
    setPhotoIndex,
    isLg,
  };
}
