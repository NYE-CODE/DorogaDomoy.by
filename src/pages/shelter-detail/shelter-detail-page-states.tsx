import { Link } from 'react-router';
import { Building2 } from 'lucide-react';
import { BackQuickMenu } from '../../../components/navigation/BackQuickMenu';
import { PageLoader } from '@/shared/ui/page-loader';
import { Button } from '@/shared/ui/button';

export function ShelterDetailLoadingView() {
  return (
    <div className="page-container w-full pt-6 sm:pt-10">
      <div className="mb-6">
        <BackQuickMenu />
      </div>
      <PageLoader />
    </div>
  );
}

export interface ShelterDetailNotFoundViewProps {
  title: string;
  hint: string;
  backLabel: string;
}

export function ShelterDetailNotFoundView({
  title,
  hint,
  backLabel,
}: ShelterDetailNotFoundViewProps) {
  return (
    <div className="page-container w-full pt-6 sm:pt-10">
      <div className="mb-6">
        <BackQuickMenu />
      </div>
      <div className="space-y-3 rounded-md border border-border bg-muted/30 p-8 text-center">
        <Building2 className="mx-auto size-12 text-muted-foreground opacity-50" aria-hidden />
        <h1 className="typo-h1">{title}</h1>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">{hint}</p>
        <Button asChild className="mt-2 w-full sm:w-auto">
          <Link to="/shelters">{backLabel}</Link>
        </Button>
      </div>
    </div>
  );
}
