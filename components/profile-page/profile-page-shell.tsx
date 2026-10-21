import '../../landing/styles/theme-scoped.css';
import { Header } from '../layout/Header';
import { Footer } from '../layout/Footer';
import { CitySelectModal } from '../city-select-modal';
import { cn } from '@/shared/lib/classNames';
import { pageContainer } from '@/shared/styles/layout-classes';
import { surfacePage, surfacePanel } from '@/shared/styles/surface-classes';
import { ProfileNotificationsTab } from './profile-notifications-tab';
import { ProfilePageTabs } from './profile-page-tabs';
import { ProfilePersonalTab } from './profile-personal-tab';
import { ProfileSecurityTab } from './profile-security-tab';
import { ProfileVolunteerDialog } from './profile-volunteer-dialog';
import { useProfilePage } from './use-profile-page';

export default function ProfilePage() {
  const p = useProfilePage();

  return (
    <div className={cn('landing-theme flex min-h-screen flex-col', surfacePage)}>
      <Header selectedCity={p.selectedCity} onCityClick={() => p.setShowCityModal(true)} />

      <main className="flex-1 py-6 sm:py-8">
        <div className={cn(pageContainer, 'mx-auto px-4')}>
          <div className="mb-8 space-y-2">
            <h1 className="typo-h2 font-display text-foreground">{p.t.profile.settingsTitle}</h1>
            <p className="typo-lead max-w-xl text-muted-foreground">{p.t.profile.settingsSubtitle}</p>
          </div>

          <div className={surfacePanel}>
            <ProfilePageTabs
              activeTab={p.activeTab}
              onTabChange={p.setActiveTab}
              personalLabel={p.t.profile.tabPersonal}
              securityLabel={p.t.profile.tabSecurity}
              notificationsLabel={p.t.profile.tabNotifications}
            />

            <div className="p-5 sm:p-8">
              {p.activeTab === 'personal' ? (
                <ProfilePersonalTab
                  user={p.user}
                  t={p.t}
                  pr={p.pr}
                  name={p.name}
                  setName={p.setName}
                  email={p.email}
                  setEmail={p.setEmail}
                  phone={p.phone}
                  setPhone={p.setPhone}
                  viber={p.viber}
                  setViber={p.setViber}
                  roleDraft={p.roleDraft}
                  setRoleDraft={p.setRoleDraft}
                  isSavingProfile={p.isSavingProfile}
                  helperCopied={p.helperCopied}
                  onCopyHelperCode={() => void p.handleCopyHelperCode()}
                  onAvatarUpload={(e) => void p.handleAvatarUpload(e)}
                  onSubmit={(e) => void p.handleSavePersonal(e)}
                />
              ) : null}

              {p.activeTab === 'security' ? (
                <ProfileSecurityTab
                  user={p.user}
                  t={p.t}
                  currentPassword={p.currentPassword}
                  setCurrentPassword={p.setCurrentPassword}
                  newPassword={p.newPassword}
                  setNewPassword={p.setNewPassword}
                  confirmPassword={p.confirmPassword}
                  setConfirmPassword={p.setConfirmPassword}
                  showCurrentPw={p.showCurrentPw}
                  setShowCurrentPw={p.setShowCurrentPw}
                  showNewPw={p.showNewPw}
                  setShowNewPw={p.setShowNewPw}
                  showConfirmPw={p.showConfirmPw}
                  setShowConfirmPw={p.setShowConfirmPw}
                  isSavingPassword={p.isSavingPassword}
                  isDeletingAccount={p.isDeletingAccount}
                  onSubmit={(e) => void p.handleSavePassword(e)}
                  onDeleteAccount={() => void p.handleDeleteAccount()}
                />
              ) : null}

              {p.activeTab === 'notifications' ? (
                <ProfileNotificationsTab
                  user={p.user}
                  t={p.t}
                  isTelegramLinked={p.isTelegramLinked}
                  linkCode={p.linkCode}
                  botUrl={p.botUrl}
                  timeLeft={p.timeLeft}
                  isLinking={p.isLinking}
                  codeCopied={p.codeCopied}
                  notifSettings={p.notifSettings}
                  notifLoading={p.notifLoading}
                  notifSaving={p.notifSaving}
                  localRadius={p.localRadius}
                  setLocalRadius={p.setLocalRadius}
                  localWatchEnabled={p.localWatchEnabled}
                  setLocalWatchEnabled={p.setLocalWatchEnabled}
                  localWatchRadius={p.localWatchRadius}
                  setLocalWatchRadius={p.setLocalWatchRadius}
                  localWatchLocation={p.localWatchLocation}
                  setLocalWatchLocation={p.setLocalWatchLocation}
                  formatTime={p.formatTime}
                  onRequestLink={(e) => void p.handleRequestLink(e)}
                  onUnlink={() => void p.handleUnlink()}
                  onCopyCode={p.handleCopyCode}
                  onCancelLinking={() => {
                    p.cleanupLinking();
                    p.setLinkCode(null);
                    p.setIsLinking(false);
                  }}
                  onToggleNotifications={(enabled) => void p.handleToggleNotifications(enabled)}
                  onToggleSimilarMatches={(enabled) => void p.handleToggleSimilarMatches(enabled)}
                  onSaveNotifSettings={() => void p.handleSaveNotifSettings()}
                />
              ) : null}
            </div>
          </div>
        </div>
      </main>

      <ProfileVolunteerDialog
        open={p.volunteerConfirmOpen}
        onOpenChange={p.setVolunteerConfirmOpen}
        title={p.t.profile.volunteerUpgradeTitle}
        body={p.t.profile.volunteerUpgradeBody}
        cancelLabel={p.t.profile.volunteerUpgradeCancel}
        confirmLabel={p.t.profile.volunteerUpgradeConfirm}
        onConfirm={() => void p.handleConfirmVolunteerUpgrade()}
      />

      <CitySelectModal
        open={p.showCityModal}
        onClose={() => p.setShowCityModal(false)}
        onSelect={p.handleCityModalSelect}
        currentCity={p.selectedCity}
      />

      <Footer />
    </div>
  );
}
