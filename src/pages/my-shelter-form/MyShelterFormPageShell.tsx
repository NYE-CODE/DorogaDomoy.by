import { Header } from '@/widgets/layout/Header';
import { Footer } from '@/widgets/layout/Footer';
import { PageLoader } from '@/shared/ui/page-loader';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/shared/ui/card';
import { SHELTER_FORM_STEPS } from '@/shared/lib/shelter-org-form';
import { MyShelterFormPageFooter } from './my-shelter-form-page-footer';
import { MyShelterFormPageHeader } from './my-shelter-form-page-header';
import { MyShelterFormStepBasic } from './my-shelter-form-step-basic';
import { MyShelterFormStepContacts } from './my-shelter-form-step-contacts';
import { MyShelterFormStepLocation } from './my-shelter-form-step-location';
import { MyShelterFormStepMedia } from './my-shelter-form-step-media';
import { useMyShelterFormPage } from './use-my-shelter-form-page';

export default function MyShelterFormPage() {
  const p = useMyShelterFormPage();
  const stepLabel = `${p.t.petForm.step} ${p.formStep} ${p.t.petForm.of} ${SHELTER_FORM_STEPS}`;

  if (p.bootLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background dark:bg-background">
        <Header showCitySelector />
        <main className="flex flex-1 items-center justify-center py-16">
          <PageLoader />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30 dark:bg-background">
      <Header showCitySelector />

      <MyShelterFormPageHeader
        title={p.isCreate ? p.ms.createCard : p.ms.editCard}
        stepLabel={stepLabel}
        closeLabel={p.t.petForm.close}
        formStep={p.formStep}
        currentStepTitle={p.currentStepMeta.title}
        approvedLocked={p.approvedLocked}
        approvedEditHint={p.ms.approvedEditHint}
        onClose={p.goList}
      />

      <main className="flex-1 py-6 sm:py-10">
        <div className="mx-auto max-w-[736px] px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-border bg-white p-6 shadow-sm dark:border-border dark:bg-card sm:p-8">
            <Card className="border-0 shadow-none">
              <CardHeader className="px-0 pt-0">
                <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                  {p.currentStepMeta.desc}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 px-0 pb-0">
                {p.formStep === 1 ? (
                  <MyShelterFormStepBasic
                    ms={p.ms}
                    form={p.form}
                    setForm={p.setForm}
                    approvedLocked={p.approvedLocked}
                  />
                ) : null}

                {p.formStep === 2 ? (
                  <MyShelterFormStepLocation
                    ms={p.ms}
                    loadingLabel={p.t.common.loading}
                    form={p.form}
                    setForm={p.setForm}
                    approvedLocked={p.approvedLocked}
                    mapSyncing={p.mapSyncing}
                    onSyncMap={() => void p.syncMapFromAddress()}
                    onPlaceFromMap={p.handlePlaceFromMap}
                  />
                ) : null}

                {p.formStep === 3 ? (
                  <MyShelterFormStepContacts ms={p.ms} form={p.form} setForm={p.setForm} />
                ) : null}

                {p.formStep === 4 ? (
                  <MyShelterFormStepMedia
                    ms={p.ms}
                    form={p.form}
                    setForm={p.setForm}
                    logoInputRef={p.logoInputRef}
                    coverInputRef={p.coverInputRef}
                    onLogoChange={p.handleLogo}
                    onCoverChange={p.handleCover}
                  />
                ) : null}
              </CardContent>
            </Card>

            <MyShelterFormPageFooter
              formStep={p.formStep}
              saving={p.saving}
              approvedLocked={p.approvedLocked}
              cancelLabel={p.ms.cancel}
              backLabel={p.t.common.back}
              nextLabel={p.t.common.next}
              loadingLabel={p.t.common.loading}
              savePublishedLabel={p.ms.savePublished}
              saveDraftLabel={p.ms.saveDraft}
              onCancel={p.goList}
              onBack={p.goFormBack}
              onNext={p.goFormNext}
              onSave={() => void p.handleSave()}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
