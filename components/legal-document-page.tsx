import { ArrowLeft } from 'lucide-react';
import type { LegalPageContent } from '@/shared/i18n/legal-pages';

interface LegalDocumentPageProps {
  doc: LegalPageContent;
  onBack: () => void;
}

export function LegalDocumentPage({ doc, onBack }: LegalDocumentPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="page-container-narrow py-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onBack}
              aria-label={doc.back}
              className="rounded-full p-2 transition-colors hover:bg-accent"
            >
              <ArrowLeft className="size-5 text-muted-foreground" aria-hidden />
            </button>
            <h1 className="typo-h3">{doc.title}</h1>
          </div>
        </div>
      </header>

      <main className="page-container-narrow py-8" id="main-content">
        <div className="space-y-8 rounded-lg border border-border bg-card p-6 md:p-8">
          {doc.sections.map((section, index) => {
            const isContact = section.title.startsWith('9.');
            return (
              <section key={index}>
                {section.title ? <h2 className="typo-h3 mb-4">{section.title}</h2> : null}
                <div className="space-y-3 leading-relaxed text-foreground/90">
                  {section.paragraphs.map((paragraph, pi) => (
                    <p key={pi}>{paragraph}</p>
                  ))}
                  {section.bullets ? (
                    <ul className="ml-4 list-inside list-disc space-y-2">
                      {section.bullets.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                  {isContact ? (
                    <p>
                      {doc.contactParagraph}{' '}
                      <a
                        href={`mailto:${doc.contactEmail}`}
                        className="ml-1 font-medium text-primary hover:text-primary/90"
                      >
                        {doc.contactEmail}
                      </a>
                    </p>
                  ) : null}
                </div>
              </section>
            );
          })}

          <section className="border-t border-border pt-6">
            <p className="text-sm text-muted-foreground">{doc.updatedAt}</p>
          </section>
        </div>
      </main>
    </div>
  );
}
