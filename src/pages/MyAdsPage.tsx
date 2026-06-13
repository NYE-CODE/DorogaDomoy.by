import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '@/app/providers/AuthContext';
import { useI18n } from '@/app/providers/I18nContext';
import { MyAdsPage as MyAdsList } from '../../components/my-ads-page';
import { DeleteReasonModal } from '../../components/delete-reason-modal';
import { ContactRequiredModal } from '../../components/contact-required-modal';
import { AuthModal } from '../../components/auth/AuthModal';
import { featureFlagsApi, instagramApi, petsApi } from '@/shared/api/client';
import { Pet } from '@/entities/pet/model/types';
import { toast } from 'sonner';
import { getHomePath } from '@/shared/lib/home-route';

export default function MyAdsPageRoute() {
  const { user, isAuthenticated, openAuthModal, closeAuthModal, isLoading } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const [pets, setPets] = useState<Pet[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [deletingPet, setDeletingPet] = useState<Pet | null>(null);
  const [showContactRequiredModal, setShowContactRequiredModal] = useState(false);
  const [instagramBoostEnabled, setInstagramBoostEnabled] = useState(true);

  useEffect(() => {
    featureFlagsApi
      .get()
      .then((ff) =>
        setInstagramBoostEnabled((ff.ff_instagram_boost_stories ?? 'true') === 'true')
      )
      .catch((e) => {
        console.warn("[featureFlags] my-ads", e);
      });
  }, []);

  useEffect(() => {
    if (isLoading) return;
    // Переход с /create после успешного создания — не редиректить на /
    const fromCreate = (location.state as { fromCreate?: boolean })?.fromCreate;
    if (fromCreate) {
      setDataLoading(true);
      if (!user?.id) {
        setDataLoading(false);
        return;
      }
      petsApi
        .list({ author_id: user.id })
        .then(setPets)
        .catch(() => setPets([]))
        .finally(() => setDataLoading(false));
      return;
    }
    if (!isAuthenticated) {
      navigate(getHomePath(), { replace: true });
      return;
    }

    if (!user?.id) {
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    petsApi
      .list({ author_id: user.id })
      .then(setPets)
      .catch(() => setPets([]))
      .finally(() => setDataLoading(false));
  }, [isLoading, isAuthenticated, navigate, location.state, user?.id]);

  if (isLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const handleCreateClick = () => {
    const hasContacts = user?.contacts?.phone || user?.contacts?.telegram || user?.contacts?.viber;
    if (!hasContacts) {
      setShowContactRequiredModal(true);
      return;
    }
    navigate('/create');
  };

  const handleDeletePet = async (payload: { reason: string; rewardHelperCode?: string }) => {
    if (!deletingPet) return;
    const reason = payload.reason;
    const archiveReasons = [
      t.deleteReason.reasons.returned,
      t.deleteReason.reasons.adopted,
      t.deleteReason.reasons.transferred,
    ];
    const isArchiveReason = archiveReasons.includes(reason);
    try {
      if (isArchiveReason) {
        const updated = await petsApi.update(deletingPet.id, {
          isArchived: true,
          archiveReason: reason,
          rewardHelperCode: payload.rewardHelperCode,
        });
        setPets((prev) => prev.map((p) => (p.id === deletingPet.id ? updated : p)));
        toast.success(t.common.toasts.adArchived, {
          description: payload.rewardHelperCode
            ? t.common.toasts.pointsAwardedToUser.replace('{code}', payload.rewardHelperCode)
            : reason,
        });
      } else {
        await petsApi.delete(deletingPet.id);
        setPets((prev) => prev.filter((p) => p.id !== deletingPet.id));
        toast.success(t.common.toasts.adDeleted);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.error);
    }
    setDeletingPet(null);
  };

  const handleBoostPet = async (pet: Pet) => {
    try {
      const eligibility = await instagramApi.boostEligibility(pet.id);
      if (!eligibility.eligible) {
        if (eligibility.reason === 'too_early') {
          toast.error(t.common.toasts.boostTooEarly);
          return;
        }
        if (eligibility.reason === 'limit_reached') {
          const next = eligibility.next_available_at
            ? new Date(eligibility.next_available_at).toLocaleString('ru-RU')
            : '';
          toast.error(
            next
              ? t.common.toasts.boostLimitUntil.replace('{date}', next)
              : t.common.toasts.boostLimitReached,
          );
          return;
        }
        if (eligibility.reason === 'route_missing') {
          toast.error(t.common.toasts.boostRouteMissing);
          return;
        }
        if (eligibility.reason === 'feature_disabled') {
          toast.error(t.common.toasts.boostFeatureDisabled);
          return;
        }
        toast.error(t.common.toasts.boostUnavailable);
        return;
      }
      await instagramApi.createBoostPublication(pet.id);
      toast.success(t.common.toasts.boostQueued);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.error);
    }
  };

  return (
    <>
      <MyAdsList
        pets={pets}
        onBack={() => navigate(getHomePath())}
        onCreateClick={handleCreateClick}
        onEditPet={(pet) => navigate(`/edit/${pet.id}`)}
        onDeletePet={setDeletingPet}
        instagramBoostEnabled={instagramBoostEnabled}
        onBoostPet={(pet) => {
          void handleBoostPet(pet);
        }}
      />

      {deletingPet && (
        <DeleteReasonModal
          onClose={() => setDeletingPet(null)}
          onConfirm={handleDeletePet}
          enableRewardSection={
            deletingPet.status === 'searching' && deletingPet.rewardMode === 'points'
          }
          rewardPoints={deletingPet.rewardPoints ?? 50}
          petDescription={`${deletingPet.animalType === 'cat' ? 'Кот' : deletingPet.animalType === 'dog' ? 'Собака' : 'Животное'} ${deletingPet.breed ? `(${deletingPet.breed})` : ''} - ${deletingPet.city}`}
        />
      )}

      <ContactRequiredModal
        open={showContactRequiredModal}
        onClose={() => setShowContactRequiredModal(false)}
        onGoToProfile={() => {
          setShowContactRequiredModal(false);
          navigate('/profile');
        }}
      />

      <AuthModal />
    </>
  );
}
