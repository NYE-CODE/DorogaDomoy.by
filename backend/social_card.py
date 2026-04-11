"""Generate branded social-media share cards (PNG) for pet announcements."""
from __future__ import annotations

import base64
import io
import logging
from pathlib import Path
from typing import Literal

import qrcode
from PIL import Image, ImageDraw, ImageFont

logger = logging.getLogger(__name__)

FONTS_DIR = Path(__file__).resolve().parent / "fonts"
UPLOADS_DIR = Path(__file__).resolve().parent / "uploads"

_font_cache: dict[tuple[str, int], ImageFont.FreeTypeFont] = {}

# ── Brand palette ──
BRAND_ORANGE = (255, 152, 0)
WHITE = (255, 255, 255)
BG_WHITE = (255, 255, 255)
DARK = (23, 23, 23)
GRAY_600 = (75, 85, 99)
GRAY_400 = (156, 163, 175)
DIVIDER = (229, 231, 235)
PILL_LOST_BG = (254, 226, 226)
PILL_LOST_FG = (185, 28, 28)
PILL_FOUND_BG = (220, 252, 231)
PILL_FOUND_FG = (21, 128, 61)
CHIP_BG = (243, 244, 246)
CHIP_FG = (55, 65, 81)

# ── Localisation ──
LABELS_RU = {
    "pill_lost": "Пропал питомец",
    "pill_found": "Найден питомец",
    "breed": "Порода",
    "age": "Возраст",
    "coat": "Окрас",
    "sex": "Пол",
    "place_lost": "Место пропажи",
    "place_found": "Место находки",
    "contacts": "Контакты",
    "phone": "Телефон",
    "telegram": "Telegram",
    "viber": "Viber",
    "scan_qr": "Подробнее на сайте",
    "site": "DorogaDomoy.by",
    "not_specified": "Не указано",
}
LABELS_BE = {
    "pill_lost": "Знікла жывёла",
    "pill_found": "Знойдзена жывёла",
    "breed": "Парода",
    "age": "Узрост",
    "coat": "Колер",
    "sex": "Пол",
    "place_lost": "Месца знікнення",
    "place_found": "Месца знаходжання",
    "contacts": "Кантакты",
    "phone": "Тэлефон",
    "telegram": "Telegram",
    "viber": "Viber",
    "scan_qr": "Падрабязней на сайце",
    "site": "DorogaDomoy.by",
    "not_specified": "Не ўказана",
}
COLOR_LABELS_RU = {
    "black": "Чёрный", "white": "Белый", "gray": "Серый",
    "brown": "Коричневый", "red": "Рыжий", "mixed": "Смешанный",
    "spotted": "Пятнистый", "striped": "Полосатый",
}
COLOR_LABELS_BE = {
    "black": "Чорны", "white": "Белы", "gray": "Шэры",
    "brown": "Карычневы", "red": "Руды", "mixed": "Змешаны",
    "spotted": "Плямісты", "striped": "Палосаты",
}
GENDER_RU = {"male": "Самец", "female": "Самка", "unknown": "Неизвестно"}
GENDER_BE = {"male": "Самец", "female": "Самка", "unknown": "Невядома"}
TYPE_RU = {"cat": "Кот", "dog": "Собака", "other": "Другое"}
TYPE_BE = {"cat": "Кот", "dog": "Сабака", "other": "Іншае"}

CardFormat = Literal["feed", "story"]


# ═══════════════════════════════════════════════════════════════
#  Helpers
# ═══════════════════════════════════════════════════════════════

def _font(weight: str, size: int) -> ImageFont.FreeTypeFont:
    key = (weight, size)
    if key in _font_cache:
        return _font_cache[key]
    names = {
        "regular": "Inter-Regular.ttf", "semibold": "Inter-SemiBold.ttf",
        "bold": "Inter-Bold.ttf", "extrabold": "Inter-ExtraBold.ttf",
    }
    path = FONTS_DIR / names.get(weight, "Inter-Regular.ttf")
    try:
        f = ImageFont.truetype(str(path), size)
    except (OSError, IOError):
        logger.warning("Font %s not found, falling back", path)
        f = ImageFont.load_default()
    _font_cache[key] = f
    return f


def _tw(font: ImageFont.FreeTypeFont, text: str) -> int:
    bb = font.getbbox(text)
    return bb[2] - bb[0]


def _lh(font: ImageFont.FreeTypeFont) -> int:
    bb = font.getbbox("АyДpq")
    return bb[3] - bb[1]


