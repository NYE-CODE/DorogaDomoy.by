import { Header } from '@/widgets/layout/Header';
import { Footer } from '@/widgets/layout/Footer';
import { AddEditPetContent } from '../../components/add-edit-pet-page';

export default function AddEditPetPageRoute() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header showHomeModeToggle={false} />
      <main className="flex-1">
        <AddEditPetContent />
      </main>
      <Footer />
    </div>
  );
}
