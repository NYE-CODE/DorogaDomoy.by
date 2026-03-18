# Сравнение Figma HTML (Landing page for lost pets) с текущим проектом

Отчёт о том, чего нет или реализовано иначе в проекте по сравнению с дизайном из Figma.

---

## 1. Шрифты (Fonts)

### В Figma HTML
- Множество `@font-face` правил для семейств: **Inter**, **Apercu**, **Figma Sans**, **Roboto**, **Whyte**
- Разные начертания (weights: 400, 500, 600, 700 и др.)
- Явное подключение шрифтов с указанием `font-weight` и `font-style`

### В проекте
- `landing/styles/fonts.css` и `landing page/src/styles/fonts.css` — **пустые** или почти пустые
- В `globals.css` используется `font-family: inherit` (системные шрифты)
- Явных подключений Inter, Apercu и др. — **нет**

**Рекомендация:** Добавить в `fonts.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
/* Apercu/Whyte — по необходимости, если есть в Figma */
```
и задать `font-family` для `body` и основных элементов.

---

## 2. Цветовая схема и переменные

### В Figma HTML
- Переменные: `--color-bg`, `--color-text`, `--color-border`, `--color-bg-brand`
- Явная поддержка тёмной темы: `data-preferred-theme="dark"`, `color-scheme: dark` на `body`
- Холст Figma: `--canvas-color: rgba(30, 30, 30, 1)` — тёмный режим интерфейса Figma

### В проекте
- Используются `--background`, `--foreground`, `--primary` и др. (другая схема имён)
- Тёмная тема через класс `.dark` — **работает**, но `CreateAdPage`:
  - применяет **жёсткий** фон `bg-[#F9FAFB]` (светло-серый)
  - не учитывает `prefers-color-scheme` и `color-scheme` для автоматического переключения
- Переменная `--color-bg-brand` (или аналог) — **отсутствует**

**Рекомендация:**
- Для CreateAdPage использовать `bg-background` вместо `bg-[#F9FAFB]`, чтобы при `.dark` страница меняла фон
- Добавить `color-scheme: light` / `color-scheme: dark` в зависимости от темы

---

## 3. Border radius (Скругления)

### В Figma HTML
- Конкретные значения: `3px`, `6px`, `8px`, `13px`, `9999px` (pill)
- Чётко заданные радиусы под компоненты

### В проекте
- Используется единый `--radius: 0.625rem` (10px) и Tailwind: `rounded-xl`, `rounded-lg`, `rounded-2xl`
- Нет отдельных значений вроде 3px, 6px, 8px, 13px для мелких элементов

**Рекомендация:** Если в макете важны точные радиусы, добавить токены:
```css
--radius-sm: 3px;
--radius-md: 6px;
--radius-lg: 8px;
--radius-xl: 13px;
--radius-full: 9999px;
```

---

## 4. Тени (Box shadow / Elevation)

### В Figma HTML
- Переменная `--elevation-200-canvas` для теней
- Специфичные Figma-значения elevation

### В проекте
- Используются Tailwind-классы: `shadow-sm`, `shadow-lg`, `shadow-xl`
- Системы elevation и кастомных теней — **нет**

**Рекомендация:** Добавить CSS-переменные для elevation:
```css
--elevation-100: 0 1px 2px rgba(0,0,0,0.05);
--elevation-200: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
--elevation-300: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1);
```

---

## 5. Конкретные проблемы CreateAdPage

| Элемент | Проблема | Решение |
|--------|----------|---------|
| Фон страницы | `bg-[#F9FAFB]` — жёстко привязан к светлой теме | Использовать `bg-background` или CSS-переменную |
| Секция шага (step header) | `bg-white`, `border-gray-200` — игнорируют тёмную тему | `bg-card`, `border-border` |
| Форма (карточка) | `bg-white`, `border-black/10` | `bg-card`, `border-border` |
| Градиент прогресса | `from-[#FDB913] to-[#FF9800]` — ок, совпадает с лендингом | Оставить, можно вынести в переменные |
| Текст | `text-black`, `text-gray-600`, `text-gray-700` | `text-foreground`, `text-muted-foreground` |

---

## 6. Структура и имена переменных

### Соответствие Figma → проект (если маппинг нужен)

| Figma | Проект |
|-------|--------|
| `--color-bg` | `--background` |
| `--color-text` | `--foreground` |
| `--color-border` | `--border` |
| `--color-bg-brand` | `--primary` (или новый токен) |

Проект уже использует свою систему, но не все страницы её применяют единообразно.

---

## 7. Что уже сделано правильно

- ✅ Оранжевая палитра (#FF9800, #F57C00, #FDB913) на лендинге и в форме
- ✅ Поддержка `.dark` в theme и globals.css
- ✅ Тема `.landing-theme` с оранжевым primary
- ✅ Прогресс-бар с градиентом совпадает с лендингом

---

## 8. Чеклист для выравнивания с Figma

1. [x] Заполнить `fonts.css` — подключить Inter (и др. при необходимости)
2. [x] Убрать хардкод цветов в CreateAdPage (`bg-[#F9FAFB]`, `bg-white`, `text-black`, `text-gray-*`)
3. [x] Добавить `color-scheme` для light/dark
4. [x] Добавить токены radius (3px, 6px, 8px, 13px) при необходимости
5. [x] Добавить elevation-переменные для теней
6. [x] Проверить, что страница создания объявления выглядит корректно и в light, и в dark теме
