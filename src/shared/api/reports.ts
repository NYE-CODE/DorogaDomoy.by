import type { Report, ReportReason } from '@/entities/admin/model/types';
import { api } from '@/shared/api/http';
import { parseApiDate } from '@/shared/api/api-utils';

interface ReportResponse {
  id: string;
  pet_id: string;
  reporter_id: string;
  reporter_name: string;
  reason: string;
  description: string;
  created_at: string;
  status: string;
  reviewed_by?: string;
  reviewed_at?: string;
  resolution?: string;
}

export const reportsApi = {
  list: (params?: { status?: string; reason?: string }) => {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => v != null && q.set(k, String(v)));
    return api<ReportResponse[]>(`/reports?${q}`).then((arr) =>
      arr.map<Report>((r) => ({
        id: r.id,
        petId: r.pet_id,
        reporterId: r.reporter_id,
        reporterName: r.reporter_name,
        reason: r.reason as ReportReason,
        description: r.description,
        createdAt: parseApiDate(r.created_at),
        status: r.status as Report['status'],
        reviewedBy: r.reviewed_by,
        reviewedAt: r.reviewed_at ? parseApiDate(r.reviewed_at) : undefined,
        resolution: r.resolution,
      }))
    );
  },

  create: (petId: string, reason: ReportReason, description: string) =>
    api<ReportResponse>('/reports', {
      method: 'POST',
      body: JSON.stringify({ pet_id: petId, reason, description }),
    }).then<Report>((r) => ({
      id: r.id,
      petId: r.pet_id,
      reporterId: r.reporter_id,
      reporterName: r.reporter_name,
      reason: r.reason as ReportReason,
      description: r.description,
      createdAt: parseApiDate(r.created_at),
      status: r.status as Report['status'],
      reviewedBy: r.reviewed_by,
      reviewedAt: r.reviewed_at ? parseApiDate(r.reviewed_at) : undefined,
      resolution: r.resolution,
    })),

  delete: (reportId: string) =>
    api<void>(`/reports/${reportId}`, { method: 'DELETE' }),

  update: (reportId: string, data: { status?: string; resolution?: string }) =>
    api<ReportResponse>(`/reports/${reportId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

