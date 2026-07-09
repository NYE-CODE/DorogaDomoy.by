import { AdminBlogCategoriesPanel } from '../admin-blog-categories-panel';
import { AdminBlogPanel } from '../admin-blog-panel';
import { AdminDashboardPanel } from '../admin-dashboard-panel';
import { AdminFaqPanel } from '../admin-faq-panel';
import { AdminFeatureFlagsPanel } from '../admin-feature-flags-panel';
import { AdminGuidesPanel } from '../admin-guides-panel';
import { AdminHelpSectionPanel } from '../admin-help-section-panel';
import { AdminInstagramPanel } from '../admin-instagram-panel';
import { AdminMediaPanel } from '../admin-media-panel';
import { AdminPartnersPanel } from '../admin-partners-panel';
import { AdminReportsPanel } from '../admin-reports-panel';
import { AdminRewardsPanel } from '../admin-rewards-panel';
import { AdminSettingsPanel } from '../admin-settings-panel';
import { AdminSheltersCatalogPanel } from '../admin-shelters-catalog-panel';
import { AdminSheltersModerationPanel } from '../admin-shelters-moderation-panel';
import { AdminTelegramBlogPanel } from '../admin-telegram-blog-panel';
import { AdminUsersPanel } from '../admin-users-panel';
import { ModerationPanel } from '../moderation-panel';
import { PetsAdminPanel } from '../pets-admin-panel';
import { ProfilePetsAdminPanel } from '../profile-pets-admin-panel';
import type { AdminTab } from '../admin-panel-nav';
import type { Pet } from '../../types/pet';
import type { AdminStats } from '../../types/admin';
import type { PointsTransactionItem } from '../../api/client';
import type { AdminPanelProps } from './admin-panel-types';

type AdminPanelTabContentProps = Pick<
  AdminPanelProps,
  | 'pets'
  | 'users'
  | 'reports'
  | 'mediaArticles'
  | 'partners'
  | 'profilePets'
  | 'blogPosts'
  | 'faqItems'
  | 'onUpdatePet'
  | 'onDeletePet'
  | 'onUpdateUser'
  | 'onDeleteUser'
  | 'onUpdateReport'
  | 'onDeleteReport'
  | 'onMediaCreate'
  | 'onMediaUpdate'
  | 'onMediaDelete'
  | 'onPartnerCreate'
  | 'onPartnerUpdate'
  | 'onPartnerDelete'
  | 'onDeleteProfilePet'
  | 'onBlogCreate'
  | 'onBlogUpdate'
  | 'onBlogDelete'
  | 'onBlogSendTelegram'
  | 'onFaqCreate'
  | 'onFaqUpdate'
  | 'onFaqDelete'
> & {
  activeTab: AdminTab;
  stats: AdminStats;
  pointsTransactions: PointsTransactionItem[];
  onSelectTab: (tab: AdminTab) => void;
  onRefreshShelterPendingCount: () => void;
  onShelterPendingCountChange: (count: number) => void;
  onRefreshPointsTransactions: () => void;
};

