"""Метаданные OG / Schema.org и crawl-HTML для публичных страниц (без полного SSR)."""
from __future__ import annotations

import html
import json
import os
import re
from dataclasses import dataclass
from typing import Any, Optional
from urllib.parse import quote

SITE_URL = (os.getenv("SITE_URL") or "https://dorogadomoy.by").rstrip("/")

ANIMAL_TYPE_LABELS_RU = {"dog": "собака", "cat": "кошка", "other": "животное"}
ANIMAL_TYPE_LABELS_TITLE = {"dog": "Собака", "cat": "Кошка", "other": "Животное"}
STATUS_HEADLINE = {
    "searching": "Пропал питомец",
    "found": "Найден питомец",
}
SHELTER_HEADLINE = "Ищет дом"

_CYR_TO_LAT = {
    "а": "a",
    "б": "b",
    "в": "v",
    "г": "g",
    "д": "d",
    "е": "e",
    "ё": "e",
    "ж": "zh",
    "з": "z",
    "и": "i",
    "й": "y",
    "к": "k",
    "л": "l",
    "м": "m",
    "н": "n",
    "о": "o",
    "п": "p",
    "р": "r",
    "с": "s",
    "т": "t",
    "у": "u",
    "ф": "f",
    "х": "h",
    "ц": "ts",
    "ч": "ch",
    "ш": "sh",
    "щ": "sch",
    "ъ": "",
    "ы": "y",
    "ь": "",
    "э": "e",
    "ю": "yu",
    "я": "ya",
    "і": "i",
    "ў": "u",
    "ґ": "g",
}

# Областные центры — стабильные slug для sitemap / ссылок
CITY_SLUG_BY_NAME: dict[str, str] = {
    "Минск": "minsk",
    "Брест": "brest",
    "Витебск": "vitebsk",
    "Гомель": "gomel",
    "Гродно": "grodno",
    "Могилёв": "mogilev",
    "Могилев": "mogilev",
}

NAME_BY_CITY_SLUG: dict[str, str] = {
    "minsk": "Минск",
    "brest": "Брест",
    "vitebsk": "Витебск",
    "gomel": "Гомель",
    "grodno": "Гродно",
    "mogilev": "Могилёв",
}


@dataclass(frozen=True)
class PageSeo:
    title: str
    description: str
    canonical_path: str
    image_url: str
    og_type: str = "website"
    robots: str = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
    json_ld: Optional[dict[str, Any]] = None
    crawl_html: str = ""
    status_code: int = 200


def escape_attr(value: str) -> str:
    return html.escape(value or "", quote=True)


def escape_text(value: str) -> str:
    return html.escape(value or "", quote=False)


def truncate_text(text: str, max_len: int = 158) -> str:
    flat = re.sub(r"\s+", " ", (text or "").strip())
    if len(flat) <= max_len:
        return flat
    return flat[: max_len - 1].rstrip() + "…"


def absolute_url(path_or_url: str) -> str:
    raw = (path_or_url or "").strip()
    if not raw:
        return f"{SITE_URL}/logo.png"
    if raw.startswith("http://") or raw.startswith("https://"):
        return raw
    if raw.startswith("//"):
        return f"https:{raw}"
    if raw.startswith("/api/uploads/"):
        raw = raw.replace("/api/uploads/", "/uploads/", 1)
    if not raw.startswith("/"):
        raw = f"/{raw}"
    return f"{SITE_URL}{raw}"


def default_og_image() -> str:
    return f"{SITE_URL}/logo.png"


def city_slug(name: str) -> str:
    cleaned = (name or "").strip()
    if not cleaned:
        return ""
    known = CITY_SLUG_BY_NAME.get(cleaned)
    if known:
        return known
    # ё→е до lower, чтобы «Могилёв» без карты тоже давал mogilev
    normalized = cleaned.lower().replace("ё", "е")
    out: list[str] = []
    for ch in normalized:
        if ch in _CYR_TO_LAT:
            out.append(_CYR_TO_LAT[ch])
        elif "a" <= ch <= "z" or "0" <= ch <= "9":
            out.append(ch)
        elif ch in {" ", "-", "_"}:
            out.append("-")
        # прочие символы пропускаем
    slug = re.sub(r"-{2,}", "-", "".join(out)).strip("-")
    return slug


def city_name_from_slug(slug: str) -> Optional[str]:
    key = (slug or "").strip().lower()
    if not key:
        return None
    return NAME_BY_CITY_SLUG.get(key)


def first_photo_url(photos: Any) -> str:
    if isinstance(photos, list) and photos:
        first = photos[0]
        if isinstance(first, str) and first.strip():
            return absolute_url(first.strip())
    return default_og_image()


