import { useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { useI18n } from "../../../context/I18nContext";
import { faqApi, type FaqItem } from "../../../api/client";
import { Skeleton } from "../../../components/ui/skeleton";
import {
  landingContainerReadable,
  landingH2,
  landingLeadCenter,
  landingSectionHeader,
  landingSectionY,
} from "./landing-section-styles";

type Locale = "ru" | "be" | "en";

function pickFaqRow(row: FaqItem, loc: Locale): { q: string; a: string } {
  const pick = (primary: string, ru: string, be: string, en: string) => {
    const p = (primary || "").trim();
    if (p) return p;
    if ((ru || "").trim()) return ru.trim();
    if ((be || "").trim()) return be.trim();
    return (en || "").trim();
  };
  const qPri = loc === "be" ? row.question_be : loc === "en" ? row.question_en : row.question_ru;
  const aPri = loc === "be" ? row.answer_be : loc === "en" ? row.answer_en : row.answer_ru;
  return {
    q: pick(qPri, row.question_ru, row.question_be, row.question_en),
    a: pick(aPri, row.answer_ru, row.answer_be, row.answer_en),
  };
}

export function FAQ() {
  const { t, locale } = useI18n();
  const [apiItems, setApiItems] = useState<FaqItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    faqApi
      .list()
      .then((rows) => {
        if (!cancelled) setApiItems(rows);
      })
      .catch(() => {
        if (!cancelled) setApiItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const faqs = useMemo(() => {
    const loc = (locale === "be" || locale === "en" ? locale : "ru") as Locale;
    const staticItems = t.landing.faq.items.map((x) => ({ q: x.q, a: x.a }));
    if (apiItems === null) return null;
    if (apiItems.length === 0) return staticItems;
    const sorted = [...apiItems].sort(
      (a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id),
    );
    return sorted.map((row) => pickFaqRow(row, loc));
  }, [apiItems, locale, t.landing.faq.items]);

  return (
    <section
      id="faq"
      className={`relative bg-gradient-to-b from-muted/40 via-background to-background ${landingSectionY}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className={landingContainerReadable}>
        <div className={landingSectionHeader}>
          <h2 className={landingH2}>{t.landing.faq.title}</h2>
          <p className={landingLeadCenter}>{t.landing.faq.subtitle}</p>
        </div>

        {faqs === null ? (
          <div className="space-y-3" aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-5 shadow-sm"
              >
                <Skeleton className="mb-3 h-5 w-[88%] max-w-md rounded-md" />
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="mt-2 h-4 w-[70%] rounded-md" />
              </div>
            ))}
            <p className="sr-only">{t.landing.faq.loading}</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-2.5">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={`faq-${index}`}
                value={`item-${index}`}
                className="rounded-xl border border-border/90 bg-card px-1 shadow-sm transition-shadow data-[state=open]:border-primary/25 data-[state=open]:shadow-md overflow-hidden border-b-0"
              >
                <AccordionTrigger className="text-left text-[15px] md:text-base font-semibold text-foreground hover:no-underline py-4 px-4 md:px-5 [&[data-state=open]]:pb-2">
                  <span className="pr-2 leading-snug">{faq.q}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm md:text-[15px] leading-relaxed px-4 md:px-5 pb-5 pt-0 whitespace-pre-wrap">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </section>
  );
}
