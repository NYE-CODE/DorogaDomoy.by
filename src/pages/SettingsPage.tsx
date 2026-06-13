import { Header } from '@/widgets/layout/Header';
import { Footer } from '@/widgets/layout/Footer';
import { SettingsContent } from '../../components/settings-page';

export default function SettingsPageRoute() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="flex-1">
        <SettingsContent />
      </div>

      <Footer />
    </div>
  );
}
