import { useEffect, useState } from "react";
import { loadCatalogShelterPets } from "../../../utils/shelter-pet-browse";
import { useI18n } from "../../../context/I18nContext";
import type { Pet } from "../../../types/pet";
import { LandingShelterPetCard } from "../../../components/landing-shelter-pet-card";
import { trackYmGoal } from "../../../utils/ym";
import { cn } from "./ui/utils";
import { LandingCta } from "./landing-cta";
import {
  landingContainerWide,
  landingH2,
  landingLead,
  landingSectionBase,
  landingSectionHeaderLeft,
  landingSectionY,
} from "./landing-section-styles";

const PREVIEW_COUNT = 4;

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
            pets.map((pet) => (
              <LandingShelterPetCard
                key={pet.id}
                pet={pet}
                to={`/shelter-pet/${pet.id}`}
                onNavigate={() => trackShelterPetsClick("card_open", pet.id)}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
