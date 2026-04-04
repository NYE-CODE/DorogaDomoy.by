import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { Plus, QrCode, Edit, PawPrint, MoreVertical, AlertCircle } from "lucide-react";
import { useI18n } from "../context/I18nContext";
import { profilePetsApi } from "../api/client";
import { profilePetToListCard, type ProfilePetListCard } from "../utils/profile-pet-display";

export function MyPetsContent() {
  const { t } = useI18n();
  const mp = t.myPets;
  const [pets, setPets] = useState<ProfilePetListCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-[#FF9800]/30 border-t-[#FF9800] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">{mp.title}</h1>
            <p className="text-sm sm:text-base text-gray-600">{mp.subtitle}</p>
          </div>
          <Link
            to="/my-pets/add"
            className="bg-[#FF9800] text-white hover:bg-[#F57C00] rounded-lg px-6 h-12 flex items-center gap-2 text-lg transition-colors whitespace-nowrap shadow-sm"
          >
            <Plus size={20} />
            <span>{mp.addPet}</span>
          </Link>
        </div>

        {loadError ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={40} className="text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{mp.loadErrorTitle}</h2>
            <p className="text-gray-600 mb-3 max-w-md mx-auto">{mp.loadErrorDesc}</p>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">{loadError}</p>
            <button
              type="button"
              onClick={loadPets}
              className="inline-flex items-center gap-2 bg-[#FF9800] text-white hover:bg-[#F57C00] rounded-lg px-6 h-12 text-lg transition-colors"
            >
              <span>{mp.retryLoad}</span>
            </button>
          </div>
        ) : pets.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <PawPrint size={40} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{mp.emptyTitle}</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">{mp.emptyDesc}</p>
            <Link
              to="/my-pets/add"
              className="inline-flex items-center gap-2 bg-[#FF9800] text-white hover:bg-[#F57C00] rounded-lg px-6 h-12 text-lg transition-colors"
            >
              <Plus size={20} />
              <span>{mp.addFirst}</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pets.map((pet) => (
              <PetCard
                key={pet.id}
                pet={pet}
                openMenuId={openMenuId}
                setOpenMenuId={setOpenMenuId}
                labels={{
                  menuQr: mp.menuQr,
                  menuEdit: mp.menuEdit,
                  menuCreateAd: mp.menuCreateAd,
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
  labels,
}: {
  pet: ProfilePetListCard;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  labels: { menuQr: string; menuEdit: string; menuCreateAd: string; menuAria: string };
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-200 overflow-hidden group relative">
      <div className="absolute top-3 right-3 z-10 pet-card-menu">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpenMenuId(openMenuId === pet.id ? null : pet.id);
          }}
          className="p-2 bg-white/90 backdrop-blur-sm hover:bg-white rounded-lg transition-colors shadow-sm"
          aria-expanded={openMenuId === pet.id}
          aria-label={labels.menuAria}
        >
          <MoreVertical size={18} className="text-gray-600" />
        </button>

        {openMenuId === pet.id && (
          <div className="absolute right-0 mt-1 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm text-left"
              onClick={() => {
                setOpenMenuId(null);
                window.open(`/pet-profile/${encodeURIComponent(pet.id)}`, "_blank", "noopener,noreferrer");
              }}
            >
              <QrCode size={16} className="text-gray-600 shrink-0" />
              <span className="text-gray-700">{labels.menuQr}</span>
            </button>
            <Link
              to={`/my-pets/${pet.id}/edit`}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm"
              onClick={() => setOpenMenuId(null)}
            >
              <Edit size={16} className="text-gray-600" />
              <span className="text-gray-700">{labels.menuEdit}</span>
            </Link>
            <Link
              to={`/create?petId=${encodeURIComponent(pet.id)}`}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm"
              onClick={() => setOpenMenuId(null)}
            >
              <AlertCircle size={16} className="text-gray-600" />
              <span className="text-gray-700">{labels.menuCreateAd}</span>
            </Link>
          </div>
        )}
      </div>

      <Link to={`/my-pets/${pet.id}`}>
        <div className="aspect-square overflow-hidden bg-gray-100 relative">
          {pet.photo ? (
            <img
              src={pet.photo}
              alt={pet.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              width={400}
              height={400}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <PawPrint size={48} className="text-gray-300" />
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="text-xl font-bold text-gray-900 mb-0.5 transition-colors">{pet.name}</h3>
          <p className="text-sm text-gray-500">
            {pet.subtitle}
          </p>
        </div>
      </Link>
    </div>
  );
}
