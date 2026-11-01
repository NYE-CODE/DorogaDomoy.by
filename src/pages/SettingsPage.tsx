import '../../landing/styles/theme-scoped.css';
import { Header } from '@/widgets/layout/Header';
import { Footer } from '@/widgets/layout/Footer';
import { SettingsContent } from '../../components/settings-page';
import { cn } from '@/shared/lib/classNames';
import { surfacePage } from '@/shared/styles/surface-classes';

export default function SettingsPageRoute() {
  return (
    <div className={cn('landing-theme flex min-h-screen flex-col', surfacePage)}>
      <Header />
      <div className="flex-1">
        <SettingsContent />
      </div>
      <Footer />
    </div>
  );
}
