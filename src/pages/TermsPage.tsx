import { useNavigate } from "react-router";

import { TermsPage as TermsPageContent } from "../../components/terms-page";
import { getHomePath } from "@/shared/lib/home-route";

export default function TermsPage() {
  const navigate = useNavigate();
  return (
    <TermsPageContent
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
