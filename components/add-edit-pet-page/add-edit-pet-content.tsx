import { AddEditPetErrorState, AddEditPetLoadingState } from './add-edit-pet-load-states';
import { AddEditPetNavigation } from './add-edit-pet-navigation';
import { AddEditPetPageHeader } from './add-edit-pet-page-header';
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
    return <AddEditPetLoadingState />;
  }

  if (isEditMode && loadError) {
    return (
      <AddEditPetErrorState
        loadError={loadError}
        loadErrorTitle={mp.loadErrorTitle}
        loadErrorDesc={mp.loadErrorDesc}
        retryLabel={mp.retryLoad}
        backLabel={mp.stubBack}
        onRetry={() => void loadProfilePet()}
        onBack={() => navigate('/my-pets')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background">
      <AddEditPetPageHeader
        title={isEditMode ? f.editTitle : f.addTitle}
        stepLine={stepLine}
        closeLabel={f.close}
        totalSteps={totalSteps}
        currentStep={currentStep}
        onBack={handleBack}
        onClose={() => navigate('/my-pets')}
      />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-card rounded-lg shadow-sm border border-border p-8">
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
              onRespondsToNameChange={(respondsToName) => setFormData((prev) => ({ ...prev, respondsToName }))}
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
        </div>
      </div>
    </div>
  );
}
