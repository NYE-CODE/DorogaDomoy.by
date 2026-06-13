import { useI18n } from '@/app/providers/I18nContext';
import { getLegalPage } from '@/shared/i18n/legal-pages';
import { LegalDocumentPage } from './legal-document-page';

interface PrivacyPageProps {
  onBack: () => void;
}

export function PrivacyPage({ onBack }: PrivacyPageProps) {
  const { locale } = useI18n();
  return <LegalDocumentPage doc={getLegalPage(locale, 'privacy')} onBack={onBack} />;
}
