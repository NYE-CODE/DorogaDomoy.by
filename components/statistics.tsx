import { Search, CheckCircle, Home } from 'lucide-react';
import { Statistics } from '../types/pet';

interface StatisticsProps {
  stats: Statistics;
}

export function StatisticsPanel({ stats }: StatisticsProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-6 ">
        <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-center gap-1.5 sm:gap-3">
          <div className="p-2 sm:p-3 bg-red-50 rounded-lg">
            <Search className="w-4 h-4 sm:w-6 sm:h-6 text-red-600" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-600">Сейчас ищут</p>
            <p className="text-lg sm:text-2xl font-semibold text-gray-900">{stats.searching}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-6 ">
        <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-center gap-1.5 sm:gap-3">
          <div className="p-2 sm:p-3 bg-blue-50 rounded-lg">
            <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-600">Найдено</p>
            <p className="text-lg sm:text-2xl font-semibold text-gray-900">{stats.found}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-6 ">
        <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-center gap-1.5 sm:gap-3">
          <div className="p-2 sm:p-3 bg-purple-50 rounded-lg">
            <Home className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-600">На передержке</p>
            <p className="text-lg sm:text-2xl font-semibold text-gray-900">{stats.fostering}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
