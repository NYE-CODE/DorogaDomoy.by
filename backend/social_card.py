"""Generate branded social-media share cards for pet announcements."""
from __future__ import annotations

import base64
import io
import logging
from dataclasses import dataclass
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
    "pill_adoption": "Ищет дом",
    "breed": "Порода",
    "age": "Возраст",
    "coat": "Окрас",
    "sex": "Пол",
    "place_lost": "Место пропажи",
    "place_found": "Место находки",
    "place_adoption": "Город",
    "contacts": "Контакты",
    "phone": "Телефон",
    "telegram": "Telegram",
    "viber": "Viber",
    "scan_qr": "Подробнее на сайте",
    "shelter_org": "Приют",
    "nickname": "Кличка",
    "qr_hint_adoption": "Профиль питомца",
    "site": "DorogaDomoy.by",
    "not_specified": "Не указано",
}
LABELS_BE = {
    "pill_lost": "Знікла жывёла",
    "pill_found": "Знойдзена жывёла",
    "pill_adoption": "Шукае дом",
    "breed": "Парода",
    "age": "Узрост",
    "coat": "Колер",
    "sex": "Пол",
    "place_lost": "Месца знікнення",
    "place_found": "Месца знаходжання",
    "place_adoption": "Горад",
    "contacts": "Кантакты",
    "phone": "Тэлефон",
    "telegram": "Telegram",
    "viber": "Viber",
    "scan_qr": "Падрабязней на сайце",
    "shelter_org": "Прыют",
    "nickname": "Мянушка",
    "qr_hint_adoption": "Профіль жывёлы",
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
CardMediaType = Literal["image/png", "image/jpeg"]

QR_BAND_BG = (249, 250, 251)


@dataclass(frozen=True)
class CardLayout:
    width: int
    height: int
    photo_h: int
    footer_h: int
    qr_band_h: int
    pad: int
    qr_target: int
    qr_min: int
    compact_info: bool = False


def _layout_for(card_format: CardFormat, is_adoption: bool) -> CardLayout:
    """Размеры холста и зон под feed (4:5) и story (9:16)."""
    if card_format == "story":
        return CardLayout(
            width=1080,
            height=1920,
            photo_h=1180 if is_adoption else 1120,
            footer_h=72,
            qr_band_h=320 if is_adoption else 300,
            pad=44,
            qr_target=240,
            qr_min=210,
            compact_info=is_adoption,
        )
    return CardLayout(
        width=1080,
        height=1350,
        photo_h=680 if is_adoption else 580,
        footer_h=72,
        qr_band_h=300 if is_adoption else 280,
        pad=44,
        qr_target=220,
        qr_min=200,
        compact_info=is_adoption,
    )


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
            with Image.open(io.BytesIO(base64.b64decode(encoded))) as im:
                return im.convert("RGB").copy()
        except Exception:
            return None
    fn = _extract_uploads_filename(url)
    if fn:
        p = UPLOADS_DIR / fn
        if p.is_file():
            try:
                with Image.open(p) as im:
                    return im.convert("RGB").copy()
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
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=12,
        border=2,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white").convert("RGB")
    if img.size[0] != size:
        return img.resize((size, size), Image.LANCZOS)
    return img


def _color_labels(keys: list[str], lang: str) -> list[str]:
    tbl = COLOR_LABELS_BE if lang == "be" else COLOR_LABELS_RU
    out: list[str] = []
    for k in keys:
        key = (k or "").strip()
        if not key:
            continue
        label = tbl.get(key.lower(), key)
        if len(label) <= 2 and key.lower() not in tbl:
            continue
        out.append(label)
    return out


def _draw_qr_band(
    img: Image.Image,
    *,
    layout: CardLayout,
    band_top: int,
    qr_url: str,
    hint: str,
    shelter_name: str | None = None,
    shelter_city: str | None = None,
    city: str | None = None,
    labels: dict[str, str] | None = None,
    adoption_panel: bool = False,
) -> None:
    """QR-полоса: для приютов — приют слева, код справа; иначе код по центру."""
    draw = ImageDraw.Draw(img)
    band_bottom = band_top + layout.qr_band_h
    pad = layout.pad
    draw.rectangle([(0, band_top), (layout.width, band_bottom)], fill=QR_BAND_BG)
    draw.line([(pad, band_top), (layout.width - pad, band_top)], fill=DIVIDER, width=1)

    hint_f = _font("regular", 22 if layout.height <= 1400 else 24)
    qr_border = 8
    hint_h = _lh(hint_f) + 10

    sn = (shelter_name or "").strip()
    show_shelter_panel = adoption_panel and labels is not None

    if show_shelter_panel:
        lbl_f = _font("regular", 24)
        name_f = _font("semibold", 30 if layout.height <= 1400 else 32)
        city_f = _font("regular", 26)

        qr_sz = min(
            layout.qr_target,
            layout.qr_band_h - pad,
            layout.width // 3 + 40,
        )
        qr_sz = max(layout.qr_min, qr_sz)

        qr_x = layout.width - pad - qr_sz
        qr_y = band_top + (layout.qr_band_h - qr_sz - hint_h) // 2
        text_left = pad
        text_w = qr_x - text_left - 24

        ty = band_top + pad - 4
        draw.text((text_left, ty), labels["shelter_org"], font=lbl_f, fill=GRAY_400)
        ty += _lh(lbl_f) + 8

        display_name = sn or labels["not_specified"]
        max_name_lines = 3 if layout.height > 1400 else 2
        for ln in _wrap(display_name, name_f, text_w, max_name_lines):
            draw.text((text_left, ty), ln, font=name_f, fill=DARK)
            ty += _lh(name_f) + 4

        loc = (shelter_city or city or "").strip()
        if loc:
            ty += 6
            for ln in _wrap(loc, city_f, text_w, 1):
                draw.text((text_left, ty), ln, font=city_f, fill=GRAY_600)
    else:
        max_qr = min(
            layout.qr_target,
            layout.qr_band_h - hint_h - 24,
            layout.width - pad * 2 - qr_border * 2,
        )
        qr_sz = min(layout.qr_target, max_qr)
        if qr_sz < layout.qr_min and max_qr >= layout.qr_min:
            qr_sz = layout.qr_min
        qr_x = (layout.width - qr_sz) // 2
        qr_y = band_top + (layout.qr_band_h - qr_sz - hint_h) // 2

    draw.rounded_rectangle(
        (
            qr_x - qr_border,
            qr_y - qr_border,
            qr_x + qr_sz + qr_border,
            qr_y + qr_sz + qr_border,
        ),
        radius=16,
        fill=BG_WHITE,
        outline=DIVIDER,
        width=2,
    )
    img.paste(_make_qr(qr_url, qr_sz), (qr_x, qr_y))

    hint_w = _tw(hint_f, hint)
    hint_x = qr_x + (qr_sz - hint_w) // 2
    draw.text(
        (hint_x, qr_y + qr_sz + qr_border + 8),
        hint,
        font=hint_f,
        fill=GRAY_600,
    )


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


def _draw_coat_tags(
    draw: ImageDraw.ImageDraw,
    x: int,
    y: int,
    max_right: int,
    texts: list[str],
    font: ImageFont.FreeTypeFont,
    *,
    compact: bool = False,
) -> int:
    """Окрас — скруглённые теги в одну/несколько строк."""
    pad_x = 18
    pad_top = 10
    pad_bottom = 15
    gap_x, gap_y = 12, 12
    margin_below_block = 18 if compact else 34
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
    pet_scope: str | None,
    adoption_status: str | None,
    site_url: str,
    shelter_name: str | None = None,
    shelter_city: str | None = None,
    pet_nickname: str | None = None,
    lang: str = "ru",
    card_format: CardFormat = "feed",
) -> tuple[bytes, CardMediaType]:
    L = LABELS_BE if lang == "be" else LABELS_RU
    is_adoption = (pet_scope or "").strip().lower() == "shelter_pet"
    is_lost = status == "searching"

    layout = _layout_for(card_format, is_adoption)
    W, H = layout.width, layout.height
    PHOTO_H = layout.photo_h
    PAD = layout.pad
    FOOTER_H = layout.footer_h

    footer_y = H - FOOTER_H
    qr_band_top = footer_y - layout.qr_band_h
    info_top = PHOTO_H + 5
    info_bottom = qr_band_top - 8

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

    pill_f = _font("semibold", 30)
    if is_adoption:
        pill_txt = L["pill_adoption"]
        pill_bg = (219, 234, 254)
        pill_fg = (29, 78, 216)
    else:
        pill_txt = L["pill_lost"] if is_lost else L["pill_found"]
        pill_bg = PILL_LOST_BG if is_lost else PILL_FOUND_BG
        pill_fg = PILL_LOST_FG if is_lost else PILL_FOUND_FG
    pill_pad_x = 18
    pill_pad_top = 10
    pill_pad_bottom = 15
    ptw = _tw(pill_f, pill_txt) + pill_pad_x * 2
    pth = pill_pad_top + _lh(pill_f) + pill_pad_bottom
    draw.rounded_rectangle((PAD, PAD, PAD + ptw, PAD + pth), radius=pth // 2, fill=pill_bg)
    draw.text((PAD + pill_pad_x, PAD + pill_pad_top), pill_txt, font=pill_f, fill=pill_fg)

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

    # ═══ 3. INFO SECTION (ограничена зоной над QR-полосой) ═══
    draw.rectangle([(0, info_top), (W, qr_band_top)], fill=BG_WHITE)

    x0 = PAD
    x1 = W - PAD
    full_w = x1 - x0
    compact = layout.compact_info
    y = info_top + (16 if compact else 24)

    lbl_f = _font("regular", 26 if compact else 28)
    val_f = _font("semibold", 32 if compact else 36)
    small_lbl_f = _font("regular", 24 if compact else 26)
    loc_f = _font("regular", 30 if compact else 32)
    chip_f = _font("regular", 26 if compact else 28)
    contact_lbl_f = _font("regular", 24 if compact else 26)
    contact_val_f = _font("semibold", 30 if compact else 34)
    gap_sm = 8 if compact else 11
    gap_md = 12 if compact else 16

    def _room(need: int) -> bool:
        return y + need <= info_bottom

    # ── Nickname (пристройство) ──
    if is_adoption and (pet_nickname or "").strip():
        nk = (pet_nickname or "").strip()
        need = _lh(lbl_f) + 11 + _lh(val_f) * min(2, len(nk) // 18 + 1) + 18
        if _room(need):
            draw.text((x0, y), L["nickname"], font=lbl_f, fill=GRAY_400)
            y += _lh(lbl_f) + gap_sm
            nick_lines = _wrap(nk, val_f, full_w, 1 if compact else 2)
            for ln in nick_lines:
                draw.text((x0, y), ln, font=val_f, fill=DARK)
                y += _lh(val_f) + 4
            y += gap_md

    # ── Sex | Age ──
    if _room(_lh(lbl_f) + gap_sm + _lh(val_f) + gap_md):
        col_w = (full_w - 32) // 2
        gender_val = _gender(gender, lang)
        age_val = (str(approximate_age).strip() if approximate_age else "").strip()

        draw.text((x0, y), L["sex"], font=lbl_f, fill=GRAY_400)
        draw.text((x0 + col_w + 32, y), L["age"], font=lbl_f, fill=GRAY_400)
        y += _lh(lbl_f) + gap_sm
        draw.text((x0, y), gender_val, font=val_f, fill=DARK)
        if age_val:
            draw.text((x0 + col_w + 32, y), age_val, font=val_f, fill=DARK)
        else:
            draw.text((x0 + col_w + 32, y), "—", font=val_f, fill=GRAY_400)
        y += _lh(val_f) + gap_md

    # ── Coat ──
    color_names = _color_labels(colors or [], lang)
    tag_texts = color_names if color_names else [L["not_specified"]]
    coat_need = _lh(lbl_f) + gap_sm + 48 + 12
    if _room(coat_need):
        draw.text((x0, y), L["coat"], font=lbl_f, fill=GRAY_400)
        y += _lh(lbl_f) + gap_sm
        y = _draw_coat_tags(draw, x0, y, x1, tag_texts[:2], chip_f, compact=compact)

    # ── Location (не для карточек приюта — город в блоке приюта у QR) ──
    if not is_adoption:
        if _room(20):
            draw.line([(x0, y), (x1, y)], fill=DIVIDER, width=1)
            y += 14 if compact else 18

        place_lbl = L["place_lost"] if is_lost else L["place_found"]
        city_txt = city.strip() or L["not_specified"]
        loc_need = _lh(lbl_f) + gap_sm + _lh(loc_f) + 8
        if _room(loc_need):
            draw.text((x0, y), place_lbl, font=lbl_f, fill=GRAY_400)
            y += _lh(lbl_f) + gap_sm
            pin_r = 8
            pin_cy = y + _lh(loc_f) // 2
            draw.ellipse((x0, pin_cy - pin_r, x0 + pin_r * 2, pin_cy + pin_r), fill=BRAND_ORANGE)
            max_lines = 2
            loc_lines = _wrap(city_txt, loc_f, full_w - 36, max_lines)
            loc_x = x0 + 28
            for ln in loc_lines:
                if not _room(_lh(loc_f) + 4):
                    break
                draw.text((loc_x, y), ln, font=loc_f, fill=GRAY_600)
                y += _lh(loc_f) + 4
            y += 6

    # ── Contacts ──
    if _room(36) and not (compact and is_adoption):
        if y < info_bottom - 36:
            draw.line([(x0, y), (x1, y)], fill=DIVIDER, width=1)
            y += 16
        shown_contacts = 0
        max_contacts = 2 if card_format == "feed" else 3
        for key, lbl_key in [("phone", "phone"), ("telegram", "telegram"), ("viber", "viber")]:
            if shown_contacts >= max_contacts:
                break
            raw = (str(contacts.get(key, "")).strip()) if contacts.get(key) else ""
            if not raw:
                continue
            block_h = _lh(contact_lbl_f) + 7 + _lh(contact_val_f) + 8
            if not _room(block_h):
                break
            draw.text((x0, y), L[lbl_key], font=contact_lbl_f, fill=GRAY_400)
            y += _lh(contact_lbl_f) + 7
            val_lines = _wrap(raw, contact_val_f, full_w, 1)
            for ln in val_lines:
                draw.text((x0, y), ln, font=contact_val_f, fill=DARK)
                y += _lh(contact_val_f) + 4
            y += 8
            shown_contacts += 1

        if shown_contacts == 0 and not is_adoption and _room(_lh(small_lbl_f) + 4):
            draw.text((x0, y), L["scan_qr"], font=small_lbl_f, fill=GRAY_400)

    # ═══ 4. QR BAND ═══
    if is_adoption:
        qr_url = f"{site_url.rstrip('/')}/shelter-pet/{pet_id}"
    else:
        qr_url = f"{site_url.rstrip('/')}/pet/{pet_id}"
    scan_txt = L["qr_hint_adoption"] if is_adoption else L["scan_qr"]
    _draw_qr_band(
        img,
        layout=layout,
        band_top=qr_band_top,
        qr_url=qr_url,
        hint=scan_txt,
        shelter_name=shelter_name,
        shelter_city=shelter_city,
        city=city,
        labels=L if is_adoption else None,
        adoption_panel=is_adoption,
    )

    # ═══ 5. FOOTER ═══
    draw = ImageDraw.Draw(img)
    draw.rectangle([(0, footer_y), (W, H)], fill=BRAND_ORANGE)
    footer_f = _font("bold", 36)
    site = L["site"]
    stw = _tw(footer_f, site)
    draw.text(
        ((W - stw) // 2, footer_y + (FOOTER_H - _lh(footer_f)) // 2),
        site,
        font=footer_f,
        fill=WHITE,
    )

    buf = io.BytesIO()
    if card_format == "story":
        img.save(buf, format="JPEG", quality=88, optimize=True, progressive=True)
        return buf.getvalue(), "image/jpeg"
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue(), "image/png"
