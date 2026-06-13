# -*- coding: utf-8 -*-
"""Restore corrupted Cyrillic string literals in src/pages from git pages/ versions."""
from __future__ import annotations

import re
import subprocess
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
FILES = [
    ("pages/PetDetailPage.tsx", "src/pages/PetDetailPage.tsx"),
    ("pages/SearchPage.tsx", "src/pages/SearchPage.tsx"),
    ("pages/ShelterPetDetailPage.tsx", "src/pages/ShelterPetDetailPage.tsx"),
]

CYRILLIC = re.compile(r"[\u0400-\u04FF\u2014\u00ab\u00bb]")


def normalize(line: str) -> str:
    line = CYRILLIC.sub("?", line)
    line = re.sub(r"\?+", "?", line)
    return line


def is_corrupted(line: str) -> bool:
    if "?" not in line:
        return False
    if CYRILLIC.search(line):
        return False
    return any(q in line for q in ("'", '"', "`"))


def git_show(path: str) -> str:
    return subprocess.check_output(
        ["git", "show", f"HEAD:{path}"],
        cwd=ROOT,
        text=True,
        encoding="utf-8",
    )


def fix_file(git_path: str, tgt_path: str) -> int:
    git_lines = git_show(git_path).splitlines()
    tgt_file = ROOT / tgt_path
    if not tgt_file.exists():
        print(f"skip missing {tgt_path}")
        return 0

    tgt_text = tgt_file.read_text(encoding="utf-8", errors="replace")
    tgt_lines = tgt_text.splitlines()
    changed = 0

    for gl in git_lines:
        if not CYRILLIC.search(gl):
            continue
        g_norm = normalize(gl)
        for i, tl in enumerate(tgt_lines):
            if not is_corrupted(tl):
                continue
            if normalize(tl) != g_norm:
                continue
            if tl != gl:
                tgt_lines[i] = gl
                changed += 1
            break

    if changed:
        newline = "\n" if tgt_text.endswith("\n") else ""
        tgt_file.write_text("\n".join(tgt_lines) + newline, encoding="utf-8")
    print(f"{tgt_path}: {changed} lines fixed")
    return changed


def main() -> None:
    total = 0
    for git_path, tgt_path in FILES:
        total += fix_file(git_path, tgt_path)

    # Lines that diverged structurally (typo-h2 vs text-2xl) — fix by ASCII anchor.
    anchor_fixes = [
        ("src/pages/ShelterPetDetailPage.tsx", "const description = `${adoptionSeo} ? ${pet.city}. ???????? ??????? ?? ?????? ?? DorogaDomoy.by`;", "const description = `${adoptionSeo} · ${pet.city}. Карточка питомца из приюта на DorogaDomoy.by`;"),
        ("src/pages/ShelterPetDetailPage.tsx", "          ????\n        </button>\n        <button\n          type=\"button\"\n          onClick={() => setFundraisingPanel('fundraising_history')", "          Сбор\n        </button>\n        <button\n          type=\"button\"\n          onClick={() => setFundraisingPanel('fundraising_history')"),
        ("src/pages/ShelterPetDetailPage.tsx", "          ??????? ?????\n        </button>\n      </div>\n\n      {showCampaign", "          История сбора\n        </button>\n      </div>\n\n      {showCampaign"),
        ("src/pages/ShelterPetDetailPage.tsx", "<h2 className=\"typo-h2\">???? ???????</h2>", "<h2 className=\"typo-h2\">Сбор средств</h2>"),
        ("src/pages/ShelterPetDetailPage.tsx", "                ?????????: {formatCalendarDate(new Date(currentCampaign.updated_at))}", "                Обновлено: {formatCalendarDate(new Date(currentCampaign.updated_at))}"),
        ("src/pages/ShelterPetDetailPage.tsx", "                  ????: ?? {formatCalendarDate(currentCampaignEndsAt)}", "                  Срок: до {formatCalendarDate(currentCampaignEndsAt)}"),
        ("src/pages/ShelterPetDetailPage.tsx", "<h2 className=\"typo-h2\">??????? ??????</h2>", "<h2 className=\"typo-h2\">История сборов</h2>"),
        ("src/pages/ShelterPetDetailPage.tsx", "                      ???????: {item.close_reason}", "                      Причина: {item.close_reason}"),
        ("src/pages/ShelterPetDetailPage.tsx", "                ? ???????\n              </button>", "                О питомце\n              </button>"),
        ("src/pages/ShelterPetDetailPage.tsx", "                ????\n              </button>\n              <button\n                type=\"button\"\n                role=\"tab\"\n                aria-selected={mobileTab === 'fundraising_history'}", "                Сбор\n              </button>\n              <button\n                type=\"button\"\n                role=\"tab\"\n                aria-selected={mobileTab === 'fundraising_history'}"),
        ("src/pages/ShelterPetDetailPage.tsx", "                ??????? ?????\n              </button>\n            </div>", "                История сбора\n              </button>\n            </div>"),
        ("src/pages/ShelterPetDetailPage.tsx", "<h2 className=\"typo-h2 mb-4 max-lg:hidden\">? ???????</h2>", "<h2 className=\"typo-h2 mb-4 max-lg:hidden\">О питомце</h2>"),
        ("src/pages/ShelterPetDetailPage.tsx", "<h2 className=\"typo-h2 mb-4\">????????</h2>", "<h2 className=\"typo-h2 mb-4\">Контакты</h2>"),
        ("src/pages/ShelterPetDetailPage.tsx", "                        ???????? ??????\n                      </Link>\n                    </div>\n                  </div>\n                </div>\n              ) : null}\n              <div className=\"space-y-3\">", "                        Страница приюта\n                      </Link>\n                    </div>\n                  </div>\n                </div>\n              ) : null}\n              <div className=\"space-y-3\">"),
        ("src/pages/ShelterPetDetailPage.tsx", "                      ???? ??????\n                    </a>\n                  </Button>\n                ) : null}\n                {!hasContactChannels", "                      Сайт приюта\n                    </a>\n                  </Button>\n                ) : null}\n                {!hasContactChannels"),
        ("src/pages/ShelterPetDetailPage.tsx", "                          ???????? ??????\n                        </Link>", "                          страницу приюта\n                        </Link>"),
    ]

    for rel_path, old, new in anchor_fixes:
        path = ROOT / rel_path
        text = path.read_text(encoding="utf-8")
        if old in text:
            path.write_text(text.replace(old, new, 1), encoding="utf-8")
            total += 1
            print(f"{rel_path}: manual fix")

    print(f"total: {total}")


if __name__ == "__main__":
    main()
