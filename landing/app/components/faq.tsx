import { useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { useI18n } from "../../../context/I18nContext";
import { faqApi, type FaqItem } from "../../../api/client";

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
    <section id="faq" className="py-20 md:py-32 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            {t.landing.faq.title}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t.landing.faq.subtitle}
          </p>
        </div>

        {faqs === null ? (
          <p className="text-center text-muted-foreground py-8">{t.landing.faq.loading}</p>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={`faq-${index}`}
                value={`item-${index}`}
                className="bg-muted rounded-2xl px-8 overflow-hidden border-none"
              >
                <AccordionTrigger className="text-left text-lg font-bold text-foreground hover:no-underline py-6">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-6 whitespace-pre-wrap">
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
