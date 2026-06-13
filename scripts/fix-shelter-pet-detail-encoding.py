# -*- coding: utf-8 -*-
"""Fix corrupted Cyrillic placeholders in ShelterPetDetailPage.tsx."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "src/pages/ShelterPetDetailPage.tsx"

REPLACEMENTS: list[tuple[str, str]] = [
    (
        "const title = `${pet.name?.trim() || pet.breed || t.pet.animalType[pet.animalType]} ? ??????? ??????`;",
        "const title = `${pet.name?.trim() || pet.breed || t.pet.animalType[pet.animalType]} — ищет дом`;",
    ),
    (
        "const description = `${adoptionSeo} · ${pet.city}. ???????? ??????? ?? ?????? ?? DorogaDomoy.by`;",
        "const description = `${adoptionSeo} · ${pet.city}. Узнайте больше о питомце на DorogaDomoy.by`;",
    ),
    (
        "{currentCampaign.help_details?.trim() || '????? ???? ?? ??????? ?????????? ?? ????????.'}",
        "{currentCampaign.help_details?.trim() || 'Реквизиты пока не указаны организацией.'}",
    ),
    (
        "{showHelpDetails ? '?????? ?????????' : '??? ??????'}",
        "{showHelpDetails ? 'Скрыть реквизиты' : 'Как помочь'}",
    ),
    (
        "? ???????? ??????? ?? ??????? ??????? ? ??????????? ? ???????? ?????{' '}",
        "У организации нет прямых контактов — напишите через{' '}",
    ),
    (
        "<>???????? ????????, ????? ?? ??????? ?????.</>",
        "<>{t.landing.shelters.detailNoContacts}</>",
    ),
    (
        'aria-label={`${t.pet.genderLabel}: ${t.pet.gender[pet.gender]}. ????????: ${health}`}',
        'aria-label={`${t.pet.genderLabel}: ${t.pet.gender[pet.gender]}. Здоровье: ${health}`}',
    ),
    (
        'aria-label="??????? ??????? ???????"',
        'aria-label="Разделы карточки питомца"',
    ),
    (
        'aria-label="?????????? ???????"',
        "aria-label={t.nav.prevPet}",
    ),
    (
        'aria-label="????????? ???????"',
        "aria-label={t.nav.nextPet}",
    ),
    (
        'aria-label="?????????? ????"',
        "aria-label={t.match.card.photoPrev}",
    ),
    (
        'aria-label="????????? ????"',
        "aria-label={t.match.card.photoNext}",
    ),
    (
        "aria-label={`???? ${idx + 1}`}",
        "aria-label={t.shelterPet.photoAlt.replace('{name}', title).replace('{n}', String(idx + 1))}",
    ),
    (
        '<h2 className="typo-h2 mb-4 max-lg:hidden">? ???????</h2>',
        '<h2 className="typo-h2 mb-4 max-lg:hidden">О питомце</h2>',
    ),
    (
        '<h2 className="typo-h2 mb-4">????????</h2>',
        '<h2 className="typo-h2 mb-4">{t.landing.shelters.detailContacts}</h2>',
    ),
    (
        '<h2 className="typo-h2">??????? ??????</h2>',
        '<h2 className="typo-h2">История сборов</h2>',
    ),
    (
        '<h2 className="typo-h2">???? ???????</h2>',
        '<h2 className="typo-h2">Текущий сбор</h2>',
    ),
    (
        "                        ???????? ??????",
        "                        {t.backQuickMenu.shelterPage}",
    ),
    (
        "                          ???????? ??????",
        "                          {t.backQuickMenu.shelterPage}",
    ),
    (
        "                      ???????: {item.close_reason}",
        "                      Причина: {item.close_reason}",
    ),
    (
        "                ?????????: {formatCalendarDate(new Date(currentCampaign.updated_at))}",
        "                Обновлено: {formatCalendarDate(new Date(currentCampaign.updated_at))}",
    ),
    (
        "                  ????: ?? {formatCalendarDate(currentCampaignEndsAt)}",
        "                  Срок: до {formatCalendarDate(currentCampaignEndsAt)}",
    ),
    (
        "            <p className=\"mt-3 text-sm text-muted-foreground\">????????? ?????...</p>",
        "            <p className=\"mt-3 text-sm text-muted-foreground\">Загрузка сбора...</p>",
    ),
    (
        "              <p className=\"text-muted-foreground\">????????? ????? ???? ???.</p>",
        "              <p className=\"text-muted-foreground\">Активного сбора пока нет.</p>",
    ),
    (
        "                <span className=\"rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary\">???????</span>",
        "                <span className=\"rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary\">Активный</span>",
    ),
    (
        "                    <span className=\"text-xs text-muted-foreground\">????????</span>",
        "                    <span className=\"text-xs text-muted-foreground\">Завершён</span>",
    ),
    (
        "                  <div className=\"flex size-full items-center justify-center text-muted-foreground\">??? ????</div>",
        "                  <div className=\"flex size-full items-center justify-center text-muted-foreground\">{t.match.card.noPhoto}</div>",
    ),
    (
        "                  <p><span className=\"text-muted-foreground\">??????: </span>{coat}</p>",
        "                  <p><span className=\"text-muted-foreground\">Шерсть: </span>{coat}</p>",
    ),
    (
        "                <p><span className=\"text-muted-foreground\">????????: </span>{progressPercent}%</p>",
        "                <p><span className=\"text-muted-foreground\">Прогресс: </span>{progressPercent}%</p>",
    ),
    (
        "                <p><span className=\"text-muted-foreground\">???????: </span>{currentCampaign.collected_amount} BYN</p>",
        "                <p><span className=\"text-muted-foreground\">Собрано: </span>{currentCampaign.collected_amount} BYN</p>",
    ),
    (
        "                <p><span className=\"text-muted-foreground\">????: </span>{currentCampaign.goal_amount} BYN</p>",
        "                <p><span className=\"text-muted-foreground\">Цель: </span>{currentCampaign.goal_amount} BYN</p>",
    ),
    (
        "                      <span title={`????????: ${health}`} className=\"inline-flex text-rose-500\">",
        "                      <span title={`Здоровье: ${health}`} className=\"inline-flex text-rose-500\">",
    ),
    ("Сбор??? ?????", "История сборов"),
]

# 1-based line numbers for stubborn single-line labels.
LINE_FIXES: dict[int, str] = {
    520: "          Сбор",
    532: "          История сборов",
    734: "                О питомце",
    748: "                Сбор",
    762: "                История сборов",
    1021: "                      Открыть сайт",
}


def main() -> None:
    raw = TARGET.read_bytes()
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        text = raw.decode("cp1251")

    for old, new in REPLACEMENTS:
        text = text.replace(old, new)

    lines = text.splitlines()
    for line_no, content in LINE_FIXES.items():
        if 1 <= line_no <= len(lines):
            lines[line_no - 1] = content
    text = "\n".join(lines) + "\n"

    remain = [
        (i + 1, line.strip())
        for i, line in enumerate(text.splitlines())
        if "???" in line and not line.strip().startswith("//")
    ]

    TARGET.write_text(text, encoding="utf-8", newline="\n")
    print(f"remain={len(remain)}")
    for ln, line in remain:
        print(f"  {ln}: {line[:120]}")


if __name__ == "__main__":
    main()
