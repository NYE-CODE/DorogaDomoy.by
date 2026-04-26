import { MapPin, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Button } from "./ui/button";
import { petsApi } from "../../../api/client";
import { useI18n } from "../../../context/I18nContext";
import type { Pet } from "../../../types/pet";
import { formatRelativeTime, petStatusPhotoPillClass } from "../../../utils/pet-helpers";
import { getRewardBadgeMeta } from "../../../components/reward-badge";
import { FavoriteHeartButton } from "../../../components/favorite-heart-button";
import {
  landingContainerWide,
  landingH2,
  landingLeadCenter,
  landingPrimaryCtaClass,
  landingSectionHeader,
  landingSectionY,
} from "./landing-section-styles";

const DEFAULT_PHOTO = "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop";

export function Announcements() {
  const { t } = useI18n();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    petsApi
      .list({ moderation_status: "approved", is_archived: false })
      .then((list) => setPets(list.slice(0, 8)))
      .catch(() => setPets([]))
      .finally(() => setLoading(false));
  }, []);

  const animalTypeLabels = t.pet.animalType as Record<string, string>;
  const colorLabels = t.pet.color as Record<string, string>;

  const cards = pets.map((pet) => ({
    id: pet.id,
    type: pet.status === "searching" ? "lost" : "found",
    petType: animalTypeLabels[pet.animalType] ?? pet.animalType,
    breed: pet.breed || t.landing.announcements.breedDefault,
    color: pet.colors.length ? pet.colors.map((c) => colorLabels[c] ?? c).join(", ") : "—",
    location: pet.city,
    time: formatRelativeTime(pet.publishedAt),
    image: pet.photos[0] || DEFAULT_PHOTO,
    reward: getRewardBadgeMeta(pet),
  }));

  return (
    <section id="announcements" className={`${landingSectionY} bg-background scroll-mt-24`}>
      <div className={landingContainerWide}>
        <div className={landingSectionHeader}>
          <h2 className={landingH2}>{t.landing.announcements.title}</h2>
          <p className={landingLeadCenter}>{t.landing.announcements.subtitle}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 mb-10 md:mb-12">
          {loading ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">{t.landing.announcements.loading}</div>
          ) : cards.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">{t.landing.announcements.noAds}</div>
          ) : (
            cards.map((announcement) => (
              <div
                key={announcement.id}
                className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:border-primary/30"
              >
                <Link
                  to={`/pet/${announcement.id}`}
                  className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={announcement.image}
                      alt={announcement.petType}
                      className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          petStatusPhotoPillClass[announcement.type === "lost" ? "searching" : "found"]
                        }`}
                      >
                        {announcement.type === "lost" ? t.landing.announcements.lost : t.landing.announcements.found}
                      </span>
                      {announcement.reward && (
                        <span
                          title={announcement.reward.tooltip}
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm ${announcement.reward.className.replace(" dark:bg-violet-900/30", " dark:bg-violet-900/85").replace(" dark:bg-amber-900/35", " dark:bg-amber-900/85")}`}
                        >
                          {announcement.reward.text}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-4 md:p-5">
                    <h3 className="mb-1 text-lg font-semibold leading-tight text-foreground line-clamp-1">
                      {announcement.petType} {announcement.breed}
                    </h3>
                    <p className="mb-3 text-sm text-muted-foreground line-clamp-1">{announcement.color}</p>
                    <div className="flex flex-col gap-2">
                      <div className="flex max-w-full items-center gap-1.5 self-start rounded-md bg-muted/70 px-2.5 py-1 text-xs text-muted-foreground">
                        <MapPin size={14} className="shrink-0" aria-hidden />
                        <span className="min-w-0 truncate">{announcement.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5 self-start rounded-md bg-muted/70 px-2.5 py-1 text-xs text-muted-foreground">
                        <Clock size={14} className="shrink-0" aria-hidden />
                        <span>{announcement.time}</span>
                      </div>
                    </div>
                  </div>
                </Link>
                <div className="pointer-events-none absolute left-0 right-0 top-0 z-[5] h-52">
                  <div className="pointer-events-auto absolute bottom-3 right-3 z-[6]">
                    <FavoriteHeartButton petId={announcement.id} size="sm" className="!p-1.5" />
                  </div>
                </div>
              </div>
          )))}
        </div>

        <div className="text-center">
          <Button asChild>
            <Link to="/search" className={landingPrimaryCtaClass}>
              {t.landing.announcements.viewAll}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}