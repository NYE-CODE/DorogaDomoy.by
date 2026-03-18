import { ArrowLeft } from 'lucide-react';

interface TermsPageProps {
  onBack: () => void;
}

export function TermsPage({ onBack }: TermsPageProps) {
  return (
    <div className="min-h-screen bg-background dark:bg-gray-900">
      <header className="bg-card border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-accent dark:hover:bg-accent rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Условия использования</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-card rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 space-y-8">
          
          {/* Introduction */}
          <section>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Добро пожаловать на платформу поиска пропавших домашних животных. Используя наш сервис, 
              вы соглашаетесь соблюдать настоящие условия использования. Пожалуйста, внимательно 
              ознакомьтесь с ними перед регистрацией.
            </p>
          </section>

          {/* 1. Общие положения */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">1. Общие положения</h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300 leading-relaxed">
              <p>
                1.1. Платформа предназначена исключительно для помощи в поиске пропавших домашних 
                животных и воссоединения их с владельцами.
              </p>
              <p>
                1.2. Регистрируясь на платформе, вы подтверждаете, что вам исполнилось 18 лет, 
                или вы имеете согласие родителей/опекунов на использование сервиса.
              </p>
              <p>
                1.3. Вы обязуетесь предоставлять достоверную информацию и поддерживать актуальность 
                ваших контактных данных.
              </p>
            </div>
          </section>

          {/* 2. Правила публикации объявлений */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">2. Правила публикации объявлений</h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300 leading-relaxed">
              <p>
                2.1. Объявления должны содержать только актуальную и достоверную информацию о 
                пропавших или найденных животных.
              </p>
              <p>
                2.2. Запрещается публиковать объявления о продаже, покупке или передаче животных 
                за вознаграждение.
              </p>
              <p>
                2.3. Фотографии должны быть качественными и соответствовать описанию животного. 
                Запрещается использовать чужие фотографии или изображения из интернета.
              </p>
              <p>
                2.4. Запрещается публиковать оскорбительный, дискриминационный или неуместный контент.
              </p>
              <p>
                2.5. После нахождения животного необходимо удалить или отметить объявление как завершённое.
              </p>
            </div>
          </section>

          {/* 3. Ответственность пользователей */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">3. Ответственность пользователей</h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300 leading-relaxed">
              <p>
                3.1. Вы несёте полную ответственность за содержание своих объявлений и за общение 
                с другими пользователями.
              </p>
              <p>
                3.2. Платформа не несёт ответственности за любые споры, конфликты или убытки, 
                возникшие в результате взаимодействия между пользователями.
              </p>
              <p>
                3.3. Вы обязуетесь не использовать платформу в противозаконных целях или для 
                причинения вреда животным.
              </p>
              <p>
                3.4. При встрече с незнакомыми людьми для передачи животного соблюдайте меры 
                безопасности и по возможности встречайтесь в общественных местах.
              </p>
            </div>
          </section>

          {/* 4. Модерация и удаление контента */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">4. Модерация и удаление контента</h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300 leading-relaxed">
              <p>
                4.1. Все объявления проходят модерацию перед публикацией.
              </p>
              <p>
                4.2. Администрация оставляет за собой право отклонить, удалить или отредактировать 
                объявления, нарушающие настоящие правила, без объяснения причин.
              </p>
              <p>
                4.3. За нарушение правил пользователь может быть заблокирован временно или навсегда.
              </p>
              <p>
                4.4. Пользователи могут сообщать о нарушениях через функцию жалоб. Все жалобы 
                рассматриваются модераторами.
              </p>
            </div>
          </section>

          {/* 5. Конфиденциальность */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">5. Конфиденциальность</h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300 leading-relaxed">
              <p>
                5.1. Ваши персональные данные обрабатываются в соответствии с нашей Политикой 
                конфиденциальности.
              </p>
              <p>
                5.2. Контактная информация (телефон, Telegram, Viber) будет видна другим 
                пользователям в ваших объ��влениях.
              </p>
              <p>
                5.3. Мы не передаём ваши данные третьим лицам без вашего согласия, за исключением 
                случаев, предусмотренных законом.
              </p>
              <p>
                5.4. Платформа не предназначена для сбора персональной информации (ПИИ) или 
                хранения конфиденциальных данных.
              </p>
            </div>
          </section>

          {/* 6. Ограничение ответственности */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">6. Ограничение ответственности</h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300 leading-relaxed">
              <p>
                6.1. Платформа предоставляется «как есть» без каких-либо гарантий.
              </p>
              <p>
                6.2. Мы не гарантируем, что сервис будет работать без перебоев или ошибок.
              </p>
              <p>
                6.3. Мы не несём ответственности за действия пользователей, достоверность 
                информации в объявлениях или за результаты использования платформы.
              </p>
              <p>
                6.4. Максимальная ответственность платформы ограничена суммой, уплаченной вами 
                за использование сервиса (в настоящее время сервис бесплатен).
              </p>
            </div>
          </section>

          {/* 7. Запрещённые действия */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">7. Запрещённые действия</h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300 leading-relaxed">
              <p>
                Запрещается:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Создавать ложные объявления или распространять недостоверную информацию</li>
                <li>Использовать платформу для мошенничества или вымогательства</li>
                <li>Публиковать спам или рекламу, не связанную с поиском животных</li>
                <li>Использовать автоматизированные средства для сбора данных (парсинг, скрейпинг)</li>
                <li>Нарушать работу платформы или пытаться получить несанкционированный доступ</li>
                <li>Размещать вредоносный код или вирусы</li>
                <li>Выдавать себя за других пользователей или сотрудников платформы</li>
              </ul>
            </div>
          </section>

          {/* 8. Изменение условий */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">8. Изменение условий</h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300 leading-relaxed">
              <p>
                8.1. Мы оставляем за собой право изменять настоящие условия использования в любое время.
              </p>
              <p>
                8.2. Об изменениях будет сообщено через уведомления на платформе или по электронной почте.
              </p>
              <p>
                8.3. Продолжая использовать платформу после внесения изменений, вы соглашаетесь с новыми условиями.
              </p>
            </div>
          </section>

          {/* 9. Контакты */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">9. Контакты</h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300 leading-relaxed">
              <p>
                По всем вопросам, связанным с условиями использования, вы можете связаться с 
                администрацией платформы через форму обратной связи или по адресу электронной почты: 
                <a href="mailto:support@dorogadomoy.by" className="text-primary hover:text-primary/90 font-medium ml-1">
                  support@dorogadomoy.by
                </a>
              </p>
            </div>
          </section>

          {/* Footer */}
          <section className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Дата последнего обновления: 28 февраля 2026 г.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
