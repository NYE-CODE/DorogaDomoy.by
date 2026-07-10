import { AdminPanelHeader } from './admin-panel-header';
import { AdminPanelNavigation } from './admin-panel-navigation';
import { AdminPanelTabContent } from './admin-panel-tab-content';
import type { AdminPanelProps } from './admin-panel-types';
import { useAdminPanel } from './use-admin-panel';

export function AdminPanel(props: AdminPanelProps) {
  const {
    onBack,
    pets,
    users,
    reports,
    mediaArticles,
    partners,
    partnerAds,
    profilePets,
    blogPosts,
    faqItems,
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
    onPartnerAdCreate,
    onPartnerAdUpdate,
    onPartnerAdDelete,
    onDeleteProfilePet,
    onBlogCreate,
    onBlogUpdate,
    onBlogDelete,
    onBlogSendTelegram,
    onFaqCreate,
    onFaqUpdate,
    onFaqDelete,
  } = props;

  const state = useAdminPanel(props);

  return (
    <div className="min-h-screen bg-background dark:bg-background">
      <AdminPanelHeader
        title={state.ap.header.title}
        subtitle={state.ap.header.subtitle}
        onBack={onBack}
      />

      <AdminPanelNavigation
        sectionMeta={state.sectionMeta}
        subTabs={state.subTabs}
        activePrimary={state.activePrimary}
        activeTab={state.activeTab}
        stats={state.stats}
        pendingModerationCount={state.pendingModerationCount}
        shelterPendingCount={state.shelterPendingCount}
        onSelectPrimary={state.selectPrimary}
        onSelectTab={state.selectTab}
      />

      <AdminPanelTabContent
        activeTab={state.activeTab}
        stats={state.stats}
        pets={pets}
        users={users}
        reports={reports}
        mediaArticles={mediaArticles}
        partners={partners}
        partnerAds={partnerAds}
        profilePets={profilePets}
        blogPosts={blogPosts}
        faqItems={faqItems}
        pointsTransactions={state.pointsTransactions}
        onSelectTab={state.selectTab}
        onUpdatePet={onUpdatePet}
        onDeletePet={onDeletePet}
        onUpdateUser={onUpdateUser}
        onDeleteUser={onDeleteUser}
        onUpdateReport={onUpdateReport}
        onDeleteReport={onDeleteReport}
        onMediaCreate={onMediaCreate}
        onMediaUpdate={onMediaUpdate}
        onMediaDelete={onMediaDelete}
        onPartnerCreate={onPartnerCreate}
        onPartnerUpdate={onPartnerUpdate}
        onPartnerDelete={onPartnerDelete}
        onPartnerAdCreate={onPartnerAdCreate}
        onPartnerAdUpdate={onPartnerAdUpdate}
        onPartnerAdDelete={onPartnerAdDelete}
        onDeleteProfilePet={onDeleteProfilePet}
        onBlogCreate={onBlogCreate}
        onBlogUpdate={onBlogUpdate}
        onBlogDelete={onBlogDelete}
        onBlogSendTelegram={onBlogSendTelegram}
        onFaqCreate={onFaqCreate}
        onFaqUpdate={onFaqUpdate}
        onFaqDelete={onFaqDelete}
        onRefreshShelterPendingCount={state.refreshShelterPendingCount}
        onShelterPendingCountChange={state.handleShelterPendingCountChange}
        onRefreshPointsTransactions={state.refreshPointsTransactions}
      />
    </div>
  );
}
