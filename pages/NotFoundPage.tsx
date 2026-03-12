import { ArrowLeft, Search } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="relative mx-auto w-40 h-40 mb-6">
          <div className="absolute inset-0 flex items-center justify-center text-8xl">
            🐾
          </div>
          <div className="absolute -bottom-1 -right-1 w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
            <Search className="w-7 h-7 text-red-500" />
          </div>
        </div>

        <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-2">404</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-1">Страница не найдена</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">
          Похоже, эта страница потерялась — совсем как питомец, которого мы помогаем искать
        </p>

        <a
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          На главную
        </a>
      </div>
    </div>
  );
}
