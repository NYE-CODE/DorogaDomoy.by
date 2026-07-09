import type { ProfilePetResponse } from '@/shared/api/client';
import { genderLabel, temperamentLabel } from '@/shared/lib/profile-pet-text';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import {
  MY_PET_PROFILE_FIELD_CLASS,
  MY_PET_PROFILE_SECTION_TITLE_CLASS,
} from './my-pet-profile-display';

export interface MyPetProfileMainInfoCardProps {
  pet: ProfilePetResponse;
  f: Record<string, string>;
  op: Record<string, string>;
  ageDisplay: string;
  colorsLine: string;
}

export function MyPetProfileMainInfoCard({
  pet,
  f,
  op,
  ageDisplay,
  colorsLine,
}: MyPetProfileMainInfoCardProps) {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className={MY_PET_PROFILE_SECTION_TITLE_CLASS}>{op.mainInfoTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className={MY_PET_PROFILE_FIELD_CLASS}>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {f.labelGender}
            </dt>
            <dd className="mt-1.5 text-base font-medium text-foreground">
              {genderLabel(pet.gender, f)}
            </dd>
          </div>
          <div className={MY_PET_PROFILE_FIELD_CLASS}>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {f.labelAge}
            </dt>
            <dd className="mt-1.5 text-base font-medium text-foreground">{ageDisplay}</dd>
          </div>
          <div className={MY_PET_PROFILE_FIELD_CLASS}>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {f.labelColors}
            </dt>
            <dd className="mt-1.5 text-base font-medium text-foreground">{colorsLine}</dd>
          </div>
          <div className={MY_PET_PROFILE_FIELD_CLASS}>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {f.labelTemperament}
            </dt>
            <dd className="mt-1.5 text-base font-medium text-foreground">
              {temperamentLabel(pet.temperament, f)}
            </dd>
          </div>
          <div className={MY_PET_PROFILE_FIELD_CLASS}>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {f.labelChipped}
            </dt>
            <dd className="mt-1.5 text-base font-medium text-foreground">
              {pet.is_chipped && pet.chip_number?.trim()
                ? op.chipYesWithNumber.replace('{number}', pet.chip_number)
                : pet.is_chipped
                  ? f.yes
                  : f.no}
            </dd>
          </div>
          <div className={MY_PET_PROFILE_FIELD_CLASS}>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {f.labelRespondsToName}
            </dt>
            <dd className="mt-1.5 text-base font-medium text-foreground">
              {pet.responds_to_name ? f.yes : f.no}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
