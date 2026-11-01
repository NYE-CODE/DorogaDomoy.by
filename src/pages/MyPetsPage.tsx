import '../../landing/styles/theme-scoped.css';
import { Header } from '@/widgets/layout/Header';
import { Footer } from '@/widgets/layout/Footer';
import { MyPetsContent } from '../../components/my-pets-page';
import { cn } from '@/shared/lib/classNames';
import { surfacePage } from '@/shared/styles/surface-classes';

export default function MyPetsPageRoute() {
  return (
    <div className={cn('landing-theme flex min-h-screen flex-col', surfacePage)}>
      <Header />
      <div className="flex-1">
        <MyPetsContent />
      </div>
      <Footer />
    </div>
  );
}
