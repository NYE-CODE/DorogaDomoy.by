import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { AddEditPetContent } from "../components/add-edit-pet-page";

export default function AddEditPetPageRoute() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        <AddEditPetContent />
      </main>
      <Footer />
    </div>
  );
}
