import { useState } from 'react';
import { ArrowLeft, Mail } from 'lucide-react';
import { Link } from 'react-router';
import type { LegalMailtoForm, LegalPageContent, LegalSection } from '@/shared/i18n/legal-pages';

interface LegalDocumentPageProps {
  doc: LegalPageContent;
  onBack: () => void;
}

function isInternalPath(to: string): boolean {
  return to.startsWith('/') && !to.startsWith('//');
}

function MailtoRequestForm({
  contactEmail,
  form,
}: {
  contactEmail: string;
  form: LegalMailtoForm;
}) {
  const [email, setEmail] = useState('');
  const subject = encodeURIComponent(form.mailSubject);
  const body = encodeURIComponent(form.mailBodyTemplate.replace(/\{email\}/g, email.trim()));
  const href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;

  return (
    <form
      className="mt-4 space-y-3 rounded-lg border border-border bg-background p-4"
      action="#"
      method="get"
      onSubmit={(e) => {
        e.preventDefault();
        window.location.href = href;
      }}
    >
      <label className="block text-sm font-medium text-foreground">
        {form.emailLabel}
        <input
          type="email"
          name="account-email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={form.emailPlaceholder}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      </label>
      <p className="text-sm text-muted-foreground">{form.hint}</p>
      <button
        type="submit"
        className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {form.button}
      </button>
    </form>
  );
}

function SectionBody({ section, doc }: { section: LegalSection; doc: LegalPageContent }) {
  return (
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
      {section.links?.length ? (
        <ul className="space-y-2">
          {section.links.map((item) => (
            <li key={`${item.to}:${item.label}`}>
              {isInternalPath(item.to) ? (
                <Link to={item.to} className="font-medium text-primary hover:text-primary/90">
                  {item.label}
                </Link>
              ) : (
                <a href={item.to} className="font-medium text-primary hover:text-primary/90">
                  {item.label}
                </a>
              )}
            </li>
          ))}
        </ul>
      ) : null}
      {section.cta ? (
        <p>
          <a
            href={section.cta.href}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Mail className="size-4" aria-hidden />
            {section.cta.label}
          </a>
        </p>
      ) : null}
      {section.mailtoForm ? (
        <MailtoRequestForm contactEmail={doc.contactEmail} form={section.mailtoForm} />
      ) : null}
      {section.showContact ? (
        <p>
          {doc.contactParagraph}{' '}
          <a
            href={`mailto:${doc.contactEmail}`}
            className="font-medium text-primary hover:text-primary/90"
          >
            {doc.contactEmail}
          </a>
        </p>
      ) : null}
    </div>
  );
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
          {doc.sections.map((section, index) => (
            <section key={index}>
              {section.title ? <h2 className="typo-h3 mb-4">{section.title}</h2> : null}
              <SectionBody section={section} doc={doc} />
            </section>
          ))}

          <section className="border-t border-border pt-6">
            <p className="text-sm text-muted-foreground">{doc.updatedAt}</p>
          </section>
        </div>
      </main>
    </div>
  );
}
