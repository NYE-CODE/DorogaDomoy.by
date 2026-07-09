import type { ProfilePetResponse } from '@/shared/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { MY_PET_PROFILE_SECTION_TITLE_CLASS } from './my-pet-profile-display';

export interface MyPetProfileDetailSectionsProps {
  pet: ProfilePetResponse;
  f: Record<string, string>;
  op: Record<string, string>;
  addedAt: string;
}

export function MyPetProfileDetailSections({ pet, f, op, addedAt }: MyPetProfileDetailSectionsProps) {
  return (
    <>
      {pet.special_marks?.trim() ? (
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className={MY_PET_PROFILE_SECTION_TITLE_CLASS}>{op.specialMarksTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="leading-relaxed text-foreground/90">{pet.special_marks}</p>
          </CardContent>
        </Card>
      ) : null}

      {pet.medical_info?.trim() ? (
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className={MY_PET_PROFILE_SECTION_TITLE_CLASS}>{op.medicalTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="leading-relaxed text-foreground/90">{pet.medical_info}</p>
          </CardContent>
        </Card>
      ) : null}

      {pet.registration_authority?.trim() || pet.registration_token_number?.trim() ? (
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className={MY_PET_PROFILE_SECTION_TITLE_CLASS}>{op.registrationTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {pet.registration_authority?.trim() ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {op.registrationAuthority}
                </p>
                <p className="mt-1 leading-relaxed text-foreground/90">
                  {pet.registration_authority.trim()}
                </p>
              </div>
            ) : null}
            {pet.registration_token_number?.trim() ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {op.registrationToken}
                </p>
                <p className="mt-1 font-mono text-foreground/90">
                  {pet.registration_token_number.trim()}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className={MY_PET_PROFILE_SECTION_TITLE_CLASS}>{op.extraInfoTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {pet.favorite_treats?.trim() ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {f.labelTreats}
              </p>
              <p className="mt-1.5 leading-relaxed text-foreground/90">{pet.favorite_treats}</p>
            </div>
          ) : null}
          {pet.favorite_walks?.trim() ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {f.labelWalks}
              </p>
              <p className="mt-1.5 leading-relaxed text-foreground/90">{pet.favorite_walks}</p>
            </div>
          ) : null}
          <div className="border-t border-border/60 pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {op.dateAdded}
            </p>
            <p className="mt-1.5 font-medium text-foreground">{addedAt}</p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
