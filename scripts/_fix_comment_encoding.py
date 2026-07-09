# -*- coding: utf-8 -*-
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

FIXES: dict[str, dict[int, str]] = {
    "components/filters.tsx": {
        50: "  /** Embedded mode: no outer card chrome, used inside drawers */",
        53: "  /** Layout variant: standalone panel, embedded, or full page */",
    },
    "src/widgets/layout/Header.tsx": {
        2: " * App shell header — re-exports landing header with app-specific props.",
        3: " * See landing/app/components/header.",
        8: "  /** Selected city from localStorage; shown when showCitySelector is true */",
        10: "  /** Opens city picker instead of inline selector (SearchPage/ProfilePage) */",
        16: "/** App header: logo, nav, city, auth */",
    },
    "src/pages/EditAdPage.tsx": {
        110: "      {/* Step header — same pattern as CreateAdPage */}",
    },
    "landing/app/components/header.tsx": {
        207: "          {/* Mobile: burger only; rest in MobileBottomNav */}",
        236: "      {/* City modal when parent handles onCityClick */}",
        255: "      {/* Mobile menu overlay above z-40 content */}",
    },
}

for rel, fixes in FIXES.items():
    path = ROOT / rel
    lines = path.read_text(encoding="utf-8").splitlines()
    for ln, new in fixes.items():
        if rel == "src/widgets/layout/Header.tsx" and ln in (2, 3):
            lines[ln - 1] = new
        else:
            lines[ln - 1] = new
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    left = sum(1 for l in lines if "\ufffd" in l)
    print(f"{rel}: {left} FFFD")
