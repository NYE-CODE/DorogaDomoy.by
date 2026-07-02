import { Header } from "@/widgets/layout/Header";
import { Footer } from "@/widgets/layout/Footer";
import { MyPetsContent } from "../../components/my-pets-page";

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
