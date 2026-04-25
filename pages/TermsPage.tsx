import { useNavigate } from "react-router";

import { TermsPage as TermsPageContent } from "../components/terms-page";

export default function TermsPage() {
  const navigate = useNavigate();
  return <TermsPageContent onBack={() => navigate(-1)} />;
}
