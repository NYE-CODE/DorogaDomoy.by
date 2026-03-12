import { Search, CheckCircle, Home } from 'lucide-react';
import { Statistics } from '../types/pet';

interface StatisticsProps {
  stats: Statistics;
}

export function StatisticsPanel({ stats }: StatisticsProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-6 ">
        <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-center gap-1.5 sm:gap-3">
          <div className="p-2 sm:p-3 bg-red-50 rounded-lg">
            <Search className="w-4 h-4 sm:w-6 sm:h-6 text-red-600" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Сейчас ищут</p>
            <p className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white">{stats.searching}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-6 ">
        <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-center gap-1.5 sm:gap-3">
          <div className="p-2 sm:p-3 bg-blue-50 rounded-lg">
            <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Найдено</p>
            <p className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white">{stats.found}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-6 ">
        <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-center gap-1.5 sm:gap-3">
          <div className="p-2 sm:p-3 bg-purple-50 rounded-lg">
            <Home className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">На передержке</p>
            <p className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white">{stats.fostering}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
