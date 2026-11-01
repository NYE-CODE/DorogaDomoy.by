import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { Plus, QrCode, Edit, PawPrint, MoreVertical, AlertCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "../context/I18nContext";
import { profilePetsApi } from "../api/client";
import { profilePetToListCard, type ProfilePetListCard } from "../utils/profile-pet-display";
import { PageLoader } from "./ui/page-loader";
import { EmptyState } from "./ui/empty-state";
import { ConfirmDialog } from "./confirm-dialog";
import { PetMedallion } from "@/shared/ui/atoms";
import { cn } from "@/shared/lib/classNames";
import { pageContainer } from "@/shared/styles/layout-classes";
import { surfaceCtaPrimary, surfaceEmpty, surfacePanel } from "@/shared/styles/surface-classes";

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
    <div className="py-6 sm:py-8">
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
        confirmClass="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60"
        extra={
          <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              className="mt-1 size-4 shrink-0 rounded border-border accent-primary"
              checked={archiveLinkedAds}
              onChange={(e) => setArchiveLinkedAds(e.target.checked)}
              disabled={deleting}
            />
            <span>{mp.deletePetArchiveAds}</span>
          </label>
        }
      />

      <div className={cn(pageContainer, 'mx-auto px-4')}>
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="typo-h2 font-display text-foreground">{mp.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">{mp.subtitle}</p>
          </div>
          <Link to="/my-pets/add" className={cn(surfaceCtaPrimary, 'w-auto min-w-[10rem] px-7')}>
            <Plus size={20} aria-hidden />
            <span>{mp.addPet}</span>
          </Link>
        </div>

        {loadError ? (
          <EmptyState
            title={mp.loadErrorTitle}
            description={mp.loadErrorDesc}
            hint={loadError}
            tone="danger"
            icon={<AlertCircle className="size-7" aria-hidden />}
            className={cn(surfaceEmpty, 'w-full px-6 py-12')}
            action={
              <button type="button" onClick={loadPets} className={cn(surfaceCtaPrimary, 'w-auto px-7')}>
                {mp.retryLoad}
              </button>
            }
          />
        ) : pets.length === 0 ? (
          <EmptyState
            title={mp.emptyTitle}
            description={mp.emptyDesc}
            tone="brand"
            icon={<PawPrint className="size-7" aria-hidden />}
            className={cn(surfaceEmpty, 'w-full px-6 py-12 sm:py-16')}
            action={
              <Link to="/my-pets/add" className={cn(surfaceCtaPrimary, 'w-auto min-w-[12rem] px-7')}>
                <Plus size={18} aria-hidden />
                <span>{mp.addFirst}</span>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
    <div className={cn(surfacePanel, 'group relative transition-all hover:border-primary/35')}>
      <div className="absolute top-3 right-3 z-10 pet-card-menu">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpenMenuId(openMenuId === pet.id ? null : pet.id);
          }}
          className="rounded-full bg-card/90 p-2 shadow-sm backdrop-blur-sm transition-colors hover:bg-landing-muted"
          aria-expanded={openMenuId === pet.id}
          aria-label={labels.menuAria}
        >
          <MoreVertical size={18} className="text-muted-foreground" />
        </button>

        {openMenuId === pet.id && (
          <div className="absolute right-0 z-20 mt-1 w-52 rounded-2xl border border-border bg-card py-1 shadow-card">
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
