import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { MyPetsContent } from "../components/my-pets-page";

export default function MyPetsPageRoute() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="flex-1">
        <MyPetsContent />
      </div>

      <Footer />
    </div>
  );
}
