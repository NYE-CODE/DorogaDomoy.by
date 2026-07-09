import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { Plus, QrCode, Edit, PawPrint, MoreVertical, AlertCircle, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "../context/I18nContext";
import { profilePetsApi } from "../api/client";
import { profilePetToListCard, type ProfilePetListCard } from "../utils/profile-pet-display";
import { PageLoader } from "./ui/page-loader";
import { EmptyState } from "./ui/empty-state";
import { ConfirmDialog } from "./confirm-dialog";
import { Button } from "./ui/button";
import { PetMedallion } from "@/shared/ui/atoms";
import { appPrimaryCtaClass } from "@/shared/styles/cta-classes";

export function MyPetsContent() {
  const { t } = useI18n();
  const mp = t.myPets;
  const [pets, setPets] = useState<ProfilePetListCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProfilePetListCard | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [archiveLinkedAds, setArchiveLinkedAds] = useState(false);

  const loadPets = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    profilePetsApi
      .my()
      .then((arr) => setPets(arr.map((pet) => profilePetToListCard(pet, mp.form))))
      .catch((error) => {
        setPets([]);
        setLoadError(error instanceof Error ? error.message : mp.loadErrorDesc);
      })
      .finally(() => setLoading(false));
  }, [mp.form, mp.loadErrorDesc]);

  useEffect(() => {
    loadPets();
  }, [loadPets]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".pet-card-menu")) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [openMenuId]);

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await profilePetsApi.delete(deleteTarget.id, { archiveLinkedAds });
      setPets((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast.success(
        archiveLinkedAds ? mp.toastPetDeletedWithAds : mp.toastPetDeleted,
      );
      setDeleteTarget(null);
      setArchiveLinkedAds(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : mp.toastPetDeleteError);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <PageLoader label={t.common.loading} />;
  }

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background py-4 sm:py-8">
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setDeleteTarget(null);
            setArchiveLinkedAds(false);
          }
        }}
        title={mp.deletePetTitle}
        description={deleteTarget ? mp.deletePetMessage.replace("{name}", deleteTarget.name) : ""}
        onConfirm={() => {
          void confirmDelete();
        }}
        cancelText={t.common.cancel}
        confirmText={deleting ? t.common.loading : mp.deletePetConfirm}
        confirmClass="bg-red-600 hover:bg-red-700 text-white disabled:opacity-60"
        extra={
          <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              className="mt-1 size-4 shrink-0 rounded border-border"
              checked={archiveLinkedAds}
              onChange={(e) => setArchiveLinkedAds(e.target.checked)}
              disabled={deleting}
            />
            <span>{mp.deletePetArchiveAds}</span>
          </label>
        }
      />

      <div className="page-container">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 page-header-block">
          <div>
            <h1 className="typo-h1 mb-2">{mp.title}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">{mp.subtitle}</p>
          </div>
          <Button className={appPrimaryCtaClass} asChild>
            <Link to="/my-pets/add">
              <Plus size={20} />
              <span>{mp.addPet}</span>
            </Link>
          </Button>
        </div>

        {loadError ? (
          <EmptyState
            title={mp.loadErrorTitle}
            description={mp.loadErrorDesc}
            hint={loadError}
            tone="danger"
            icon={<AlertCircle size={32} />}
            action={
              <Button onClick={loadPets}>
                {mp.retryLoad}
              </Button>
            }
          />
        ) : pets.length === 0 ? (
          <EmptyState
            title={mp.emptyTitle}
            description={mp.emptyDesc}
            icon={<PawPrint size={32} />}
            action={
              <Button asChild>
                <Link to="/my-pets/add">
                  <Plus size={18} />
                  <span>{mp.addFirst}</span>
                </Link>
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pets.map((pet) => (
              <PetCard
                key={pet.id}
                pet={pet}
                openMenuId={openMenuId}
                setOpenMenuId={setOpenMenuId}
                onRequestDelete={(p) => setDeleteTarget(p)}
                labels={{
                  menuQr: mp.menuQr,
                  menuEdit: mp.menuEdit,
                  menuCreateAd: mp.menuCreateAd,
                  menuDelete: mp.menuDelete,
                  menuAria: mp.cardMenuAria,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PetCard({
  pet,
  openMenuId,
  setOpenMenuId,
  onRequestDelete,
  labels,
}: {
  pet: ProfilePetListCard;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  onRequestDelete: (pet: ProfilePetListCard) => void;
  labels: {
    menuQr: string;
    menuEdit: string;
    menuCreateAd: string;
    menuDelete: string;
    menuAria: string;
  };
}) {
  return (
    <div className="bg-white dark:bg-card rounded-lg shadow-sm hover:shadow-md transition-all border border-border overflow-hidden group relative">
      <div className="absolute top-3 right-3 z-10 pet-card-menu">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpenMenuId(openMenuId === pet.id ? null : pet.id);
          }}
          className="p-2 bg-white/90 dark:bg-card/90 backdrop-blur-sm hover:bg-white dark:hover:bg-card rounded-lg transition-colors shadow-sm"
          aria-expanded={openMenuId === pet.id}
          aria-label={labels.menuAria}
        >
          <MoreVertical size={18} className="text-muted-foreground" />
        </button>

        {openMenuId === pet.id && (
          <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-card rounded-lg shadow-lg border border-border py-1 z-20">
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-sm text-left"
              onClick={() => {
                setOpenMenuId(null);
                window.open(`/pet-profile/${encodeURIComponent(pet.id)}`, "_blank", "noopener,noreferrer");
              }}
            >
              <QrCode size={16} className="text-muted-foreground shrink-0" />
              <span className="text-foreground/90 dark:text-foreground">{labels.menuQr}</span>
            </button>
            <Link
              to={`/my-pets/${pet.id}/edit`}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-sm"
              onClick={() => setOpenMenuId(null)}
            >
              <Edit size={16} className="text-muted-foreground" />
              <span className="text-foreground/90 dark:text-foreground">{labels.menuEdit}</span>
            </Link>
            <Link
              to={`/create?petId=${encodeURIComponent(pet.id)}`}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-sm"
              onClick={() => setOpenMenuId(null)}
            >
              <AlertCircle size={16} className="text-muted-foreground" />
              <span className="text-foreground/90 dark:text-foreground">{labels.menuCreateAd}</span>
            </Link>
            <div className="border-t border-border/60 mt-1 pt-1">
              <button
                type="button"
                className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-sm text-left text-red-600 dark:text-red-400"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpenMenuId(null);
                  onRequestDelete(pet);
                }}
              >
                <Trash2 size={16} className="shrink-0" />
                <span>{labels.menuDelete}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <Link to={`/my-pets/${pet.id}`}>
        {/* Адресник-регистр: питомец — медальон на латунной подложке */}
        <div className="flex items-center justify-center bg-medallion-soft/70 dark:bg-background pt-9 pb-6 transition-colors group-hover:bg-medallion-soft dark:group-hover:bg-muted/40">
          <PetMedallion
            src={pet.photo || undefined}
            alt={pet.name}
            register="medallion"
            size="xl"
            withEar
            className="transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>

        <div className="p-4 text-center">
          <h3 className="typo-h4 mb-0.5 transition-colors">{pet.name}</h3>
          <p className="text-sm text-muted-foreground">
            {pet.subtitle}
          </p>
        </div>
      </Link>
    </div>
  );
}
