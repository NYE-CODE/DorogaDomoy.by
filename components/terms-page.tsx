import { useI18n } from '@/app/providers/I18nContext';
import { getLegalPage } from '@/shared/i18n/legal-pages';
import { LegalDocumentPage } from './legal-document-page';

interface TermsPageProps {
  onBack: () => void;
}

export function TermsPage({ onBack }: TermsPageProps) {
  const { locale } = useI18n();
  return <LegalDocumentPage doc={getLegalPage(locale, 'terms')} onBack={onBack} />;
}
