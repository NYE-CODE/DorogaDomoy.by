import { useNavigate } from 'react-router';

import { PrivacyPage as PrivacyPageContent } from '../../components/privacy-page';
import { getHomePath } from '@/shared/lib/home-route';

export default function PrivacyPage() {
  const navigate = useNavigate();
  return (
    <PrivacyPageContent
      onBack={() => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
          navigate(-1);
        } else {
          navigate(getHomePath());
        }
      }}
    />
  );
}
