import { adm } from '../admin-panel-chrome';
import { AdminInstagramAccountsSection } from './admin-instagram-accounts-section';
import { AdminInstagramManualModal } from './admin-instagram-manual-modal';
import { AdminInstagramQueueSection } from './admin-instagram-queue-section';
import { AdminInstagramRoutesSection } from './admin-instagram-routes-section';
import { AdminInstagramSettingsSection } from './admin-instagram-settings-section';
import { useAdminInstagramPanel } from './use-admin-instagram-panel';

export function AdminInstagramPanel() {
  const p = useAdminInstagramPanel();

  if (p.loading) {
    return (
      <div className={`${adm.settingsCard} flex items-center justify-center py-16`}>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
      </div>
    );
  }

  return (
    <div className={adm.page}>
      <div className={adm.headerRow}>
        <div className={adm.headerText}>
          <h2 className={adm.title}>{p.ig.title}</h2>
          <p className={adm.subtitle}>{p.ig.subtitle}</p>
        </div>
      </div>

      <AdminInstagramSettingsSection
        ig={p.ig}
        instagramAutopublishEnabled={p.instagramAutopublishEnabled}
        setInstagramAutopublishEnabled={p.setInstagramAutopublishEnabled}
        instagramStoryEnabled={p.instagramStoryEnabled}
        setInstagramStoryEnabled={p.setInstagramStoryEnabled}
        instagramManualWhenAutoOff={p.instagramManualWhenAutoOff}
        setInstagramManualWhenAutoOff={p.setInstagramManualWhenAutoOff}
        busy={p.busy}
        onSave={() => void p.saveInstagramSettings()}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminInstagramAccountsSection
          ig={p.ig}
          accounts={p.accounts}
          editingAccountId={p.editingAccountId}
          accountForm={p.accountForm}
          setAccountForm={p.setAccountForm}
          busy={p.busy}
          onResetForm={p.resetAccountForm}
          onSubmit={() => void p.handleAccountSubmit()}
          onEdit={p.beginEditAccount}
        />

        <AdminInstagramRoutesSection
          ig={p.ig}
          accounts={p.accounts}
          routes={p.routes}
          routeRegion={p.routeRegion}
          setRouteRegion={p.setRouteRegion}
          routeAccountId={p.routeAccountId}
          setRouteAccountId={p.setRouteAccountId}
          routeFallback={p.routeFallback}
          setRouteFallback={p.setRouteFallback}
          busy={p.busy}
          onCreateRoute={() => void p.handleCreateRoute()}
          onDeleteRoute={(routeId) => void p.handleDeleteRoute(routeId)}
          onToggleFallback={(row, value) => void p.toggleRouteFallback(row, value)}
        />
      </div>

      <AdminInstagramQueueSection
        ig={p.ig}
        paginationLabels={p.t.adminPanel.pagination}
        publicationFilter={p.publicationFilter}
        publicationPetFilter={p.publicationPetFilter}
        setPublicationPetFilter={p.setPublicationPetFilter}
        publicationStatusOptions={p.publicationStatusOptions}
        statusLabels={p.statusLabels}
        visiblePublications={p.visiblePublications}
        publications={p.publications}
        publicationsTotal={p.publicationsTotal}
        queuePage={p.queuePage}
        queueTotalPages={p.queueTotalPages}
        queueLoading={p.queueLoading}
        busy={p.busy}
        onFilterChange={p.applyQueueFilter}
        onRefresh={p.refreshQueueFromFilters}
        onOpenManualModal={() => p.setIsManualModalOpen(true)}
        onQueueAction={(id, action) => void p.handleQueueAction(id, action)}
        onPageChange={p.goToQueuePage}
        queueStatusBadgeClass={p.queueStatusBadgeClass}
        queueStatusLabel={p.queueStatusLabel}
        formatQueueDate={p.formatQueueDate}
      />

      <AdminInstagramManualModal
        open={p.isManualModalOpen}
        ig={p.ig}
        manualPetId={p.manualPetId}
        setManualPetId={p.setManualPetId}
        busy={p.busy}
        onClose={() => p.setIsManualModalOpen(false)}
        onSubmit={() => void p.handleManualQueue()}
      />
    </div>
  );
}