def _truncate(font: ImageFont.FreeTypeFont, text: str, max_w: int) -> str:
    if _tw(font, text) <= max_w:
        return text
    for i in range(len(text), 0, -1):
        c = text[:i].rstrip() + "…"
        if _tw(font, c) <= max_w:
            return c
    return "…"


def _wrap(text: str, font: ImageFont.FreeTypeFont, max_w: int, max_lines: int) -> list[str]:
    words = text.replace("\n", " ").split()
    if not words:
        return []
    lines: list[str] = []
    wi = 0
    while wi < len(words) and len(lines) < max_lines:
        parts: list[str] = []
        while wi < len(words):
            trial = " ".join(parts + [words[wi]]) if parts else words[wi]
            if _tw(font, trial) <= max_w:
                parts.append(words[wi])
                wi += 1
            else:
                if parts:
                    break
                piece = words[wi]
                while piece and _tw(font, piece + "…") > max_w:
                    piece = piece[:-1]
                lines.append((piece or "") + "…")
                wi += 1
                break
        if parts:
            lines.append(" ".join(parts))
    if wi < len(words) and lines:
        last = lines[-1]
        while last and _tw(font, last.rstrip() + "…") > max_w:
            last = last[:-1].rstrip()
        lines[-1] = (last + "…").strip() if last else "…"
    return lines[:max_lines]


def _extract_uploads_filename(url: str) -> str | None:
    if url.startswith("/uploads/"):
        return Path(url).name
    if "/uploads/" in url:
        after = url.split("/uploads/", 1)[1]
        return after.split("?")[0].split("#")[0] if after else None
    return None


def _load_photo(url: str | None) -> Image.Image | None:
    if not url:
        return None
    if url.startswith("data:image/"):
        try:
            _, encoded = url.split(",", 1)
            return Image.open(io.BytesIO(base64.b64decode(encoded))).convert("RGB")
        except Exception:
            return None
    fn = _extract_uploads_filename(url)
    if fn:
        p = UPLOADS_DIR / fn
        if p.is_file():
            try:
                return Image.open(p).convert("RGB")
            except Exception:
                return None
    return None


def _crop_center(img: Image.Image, tw: int, th: int) -> Image.Image:
    sw, sh = img.size
    scale = max(tw / sw, th / sh)
    nw, nh = int(sw * scale), int(sh * scale)
    img = img.resize((nw, nh), Image.LANCZOS)
    l, t = (nw - tw) // 2, (nh - th) // 2
    return img.crop((l, t, l + tw, t + th))


def _make_qr(url: str, size: int) -> Image.Image:
    qr = qrcode.QRCode(version=None, error_correction=qrcode.constants.ERROR_CORRECT_M,
                        box_size=10, border=2)
    qr.add_data(url)
    qr.make(fit=True)
    return qr.make_image(fill_color="black", back_color="white").convert("RGB").resize(
        (size, size), Image.LANCZOS)


