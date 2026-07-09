"""Extract PetDetailPage.tsx sections into src/pages/pet-detail/ modules."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src" / "pages" / "PetDetailPage.tsx"
OUT = ROOT / "src" / "pages" / "pet-detail"


def compact(text: str) -> str:
    lines = [ln for ln in text.splitlines() if ln.strip()]
    return "\n".join(lines)


def slice_lines(start: int, end: int) -> str:
    lines = SOURCE.read_text(encoding="utf-8").splitlines()
    return compact("\n".join(lines[start - 1 : end]))


def write(name: str, content: str) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / name
    path.write_text(content.rstrip() + "\n", encoding="utf-8")
    print(f"  {name} ({len(path.read_text(encoding='utf-8').splitlines())} lines)")


def main() -> None:
    helpers = slice_lines(94, 174)
    helpers = helpers.replace("const PRINT_PLACEHOLDER_IMAGE = PLACEHOLDER_PRINT_FLYER;\n\n", "")
    write(
        "pet-detail-helpers.ts",
        '''import type { SightingItem } from '@/shared/api/client';
import { PLACEHOLDER_PRINT_FLYER } from '@/shared/lib/placeholder-images';

export const PRINT_PLACEHOLDER_IMAGE = PLACEHOLDER_PRINT_FLYER;

''' + helpers,
    )

    map_src = slice_lines(176, 272)
    write(
        "pet-detail-map.tsx",
        '''import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Pet } from '@/entities/pet/model/types';
import type { SightingItem } from '@/shared/api/client';
import { getPetPhotoCircleDivIcon, SIGHTING_MARKER_BORDER_COLOR } from '@/shared/lib/leaflet-pet-photo-icon';
import { createSightingPopupContent } from './pet-detail-helpers';

''' + map_src,
    )

    carousel = slice_lines(274, 440)
    write(
        "pet-detail-image-carousel.tsx",
        '''import { useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/ui/utils';

''' + carousel,
    )

    print("done")


if __name__ == "__main__":
    main()
