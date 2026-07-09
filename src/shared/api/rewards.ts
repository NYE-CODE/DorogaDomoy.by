import { api } from '@/shared/api/http';

export interface PointsTransactionItem {
  id: string;
  user_id: string;
  pet_id?: string | null;
  amount: number;
  kind: string;
  note?: string | null;
  created_at: string;
}

export const rewardsApi = {
  listPointsTransactions: (params?: { user_id?: string; pet_id?: string; kind?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => v != null && q.set(k, String(v)));
    return api<PointsTransactionItem[]>(`/rewards/points-transactions?${q}`);
  },
};

