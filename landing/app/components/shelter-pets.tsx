import { useEffect, useState } from "react";
import { Link } from "react-router";
import { MapPin } from "lucide-react";
import { loadCatalogShelterPets } from "../../../utils/shelter-pet-browse";
import { useI18n } from "../../../context/I18nContext";
import type { Pet } from "../../../types/pet";
import { FavoriteHeartButton } from "../../../components/favorite-heart-button";
import { trackYmGoal } from "../../../utils/ym";
import { cn } from "./ui/utils";
import { displayPhotoUrl } from "@/shared/lib/display-photo-url";
import { petScenarioPhotoPillClass } from "@/shared/lib/pet-scenario-colors";
import { LandingCta } from "./landing-cta";
import {
  landingContainerWide,
  landingH2,
  landingLead,
  landingMuted,
  landingPanel,
  landingSectionBase,
  landingSectionHeaderLeft,
  landingSectionY,
} from "./landing-section-styles";

const PREVIEW_COUNT = 4;
const DEFAULT_PHOTO =
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop";

function trackShelterPetsClick(action: "card_open" | "view_all", targetId?: string) {
  trackYmGoal("shelter_pets_click", {
    action,
    target_id: targetId ?? null,
  });
}

export function ShelterPets() {
  const { t } = useI18n();
  const copy = t.landing.shelterPets;
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    loadCatalogShelterPets()
      .then((list) => setPets(list.slice(0, PREVIEW_COUNT)))
      .catch(() => setPets([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="shelter-pets" className={cn(landingSectionBase, landingSectionY)}>
      <div className={landingContainerWide}>
        <div
          className={cn(
            landingSectionHeaderLeft,
            "flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-8",
          )}
        >
          <div className="min-w-0 max-w-2xl space-y-3">
            <h2 className={cn(landingH2, "mb-0 text-left")}>{copy.title}</h2>
            <p className={cn(landingLead, "text-left")}>{copy.subtitle}</p>
          </div>
          <LandingCta
            to="/shelters?tab=pets"
            variant="outlineForest"
            showArrow
            className="shrink-0 self-start"
            onClick={() => trackShelterPetsClick("view_all")}
          >
            {copy.viewAll}
          </LandingCta>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {loading ? (
            <div className="col-span-full py-12 text-center text-muted-foreground">{copy.loading}</div>
          ) : pets.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground">{copy.empty}</div>
          ) : (
            pets.map((pet) => {
              const name =
                pet.name?.trim() || pet.breed || t.pet.animalType[pet.animalType];
              const age = pet.approximateAge?.trim();
              const breed = pet.breed?.trim() || copy.breedDefault;
              const meta = [breed, age].filter(Boolean).join(" · ");
              const href = `/shelter-pet/${pet.id}`;
              const photo = pet.photos?.[0]
                ? displayPhotoUrl(pet.photos[0], 640)
                : DEFAULT_PHOTO;

              return (
                <div key={pet.id} className={cn(landingPanel, "group relative")}>
                  <Link
                    to={href}
                    onClick={() => trackShelterPetsClick("card_open", pet.id)}
                    className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <div className="relative overflow-hidden">
                      <img
                        src={photo}
                        alt={name}
                        className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        loading="lazy"
                        decoding="async"
                      />
                      {/* Приют: тонкий emerald-pill, без тяжёлого градиента поверх морды */}
                      <div className="absolute left-3 top-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-1 text-[0.65rem] font-semibold",
                            petScenarioPhotoPillClass.shelter,
                          )}
                        >
                          {copy.badge}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 md:p-5">
                      <h3 className="mb-1 line-clamp-1 font-display text-lg font-semibold leading-tight text-foreground sm:text-xl">
                        {name}
                      </h3>
                      <p className={cn(landingMuted, "mb-3 line-clamp-1")}>{meta}</p>
                      <div className="flex max-w-full items-center gap-1.5 self-start rounded-md bg-muted/70 px-2.5 py-1 text-xs text-muted-foreground">
                        <MapPin size={14} className="shrink-0" aria-hidden />
                        <span className="min-w-0 truncate">{pet.city || "—"}</span>
                      </div>
                    </div>
                  </Link>
                  <div className="pointer-events-none absolute left-0 right-0 top-0 z-[5] h-52">
                    <div className="pointer-events-auto absolute bottom-3 right-3 z-[6]">
                      <FavoriteHeartButton petId={pet.id} size="sm" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
