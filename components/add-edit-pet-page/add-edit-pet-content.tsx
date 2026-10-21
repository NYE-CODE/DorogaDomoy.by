import { AdFormPageShell } from '../ad-form-page-shell';
import { AdFormStepHeader } from '../ad-form-step-header';
import { surfacePage } from '@/shared/styles/surface-classes';
import { cn } from '@/shared/lib/classNames';
import { AddEditPetErrorState, AddEditPetLoadingState } from './add-edit-pet-load-states';
import { AddEditPetNavigation } from './add-edit-pet-navigation';
import { AddEditPetStepBasic } from './add-edit-pet-step-basic';
import { AddEditPetStepDetails } from './add-edit-pet-step-details';
import { AddEditPetStepPhotos, AddEditPetStepPhotosGuide } from './add-edit-pet-step-photos';
import { AddEditPetStepTemperament } from './add-edit-pet-step-temperament';
import { useAddEditPetForm } from './use-add-edit-pet-form';

export function AddEditPetContent() {
  const form = useAddEditPetForm();
  const {
    navigate,
    t,
    mp,
    f,
    isEditMode,
    totalSteps,
    currentStep,
    formData,
    setFormData,
    isLoadingProfile,
    loadError,
    isUploadingPhotos,
    uploadingSlotIndex,
    isSubmitting,
    aiAnalyzing,
    fileInputRef,
    currentMeta,
    stepLine,
    loadProfilePet,
    handleInputChange,
    handleSpeciesChange,
    toggleColor,
    handlePickSlot,
    handleFileChange,
    handleRemovePhoto,
    handleSlotFileDrop,
    handleProfileAiAnalyze,
    handleNext,
    handleBack,
    handleSubmit,
  } = form;

  if (isEditMode && isLoadingProfile) {
    return (
      <div className={cn('landing-theme flex min-h-screen flex-col', surfacePage)}>
        <AddEditPetLoadingState />
      </div>
    );
  }

  if (isEditMode && loadError) {
    return (
      <div className={cn('landing-theme flex min-h-screen flex-col', surfacePage)}>
        <AddEditPetErrorState
          loadError={loadError}
          loadErrorTitle={mp.loadErrorTitle}
          loadErrorDesc={mp.loadErrorDesc}
          retryLabel={mp.retryLoad}
          backLabel={mp.stubBack}
          onRetry={() => void loadProfilePet()}
          onBack={() => navigate('/my-pets')}
        />
      </div>
    );
  }

  const pageTitle = isEditMode ? f.editTitle : f.addTitle;

  return (
    <AdFormPageShell
      stepHeader={
        <AdFormStepHeader
          pageTitle={pageTitle}
          stepLabel={stepLine}
          totalSteps={totalSteps}
          currentStep={currentStep}
          progressLabel={stepLine}
          backAriaLabel={t.common.back}
          closeLabel={f.close}
          onBack={handleBack}
          onClose={() => navigate('/my-pets')}
        />
      }
    >
      <div className="mb-6 space-y-2">
        <p className="text-muted-foreground">{currentMeta.subtitle}</p>
        {currentStep === 1 ? <AddEditPetStepPhotosGuide f={f} /> : null}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {currentStep === 1 ? (
        <AddEditPetStepPhotos
          formData={formData}
          f={f}
          t={t}
          isUploadingPhotos={isUploadingPhotos}
          uploadingSlotIndex={uploadingSlotIndex}
          aiAnalyzing={aiAnalyzing}
          onPickSlot={handlePickSlot}
          onRemoveSlot={handleRemovePhoto}
          onFileDrop={handleSlotFileDrop}
          onAiAnalyze={handleProfileAiAnalyze}
        />
      ) : null}

      {currentStep === 2 ? (
        <AddEditPetStepBasic
          formData={formData}
          f={f}
          onInputChange={handleInputChange}
          onSpeciesChange={handleSpeciesChange}
          onBreedChange={(breed) => setFormData((prev) => ({ ...prev, breed }))}
          onGenderChange={(gender) => setFormData((prev) => ({ ...prev, gender }))}
          onToggleColor={toggleColor}
        />
      ) : null}

      {currentStep === 3 ? (
        <AddEditPetStepDetails
          formData={formData}
          f={f}
          onInputChange={handleInputChange}
          onChippedChange={(isChipped) =>
            setFormData((prev) => ({
              ...prev,
              isChipped,
              chipNumber: isChipped === 'no' ? '' : prev.chipNumber,
            }))
          }
        />
      ) : null}

      {currentStep === 4 ? (
        <AddEditPetStepTemperament
          formData={formData}
          f={f}
          onInputChange={handleInputChange}
          onTemperamentChange={(temperament) => setFormData((prev) => ({ ...prev, temperament }))}
          onRespondsToNameChange={(respondsToName) =>
            setFormData((prev) => ({ ...prev, respondsToName }))
          }
        />
      ) : null}

      <AddEditPetNavigation
        currentStep={currentStep}
        totalSteps={totalSteps}
        nextLabel={f.nextStep}
        submitLabel={isEditMode ? f.submitSave : f.submitAdd}
        submittingLabel={t.common.submitting}
        isUploadingPhotos={isUploadingPhotos}
        isSubmitting={isSubmitting}
        onNext={handleNext}
        onSubmit={() => void handleSubmit()}
      />
    </AdFormPageShell>
  );
}
