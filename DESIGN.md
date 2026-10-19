---
name: DorogaDomoy.by
description: Карта и объявления, чтобы вернуть питомца домой — спокойно, срочно, по делу.
colors:
  brand: "#ff9800"
  brand-light: "#fdb913"
  brand-dark: "#f57c00"
  brand-soft: "#ffb74d"
  brand-surface: "#fff4e5"
  brand-emphasis: "#c2410c"
  lost: "#e11d48"
  lost-soft: "#fff1f2"
  lost-foreground: "#881337"
  found: "#0284c7"
  found-soft: "#f0f9ff"
  found-foreground: "#0c4a6e"
  shelter: "#059669"
  shelter-soft: "#ecfdf5"
  shelter-foreground: "#065f46"
  medallion: "#b98a2f"
  medallion-soft: "#faf6ec"
  medallion-foreground: "#7a5b1e"
  text-primary: "#111827"
  text-secondary: "#374151"
  text-muted: "#5c5c6b"
  text-disabled: "#9ca3af"
  bg-base: "#ffffff"
  bg-subtle: "#f3f4f6"
  bg-landing: "#f9f8f6"
  bg-landing-muted: "#f1f0ed"
  bg-landing-dark: "#1a3026"
  on-landing-dark: "#f5f5f4"
  on-landing-dark-muted: "rgba(245, 245, 244, 0.72)"
  border-default: "rgba(0, 0, 0, 0.06)"
  border-strong: "#eef0f3"
  track-muted: "#e5e7eb"
  medallion-border: "#e7d9b8"
  danger: "#d4183d"
  success: "#16a34a"
  telegram: "#0088cc"
  viber: "#7360f2"
typography:
  display:
    fontFamily: "Manrope, Inter, system-ui, sans-serif"
    fontWeight: 700
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontWeight: 400
  engraved:
    fontFamily: "Manrope, Inter, system-ui, sans-serif"
    fontWeight: 600
    letterSpacing: "0.14em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  2xl: "16px"
  3xl: "20px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    height: "48px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
  medallion:
    rounded: "{rounded.full}"
    size: "3px border"
---

# Design System: DorogaDomoy.by

## Overview

**Creative North Star: "Медальон на дороге домой"**

Интерфейс опирается на два якоря: оранжевый маршрут «домой» и круглый жетон-медальон с ободком сценария. Плотность умеренная — в стрессе экран должен читаться с первого взгляда: один главный CTA, короткие глаголы, дозированный цвет регистра.

Система Operate + Persuade на лендинге: продукт — карта и контакт, бренд живёт в деталях (гравировка, пунктирная дорога, латунь адресника), а не в декоративных карточках.

**Key Characteristics:**
- Оранжевый бренд только для главного пути / CTA / FAB
- Четыре регистра: пропал / найден / приют / адресник
- Круглый медальон 3px как атом фото и маркера карты
- Manrope + Inter; `typo-engraved` точечно
- Радиусы: `rounded-lg` (8) для controls, `rounded-2xl` (16) для карточек, `rounded-3xl` (20) для search / hero media

## Colors

Палитра: тёплый бренд-оранж + нейтрали + четыре сценарных регистра + лесной dark лендинга.

### Primary
- **Дорога домой** (`#ff9800`): главный CTA, шаги визарда, FAB, пунктирный маршрут. Не смешивать со сценарным акцентом на одном элементе.

### Scenario
- **Пропал** (`#e11d48`): максимальная дозировка — ободок, плашка, баннер, крупный телефон.
- **Найден** (`#0284c7`): средняя — ободок + мягкий pill.
- **Приют** (`#059669`): минимальная — ободок и тонкий pill, без плашек поверх морды.
- **Адресник / медальон** (`#b98a2f`): латунь; сценарные цвета в этом регистре запрещены.

### Neutral
- Текст: `#111827` / `#374151` / muted `#5c5c6b` (не светлее для контента).
- Фоны app: белый base, subtle `#f3f4f6`.
- Лендинг: тёплый off-white `#f9f8f6` / muted `#f1f0ed` (не cream `#F4F1EA`); тёмный лесной `#1a3026` для карты и футера. Текст на dark: `#f5f5f4` / muted `rgba(245,245,244,0.72)`.
- **Правило:** `landing-dark` ≠ `scenario-shelter`. Emerald остаётся только для бейджей/ободков приюта.

### Named Rules
**The One CTA Rule.** На экране один `variant="default"` CTA брендового оранжа размера `cta`; остальное — outline/ghost.

**The Dose Rule.** Регистр задаёт дозировку цвета, не только оттенок.

## Typography

**Display Font:** Manrope  
**Body Font:** Inter (зафиксированный UI-стек платформы)

**Character:** Manrope чуть теплее и округлее — имена питомцев и заголовки; Inter — рабочие тексты и формы.

### Hierarchy
- Display / имена — Manrope 600–800
- Body — Inter 400–600, размеры через `--text-*` токены
- Engraved — uppercase + letter-spacing 0.14em для жетонных подписей (бейджи, brand-strip флаера, QR), не для абзацев

### Named Rules
**The Inter Commitment.** Inter — бренд-токен UI, не случайный default; замена только через ребрендинг.

## Layout

Mobile-first от 360px; граница mobile/desktop — `md` / `useIsMobile()` (&lt;768px). Отступы между элементами задаёт родитель через `gap-*`; атомы без внешних margin. Главный CTA на мобиле — full width в зоне большого пальца / sticky.

## Elevation & Depth

В основном плоские поверхности и тонкие границы (`--color-border-default`). Лёгкие тени допустимы на модалках и карточке Telegram-auth; без hard offset и glow.

На лендинге: `--shadow-card` для карточек/панелей, `--shadow-search` для search bar (классы `shadow-card` / `shadow-search`). Оттенок тени чуть тянет в лесной, не в чистый чёрный.

## Shapes

- Controls: `rounded-lg` (8px)
- Cards / modals / map popups: `rounded-2xl` (16px)
- Search bar / крупные hero-поверхности: `rounded-3xl` (20px)
- Медальон и маркеры: полный круг + ободок 3px цвета регистра
- «Ушко» жетона — только в церемониальных местах (QR-жетон, success, empty), не в списках и не на карте

## Components

### Buttons
- Primary: brand fill, height `cta` (h-12), один на экран
- Outline / ghost для вторичных действий
- Transition `duration-200`; без layout-прыжков на hover

### Medallion / Pet photo
- Круг + 3px scenario/medallion border; та же геометрия, что маркер карты (`PetMedallion`)

### Cards / Containers
- Крупные поверхности `rounded-2xl` + на лендинге `shadow-card` (`landingPanel`); без вложенных «карточка в карточке» без нужды
- Тёмные секции лендинга: `landingSectionDark` (`bg-landing-dark`)

### Inputs
- `rounded-lg`, фон `--color-bg-input`, focus-visible ring через примитивы
- Hero search: `landingSearchShell` (`rounded-3xl` + `shadow-search`)

## Do's and Don'ts

**Do**
- Токены из `tokens.css` / `@theme` — никаких hex в JSX
- i18n для всего видимого текста (ru/be/en)
- Статус = цвет + текстовая подпись
- Один главный CTA на экран

**Don't**
- Смешивать brand-оранж и scenario-акцент на одном элементе
- Бледно-серый текст светлее `--color-text-muted` для контента
- Писать UI-строки без i18n
- Кладки AI-slop: purple gradients, bounce easing, толстые side-tab акценты
