/** Pet match / swipe strings (ru / be / en) — композиция из модулей match/*. */
import { matchCtaLocales } from './match/cta';
import { matchSeoLocales } from './match/seo';
import { matchQuizLocales } from './match/quiz';
import { matchSwipeLocales } from './match/swipe';
import { matchCompleteLocales } from './match/complete';
import { matchNoResultsLocales } from './match/noResults';
import { matchCardLocales } from './match/card';
import { matchProfileLocales } from './match/profile';
import { matchReasonsLocales } from './match/reasons';
import { matchToastsLocales } from './match/toasts';

export const matchLocales = {
  ru: {
    cta: matchCtaLocales.ru,
    seo: matchSeoLocales.ru,
    quiz: matchQuizLocales.ru,
    swipe: matchSwipeLocales.ru,
    complete: matchCompleteLocales.ru,
    noResults: matchNoResultsLocales.ru,
    card: matchCardLocales.ru,
    profile: matchProfileLocales.ru,
    reasons: matchReasonsLocales.ru,
    toasts: matchToastsLocales.ru,
  },
  be: {
    cta: matchCtaLocales.be,
    seo: matchSeoLocales.be,
    quiz: matchQuizLocales.be,
    swipe: matchSwipeLocales.be,
    complete: matchCompleteLocales.be,
    noResults: matchNoResultsLocales.be,
    card: matchCardLocales.be,
    profile: matchProfileLocales.be,
    reasons: matchReasonsLocales.be,
    toasts: matchToastsLocales.be,
  },
  en: {
    cta: matchCtaLocales.en,
    seo: matchSeoLocales.en,
    quiz: matchQuizLocales.en,
    swipe: matchSwipeLocales.en,
    complete: matchCompleteLocales.en,
    noResults: matchNoResultsLocales.en,
    card: matchCardLocales.en,
    profile: matchProfileLocales.en,
    reasons: matchReasonsLocales.en,
    toasts: matchToastsLocales.en,
  },
} as const;
