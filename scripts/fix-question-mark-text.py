# -*- coding: utf-8 -*-
"""Fix static UI strings corrupted to question marks."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# (path, old, new) — old must match exactly once per file.
REPLACEMENTS: list[tuple[str, str, str]] = [
    # --- PetDetailPage ---
    (
        "src/pages/PetDetailPage.tsx",
        "alt={photos.length > 1 ? `${alt} ? ???? ${current + 1}` : alt}",
        "alt={photos.length > 1 ? `${alt} — фото ${current + 1}` : alt}",
    ),
    (
        "src/pages/PetDetailPage.tsx",
        "alt={`${alt} ? ????????? ${i + 1}`}",
        "alt={`${alt} — миниатюра ${i + 1}`}",
    ),
    (
        "src/pages/PetDetailPage.tsx",
        "title: '?????????? ?? ??????? | DorogaDomoy.by',",
        "title: 'Объявление не найдено | DorogaDomoy.by',",
    ),
    (
        "src/pages/PetDetailPage.tsx",
        "'?????????? ??????? ??? ?? ??????????. DorogaDomoy.by ? ?????????? ?????? ???????? ? ????????.',",
        "'Объявление удалено или ссылка устарела. DorogaDomoy.by — платформа поиска пропавших и найденных питомцев в Беларуси.',",
    ),
    (
        "src/pages/PetDetailPage.tsx",
        "const title = `${headline} ? ${animal}${breedPart}, ${pet.city} | DorogaDomoy.by`;",
        "const title = `${headline} — ${animal}${breedPart}, ${pet.city} | DorogaDomoy.by`;",
    ),
    (
        "src/pages/PetDetailPage.tsx",
        "const flyerSubtitle = escapeHtml(`${pet.city} ? ${t.pet.animalType[pet.animalType]}`);",
        "const flyerSubtitle = escapeHtml(`${pet.city} · ${t.pet.animalType[pet.animalType]}`);",
    ),
    (
        "src/pages/PetDetailPage.tsx",
        "const flyerDocTitle = escapeHtml(`DorogaDomoy.by ? ${pet.city}`);",
        "const flyerDocTitle = escapeHtml(`DorogaDomoy.by · ${pet.city}`);",
    ),
    (
        "src/pages/PetDetailPage.tsx",
        '<div className="mb-1 text-sm text-muted-foreground">??????????????</div>',
        '<div className="mb-1 text-sm text-muted-foreground">Вознаграждение</div>',
    ),
    (
        "src/pages/PetDetailPage.tsx",
        "{t.pet.animalTypeLabel || '??? ?????????'}",
        "{t.pet.animalTypeLabel}",
    ),
    (
        "src/pages/PetDetailPage.tsx",
        '<span className="mx-1.5 text-border">?</span>',
        '<span className="mx-1.5 text-border">·</span>',
    ),
    (
        "src/pages/PetDetailPage.tsx",
        "{/* ?????????? ? ???????? */}",
        "{/* Статус и награда */}",
    ),
    (
        "src/pages/PetDetailPage.tsx",
        "{/* ?????????? ?????????? */}",
        "{/* Информация об авторе */}",
    ),
    (
        "src/pages/PetDetailPage.tsx",
        "{/* ???????????? */}",
        "{/* Контакты */}",
    ),
    (
        "src/pages/PetDetailPage.tsx",
        "// ?? ???????? noopener ? windowFeatures: ????? window.open ?????????? null,",
        "// Не передаём noopener в windowFeatures: иначе window.open возвращает null,",
    ),
    (
        "src/pages/PetDetailPage.tsx",
        "// ? document.write ?? ??????????? ? ?????? ??? ?????? / QR.",
        "// а document.write не срабатывает — нужен другой способ / QR.",
    ),
    # --- SearchPage ---
    (
        "src/pages/SearchPage.tsx",
        "? `????????? ???? ???????????? ${payload.rewardHelperCode}`",
        "? t.common.toasts.pointsAwardedToUser.replace('{code}', payload.rewardHelperCode)",
    ),
    (
        "src/pages/SearchPage.tsx",
        "petDescription={`${deletingPet.animalType === 'cat' ? '???' : deletingPet.animalType === 'dog' ? '??????' : '????????'} ${deletingPet.breed ? `(${deletingPet.breed})` : ''} - ${deletingPet.city}`}",
        "petDescription={`${t.pet.animalType[deletingPet.animalType]} ${deletingPet.breed ? `(${deletingPet.breed})` : ''} - ${deletingPet.city}`}",
    ),
    # --- ShelterPetDetailPage ---
    (
        "src/pages/ShelterPetDetailPage.tsx",
        "const title = `${pet.name?.trim() || pet.breed || t.pet.animalType[pet.animalType]} ? ??????? ??????`;",
        "const title = `${pet.name?.trim() || pet.breed || t.pet.animalType[pet.animalType]} — питомец приюта`;",
    ),
    (
        "src/pages/ShelterPetDetailPage.tsx",
        "const description = `${adoptionSeo} · ${pet.city}. ???????? ??????? ?? ?????? ?? DorogaDomoy.by`;",
        "const description = `${adoptionSeo} · ${pet.city}. Карточка питомца из приюта на DorogaDomoy.by`;",
    ),
    (
        "src/pages/ShelterPetDetailPage.tsx",
        ": '?';",
        ": '—';",
    ),
    (
        "src/pages/ShelterPetDetailPage.tsx",
        "????",
        "Сбор",
    ),
    (
        "src/pages/ShelterPetDetailPage.tsx",
        "??????? ?????",
        "История сбора",
    ),
    (
        "src/pages/ShelterPetDetailPage.tsx",
        "???? ???????",
        "Сбор средств",
    ),
    (
        "src/pages/ShelterPetDetailPage.tsx",
        "????????? ?????...",
        "Загружаем сборы...",
    ),
    (
        "src/pages/ShelterPetDetailPage.tsx",
        ">???????</span>",
        ">Активен</span>",
    ),
    (
        "src/pages/ShelterPetDetailPage.tsx",
        "??????: ",
        "Цель: ",
    ),
    (
        "src/pages/ShelterPetDetailPage.tsx",
        "???????: ",
        "Собрано: ",
    ),
    (
        "src/pages/ShelterPetDetailPage.tsx",
        "????????: ",
        "Прогресс: ",
    ),
    (
        "src/pages/ShelterPetDetailPage.tsx",
        "?????????: ",
        "Обновлено: ",
    ),
    (
        "src/pages/ShelterPetDetailPage.tsx",
        "????: ?? ",
        "Срок: до ",
    ),
    (
        "src/pages/ShelterPetDetailPage.tsx",
        "'?????? ?????????'",
        "'Скрыть реквизиты'",
    ),
    (
        "src/pages/ShelterPetDetailPage.tsx",
        "'??? ??????'",
        "'Как помочь'",
    ),
    (
        "src/pages/ShelterPetDetailPage.tsx",
        "'????? ???? ?? ??????? ?????????? ?? ????????.'",
        "'Приют пока не добавил инструкцию по переводу.'",
    ),
    (
        "src/pages/ShelterPetDetailPage.tsx",
        "????????? ????? ???? ???.",
        "Активного сбора пока нет.",
    ),
    (
        "src/pages/ShelterPetDetailPage.tsx",
        "??????? ??????",
        "История сборов",
    ),
    (
        "src/pages/ShelterPetDetailPage.tsx",
        ">????????</span>",
        ">Завершён</span>",
    ),
    (
        "src/pages/ShelterPetDetailPage.tsx",
        "???????: ",
        "Причина: ",
    ),
    (
        "src/pages/ShelterPetDetailPage.tsx",
        'aria-label="?????????? ???????"',
        'aria-label="Предыдущий питомец"',
    ),
    (
        "src/pages/ShelterPetDetailPage.tsx",
        'aria-label="????????? ???????"',
        'aria-label="Следующий питомец"',
    ),
    (
        "src/pages/ShelterPetDetailPage.tsx",
        ">??? ????</div>",
        ">Нет фото</div>",
    ),
    (
        "src/pages/ShelterPetDetailPage.tsx",
        'aria-label="?????????? ????"',
        'aria-label="Предыдущее фото"',
    ),
    (
        "src/pages/ShelterPetDetailPage.tsx",
        'aria-label="????????? ????"',
        'aria-label="Следующее фото"',
    ),
    (
        "src/pages/ShelterPetDetailPage.tsx",
        "aria-label={`???? ${idx + 1}`}",
        "aria-label={`Фото ${idx + 1}`}",
    ),
    (
        "src/pages/ShelterPetDetailPage.tsx",
        'aria-label="??????? ??????? ???????"',
        'aria-label="Разделы профиля питомца"',
    ),
    (
        "src/pages/ShelterPetDetailPage.tsx",
        "? ???????",
        "О питомце",
    ),
    (
        "src/pages/ShelterPetDetailPage.tsx",
        ">? ???????</h2>",
        ">О питомце</h2>",
    ),
    (
        "src/pages/ShelterPetDetailPage.tsx",
        ". ????????: ${health}`",
        ". Здоровье: ${health}`",
    ),
    (
        "src/pages/ShelterPetDetailPage.tsx",
        "title={`????????: ${health}`}",
        "title={`Здоровье: ${health}`}",
    ),
    (
        "src/pages/ShelterPetDetailPage.tsx",
        "??????: ",
        "Шерсть: ",
    ),
    (
        "src/pages/ShelterPetDetailPage.tsx",
        ">????????</h2>",
        ">Контакты</h2>",
    ),
    (
        "src/pages/ShelterPetDetailPage.tsx",
        "???????? ??????",
        "Страница приюта",
    ),
    (
        "src/pages/ShelterPetDetailPage.tsx",
        "???? ??????",
        "Сайт организации",
    ),
    (
        "src/pages/ShelterPetDetailPage.tsx",
        "? ???????? ??????? ?? ??????? ??????? ? ??????????? ? ???????? ?????",
        "У организации пока нет прямых контактов — напишите через страницу приюта",
    ),
    (
        "src/pages/ShelterPetDetailPage.tsx",
        "<>???????? ????????, ????? ?? ??????? ?????.</>",
        "<>Контакты не указаны, свяжитесь через приют.</>",
    ),
    (
        "src/pages/ShelterPetDetailPage.tsx",
        "|| '?'",
        "|| '—'",
    ),
]


def read_text(path: Path) -> str:
    raw = path.read_bytes()
    try:
        return raw.decode("utf-8")
    except UnicodeDecodeError:
        return raw.decode("cp1251")


def main() -> None:
    total = 0
    for rel, old, new in REPLACEMENTS:
        path = ROOT / rel
        if not path.exists():
            print(f"missing {rel}")
            continue
        text = read_text(path)
        count = text.count(old)
        if count == 0:
            print(f"skip (not found) {rel}: {old[:60]}...")
            continue
        if count > 1 and old in ("????", ": '?';", "??????? ?????", "???? ??????"):
            text = text.replace(old, new)
        elif count != 1:
            print(f"warn {count}x in {rel}: {old[:60]}...")
            text = text.replace(old, new)
        else:
            text = text.replace(old, new)
        path.write_text(text, encoding="utf-8")
        total += count
        print(f"fixed {rel}: {old[:50]!r} -> {new[:50]!r}")

    print(f"total replacements: {total}")


if __name__ == "__main__":
    main()
