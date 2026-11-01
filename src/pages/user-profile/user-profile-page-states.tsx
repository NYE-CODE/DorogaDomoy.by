import { Link } from 'react-router';
import '../../../landing/styles/theme-scoped.css';
import { Header } from '@/widgets/layout/Header';
import { Footer } from '@/widgets/layout/Footer';
import { Button } from '@/shared/ui/button';
import { getHomePath } from '@/shared/lib/home-route';
import { cn } from '@/shared/lib/classNames';
import { surfaceCtaPrimary, surfacePage } from '@/shared/styles/surface-classes';

export function UserProfileLoadingView() {
  return (
    <div className={cn('landing-theme flex min-h-screen flex-col', surfacePage)}>
      <Header />
      <main className="flex flex-1 items-center justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
      </main>
      <Footer />
    </div>
  );
}

export interface UserProfileNotFoundViewProps {
  title: string;
  description: string;
  backLabel: string;
}

export function UserProfileNotFoundView({
  title,
  description,
  backLabel,
}: UserProfileNotFoundViewProps) {
  return (
    <div className={cn('landing-theme flex min-h-screen flex-col', surfacePage)}>
      <Header />
      <main className="flex flex-1 items-center justify-center py-12">
        <div className="text-center">
          <h1 className="font-display typo-h1 mb-2">{title}</h1>
          <p className="mb-6 text-muted-foreground">{description}</p>
          <Button className={surfaceCtaPrimary} asChild>
            <Link to={getHomePath()}>{backLabel}</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
