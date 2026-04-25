import { MapPin, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Button } from "./ui/button";
import { petsApi } from "../../../api/client";
import { useI18n } from "../../../context/I18nContext";
import type { Pet } from "../../../types/pet";
import { formatRelativeTime } from "../../../utils/pet-helpers";
import { getRewardBadgeMeta } from "../../../components/reward-badge";
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
    <section id="announcements" className={`${landingSectionY} bg-background`}>
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
              <Link
                key={announcement.id}
                to={`/pet/${announcement.id}`}
                className="group block overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:border-primary/30"
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
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm ${
                        announcement.type === "lost"
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {announcement.type === "lost" ? t.landing.announcements.lost : t.landing.announcements.found}
                    </span>
                    {announcement.reward && (
                      <span
                        title={announcement.reward.tooltip}
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm ${announcement.reward.className.replace(" dark:bg-violet-900/30", " dark:bg-violet-900/85").replace(" dark:bg-emerald-900/30", " dark:bg-emerald-900/85")}`}
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
                  <div className="space-y-2">
                    <div className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-muted/70 px-2.5 py-1 text-xs text-muted-foreground">
                      <MapPin size={14} className="shrink-0" />
                      <span className="truncate">{announcement.location}</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-md bg-muted/70 px-2.5 py-1 text-xs text-muted-foreground">
                      <Clock size={14} className="shrink-0" />
                      <span>{announcement.time}</span>
                    </div>
                  </div>
                </div>
              </Link>
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