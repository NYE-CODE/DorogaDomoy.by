# -*- coding: utf-8 -*-
"""Fix corrupted visible strings in add-edit-pet-page and MyShelterPetFormPage."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def fix_add_edit_pet_page() -> None:
    path = ROOT / "components" / "add-edit-pet-page.tsx"
    text = path.read_text(encoding="utf-8")

    if "class PhotoPrepareError" not in text:
        text = text.replace(
            "const MAX_PROFILE_UPLOAD_BYTES = 750 * 1024;\n\n",
            "const MAX_PROFILE_UPLOAD_BYTES = 750 * 1024;\n\n"
            "class PhotoPrepareError extends Error {\n"
            "  constructor(public readonly kind: \"process\" | \"tooLarge\") {\n"
            "    super(kind);\n"
            "    this.name = \"PhotoPrepareError\";\n"
            "  }\n"
            "}\n\n",
        )

    lines = text.splitlines()
    for i, line in enumerate(lines):
        if "PROFILE_PET_PHOTO_GUIDE_INSTAGRAM_URL" in line and i > 0 and "\ufffd" in lines[i - 1]:
            lines[i - 1] = "/** Instagram guide for pet photos (external link). */"
        if "throw new Error" in line and "\ufffd" in line:
            if "tooLarge" not in line:
                lines[i] = '    throw new PhotoPrepareError("process");'
            else:
                lines[i] = '    throw new PhotoPrepareError("tooLarge");'
        if 'isSubmitting ? "' in line and "\ufffd" in line:
            lines[i] = '                {isSubmitting ? t.common.submitting : (isEditMode ? f.submitSave : f.submitAdd)}'

    text = "\n".join(lines) + "\n"

    old_catch = (
        '    } catch (error) {\n'
        "      toast.error(error instanceof Error ? error.message : t.common.error);\n"
        "    } finally {"
    )
    new_catch = (
        "    } catch (error) {\n"
        "      if (error instanceof PhotoPrepareError) {\n"
        "        toast.error(\n"
        "          error.kind === \"tooLarge\"\n"
        "            ? t.common.toasts.photoTooLargeAfterCompress\n"
        "            : t.common.toasts.imageProcessError,\n"
        "        );\n"
        "      } else {\n"
        "        toast.error(error instanceof Error ? error.message : t.common.error);\n"
        "      }\n"
        "    } finally {"
    )
    if old_catch in text:
        text = text.replace(old_catch, new_catch, 1)

    path.write_text(text, encoding="utf-8")
    remaining = sum(1 for line in text.splitlines() if "\ufffd" in line)
    print(f"add-edit-pet-page.tsx: {remaining} FFFD lines")


def fix_my_shelter_pet_form_page() -> None:
    path = ROOT / "src" / "pages" / "MyShelterPetFormPage.tsx"
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()

    # Remove TRAIT_SCALE_HINTS block - will refactor TraitScale
    out: list[str] = []
    skip = False
    for line in lines:
        if line.startswith("const TRAIT_SCALE_HINTS"):
            skip = True
            continue
        if skip:
            if line.strip() == "};":
                skip = False
            continue
        out.append(line)
    lines = out

    text = "\n".join(lines) + "\n"

    # TraitScale signature and body updates via string replace
    text = text.replace(
        """function TraitScale({
  label,
  field,
  value,
  onChange,
}: {
  label: string;
  field: keyof typeof TRAIT_SCALE_HINTS;
  value: number;
  onChange: (v: number) => void;
}) {
  const [low, high] = TRAIT_SCALE_HINTS[field];""",
        """function TraitScale({
  label,
  lowHint,
  highHint,
  clearLabel,
  value,
  onChange,
}: {
  label: string;
  lowHint: string;
  highHint: string;
  clearLabel: string;
  value: number;
  onChange: (v: number) => void;
}) {""",
    )
    text = text.replace(
        """            className="text-xs text-muted-foreground hover:text-foreground"
          >
            \ufffd\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd
          </button>""",
        """            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {clearLabel}
          </button>""",
    )
    # fallback for clear button - replace any corrupted line between onClick clear and button close
    import re

    text = re.sub(
        r"(onClick=\{\(\) => onChange\(0\)\}[\s\S]*?>\s*)[^\n{<]+(\s*</button>)",
        r"\1{clearLabel}\2",
        text,
        count=1,
    )
    text = text.replace("<span>{low}</span>", "<span>{lowHint}</span>")
    text = text.replace("<span>{high}</span>", "<span>{highHint}</span>")

    text = text.replace(
        """function CompatibilitySelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Compatibility;
  onChange: (v: Compatibility) => void;
}) {
  const options: { v: Compatibility; t: string }[] = [
    { v: 'yes', t: '\ufffd\ufffd' },
    { v: 'no', t: '\ufffd\ufffd\ufffd' },
    { v: 'unknown', t: '\ufffd\ufffd \ufffd\ufffd\ufffd\ufffd' },
  ];""",
        """function CompatibilitySelect({
  label,
  value,
  onChange,
  yesLabel,
  noLabel,
  unknownLabel,
}: {
  label: string;
  value: Compatibility;
  onChange: (v: Compatibility) => void;
  yesLabel: string;
  noLabel: string;
  unknownLabel: string;
}) {
  const options: { v: Compatibility; t: string }[] = [
    { v: 'yes', t: yesLabel },
    { v: 'no', t: noLabel },
    { v: 'unknown', t: unknownLabel },
  ];""",
    )

    # Generic fix for corrupted option/placeholder lines - use line-by-line after reading
    lines = text.splitlines()
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")

    # Re-read and apply line fixes in component body
    lines = path.read_text(encoding="utf-8").splitlines()

    # Find export default function and add vars after pf = t.petForm
    for i, line in enumerate(lines):
        if line.strip() == "const pf = t.petForm;":
            insert = [
                "  const sp = t.shelterPet;",
                "  const pt = t.petTraits;",
                "  const msl = t.myShelterPetsList;",
                "  const mf = t.myPets.form;",
                "  const compatYes = mf.yes;",
                "  const compatNo = mf.no;",
                "  const compatUnknown = t.pet.gender.unknown;",
            ]
            lines[i + 1 : i + 1] = insert
            break

    # stepTitle useMemo
    for i, line in enumerate(lines):
        if "const stepTitle = useMemo" in line:
            end = i
            while end < len(lines) and "}, [step]);" not in lines[end]:
                end += 1
            lines[i : end + 1] = [
                "  const stepTitle = useMemo(() => {",
                "    if (step === 1) return sp.stepPhotos;",
                "    if (step === 2) return sp.stepAbout;",
                "    return sp.stepPublication;",
                "  }, [step, sp.stepPhotos, sp.stepAbout, sp.stepPublication]);",
            ]
            break

    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    lines = path.read_text(encoding="utf-8").splitlines()

    fixes: dict[int, str] = {}
    for i, line in enumerate(lines, 1):
        if "\ufffd" not in line:
            continue
        if "pageTitle = isEdit" in line:
            fixes[i] = "  const pageTitle = isEdit ? sp.formEditTitle : sp.formAddTitle;"
        elif "stepTitle.replace" in line:
            fixes[i] = "                {t.petForm.step} {step} {t.petForm.of} {totalSteps}: {stepTitle}"
        elif 'placeholder="' in line and "nickname" in lines[i - 2] if i > 2 else False:
            fixes[i] = '                  <input value={form.nickname} onChange={(e) => setForm((p) => ({ ...p, nickname: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder={sp.nicknamePlaceholder} />'
        elif "<option value=\"cat\">" in line:
            fixes[i] = '                    <option value="cat">{t.pet.animalType.cat}</option>'
        elif "<option value=\"dog\">" in line:
            fixes[i] = '                    <option value="dog">{t.pet.animalType.dog}</option>'
        elif "<option value=\"other\">" in line and "animalType" in (lines[i - 3] if i > 3 else ""):
            fixes[i] = '                    <option value="other">{t.pet.animalType.other}</option>'
        elif "breed" in line and 'placeholder="' in line:
            fixes[i] = '                  <input value={form.breed} onChange={(e) => setForm((p) => ({ ...p, breed: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder={sp.breedPlaceholder} />'
        elif "<option value=\"unknown\">" in line and "gender" in (lines[i - 2] if i > 2 else ""):
            fixes[i] = '                    <option value="unknown">{t.pet.gender.unknown}</option>'
        elif "<option value=\"male\">" in line:
            fixes[i] = '                    <option value="male">{t.pet.gender.male}</option>'
        elif "<option value=\"female\">" in line:
            fixes[i] = '                    <option value="female">{t.pet.gender.female}</option>'
        elif "approximateAge" in line and 'placeholder="' in line:
            fixes[i] = '                  <input value={form.approximateAge} onChange={(e) => setForm((p) => ({ ...p, approximateAge: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder={sp.agePlaceholder} />'
        elif "colorsCsv" in line and 'placeholder="' in line:
            fixes[i] = '                  <input value={form.colorsCsv} onChange={(e) => setForm((p) => ({ ...p, colorsCsv: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder={sp.colorsPlaceholder} />'
        elif "<option value=\"disabled\">" in line:
            fixes[i] = '                    <option value="disabled">{sp.healthDisabled}</option>'
        elif "<option value=\"treatment\">" in line:
            fixes[i] = '                    <option value="treatment">{sp.healthTreatment}</option>'
        elif "<option value=\"good\">" in line and "healthStatus" in (lines[i - 2] if i > 2 else ""):
            fixes[i] = '                    <option value="good">{sp.healthGood}</option>'
        elif "<option value=\"excellent\">" in line:
            fixes[i] = '                    <option value="excellent">{sp.healthExcellent}</option>'
        elif "<option value=\"smooth\">" in line:
            fixes[i] = '                    <option value="smooth">{sp.coatSmooth}</option>'
        elif "<option value=\"semi\">" in line:
            fixes[i] = '                    <option value="semi">{sp.coatSemi}</option>'
        elif "<option value=\"fluffy\">" in line:
            fixes[i] = '                    <option value="fluffy">{sp.coatFluffy}</option>'
        elif "description" in line and "textarea" in line and 'placeholder="' in line:
            fixes[i] = '                  <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="min-h-24 rounded-lg border border-border bg-background px-3 py-2 text-sm sm:col-span-2" placeholder={sp.descriptionPlaceholder} />'
        elif "traitsSectionTitle" in line or ("<h3" in line and "\ufffd" in line):
            fixes[i] = '                    <h3 className="text-sm font-semibold text-foreground">{sp.traitsSectionTitle}</h3>'
        elif "traitsSectionHint" in line or ("<p className=\"mt-0.5" in line and "\ufffd" in line):
            fixes[i] = '                    <p className="mt-0.5 text-xs text-muted-foreground">{sp.traitsSectionHint}</p>'
        elif 'TraitScale label="' in line and "energyLevel" in line:
            fixes[i] = '                  <TraitScale label={pt.energyLevel.label} lowHint={pt.energyLevel.levels[0]} highHint={pt.energyLevel.levels[4]} clearLabel={sp.clearTrait} value={form.energyLevel} onChange={(v) => setForm((p) => ({ ...p, energyLevel: v }))} />'
        elif 'TraitScale label="' in line and "friendlinessLevel" in line:
            fixes[i] = '                  <TraitScale label={pt.friendlinessLevel.label} lowHint={pt.friendlinessLevel.levels[0]} highHint={pt.friendlinessLevel.levels[4]} clearLabel={sp.clearTrait} value={form.friendlinessLevel} onChange={(v) => setForm((p) => ({ ...p, friendlinessLevel: v }))} />'
        elif 'TraitScale label="' in line and "trainingLevel" in line:
            fixes[i] = '                  <TraitScale label={pt.trainingLevel.label} lowHint={pt.trainingLevel.levels[0]} highHint={pt.trainingLevel.levels[4]} clearLabel={sp.clearTrait} value={form.trainingLevel} onChange={(v) => setForm((p) => ({ ...p, trainingLevel: v }))} />'
        elif 'TraitScale label="' in line and "independenceLevel" in line:
            fixes[i] = '                  <TraitScale label={pt.independenceLevel.label} lowHint={pt.independenceLevel.levels[0]} highHint={pt.independenceLevel.levels[4]} clearLabel={sp.clearTrait} value={form.independenceLevel} onChange={(v) => setForm((p) => ({ ...p, independenceLevel: v }))} />'
        elif 'CompatibilitySelect label="' in line and "goodWithKids" in line:
            fixes[i] = '                  <CompatibilitySelect label={pt.compatYesKids} yesLabel={compatYes} noLabel={compatNo} unknownLabel={compatUnknown} value={form.goodWithKids} onChange={(v) => setForm((p) => ({ ...p, goodWithKids: v }))} />'
        elif 'CompatibilitySelect label="' in line and "goodWithDogs" in line:
            fixes[i] = '                  <CompatibilitySelect label={pt.compatYesDogs} yesLabel={compatYes} noLabel={compatNo} unknownLabel={compatUnknown} value={form.goodWithDogs} onChange={(v) => setForm((p) => ({ ...p, goodWithDogs: v }))} />'
        elif 'CompatibilitySelect label="' in line and "goodWithCats" in line:
            fixes[i] = '                  <CompatibilitySelect label={pt.compatYesCats} yesLabel={compatYes} noLabel={compatNo} unknownLabel={compatUnknown} value={form.goodWithCats} onChange={(v) => setForm((p) => ({ ...p, goodWithCats: v }))} />'
        elif "<option value=\"available\">" in line:
            fixes[i] = '                    <option value="available">{msl.statusAvailable}</option>'
        elif "<option value=\"reserved\">" in line:
            fixes[i] = '                    <option value="reserved">{msl.statusReserved}</option>'
        elif "<option value=\"adopted\">" in line:
            fixes[i] = '                    <option value="adopted">{msl.statusAdopted}</option>'
        elif "<option value=\"on_treatment\">" in line:
            fixes[i] = '                    <option value="on_treatment">{msl.statusTreatment}</option>'
        elif "<option value=\"not_for_adoption\">" in line:
            fixes[i] = '                    <option value="not_for_adoption">{msl.statusNotForAdoption}</option>'
        elif "isPublished" in line and "\ufffd" in line and "checkbox" in (lines[i - 2] if i > 2 else ""):
            fixes[i] = "                    {sp.publishCheckbox}"
        elif "disabled={step === 1" in line and "Назад" not in line:
            pass
        elif "setStep" in (lines[i - 1] if i > 1 else "") and "\ufffd" in line and "Button" in (lines[i - 2] if i > 2 else ""):
            fixes[i] = "                {t.common.back}"
        elif "step < 3" in (lines[i + 1] if i < len(lines) else "") and "\ufffd" in line:
            fixes[i] = "                  {t.common.next}"
        elif "saving ?" in line:
            fixes[i] = "                  {saving ? t.common.submitting : isEdit ? sp.savePet : sp.addPetButton}"
        elif "energyLevel:" in line and "/**" in line:
            fixes[i] = "  /** Trait scale 1–5; 0 = not set */"

    for ln, new in fixes.items():
        lines[ln - 1] = new

    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    remaining = sum(1 for line in lines if "\ufffd" in line)
    print(f"MyShelterPetFormPage.tsx: {remaining} FFFD lines")


def main() -> None:
    fix_add_edit_pet_page()
    fix_my_shelter_pet_form_page()


if __name__ == "__main__":
    main()
