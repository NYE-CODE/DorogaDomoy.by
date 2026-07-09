import { useState } from 'react';
import { CheckCircle2, ExternalLink, Trash2, XCircle } from 'lucide-react';
import { Pet } from '../types/pet';
import { Report, type ReportReason } from '../types/admin';
import { formatDate } from '../utils/pet-helpers';
import { useI18n } from '../context/I18nContext';
import { adm } from './admin-panel-chrome';
import { AdminTablePagination } from './admin-table-pagination';
import { getAdminPetPreviewPhoto } from './admin-panel-helpers';

export interface AdminReportsPanelProps {
  reports: Report[];
  pets: Pet[];
  onUpdateReport: (report: Report) => void;
  onDeleteReport: (reportId: string) => void;
}

export function AdminReportsPanel({
  reports,
  pets,
  onUpdateReport,
  onDeleteReport,
}: AdminReportsPanelProps) {
  const { t } = useI18n();
  const ap = t.adminPanel;

  const [reportsStatusFilter, setReportsStatusFilter] = useState<string>('all');
  const [reportsReasonFilter, setReportsReasonFilter] = useState<string>('all');
  const [reportsPage, setReportsPage] = useState(1);
  const reportsPerPage = 10;

  const filteredReports = reports
    .filter((report) => {
      if (reportsStatusFilter !== 'all') return report.status === reportsStatusFilter;
      return true;
    })
    .filter((report) => {
      if (reportsReasonFilter !== 'all') return report.reason === reportsReasonFilter;
      return true;
    });

  const totalPages = Math.ceil(filteredReports.length / reportsPerPage);
  const paginatedReports = filteredReports.slice(
    (reportsPage - 1) * reportsPerPage,
    reportsPage * reportsPerPage,
  );

  return (
    <div className={adm.page}>
      <div className={adm.headerRow}>
        <div className={adm.headerText}>
          <h2 className={adm.title}>{ap.reports.title}</h2>
        </div>
      </div>

      <div className={adm.filtersCard}>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className={adm.labelFilter}>{ap.reports.statusLabel}</label>
            <select
              value={reportsStatusFilter}
              onChange={(e) => {
                setReportsStatusFilter(e.target.value);
                setReportsPage(1);
              }}
              className={adm.selectNative}
            >
              <option value="all">{ap.reports.statusAll}</option>
              <option value="pending">{ap.reports.statusNew}</option>
              <option value="reviewed">{ap.reports.statusReviewed}</option>
              <option value="resolved">{ap.reports.statusResolved}</option>
              <option value="dismissed">{ap.reports.statusDismissed}</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className={adm.labelFilter}>{ap.reports.reasonLabel}</label>
            <select
              value={reportsReasonFilter}
              onChange={(e) => {
                setReportsReasonFilter(e.target.value);
                setReportsPage(1);
              }}
              className={adm.selectNative}
            >
              <option value="all">{ap.reports.reasonAll}</option>
              {(Object.keys(ap.reports.reasons) as ReportReason[]).map((rk) => (
                <option key={rk} value={rk}>
                  {ap.reports.reasons[rk]}
                </option>
              ))}
            </select>
          </div>

          <div className="text-sm text-muted-foreground ml-auto">
            {ap.reports.foundCount}: {filteredReports.length} {ap.reports.complaints}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {paginatedReports.length === 0 ? (
          <div className={adm.emptyBox}>
            <p>{ap.reports.empty}</p>
          </div>
        ) : (
          paginatedReports.map((report) => {
            const pet = pets.find((p) => p.id === report.petId);
            return (
              <div key={report.id} className={adm.listCard}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span
                        className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          report.status === 'pending'
                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                            : report.status === 'resolved'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : report.status === 'dismissed'
                                ? 'bg-muted text-foreground/90'
                                : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {report.status === 'pending'
                          ? ap.reports.badgeNew
                          : report.status === 'resolved'
                            ? ap.reports.badgeResolved
                            : report.status === 'dismissed'
                              ? ap.reports.badgeDismissed
                              : ap.reports.badgeReviewed}
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {ap.reports.reasons[report.reason]}
                      </span>
                    </div>

                    <p className="font-medium text-foreground mb-1">
                      {ap.reports.from}:{' '}
                      <a
                        href={`/user/${report.reporterId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/90 hover:underline"
                      >
                        {report.reporterName}
                      </a>
                    </p>
                    <p className="text-sm text-muted-foreground mb-3">{report.description}</p>

                    {pet && (
                      <div className="space-y-2">
                        <a
                          href={`/pet/${pet.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-muted dark:bg-accent rounded-lg hover:bg-accent dark:hover:bg-accent transition-colors group"
                        >
                          <img
                            src={getAdminPetPreviewPhoto(pet)}
                            alt=""
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400">
                              {pet.breed || ap.breedUnknown}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {pet.city} · {pet.authorName}
                            </p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-muted-foreground/80 group-hover:text-primary shrink-0" />
                        </a>
                        <div className="rounded-lg border border-border p-2 text-xs text-muted-foreground dark:text-muted-foreground/50">
                          {ap.reports.petReward}{' '}
                          {pet.rewardMode === 'money'
                            ? `${pet.rewardAmountByn ?? 0} BYN`
                            : ap.reports.rewardPointsUnit(pet.rewardPoints ?? 0)}{' '}
                          · {ap.reports.petAwarded}{' '}
                          {pet.rewardPointsAwardedAt
                            ? formatDate(pet.rewardPointsAwardedAt)
                            : ap.reports.petAwardedNever}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-2">{formatDate(report.createdAt)}</p>
                  </div>

                  <div className="flex sm:flex-col gap-2">
                    {report.status === 'pending' && (
                      <>
                        <button
                          onClick={() =>
                            onUpdateReport({ ...report, status: 'resolved', reviewedAt: new Date() })
                          }
                          className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          title={ap.reports.resolveTooltip}
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() =>
                            onUpdateReport({ ...report, status: 'dismissed', reviewedAt: new Date() })
                          }
                          className="p-2 text-muted-foreground hover:bg-accent dark:hover:bg-accent rounded-lg transition-colors"
                          title={ap.reports.dismissTooltip}
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        if (window.confirm(ap.reports.deleteConfirm)) {
                          onDeleteReport(report.id);
                        }
                      }}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title={ap.reports.deleteTooltip}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <AdminTablePagination
          currentPage={reportsPage}
          totalPages={totalPages}
          onPageChange={setReportsPage}
          labels={ap.pagination}
          summary={
            <>
              <span className="text-sm text-muted-foreground">
                {ap.reports.pageOf(reportsPage, totalPages)}
              </span>
              <span className="text-xs text-muted-foreground">
                {ap.users.totalShort(filteredReports.length)}
              </span>
            </>
          }
        />
      )}
    </div>
  );
}
