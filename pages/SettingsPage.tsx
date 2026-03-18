import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { SettingsContent } from '../components/settings-page';

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
