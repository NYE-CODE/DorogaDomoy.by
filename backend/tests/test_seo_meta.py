"""Тесты OG / crawl HTML без полного SSR."""
from seo_meta import (
    blog_list_seo,
    blog_page_seo,
    city_name_from_slug,
    city_page_seo,
    city_slug,
    default_og_image,
    inject_seo_into_html,
    pet_page_seo,
    search_list_seo,
    shelter_page_seo,
    shelters_list_seo,
    truncate_text,
)


SHELL = """<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <title>Old title</title>
    <meta name="description" content="old" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="https://dorogadomoy.by/" />
  </head>
  <body>
    <div id="root">
      <article id="crawl-fallback">fallback</article>
    </div>
  </body>
</html>
"""


def test_city_slug_regional_centers():
    assert city_slug("Минск") == "minsk"
    assert city_slug("Могилёв") == "mogilev"
    assert city_name_from_slug("gomel") == "Гомель"


def test_truncate_text():
    assert truncate_text("abc", 10) == "abc"
    assert truncate_text("a" * 200, 20).endswith("…")
    assert len(truncate_text("a" * 200, 20)) == 20


def test_pet_page_seo_and_inject():
    seo = pet_page_seo(
        pet_id="pet-1",
        status="searching",
        animal_type="dog",
        breed="лабрадор",
        city="Минск",
        description="Рыжий пёс, пропал у Парка Челюскинцев.",
        photos=["/uploads/dog.jpg"],
    )
    assert "Пропал питомец" in seo.title
    assert "Минск" in seo.title
    assert seo.image_url.endswith("/uploads/dog.jpg")
    assert 'og:image' in seo.crawl_html or "dog.jpg" in seo.crawl_html

    html = inject_seo_into_html(SHELL, seo)
    assert "og:title" in html
    assert "og:image" in html
    assert "https://dorogadomoy.by/uploads/dog.jpg" in html
    assert "application/ld+json" in html
    assert "Рыжий пёс" in html
    assert "Old title" not in html


def test_city_page_seo():
    seo = city_page_seo(
        city_name="Минск",
        slug="minsk",
        pet_summaries=[{"url": "/pet/1", "label": "Пропал: Собака, Минск"}],
    )
    assert seo.canonical_path == "/city/minsk"
    html = inject_seo_into_html(SHELL, seo)
    assert "/city/minsk" in html
    assert "Пропавшие и найденные" in html


def test_blog_page_seo():
    seo = blog_page_seo(
        slug="kak-iskat-sobaku",
        title="Как искать пропавшую собаку",
        excerpt="Пошаговая инструкция",
        body_md="## Шаг 1\n\nПроверьте [карту](/search).",
        meta_description=None,
        cover_image_url="/uploads/cover.jpg",
        published_iso="2026-01-01T12:00:00Z",
    )
    assert seo.canonical_path == "/blog/kak-iskat-sobaku"
    assert "Article" in str(seo.json_ld)
    html = inject_seo_into_html(SHELL, seo)
    assert "Как искать пропавшую собаку" in html
    assert "application/ld+json" in html


def test_shelter_page_seo():
    seo = shelter_page_seo(
        shelter_id="sh-1",
        name="Добрые лапы",
        kind="shelter",
        city="Минск",
        address="ул. Примерная, 1",
        description="Приют для собак и кошек.",
        logo_url="/uploads/logo-s.png",
        cover_url=None,
        phone="+375291112233",
        lat=53.9,
        lng=27.566667,
    )
    assert seo.canonical_path == "/shelters/sh-1"
    assert seo.json_ld and seo.json_ld.get("@graph")
    types = {node.get("@type") for node in seo.json_ld["@graph"]}
    assert "AnimalShelter" in types
    assert "BreadcrumbList" in types
    html = inject_seo_into_html(SHELL, seo)
    assert "Добрые лапы" in html
    assert "+375291112233" in html


def test_list_pages_seo():
    assert "hero/search-main.webp" in default_og_image()
    search = search_list_seo()
    assert search.canonical_path == "/search"
    assert "карта" in search.description.lower() or "Карта" in search.description
    blog = blog_list_seo(post_summaries=[{"url": "/blog/a", "label": "Статья A"}])
    assert "Статья A" in blog.crawl_html
    shelters = shelters_list_seo()
    assert shelters.canonical_path == "/shelters"
