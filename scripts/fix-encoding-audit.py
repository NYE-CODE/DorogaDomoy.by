# -*- coding: utf-8 -*-
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# admin-panel
ap = ROOT / "components/admin-panel.tsx"
t = ap.read_text(encoding="utf-8", errors="replace")
replacements = [
    ("{pet.city} \ufffd {pet.authorName}", "{pet.city} · {pet.authorName}"),
    ("` \ufffd ${pp.owner_name}`", "` · ${pp.owner_name}`"),
    ("{sh.city} \ufffd {shelterCatalogStatusLabel", "{sh.city} · {shelterCatalogStatusLabel"),
    ("\ufffd {ap.reports.petAwarded}", "· {ap.reports.petAwarded}"),
]
for old, new in replacements:
    t = t.replace(old, new)
ap.write_text(t, encoding="utf-8")

# my-ads-page
ma = ROOT / "components/my-ads-page.tsx"
t2 = ma.read_text(encoding="utf-8", errors="replace")
t2 = t2.replace('<span className="shrink-0">\ufffd</span>', '<span className="shrink-0" aria-hidden>·</span>')
ma.write_text(t2, encoding="utf-8")

# PetDetailPage flyer subtitle
pd = ROOT / "src/pages/PetDetailPage.tsx"
t3 = pd.read_text(encoding="utf-8")
t3 = t3.replace(
    "${pet.city} ? ${t.pet.animalType[pet.animalType]}",
    "${pet.city} — ${t.pet.animalType[pet.animalType]}",
)
pd.write_text(t3, encoding="utf-8")

# ShelterPetDetailPage description i18n
sp = ROOT / "src/pages/ShelterPetDetailPage.tsx"
t4 = sp.read_text(encoding="utf-8")
t4 = t4.replace(
    "{pet.description || 'Описание пока не добавлено.'}",
    "{pet.description || t.shelterPet.descriptionEmpty}",
)
sp.write_text(t4, encoding="utf-8")

# admin-panel: em-dash placeholders
ap = ROOT / "components/admin-panel.tsx"
t5 = ap.read_text(encoding="utf-8", errors="replace")
t5 = t5.replace(" \ufffd{", " ·{")
t5 = t5.replace("|| '\ufffd'", "|| '—'")
t5 = t5.replace(": '\ufffd'", ": '—'")
t5 = t5.replace("? `\ufffd ${", "? ` · ${")
t5 = t5.replace("<span className=\"text-muted-foreground/80 text-sm\">\ufffd</span>", "<span className=\"text-muted-foreground/80 text-sm\" aria-hidden>·</span>")
ap.write_text(t5, encoding="utf-8")

print("done")
