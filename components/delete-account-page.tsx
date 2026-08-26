import { useI18n } from '@/app/providers/I18nContext';
import { getLegalPage } from '@/shared/i18n/legal-pages';
import { LegalDocumentPage } from './legal-document-page';

interface DeleteAccountPageProps {
  onBack: () => void;
}

export function DeleteAccountPage({ onBack }: DeleteAccountPageProps) {
  const { locale } = useI18n();
  return <LegalDocumentPage doc={getLegalPage(locale, 'delete-account')} onBack={onBack} />;
}
