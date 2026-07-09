import { useParams } from 'react-router';
import { useState, useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { User, useAuth } from '@/app/providers/AuthContext';
import { Pet } from '@/entities/pet/model/types';
import { usersApi, petsApi, profilePetsApi } from '@/shared/api/client';
import { useI18n } from '@/app/providers/I18nContext';
import { profilePetToListCard, type ProfilePetListCard } from '@/shared/lib/profile-pet-display';
import { copyText } from '@/shared/lib/copy-text';
import {
  applySeo,
  canonicalUrlFromPath,
  SEO_KEYWORDS,
  SEO_ROBOTS_PRIVATE,
  SEO_ROBOTS_PUBLIC,
  truncateMetaDescription,
} from '@/shared/lib/seo';
import { USER_PROFILE_ARCHIVE_SUCCESS_REASONS } from './user-profile-constants';
import {
  deriveUserProfileJoinDate,
  deriveUserProfileLocation,
  getUserProfileRoleName,
} from './user-profile-helpers';

export function useUserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useI18n();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [allPets, setAllPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [profilePets, setProfilePets] = useState<ProfilePetListCard[]>([]);
  const copyResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    setUser(null);

    Promise.all([
      usersApi.get(id).catch(() => null),
      petsApi.list({ author_id: id, limit: 500 }).catch(() => []),
    ])
      .then(([userData, petsData]) => {
        if (cancelled) return;
        setUser(userData);
        setAllPets(petsData);
        if (!userData) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const form = t.myPets.form;
    profilePetsApi
      .list({ owner_id: id })
      .then((arr) => {
        if (!cancelled) setProfilePets(arr.map((pet) => profilePetToListCard(pet, form)));
      })
      .catch(() => {
        if (!cancelled) setProfilePets([]);
      });
    return () => {
      cancelled = true;
    };
  }, [id, locale]);

  const stats = useMemo(() => {
    const active = allPets.filter((p) => !p.isArchived && p.moderationStatus === 'approved');
    const successful = allPets.filter(
      (p) =>
        p.isArchived &&
        p.archiveReason &&
        USER_PROFILE_ARCHIVE_SUCCESS_REASONS.includes(p.archiveReason),
    );
    return {
      total: allPets.length,
      active: active.length,
      successful: successful.length,
      pets: profilePets.length,
    };
  }, [allPets, profilePets]);

  const activePets = useMemo(
    () => allPets.filter((p) => !p.isArchived && p.moderationStatus === 'approved'),
    [allPets],
  );

  const location = useMemo(() => deriveUserProfileLocation(activePets), [activePets]);
  const joinDate = useMemo(() => deriveUserProfileJoinDate(allPets), [allPets]);

  useEffect(() => {
    if (loading || !id) return;
    if (error || !user) {
      applySeo({
        title: 'Пользователь не найден | DorogaDomoy.by',
        description:
          'Профиль не существует или недоступен. DorogaDomoy.by — экосистема помощи животным в Беларуси.',
        canonicalUrl: canonicalUrlFromPath(`/user/${id}`),
        robots: SEO_ROBOTS_PRIVATE,
        keywords: SEO_KEYWORDS,
      });
      return;
    }
    const role = getUserProfileRoleName(user.role, t.userProfile);
    const geo = location ?? '';
    applySeo({
      title: `${user.name} — ${role} | DorogaDomoy.by`,
      description: truncateMetaDescription(
        `Профиль ${user.name} (${role}) на DorogaDomoy.by. Экосистема помощи животным: поиск, приюты, поддержка.${geo ? ` ${geo}.` : ''}`,
      ),
      canonicalUrl: canonicalUrlFromPath(`/user/${user.id}`),
      robots: SEO_ROBOTS_PUBLIC,
      keywords: SEO_KEYWORDS,
    });
  }, [loading, error, user, id, t, location]);

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current);
    };
  }, []);

  const handleToggleBlock = async () => {
    if (!user || !currentUser || currentUser.role !== 'admin') return;
    const newBlocked = !user.isBlocked;
    if (newBlocked && !window.confirm(t.userProfile.blockConfirm)) return;
    setBlocking(true);
    try {
      const updated = await usersApi.update(user.id, { is_blocked: newBlocked });
      setUser(updated);
      toast.success(newBlocked ? t.userProfile.blockedSuccess : t.userProfile.unblockedSuccess);
    } catch {
      toast.error(t.common.error);
    } finally {
      setBlocking(false);
    }
  };

  const copyToClipboard = async () => {
    const url = window.location.href;
    if (await copyText(url)) {
      setIsCopied(true);
      if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current);
      copyResetTimerRef.current = setTimeout(() => {
        copyResetTimerRef.current = null;
        setIsCopied(false);
      }, 2000);
    }
  };

  return {
    t,
    locale,
    currentUser,
    user,
    loading,
    error,
    isCopied,
    blocking,
    profilePets,
    stats,
    activePets,
    location,
    joinDate,
    handleToggleBlock,
    copyToClipboard,
  };
}
