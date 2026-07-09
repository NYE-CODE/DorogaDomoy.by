import { PawPrint } from 'lucide-react';
import type { ProfilePetListCard } from '@/shared/lib/profile-pet-display';
import { cn } from '@/shared/ui/utils';
import { surfacePanelClass } from '@/shared/styles/surface-classes';
import { typoH3, typoH4 } from '@/shared/styles/typography-classes';

export interface UserProfilePetsSectionProps {
  title: string;
  emptyLabel: string;
  profilePets: ProfilePetListCard[];
}

export function UserProfilePetsSection({
  title,
  emptyLabel,
  profilePets,
}: UserProfilePetsSectionProps) {
  return (
    <div className={cn(surfacePanelClass, 'mb-6')}>
      <div className="border-b border-border px-6 py-4">
        <h2 className={typoH3}>{title}</h2>
      </div>
      <div className="p-4 sm:p-6">
        {profilePets.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">{emptyLabel}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {profilePets.map((pet) => (
              <div
                key={pet.id}
                className="group overflow-hidden rounded-md border border-border bg-white shadow-sm transition-all duration-300 hover:shadow-md dark:bg-card"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={pet.photo}
                    alt={pet.name}
                    className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-105 sm:h-40"
                  />
                  <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary-light">
                    <PawPrint size={14} className="text-black" strokeWidth={2} />
                  </div>
                </div>
                <div className="p-3">
                  <h3 className={cn(typoH4, 'mb-1 truncate')}>{pet.name}</h3>
                  <p className="truncate text-xs text-muted-foreground sm:text-sm">{pet.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