def _gradient(img: Image.Image, y0: int, h: int, alpha: int = 210):
    ov = Image.new("RGBA", (img.width, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    for i in range(h):
        a = int(alpha * (i / h) ** 1.5)
        d.line([(0, i), (img.width, i)], fill=(0, 0, 0, a))
    rgba = img.convert("RGBA")
    rgba.paste(ov, (0, y0), ov)
    return rgba.convert("RGB")


def _placeholder(draw: ImageDraw.ImageDraw, w: int, h: int):
    draw.rectangle([(0, 0), (w, h)], fill=(230, 230, 230))
    cx, cy = w // 2, h // 2 - 20
    c = (195, 195, 195)
    draw.ellipse([cx - 44, cy + 12, cx + 44, cy + 76], fill=c)
    for ox, oy in [(-50, -28), (-16, -44), (16, -44), (50, -28)]:
        draw.ellipse([cx + ox - 16, cy + oy - 16, cx + ox + 16, cy + oy + 16], fill=c)


def _gender(g: str | None, lang: str) -> str:
    tbl = GENDER_BE if lang == "be" else GENDER_RU
    return tbl.get((g or "unknown").strip().lower(), tbl["unknown"])


def _type_name(t: str, lang: str) -> str:
    tbl = TYPE_BE if lang == "be" else TYPE_RU
    return tbl.get(t, t)


def _color_labels(keys: list[str], lang: str) -> list[str]:
    tbl = COLOR_LABELS_BE if lang == "be" else COLOR_LABELS_RU
    return [tbl.get(k, k) for k in keys] if keys else []


def _draw_coat_tags(
    draw: ImageDraw.ImageDraw,
    x: int,
    y: int,
    max_right: int,
    texts: list[str],
    font: ImageFont.FreeTypeFont,
) -> int:
    """Окрас — скруглённые теги в одну/несколько строк."""
    pad_x = 18
    pad_top = 10
    pad_bottom = 15  # чуть больше снизу: у Inter нижний вынос букв визуально «съедает» паддинг
    gap_x, gap_y = 12, 12
    margin_below_block = 34  # явный зазор под последним рядом тегов до следующего блока
    cx = x
    line_y = y
    row_h = 0
    for txt in texts:
        tw = _tw(font, txt)
        th = _lh(font)
        w_chip = tw + pad_x * 2
        h_chip = pad_top + th + pad_bottom
        if cx + w_chip > max_right and cx > x:
            line_y += row_h + gap_y
            cx = x
            row_h = 0
        draw.rounded_rectangle(
            (cx, line_y, cx + w_chip, line_y + h_chip),
            radius=h_chip // 2,
            fill=CHIP_BG,
        )
        draw.text((cx + pad_x, line_y + pad_top), txt, font=font, fill=CHIP_FG)
        row_h = max(row_h, h_chip)
        cx += w_chip + gap_x
    return line_y + row_h + margin_below_block


# ═══════════════════════════════════════════════════════════════
#  Main generator
# ═══════════════════════════════════════════════════════════════

def generate_social_card(
    *,
    pet_id: str,
    photo_url: str | None,
    status: str,
    animal_type: str,
    breed: str | None,
    city: str,
    colors: list[str] | None,
    gender: str | None,
    approximate_age: str | None,
    contacts: dict,
    author_name: str | None,
    site_url: str,
    lang: str = "ru",
    card_format: CardFormat = "feed",
) -> bytes:
    L = LABELS_BE if lang == "be" else LABELS_RU
    is_lost = status == "searching"

    # ── Canvas ──
    if card_format == "story":
        W, H = 1080, 1920
        PHOTO_H = 1060
        qr_sz = 280
    else:
        W, H = 1080, 1350
        PHOTO_H = 580
        qr_sz = 238

    PAD = 40
    FOOTER_H = 68

    img = Image.new("RGB", (W, H), BG_WHITE)
    draw = ImageDraw.Draw(img)

    # ═══ 1. PHOTO ═══
    photo = _load_photo(photo_url)
    if photo:
        img.paste(_crop_center(photo, W, PHOTO_H), (0, 0))
    else:
        _placeholder(draw, W, PHOTO_H)

    img = _gradient(img, PHOTO_H - 220, 220, alpha=230)
    draw = ImageDraw.Draw(img)

    # Status pill (top-left) — те же вертикальные отступы, что у тегов окраса
    pill_f = _font("semibold", 30)
    pill_txt = L["pill_lost"] if is_lost else L["pill_found"]
    pill_bg = PILL_LOST_BG if is_lost else PILL_FOUND_BG
    pill_fg = PILL_LOST_FG if is_lost else PILL_FOUND_FG
    pill_pad_x = 18
    pill_pad_top = 10
    pill_pad_bottom = 15
    ptw = _tw(pill_f, pill_txt) + pill_pad_x * 2
    pth = pill_pad_top + _lh(pill_f) + pill_pad_bottom
    draw.rounded_rectangle((PAD, PAD, PAD + ptw, PAD + pth), radius=pth // 2,
                           fill=pill_bg)
    draw.text((PAD + pill_pad_x, PAD + pill_pad_top), pill_txt, font=pill_f, fill=pill_fg)

    # Hero text over gradient: "Собака · Лабрадор-ретривер"
    hero_parts = [_type_name(animal_type, lang)]
    breed_txt = (breed or "").strip()
    if breed_txt:
        hero_parts.append(breed_txt)
    hero_str = " · ".join(hero_parts)
    hero_f = _font("bold", 48)
    hero_disp = _truncate(hero_f, hero_str, W - PAD * 2)
    draw.text((PAD, PHOTO_H - _lh(hero_f) - 28), hero_disp, font=hero_f, fill=WHITE)

    # ═══ 2. ORANGE BAR ═══
    draw.rectangle([(0, PHOTO_H), (W, PHOTO_H + 5)], fill=BRAND_ORANGE)

    # ═══ 3. INFO SECTION ═══
    info_top = PHOTO_H + 5
    footer_y = H - FOOTER_H
    draw.rectangle([(0, info_top), (W, footer_y)], fill=BG_WHITE)

    x0 = PAD
    x1 = W - PAD
    full_w = x1 - x0
    y = info_top + 28

    # Fonts for info
    lbl_f = _font("regular", 28)
    val_f = _font("semibold", 36)
    small_lbl_f = _font("regular", 26)
    loc_f = _font("regular", 32)
    chip_f = _font("regular", 28)
    contact_lbl_f = _font("regular", 26)
    contact_val_f = _font("semibold", 34)

    # ── Two-column row: Sex | Age ──
    col_w = (full_w - 32) // 2
    gender_val = _gender(gender, lang)
    age_val = (str(approximate_age).strip() if approximate_age else "").strip()

    draw.text((x0, y), L["sex"], font=lbl_f, fill=GRAY_400)
    draw.text((x0 + col_w + 32, y), L["age"], font=lbl_f, fill=GRAY_400)
    y += _lh(lbl_f) + 10
    draw.text((x0, y), gender_val, font=val_f, fill=DARK)
    if age_val:
        draw.text((x0 + col_w + 32, y), age_val, font=val_f, fill=DARK)
    else:
        draw.text((x0 + col_w + 32, y), "—", font=val_f, fill=GRAY_400)
    y += _lh(val_f) + 20

    # ── Coat (теги) ──
    color_names = _color_labels(colors or [], lang)
    tag_texts = color_names if color_names else [L["not_specified"]]
    draw.text((x0, y), L["coat"], font=lbl_f, fill=GRAY_400)
    y += _lh(lbl_f) + 11
    y = _draw_coat_tags(draw, x0, y, x1, tag_texts, chip_f)

    # ── Divider ──
    draw.line([(x0, y), (x1, y)], fill=DIVIDER, width=1)
    y += 20

    # ── Location ──
    place_lbl = L["place_lost"] if is_lost else L["place_found"]
    city_txt = city.strip() or L["not_specified"]
    draw.text((x0, y), place_lbl, font=lbl_f, fill=GRAY_400)
    y += _lh(lbl_f) + 11

    pin_r = 8
    pin_cy = y + _lh(loc_f) // 2
    draw.ellipse((x0, pin_cy - pin_r, x0 + pin_r * 2, pin_cy + pin_r), fill=BRAND_ORANGE)
    max_lines = 4 if card_format == "story" else 3
    loc_lines = _wrap(city_txt, loc_f, full_w - 36, max_lines)
    loc_x = x0 + 28
    for ln in loc_lines:
        draw.text((loc_x, y), ln, font=loc_f, fill=GRAY_600)
        y += _lh(loc_f) + 6
    y += 12

    # ── Divider ──
    draw.line([(x0, y), (x1, y)], fill=DIVIDER, width=1)
    y += 20

    # ── Contacts + QR side by side ──
    qr_url = f"{site_url.rstrip('/')}/pet/{pet_id}"
    qr_img = _make_qr(qr_url, qr_sz)
    qr_x = x1 - qr_sz
    qr_y = y
    contact_w = qr_x - x0 - 28

    has_any = False
    for key, lbl_key in [("phone", "phone"), ("telegram", "telegram"), ("viber", "viber")]:
        raw = (str(contacts.get(key, "")).strip()) if contacts.get(key) else ""
        if not raw:
            continue
        has_any = True
        draw.text((x0, y), L[lbl_key], font=contact_lbl_f, fill=GRAY_400)
        y += _lh(contact_lbl_f) + 7
        val_lines = _wrap(raw, contact_val_f, contact_w, 2)
        for ln in val_lines:
            draw.text((x0, y), ln, font=contact_val_f, fill=DARK)
            y += _lh(contact_val_f) + 4
        y += 10

    if not has_any:
        draw.text((x0, y), L["scan_qr"], font=small_lbl_f, fill=GRAY_400)

    # QR code
    qr_border = 8
    draw.rounded_rectangle(
        (qr_x - qr_border, qr_y - qr_border,
         qr_x + qr_sz + qr_border, qr_y + qr_sz + qr_border),
        radius=14, fill=BG_WHITE, outline=DIVIDER, width=1,
    )
    img.paste(qr_img, (qr_x, qr_y))

    scan_f = _font("regular", 22)
    scan_txt = L["scan_qr"]
    scan_w = _tw(scan_f, scan_txt)
    draw.text((qr_x + (qr_sz - scan_w) // 2, qr_y + qr_sz + 10),
              scan_txt, font=scan_f, fill=GRAY_400)

    # ═══ 4. FOOTER ═══
    draw.rectangle([(0, footer_y), (W, H)], fill=BRAND_ORANGE)
    footer_f = _font("bold", 36)
    site = L["site"]
    stw = _tw(footer_f, site)
    draw.text(((W - stw) // 2, footer_y + (FOOTER_H - _lh(footer_f)) // 2),
              site, font=footer_f, fill=WHITE)

    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()