def pet_page_seo(
    *,
    pet_id: str,
    status: str,
    animal_type: str,
    breed: Optional[str],
    city: str,
    description: str,
    photos: Any,
    pet_scope: str = "lost_found",
    nickname: Optional[str] = None,
    published_iso: Optional[str] = None,
    path_prefix: str = "pet",
) -> PageSeo:
    animal = ANIMAL_TYPE_LABELS_TITLE.get(animal_type, "Животное")
    animal_l = ANIMAL_TYPE_LABELS_RU.get(animal_type, "животное")
    is_shelter = (pet_scope or "lost_found") == "shelter_pet"
    if is_shelter:
        headline = SHELTER_HEADLINE
        name_bit = (nickname or "").strip()
        title_core = f"{headline}: {name_bit}, {animal}" if name_bit else f"{headline}: {animal}"
    else:
        headline = STATUS_HEADLINE.get(status, "Объявление")
        title_core = f"{headline}: {animal}"
    breed_bit = f", {breed}" if (breed or "").strip() else ""
    city_bit = (city or "").strip() or "Беларусь"
    title = f"{title_core}{breed_bit}, {city_bit} | DorogaDomoy.by"
    desc_src = (
        f"{headline}. {animal}, {city_bit}. {description or ''}".strip()
        if not is_shelter
        else f"{headline}. {animal}{breed_bit}, {city_bit}. {description or ''}".strip()
    )
    desc = truncate_text(desc_src)
    image = first_photo_url(photos)
    path = f"/{path_prefix}/{quote(pet_id, safe='')}"
    page_url = f"{SITE_URL}{path}"

    schema: dict[str, Any] = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": title_core,
        "url": page_url,
        "description": desc,
        "inLanguage": "ru",
        "isPartOf": {
            "@type": "WebSite",
            "name": "DorogaDomoy.by",
            "url": f"{SITE_URL}/",
        },
        "about": {
            "@type": "Thing",
            "name": f"{animal} — {city_bit}",
        },
    }
    if published_iso:
        schema["datePublished"] = published_iso
    if image and image != default_og_image():
        schema["primaryImageOfPage"] = {"@type": "ImageObject", "url": image}

    status_line = (
        "Ищет дом в приюте"
        if is_shelter
        else ("Пропал" if status == "searching" else "Найден")
    )
    breed_line = escape_text((breed or "").strip())
    crawl = (
        f"<h1>{escape_text(title_core)}{escape_text(breed_bit)}, {escape_text(city_bit)}</h1>"
        f"<p><strong>{escape_text(status_line)}</strong> · {escape_text(animal_l)} · {escape_text(city_bit)}</p>"
        f"{f'<p>Порода: {breed_line}</p>' if breed_line else ''}"
        f"<p>{escape_text(truncate_text(description or '', 500))}</p>"
        f'<p><img src="{escape_attr(image)}" alt="{escape_attr(title_core)}" width="600" /></p>'
        f'<p><a href="{escape_attr(page_url)}">Открыть объявление на DorogaDomoy.by</a></p>'
        f'<p><a href="/search?city={quote(city_bit)}">Все объявления: {escape_text(city_bit)}</a> · '
        f'<a href="/">На главную</a></p>'
    )

    return PageSeo(
        title=title,
        description=desc,
        canonical_path=path,
        image_url=image,
        og_type="article",
        json_ld=schema,
        crawl_html=crawl,
        status_code=200,
    )


def city_page_seo(
    *,
    city_name: str,
    slug: str,
    pet_summaries: list[dict[str, str]],
) -> PageSeo:
    title = f"Пропавшие и найденные животные — {city_name} | DorogaDomoy.by"
    desc = truncate_text(
        f"Объявления о пропавших и найденных собаках и кошках в городе {city_name}. "
        f"Карта, фото и контакты на DorogaDomoy.by."
    )
    path = f"/city/{slug}"
    page_url = f"{SITE_URL}{path}"
    items_html = ""
    for row in pet_summaries[:12]:
        href = escape_attr(row.get("url") or "#")
        label = escape_text(row.get("label") or "Объявление")
        items_html += f"<li><a href=\"{href}\">{label}</a></li>"
    if not items_html:
        items_html = "<li>Пока нет активных объявлений — разместите первое.</li>"

    crawl = (
        f"<h1>Пропавшие и найденные животные в городе {escape_text(city_name)}</h1>"
        f"<p>{escape_text(desc)}</p>"
        f"<ul>{items_html}</ul>"
        f'<p><a href="/search?city={quote(city_name)}">Открыть карту объявлений</a> · '
        f'<a href="/create">Сообщить о пропаже или находке</a></p>'
    )
    schema = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": title,
        "url": page_url,
        "description": desc,
        "inLanguage": "ru",
        "isPartOf": {
            "@type": "WebSite",
            "name": "DorogaDomoy.by",
            "url": f"{SITE_URL}/",
        },
    }
    return PageSeo(
        title=title,
        description=desc,
        canonical_path=path,
        image_url=default_og_image(),
        og_type="website",
        json_ld=schema,
        crawl_html=crawl,
        status_code=200,
    )


def not_found_seo(*, path: str, kind: str = "Объявление") -> PageSeo:
    title = f"{kind} не найдено | DorogaDomoy.by"
    desc = (
        f"{kind} удалено или недоступно. DorogaDomoy.by — поиск пропавших и найденных животных в Беларуси."
    )
    return PageSeo(
        title=title,
        description=desc,
        canonical_path=path,
        image_url=default_og_image(),
        og_type="website",
        robots="noindex, nofollow",
        crawl_html=(
            f"<h1>{escape_text(kind)} не найдено</h1>"
            f"<p>{escape_text(desc)}</p>"
            '<p><a href="/search">К карте объявлений</a> · <a href="/">На главную</a></p>'
        ),
        status_code=404,
    )


