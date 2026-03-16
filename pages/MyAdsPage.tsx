import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { MyAdsPage as MyAdsList } from '../components/my-ads-page';
import { PetForm, PetFormData } from '../components/pet-form';
import { DeleteReasonModal } from '../components/delete-reason-modal';
import { ContactRequiredModal } from '../components/contact-required-modal';
import { AuthModal } from '../components/auth/AuthModal';
import { petsApi } from '../api/client';
import { Pet } from '../types/pet';
import { toast, Toaster } from 'sonner';

export default function MyAdsPageRoute() {
  const { user, isAuthenticated, openAuthModal, closeAuthModal, isLoading } = useAuth();
  const { theme } = useTheme();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [pets, setPets] = useState<Pet[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [deletingPet, setDeletingPet] = useState<Pet | null>(null);
  const [showContactRequiredModal, setShowContactRequiredModal] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      navigate('/', { replace: true });
      return;
    }

    setDataLoading(true);
    petsApi.list()
      .then(setPets)
      .catch(() => setPets([]))
      .finally(() => setDataLoading(false));
  }, [isLoading, isAuthenticated, navigate]);

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

  const handleUpdatePet = async (formData: PetFormData) => {
    if (!editingPet) return;
    try {
      const updatedPet = await petsApi.update(editingPet.id, {
        photos: formData.photos,
        animalType: formData.animalType,
        breed: formData.breed,
        colors: formData.colors,
        gender: formData.gender,
        approximateAge: formData.approximateAge,
        status: formData.status,
        description: formData.description,
        city: formData.city,
        location: formData.location,
        contacts: formData.contacts,
      });
      setPets((prev) => prev.map((p) => (p.id === editingPet.id ? updatedPet : p)));
      setEditingPet(null);
      setShowForm(false);
      if (updatedPet.moderationStatus === 'pending') {
        toast.success('Объявление обновлено и отправлено на модерацию');
      } else {
        toast.success(t.app.adUpdated);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.error);
    }
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
        onEditPet={(pet) => {
          setEditingPet(pet);
          setShowForm(true);
        }}
        onDeletePet={setDeletingPet}
      />

      {showForm && editingPet && (
        <PetForm
          onClose={() => {
            setShowForm(false);
            setEditingPet(null);
          }}
          onSubmit={handleUpdatePet}
          initialData={editingPet}
          isEditing
        />
      )}

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

      <Toaster position="top-center" richColors theme={theme} />
    </>
  );
}
