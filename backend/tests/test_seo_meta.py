"""Тесты OG / crawl HTML без полного SSR."""
from seo_meta import (
    city_name_from_slug,
    city_page_seo,
    city_slug,
    inject_seo_into_html,
    pet_page_seo,
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