def build_meta_block(seo: PageSeo) -> str:
    canonical = f"{SITE_URL}{seo.canonical_path}"
    tags = [
        f'<title>{escape_text(seo.title)}</title>',
        f'<meta name="description" content="{escape_attr(seo.description)}" />',
        f'<meta name="robots" content="{escape_attr(seo.robots)}" />',
        f'<link rel="canonical" href="{escape_attr(canonical)}" />',
        f'<meta property="og:site_name" content="DorogaDomoy.by" />',
        f'<meta property="og:locale" content="ru_BY" />',
        f'<meta property="og:type" content="{escape_attr(seo.og_type)}" />',
        f'<meta property="og:title" content="{escape_attr(seo.title)}" />',
        f'<meta property="og:description" content="{escape_attr(seo.description)}" />',
        f'<meta property="og:url" content="{escape_attr(canonical)}" />',
        f'<meta property="og:image" content="{escape_attr(seo.image_url)}" />',
        f'<meta property="og:image:alt" content="{escape_attr(seo.title)}" />',
        f'<meta name="twitter:card" content="summary_large_image" />',
        f'<meta name="twitter:title" content="{escape_attr(seo.title)}" />',
        f'<meta name="twitter:description" content="{escape_attr(seo.description)}" />',
        f'<meta name="twitter:image" content="{escape_attr(seo.image_url)}" />',
    ]
    if seo.json_ld:
        payload = json.dumps(seo.json_ld, ensure_ascii=False, separators=(",", ":"))
        tags.append(f'<script type="application/ld+json">{payload}</script>')
    return "\n    ".join(tags)


_TITLE_RE = re.compile(r"<title\b[^>]*>.*?</title>", re.I | re.S)
_DESC_RE = re.compile(
    r'<meta\s+[^>]*name=["\']description["\'][^>]*/?>',
    re.I,
)
_ROBOTS_RE = re.compile(
    r'<meta\s+[^>]*name=["\']robots["\'][^>]*/?>',
    re.I,
)
_CANONICAL_RE = re.compile(r'<link\s+[^>]*rel=["\']canonical["\'][^>]*/?>', re.I)
_OG_TWITTER_RE = re.compile(
    r'<meta\s+[^>]*(?:property=["\']og:[^"\']+["\']|name=["\']twitter:[^"\']+["\'])[^>]*/?>',
    re.I,
)
_JSONLD_RE = re.compile(
    r'<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>.*?</script>',
    re.I | re.S,
)
_CRAWL_RE = re.compile(
    r'(<article\b[^>]*id=["\']crawl-fallback["\'][^>]*>)(.*?)(</article>)',
    re.I | re.S,
)


def inject_seo_into_html(shell_html: str, seo: PageSeo) -> str:
    """Вставляет title/description/OG/JSON-LD и crawl-текст в shell SPA."""
    html_out = shell_html
    meta_block = build_meta_block(seo)

    html_out = _TITLE_RE.sub("", html_out, count=1)
    html_out = _DESC_RE.sub("", html_out, count=1)
    html_out = _ROBOTS_RE.sub("", html_out, count=1)
    html_out = _CANONICAL_RE.sub("", html_out, count=1)
    html_out = _OG_TWITTER_RE.sub("", html_out)
    html_out = _JSONLD_RE.sub("", html_out)

    if re.search(r"</head>", html_out, re.I):
        html_out = re.sub(
            r"</head>",
            f"    {meta_block}\n  </head>",
            html_out,
            count=1,
            flags=re.I,
        )
    else:
        html_out = meta_block + "\n" + html_out

    crawl_inner = seo.crawl_html or ""
    if _CRAWL_RE.search(html_out):
        html_out = _CRAWL_RE.sub(
            rf"\1\n        {crawl_inner}\n      \3",
            html_out,
            count=1,
        )
    elif re.search(r'<div\s+id=["\']root["\']\s*>', html_out, re.I):
        article = (
            f'<article id="crawl-fallback" style="padding:2rem 1.25rem;max-width:42rem;'
            f'margin:0 auto;font-family:system-ui,sans-serif;line-height:1.55;">'
            f"{crawl_inner}</article>"
        )
        html_out = re.sub(
            r'(<div\s+id=["\']root["\']\s*>)',
            rf"\1\n      {article}\n",
            html_out,
            count=1,
            flags=re.I,
        )

    return html_out


FALLBACK_SHELL = """<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/png" href="/logo.png" />
    <meta name="theme-color" content="#FF9800" />
  </head>
  <body>
    <div id="root">
      <article id="crawl-fallback"></article>
    </div>
    <p style="padding:1rem;font-family:system-ui,sans-serif;">
      <a href="/">DorogaDomoy.by</a> — включите JavaScript для полного интерфейса.
    </p>
  </body>
</html>
"""
