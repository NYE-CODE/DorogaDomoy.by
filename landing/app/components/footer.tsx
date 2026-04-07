import { Mail, MessageCircle, Bot } from "lucide-react";
import { Link } from "react-router";
import { useI18n } from "../../../context/I18nContext";
import { useFeatureFlags } from "../../../context/FeatureFlagsContext";

export function Footer() {
  const { t } = useI18n();
  const { ff_landing_show_help, ff_landing_show_faq } = useFeatureFlags();
  const f = t.landing.footer;
  return (
    <footer className="bg-gray-800 dark:bg-gray-900 text-white py-16 pb-24 md:pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Link to="/" className="flex items-center gap-3">
                <img src="/logo.png" alt="DorogaDomoy.by" className="w-10 h-10 object-contain" />
                <span className="text-2xl font-bold">DorogaDomoy.by</span>
              </Link>
            </div>
            <p className="text-gray-400 leading-relaxed">
              {f.about}
            </p>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-6">{f.contactsTitle}</h3>
            <ul className="space-y-4">
              <li>
                <a href="mailto:contact@dorogadomoy.by" className="text-gray-400 hover:text-[#FDB913] transition-colors flex items-center gap-3">
                  <Mail size={18} />
                  <span>contact@dorogadomoy.by</span>
                </a>
              </li>
              <li>
                <a href="https://t.me/dorogadomoy_by" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#FDB913] transition-colors flex items-center gap-3">
                  <MessageCircle size={18} />
                  <span>{f.telegramGroup}</span>
                </a>
              </li>
              <li>
                <a href="https://t.me/dorogadomoy_support_bot" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#FDB913] transition-colors flex items-center gap-3">
                  <Bot size={18} />
                  <span>{f.supportBot}</span>
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-6">{f.infoTitle}</h3>
            <ul className="space-y-3">
              <li><Link to="/#how-it-works" className="text-gray-400 hover:text-[#FDB913] transition-colors">{f.howItWorks}</Link></li>
              <li><a href="#" className="text-gray-400 hover:text-[#FDB913] transition-colors">{f.rules}</a></li>
              <li><a href="#" className="text-gray-400 hover:text-[#FDB913] transition-colors">{f.privacyPolicy}</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-6">{f.navTitle}</h3>
            <ul className="space-y-3">
              <li><Link to="/#how-it-works" className="text-gray-400 hover:text-[#FDB913] transition-colors">{f.howItWorks}</Link></li>
              <li><Link to="/#why-us" className="text-gray-400 hover:text-[#FDB913] transition-colors">{f.whyUs}</Link></li>
              <li><Link to="/blog" className="text-gray-400 hover:text-[#FDB913] transition-colors">{f.blog}</Link></li>
              <li><Link to="/#announcements" className="text-gray-400 hover:text-[#FDB913] transition-colors">{f.ads}</Link></li>
              {ff_landing_show_faq && (
                <li><Link to="/#faq" className="text-gray-400 hover:text-[#FDB913] transition-colors">{f.faq}</Link></li>
              )}
              {ff_landing_show_help && <li><Link to="/#help" className="text-gray-400 hover:text-[#FDB913] transition-colors">{f.help}</Link></li>}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8 text-center text-gray-400">
          <p>&copy; 2026 DorogaDomoy.by — {f.copyright}</p>
          <p className="mt-2">{f.madeWith} ❤️ {f.forPets}</p>
        </div>
      </div>
    </footer>
  );
}