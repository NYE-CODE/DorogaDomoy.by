import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "./ui/button";
import { loadCatalogShelterPets } from "../../../utils/shelter-pet-browse";
import { useI18n } from "../../../context/I18nContext";
import type { Pet } from "../../../types/pet";
import { ShelterPetCard } from "../../../components/shelter-pet-card";
import { trackYmGoal } from "../../../utils/ym";
import {
  landingBandMuted,
  landingContainerWide,
  landingH2,
  landingLeadCenter,
  landingPrimaryCtaClass,
  landingSectionHeader,
  landingSectionY,
} from "./landing-section-styles";

const PREVIEW_COUNT = 8;

function trackShelterPetsClick(action: "card_open" | "view_all", targetId?: string) {
  trackYmGoal("shelter_pets_click", {
    action,
    target_id: targetId ?? null,
  });
}

export function ShelterPets() {
  const { t } = useI18n();
  const navigate = useNavigate();
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
    <section id="shelter-pets" className={`${landingSectionY} ${landingBandMuted} scroll-mt-24`}>
      <div className={landingContainerWide}>
        <div className={landingSectionHeader}>
          <h2 className={landingH2}>{copy.title}</h2>
          <p className={landingLeadCenter}>{copy.subtitle}</p>
        </div>

        <div className="mb-10 md:mb-12">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">{copy.loading}</div>
          ) : pets.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">{copy.empty}</div>
          ) : (
            <ul className="grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {pets.map((pet) => (
                <li key={pet.id} className="h-full">
                  <ShelterPetCard
                    pet={pet}
                    onClick={() => {
                      trackShelterPetsClick("card_open", pet.id);
                      navigate(`/shelter-pet/${pet.id}`);
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="text-center">
          <Button asChild>
            <Link
              to="/shelters?tab=pets"
              className={landingPrimaryCtaClass}
              onClick={() => trackShelterPetsClick("view_all")}
            >
              {copy.viewAll}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
