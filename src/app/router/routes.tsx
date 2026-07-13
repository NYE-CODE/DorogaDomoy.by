import { lazy } from 'react';
import { Route } from 'react-router';
import { RequireAdmin, RequireAuth, RequireVolunteer } from '@/app/router/guards';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const SearchPage = lazy(() => import('@/pages/SearchPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const PetDetailPage = lazy(() => import('@/pages/PetDetailPage'));
const ShelterPetDetailPage = lazy(() => import('@/pages/ShelterPetDetailPage'));
const UserProfilePage = lazy(() => import('@/pages/UserProfilePage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const MyAdsPageRoute = lazy(() => import('@/pages/MyAdsPage'));
const CreateAdPage = lazy(() => import('@/pages/CreateAdPage'));
const CreateAdSuccessPage = lazy(() => import('@/pages/CreateAdSuccessPage'));
const ReunionMatchPage = lazy(() => import('@/pages/ReunionMatchPage'));
const EditAdPage = lazy(() => import('@/pages/EditAdPage'));
const SettingsPageRoute = lazy(() => import('@/pages/SettingsPage'));
const MyPetsPageRoute = lazy(() => import('@/pages/MyPetsPage'));
const MyPetProfilePage = lazy(() => import('@/pages/MyPetProfilePage'));
const AddEditPetPageRoute = lazy(() => import('@/pages/AddEditPetPage'));
const PublicPetProfilePage = lazy(() => import('@/pages/PublicPetProfilePage'));
const TermsPage = lazy(() => import('@/pages/TermsPage'));
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage'));
const BlogListPage = lazy(() => import('@/pages/BlogListPage'));
const GuidesPage = lazy(() => import('@/pages/GuidesPage'));
const BlogPostPage = lazy(() => import('@/pages/BlogPostPage'));
const FavoritesPage = lazy(() => import('@/pages/FavoritesPage'));
const MatchQuizPage = lazy(() => import('@/pages/MatchQuizPage'));
const MatchSwipePage = lazy(() => import('@/pages/MatchSwipePage'));
const SheltersPage = lazy(() => import('@/pages/SheltersPage'));
const ShelterDetailPage = lazy(() => import('@/pages/ShelterDetailPage'));
const MySheltersPage = lazy(() => import('@/pages/MySheltersPage'));
const MyShelterFormPage = lazy(() => import('@/pages/MyShelterFormPage'));
const MyShelterPetsListPage = lazy(() => import('@/pages/MyShelterPetsListPage'));
const MyShelterPetFormPage = lazy(() => import('@/pages/MyShelterPetFormPage'));
const MyShelterPetCampaignPage = lazy(() => import('@/pages/MyShelterPetCampaignPage'));
const MyShelterTeamPage = lazy(() => import('@/pages/MyShelterTeamPage'));
const CompleteProfilePage = lazy(() => import('@/pages/CompleteProfilePage'));
const WelcomePetProfilePage = lazy(() => import('@/pages/WelcomePetProfilePage'));
const WelcomeShelterOrgPage = lazy(() => import('@/pages/WelcomeShelterOrgPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));

/** Все маршруты SPA — lazy-loaded страницы из слоя pages. */
export function AppRoutes() {
  return (
    <>
      <Route path="/" element={<LandingPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/favorites" element={<FavoritesPage />} />
      <Route path="/profile" element={<RequireAuth allowIncompleteProfile><ProfilePage /></RequireAuth>} />
      <Route path="/pet-profile/:id" element={<PublicPetProfilePage />} />
      <Route path="/my-pets/add" element={<RequireAuth><AddEditPetPageRoute /></RequireAuth>} />
      <Route path="/my-pets/:id/edit" element={<RequireAuth><AddEditPetPageRoute /></RequireAuth>} />
      <Route path="/my-pets/:id" element={<RequireAuth><MyPetProfilePage /></RequireAuth>} />
      <Route path="/my-pets" element={<RequireAuth><MyPetsPageRoute /></RequireAuth>} />
      <Route path="/pet/:sourceId/reunion/:matchId" element={<ReunionMatchPage />} />
      <Route path="/pet/:id" element={<PetDetailPage />} />
      <Route path="/shelter-pet/:id" element={<ShelterPetDetailPage />} />
      <Route path="/user/:id" element={<UserProfilePage />} />
      <Route path="/my-ads" element={<RequireAuth><MyAdsPageRoute /></RequireAuth>} />
      <Route path="/create" element={<RequireAuth><CreateAdPage /></RequireAuth>} />
      <Route path="/create/success/:id" element={<RequireAuth><CreateAdSuccessPage /></RequireAuth>} />
      <Route path="/edit/:id" element={<RequireAuth><EditAdPage /></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><SettingsPageRoute /></RequireAuth>} />
      <Route path="/admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/complete-profile"
        element={
          <RequireAuth allowIncompleteProfile>
            <CompleteProfilePage />
          </RequireAuth>
        }
      />
      <Route
        path="/welcome/pet-profile"
        element={
          <RequireAuth>
            <WelcomePetProfilePage />
          </RequireAuth>
        }
      />
      <Route
        path="/welcome/shelter-org"
        element={
          <RequireAuth>
            <RequireVolunteer>
              <WelcomeShelterOrgPage />
            </RequireVolunteer>
          </RequireAuth>
        }
      />
      <Route path="/blog" element={<BlogListPage />} />
      <Route path="/blog/:slug" element={<BlogPostPage />} />
      <Route path="/guides" element={<GuidesPage />} />
      <Route path="/shelters/:shelterId" element={<ShelterDetailPage />} />
      <Route path="/shelters" element={<SheltersPage />} />
      <Route path="/shelters/" element={<SheltersPage />} />
      <Route path="/match/quiz" element={<MatchQuizPage />} />
      <Route path="/match" element={<MatchSwipePage />} />
      <Route
        path="/my-shelters/:shelterId/pets"
        element={
          <RequireAuth>
            <RequireVolunteer>
              <MyShelterPetsListPage />
            </RequireVolunteer>
          </RequireAuth>
        }
      />
      <Route
        path="/my-shelters/:shelterId/pets/new"
        element={
          <RequireAuth>
            <RequireVolunteer>
              <MyShelterPetFormPage />
            </RequireVolunteer>
          </RequireAuth>
        }
      />
      <Route
        path="/my-shelters/:shelterId/pets/:petId/edit"
        element={
          <RequireAuth>
            <RequireVolunteer>
              <MyShelterPetFormPage />
            </RequireVolunteer>
          </RequireAuth>
        }
      />
      <Route
        path="/my-shelters/:shelterId/pets/:petId/campaign"
        element={
          <RequireAuth>
            <RequireVolunteer>
              <MyShelterPetCampaignPage />
            </RequireVolunteer>
          </RequireAuth>
        }
      />
      <Route
        path="/my-shelters/:shelterId/team"
        element={
          <RequireAuth>
            <MyShelterTeamPage />
          </RequireAuth>
        }
      />
      <Route
        path="/my-shelters/new"
        element={
          <RequireAuth>
            <RequireVolunteer>
              <MyShelterFormPage />
            </RequireVolunteer>
          </RequireAuth>
        }
      />
      <Route
        path="/my-shelters/edit/:shelterId"
        element={
          <RequireAuth>
            <RequireVolunteer>
              <MyShelterFormPage />
            </RequireVolunteer>
          </RequireAuth>
        }
      />
      <Route
        path="/my-shelters"
        element={
          <RequireAuth>
            <MySheltersPage />
          </RequireAuth>
        }
      />
      <Route
        path="/my-shelters/"
        element={
          <RequireAuth>
            <MySheltersPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </>
  );
}
