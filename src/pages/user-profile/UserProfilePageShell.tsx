import { Link } from 'react-router';
import { Header } from '@/widgets/layout/Header';
import { Footer } from '@/widgets/layout/Footer';
import { getHomePath } from '@/shared/lib/home-route';
import { UserProfileAdsSection } from './user-profile-ads-section';
import { UserProfileHeader } from './user-profile-header';
import { UserProfileLoadingView, UserProfileNotFoundView } from './user-profile-page-states';
import { UserProfilePetsSection } from './user-profile-pets-section';
import { resolveUserProfileAvatarUrl } from './user-profile-helpers';
import { useUserProfilePage } from './use-user-profile-page';

export default function UserProfilePage() {
  const p = useUserProfilePage();
  const up = p.t.userProfile as Record<string, string | undefined>;

  if (p.loading) {
    return <UserProfileLoadingView />;
  }

  if (p.error || !p.user) {
    return (
      <UserProfileNotFoundView
        title={up.notFound ?? 'Пользователь не найден'}
        description="К сожалению, профиль пользователя не существует."
        backLabel={up.toMain ?? 'На главную'}
      />
    );
  }

  const showAdminBlock =
    p.currentUser?.role === 'admin' && p.currentUser.id !== p.user.id;

  return (
    <div className="flex min-h-screen flex-col bg-muted/30 dark:bg-background">
      <Header />

      <main className="flex-1 py-6 sm:py-8">
        <div className="page-container">
          <UserProfileHeader
            user={p.user}
            avatarUrl={resolveUserProfileAvatarUrl(p.user.avatar)}
            t={p.t.userProfile}
            locale={p.locale}
            location={p.location}
            joinDate={p.joinDate}
            stats={p.stats}
            statHelperLabel={up.statHelper ?? 'Помог вернуть домой'}
            isCopied={p.isCopied}
            blocking={p.blocking}
            showAdminBlock={showAdminBlock}
            onToggleBlock={() => void p.handleToggleBlock()}
            onShare={() => void p.copyToClipboard()}
          />

          <UserProfilePetsSection
            title={p.t.userProfile.userPetsTitle}
            emptyLabel={p.t.userProfile.noUserPets}
            profilePets={p.profilePets}
          />

          <UserProfileAdsSection
            title={p.t.userProfile.activeAdsTitle}
            emptyLabel={up.noActiveAds ?? 'У этого пользователя пока нет объявлений'}
            activePets={p.activePets}
            locale={p.locale}
            petForm={p.t.petForm}
            petColors={p.t.pet.color}
            lostBadge={p.t.userProfile.lostBadge}
            foundBadge={p.t.userProfile.foundBadge}
          />

          <div className="mt-6 text-center">
            <Link
              to={getHomePath()}
              className="inline-flex items-center justify-center font-medium text-muted-foreground transition-colors hover:text-black dark:hover:text-white"
            >
              {p.t.userProfile.backHome}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
