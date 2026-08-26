import { useNavigate } from 'react-router';

import { DeleteAccountPage as DeleteAccountPageContent } from '../../components/delete-account-page';
import { getHomePath } from '@/shared/lib/home-route';

export default function DeleteAccountPage() {
  const navigate = useNavigate();
  return (
    <DeleteAccountPageContent
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
