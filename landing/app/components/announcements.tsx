import { MapPin, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Button } from "./ui/button";
import { petsApi } from "../../../api/client";
import { useI18n } from "../../../context/I18nContext";
import type { Pet } from "../../../types/pet";
import { formatRelativeTime } from "../../../utils/pet-helpers";

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
  }));

  return (
    <section id="announcements" className="py-20 md:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            {t.landing.announcements.title}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t.landing.announcements.subtitle}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {loading ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">{t.landing.announcements.loading}</div>
          ) : cards.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">{t.landing.announcements.noAds}</div>
          ) : (
            cards.map((announcement) => (
              <Link
                key={announcement.id}
                to={`/pet/${announcement.id}`}
                className="bg-card rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group block"
              >
              <div className="relative overflow-hidden">
                <img
                  src={announcement.image}
                  alt={announcement.petType}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className={`absolute top-4 right-4 px-4 py-2 rounded-full font-bold ${
                  announcement.type === "lost" 
                    ? "bg-secondary text-secondary-foreground" 
                    : "bg-primary text-primary-foreground"
                }`}>
                  {announcement.type === "lost" ? t.landing.announcements.lost : t.landing.announcements.found}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-2">{announcement.petType} {announcement.breed}</h3>
                <p className="text-muted-foreground mb-4">{announcement.color}</p>
                <div className="flex items-center gap-2 text-muted-foreground mb-2 text-sm">
                  <MapPin size={16} />
                  <span>{announcement.location}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Clock size={16} />
                  <span>{announcement.time}</span>
                </div>
              </div>
            </Link>
          )))}
        </div>

        <div className="text-center">
          <Button asChild>
            <Link to="/search" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-10 py-6 text-lg shadow-lg inline-flex items-center justify-center">
              {t.landing.announcements.viewAll}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}