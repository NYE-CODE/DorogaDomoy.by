import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { MyAdsPage as MyAdsList } from '../components/my-ads-page';
import { DeleteReasonModal } from '../components/delete-reason-modal';
import { ContactRequiredModal } from '../components/contact-required-modal';
import { AuthModal } from '../components/auth/AuthModal';
import { petsApi } from '../api/client';
import { Pet } from '../types/pet';
import { toast } from 'sonner';

export default function MyAdsPageRoute() {
  const { user, isAuthenticated, openAuthModal, closeAuthModal, isLoading } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const [pets, setPets] = useState<Pet[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [deletingPet, setDeletingPet] = useState<Pet | null>(null);
  const [showContactRequiredModal, setShowContactRequiredModal] = useState(false);

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
      navigate('/', { replace: true });
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
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-gray-900">
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

  const handleDeletePet = async (reason: string) => {
    if (!deletingPet) return;
    const archiveReasons = [
      'Питомец вернулся домой / найден хозяин',
      'Питомец пристроен в новую семью',
      'Питомец передан в приют',
    ];
    const isArchiveReason = archiveReasons.includes(reason);
    try {
      if (isArchiveReason) {
        const updated = await petsApi.update(deletingPet.id, {
          isArchived: true,
          archiveReason: reason,
        });
        setPets((prev) => prev.map((p) => (p.id === deletingPet.id ? updated : p)));
        toast.success('Объявление перемещено в архив', { description: reason });
      } else {
        await petsApi.delete(deletingPet.id);
        setPets((prev) => prev.filter((p) => p.id !== deletingPet.id));
        toast.success('Объявление удалено');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.error);
    }
    setDeletingPet(null);
  };

  return (
    <>
      <MyAdsList
        pets={pets}
        onBack={() => navigate('/search')}
        onCreateClick={handleCreateClick}
        onEditPet={(pet) => navigate(`/edit/${pet.id}`)}
        onDeletePet={setDeletingPet}
      />

      {deletingPet && (
        <DeleteReasonModal
          onClose={() => setDeletingPet(null)}
          onConfirm={handleDeletePet}
          petDescription={`${deletingPet.animalType === 'cat' ? 'Кот' : deletingPet.animalType === 'dog' ? 'Собака' : 'Животное'} ${deletingPet.breed ? '(' + deletingPet.breed + ')' : ''} - ${deletingPet.city}`}
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
