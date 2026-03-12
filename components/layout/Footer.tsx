import { Mail, MessageCircle, Bot, Heart } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="max-w-[1920px] mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* О проекте */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <img src="/logo.png" alt="DorogaDomoy.by" className="h-8 w-auto" />
              <span className="text-lg font-semibold text-gray-900 dark:text-white">DorogaDomoy.by</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {t.footer.about}
            </p>
          </div>

          {/* Контакты */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-3">{t.footer.contacts}</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:contact@dorogadomoy.by"
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500 transition-colors"
                >
                  <Mail className="w-4 h-4 shrink-0" />
                  contact@dorogadomoy.by
                </a>
              </li>
              <li>
                <a
                  href="https://t.me/dorogadomoy_by"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  {t.footer.telegramGroup}
                </a>
              </li>
              <li>
                <a
                  href="https://t.me/dorogadomoy_support_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500 transition-colors"
                >
                  <Bot className="w-4 h-4 shrink-0" />
                  {t.footer.supportBot}
                </a>
              </li>
            </ul>
          </div>

          {/* Ссылки */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-3">{t.footer.info}</h3>
            <ul className="space-y-2">
              <li>
                <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500 transition-colors">
                  {t.footer.howItWorks}
                </button>
              </li>
              <li>
                <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500 transition-colors">
                  {t.footer.rules}
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 mt-6 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} DorogaDomoy.by — {t.footer.copyright}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            {t.footer.madeWith} <Heart className="w-3 h-3 text-red-500 fill-red-500" /> {t.footer.forPets}
          </p>
        </div>
      </div>
    </footer>
  );
}
