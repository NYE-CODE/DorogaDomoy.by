# -*- coding: utf-8 -*-
"""Fix corrupted Cyrillic in components/pet-form.tsx using i18n keys."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "components" / "pet-form.tsx"

REPLACEMENTS: list[tuple[str, str]] = [
    (
        "const agePresetValues = ['', '\ufffd\ufffd\ufffd\ufffd\ufffd 2 \ufffd\ufffd\ufffd\ufffd', '\ufffd\ufffd\ufffd\ufffd\ufffd 2 \ufffd\ufffd\ufffd\ufffd'] as const;",
        "const agePresetValues = APPROXIMATE_AGE_PRESET_VALUES;",
    ),
]

# Fallback: replace any line matching age preset const
AGE_PRESET_RE = re.compile(
    r"const agePresetValues = \['', '[^']*', '[^']*'\] as const;"
)

GET_AGE_LABEL_BLOCK = """  const getAgeLabel = (value: string, short: boolean) => {
    const pf = t.petForm;
    if (value === '') return short ? pf.ageUnknownShort : t.pet.gender.unknown;
    if (value === APPROXIMATE_AGE_LESS_2) return short ? pf.ageLess2Short : pf.ageLess2;
    if (value === APPROXIMATE_AGE_MORE_2) return short ? pf.ageMore2Short : pf.ageMore2;
    return value;
  };"""

STEP4_ERR_RE = re.compile(
    r"else if \(formData\.description\.length > MAX_DESCRIPTION\) errs\.description = `[^`]+`;"
)
STEP4_ERR_NEW = (
    "else if (formData.description.length > MAX_DESCRIPTION) {\n"
    "      errs.description = t.petForm.descriptionTooLong.replace('{max}', String(MAX_DESCRIPTION));\n"
    "    }"
)

REWARD_ERR_RE = re.compile(r"errs\.rewardAmountByn = '[^']+';")
REWARD_ERR_NEW = "errs.rewardAmountByn = t.petForm.rewardAmountRequired;"

RA_ERR_RE = re.compile(r"if \(raLen > 300\) errs\.registrationAuthority = '[^']+';")
RA_ERR_NEW = "if (raLen > 300) errs.registrationAuthority = t.petForm.registrationAuthorityTooLong;"

RT_ERR_RE = re.compile(r"if \(rtLen > 80\) errs\.registrationTokenNumber = '[^']+';")
RT_ERR_NEW = "if (rtLen > 80) errs.registrationTokenNumber = t.petForm.registrationTokenTooLong;"


def main() -> None:
    text = PATH.read_text(encoding="utf-8")

    if "APPROXIMATE_AGE_PRESET_VALUES" not in text:
        text = text.replace(
            "import { RouteProgress } from '@/shared/ui/molecules';",
            "import { RouteProgress } from '@/shared/ui/molecules';\n"
            "import {\n"
            "  APPROXIMATE_AGE_LESS_2,\n"
            "  APPROXIMATE_AGE_MORE_2,\n"
            "  APPROXIMATE_AGE_PRESET_VALUES,\n"
            "} from '@/shared/lib/approximate-age-presets';",
        )

    text = AGE_PRESET_RE.sub(
        "const agePresetValues = APPROXIMATE_AGE_PRESET_VALUES;", text
    )

    text = re.sub(
        r"  const getAgeLabel = \(value: string, short: boolean\) => \{[\s\S]*?  \};",
        GET_AGE_LABEL_BLOCK,
        text,
        count=1,
    )

    text = STEP4_ERR_RE.sub(STEP4_ERR_NEW, text)
    text = REWARD_ERR_RE.sub(REWARD_ERR_NEW, text)
    text = RA_ERR_RE.sub(RA_ERR_NEW, text)
    text = RT_ERR_RE.sub(RT_ERR_NEW, text)

    text = text.replace(
        "{ value: 'cat', icon: '??' },\n  { value: 'dog', icon: '??' },\n  { value: 'other', icon: '??' },",
        "{ value: 'cat', icon: '🐱' },\n  { value: 'dog', icon: '🐶' },\n  { value: 'other', icon: '🐾' },",
    )

    # Status toggle block
    text = re.sub(
        r"<label className=\"block text-sm font-semibold text-muted-foreground uppercase mb-3\">\s*[^\n<]+\s*</label>",
        "<label className=\"block text-sm font-semibold text-muted-foreground uppercase mb-3\">\n                    {t.petForm.whatHappened}\n                  </label>",
        text,
        count=1,
    )
    text = re.sub(
        r"(formData\.status === 'searching'[\s\S]*?>\s*)[^\n<]+(\s*</button>)",
        r"\1{t.petForm.statusToggleLost}\2",
        text,
        count=1,
    )
    text = re.sub(
        r"(formData\.status === 'found'[\s\S]*?>\s*)[^\n<]+(\s*</button>)",
        r"\1{t.petForm.statusToggleFound}\2",
        text,
        count=1,
    )

    text = re.sub(
        r'placeholder="[^"]*обязательно[^"]*"',
        'placeholder={t.petForm.otherBreedPlaceholder}',
        text,
        flags=re.IGNORECASE,
    )
    text = re.sub(
        r'placeholder="[^"]*породу[^"]*"',
        'placeholder={t.petForm.selectOrEnterBreed}',
        text,
        count=1,
    )

    text = re.sub(
        r"\? \(\(t\.pet\.gender as \{ unknownShort\?: string \}\)\.unknownShort \?\? '[^']+'\)",
        "? t.pet.gender.unknownShort",
        text,
    )

    text = re.sub(
        r'placeholder="[^"]*2[^"]*год[^"]*"',
        'placeholder={t.petForm.ageExamplePlaceholder}',
        text,
        count=1,
    )

    text = re.sub(
        r"\{formData\.photos\.length\} [^\{]+\{maxPhotos\}",
        "{t.petForm.photosUploadedCount.replace('{current}', String(formData.photos.length)).replace('{max}', String(maxPhotos))}",
        text,
        count=1,
    )

    text = re.sub(
        r'alt=\{`[^`]+`\}',
        "alt={t.petForm.photoAltNumber.replace('{n}', String(index + 1))}",
        text,
        count=1,
    )

    text = re.sub(
        r"\(t\.petForm as \{ uploadPhotoHint\?: string \}\)\.uploadPhotoHint \|\| '[^']+'",
        "t.petForm.uploadPhotoHint",
        text,
    )
    text = re.sub(
        r"\(t\.petForm as \{ uploadPhotoDrag\?: string \}\)\.uploadPhotoDrag \|\| '[^']+'",
        "t.petForm.uploadPhotoDrag",
        text,
    )

    text = re.sub(
        r'<p className="text-sm text-muted-foreground text-center py-1">[^<]+</p>',
        '<p className="text-sm text-muted-foreground text-center py-1">{t.petForm.maxPhotosReached}</p>',
        text,
        count=1,
    )

    text = re.sub(
        r'placeholder="Минск[^"]*"',
        'placeholder={t.petForm.addressExamplePlaceholder}',
        text,
        count=1,
    )
    text = re.sub(
        r'title="[^"]*карт[^"]*"',
        'title={t.petForm.geocodeOnMapTitle}',
        text,
        count=1,
    )
    text = re.sub(
        r': <p className="text-xs text-muted-foreground/80 mt-1">[^<]+</p>',
        ': <p className="text-xs text-muted-foreground/80 mt-1">{t.petForm.addressMapHint}</p>',
        text,
        count=1,
    )
    text = re.sub(
        r'<span className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wide">[^<]+\*</span>',
        '<span className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wide">{t.petForm.mapPointLabel}</span>',
        text,
        count=1,
    )

    for field, key in [
        ("rewardTitle", "rewardTitle"),
        ("rewardPointsMode", "rewardPointsMode"),
        ("rewardMoneyMode", "rewardMoneyMode"),
        ("rewardAmountLabel", "rewardAmountLabel"),
        ("rewardMoneyHint", "rewardMoneyHint"),
        ("rewardPointsHint", "rewardPointsHint"),
    ]:
        text = re.sub(
            rf"\(t\.petForm as \{{ {field}\?: string \}}\)\.{field} \?\?\s*'[^']*'",
            f"t.petForm.{key}",
            text,
        )

    text = re.sub(
        r'placeholder="Ваше имя"',
        'placeholder={t.petForm.contactNamePlaceholder}',
        text,
    )
    text = re.sub(
        r"\(t\.petForm as \{ nextStep\?: string \}\)\.nextStep \|\| '[^']+'",
        "t.petForm.nextStep",
        text,
    )

    # Strip remaining U+FFFD from comments (replace with English)
    lines = []
    for line in text.splitlines():
        if "\ufffd" in line and ("//" in line or "/*" in line or "*/" in line or "{/*" in line):
            if "Header" in line or "renderStepHeaderExternally" in line:
                line = "      {/* Header — hidden when parent renders step header (PostPage) */}"
            elif "stepDesc" in line:
                line = "          {/* stepDesc for steps 2–5 below the title, same as modal */}"
            elif "Step 1" in line:
                line = "          {/* Step 1: type, breed, color, gender */}"
            elif "Step 2" in line:
                line = "          {/* Step 2: photos */}"
            elif "Step 3" in line:
                line = "          {/* Step 3: address and map */}"
            elif "Step 4" in line:
                line = "          {/* Step 4: description and registration */}"
            elif "Step 5" in line:
                line = "          {/* Step 5: contacts and privacy */}"
            elif "defaultsFromSelectedCity" in lines[-1] if lines else False:
                pass
            elif line.strip().startswith("/**"):
                line = re.sub(r"/\*\*.*\*/", "/** See PetFormProps */", line)
            elif line.strip().startswith("//"):
                line = re.sub(r"//.*", "// (see i18n)", line)
            else:
                line = re.sub(r"\ufffd+", "", line)
        lines.append(line)
    text = "\n".join(lines) + ("\n" if text.endswith("\n") else "")

    # Fix interface JSDoc blocks with FFFD
    text = re.sub(
        r"/\*\*[^*]*\ufffd[^*]*\*/",
        "",
        text,
    )

    PATH.write_text(text, encoding="utf-8")
    remaining = sum(1 for line in text.splitlines() if "\ufffd" in line)
    print(f"pet-form.tsx: {remaining} lines still contain U+FFFD")


if __name__ == "__main__":
    main()
