# -*- coding: utf-8 -*-
from pathlib import Path

p = Path("src/pages/MyShelterPetFormPage.tsx")
lines = p.read_text(encoding="utf-8").splitlines()
fixes = {
    31: "  /** Trait scale 1-5; 0 = not set */",
    423: '                  <input value={form.nickname} onChange={(e) => setForm((p) => ({ ...p, nickname: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder={sp.nicknamePlaceholder} />',
    427: '                    <option value="other">{t.pet.animalType.other}</option>',
    440: '                    <option value="good">{sp.healthGood}</option>',
    455: "                      {sp.traitsSectionHint}",
    479: "                    {sp.publishCheckbox}",
    487: "                {t.common.back}",
    491: "                  {t.common.next}",
}
for ln, new in fixes.items():
    lines[ln - 1] = new
p.write_text("\n".join(lines) + "\n", encoding="utf-8")
print("FFFD left", sum(1 for l in lines if "\ufffd" in l))