export function AdminPanelTabContent({
  activeTab,
  stats,
  pets,
  users,
  reports,
  mediaArticles,
  partners,
  profilePets,
  blogPosts,
  faqItems,
  pointsTransactions,
  onSelectTab,
  onUpdatePet,
  onDeletePet,
  onUpdateUser,
  onDeleteUser,
  onUpdateReport,
  onDeleteReport,
  onMediaCreate,
  onMediaUpdate,
  onMediaDelete,
  onPartnerCreate,
  onPartnerUpdate,
  onPartnerDelete,
  onDeleteProfilePet,
  onBlogCreate,
  onBlogUpdate,
  onBlogDelete,
  onBlogSendTelegram,
  onFaqCreate,
  onFaqUpdate,
  onFaqDelete,
  onRefreshShelterPendingCount,
  onShelterPendingCountChange,
  onRefreshPointsTransactions,
}: AdminPanelTabContentProps) {
  return (
    <div className="page-container py-6">
      {activeTab === 'dashboard' && (
        <AdminDashboardPanel stats={stats} pets={pets} profilePets={profilePets} />
      )}
      {activeTab === 'moderation' && (
        <ModerationPanel
          pets={pets}
          onApprovePet={(pet) => {
            const approvedPet: Pet = {
              ...pet,
              moderationStatus: 'approved',
              moderatedAt: new Date(),
              moderatedBy: 'admin',
            };
            onUpdatePet(approvedPet);
          }}
          onRejectPet={(pet, reason) => {
            const rejectedPet: Pet = {
              ...pet,
              moderationStatus: 'rejected',
              moderationReason: reason,
              moderatedAt: new Date(),
              moderatedBy: 'admin',
            };
            onUpdatePet(rejectedPet);
          }}
        />
      )}
      {activeTab === 'sheltersCatalog' && (
        <AdminSheltersCatalogPanel
          users={users}
          onRefreshPendingQueue={onRefreshShelterPendingCount}
        />
      )}
      {activeTab === 'sheltersModeration' && (
        <AdminSheltersModerationPanel
          users={users}
          onPendingCountChange={onShelterPendingCountChange}
        />
      )}
      {activeTab === 'pets' && (
        <PetsAdminPanel
          pets={pets}
          users={users}
          onDeletePet={onDeletePet}
          onOpenPet={(petId) => window.open(`/pet/${petId}`, '_blank')}
        />
      )}
      {activeTab === 'profilePets' && (
        <ProfilePetsAdminPanel profilePets={profilePets} onDeleteProfilePet={onDeleteProfilePet} />
      )}
      {activeTab === 'users' && (
        <AdminUsersPanel users={users} onUpdateUser={onUpdateUser} onDeleteUser={onDeleteUser} />
      )}
      {activeTab === 'rewards' && (
        <AdminRewardsPanel
          pets={pets}
          users={users}
          pointsTransactions={pointsTransactions}
          onRefresh={onRefreshPointsTransactions}
        />
      )}
      {activeTab === 'reports' && (
        <AdminReportsPanel
          reports={reports}
          pets={pets}
          onUpdateReport={onUpdateReport}
          onDeleteReport={onDeleteReport}
        />
      )}
      {activeTab === 'media' && (
        <AdminMediaPanel
          mediaArticles={mediaArticles}
          onMediaCreate={onMediaCreate}
          onMediaUpdate={onMediaUpdate}
          onMediaDelete={onMediaDelete}
        />
      )}
      {activeTab === 'blog' && (
        <AdminBlogPanel
          blogPosts={blogPosts}
          onBlogCreate={onBlogCreate}
          onBlogUpdate={onBlogUpdate}
          onBlogDelete={onBlogDelete}
          onBlogSendTelegram={onBlogSendTelegram}
          onOpenCategories={() => onSelectTab('blogCategories')}
          onOpenTelegramSettings={() => onSelectTab('telegramBlog')}
        />
      )}
      {activeTab === 'blogCategories' && <AdminBlogCategoriesPanel />}
      {activeTab === 'partners' && (
        <AdminPartnersPanel
          partners={partners}
          onPartnerCreate={onPartnerCreate}
          onPartnerUpdate={onPartnerUpdate}
          onPartnerDelete={onPartnerDelete}
        />
      )}
      {activeTab === 'faq' && (
        <AdminFaqPanel
          faqItems={faqItems}
          onFaqCreate={onFaqCreate}
          onFaqUpdate={onFaqUpdate}
          onFaqDelete={onFaqDelete}
        />
      )}
      {activeTab === 'guides' && <AdminGuidesPanel />}
      {activeTab === 'helpSection' && <AdminHelpSectionPanel />}
      {activeTab === 'featureFlags' && <AdminFeatureFlagsPanel />}
      {activeTab === 'telegramBlog' && <AdminTelegramBlogPanel />}
      {activeTab === 'instagram' && <AdminInstagramPanel />}
      {activeTab === 'settings' && <AdminSettingsPanel />}
    </div>
  );
}
