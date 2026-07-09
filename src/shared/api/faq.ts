import { api } from '@/shared/api/http';

export interface FaqItem {
  id: string;
  question_ru: string;
  question_be: string;
  question_en: string;
  answer_ru: string;
  answer_be: string;
  answer_en: string;
  sort_order: number;
}

export const faqApi = {
  list: () => api<FaqItem[]>('/faq'),

  create: (data: {
    question_ru?: string;
    question_be?: string;
    question_en?: string;
    answer_ru?: string;
    answer_be?: string;
    answer_en?: string;
    sort_order?: number;
  }) =>
    api<FaqItem>('/faq', {
      method: 'POST',
      body: JSON.stringify({
        question_ru: data.question_ru ?? '',
        question_be: data.question_be ?? '',
        question_en: data.question_en ?? '',
        answer_ru: data.answer_ru ?? '',
        answer_be: data.answer_be ?? '',
        answer_en: data.answer_en ?? '',
        sort_order: data.sort_order ?? 0,
      }),
    }),

  update: (
    id: string,
    data: Partial<{
      question_ru: string;
      question_be: string;
      question_en: string;
      answer_ru: string;
      answer_be: string;
      answer_en: string;
      sort_order: number;
    }>,
  ) =>
    api<FaqItem>(`/faq/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) => api<void>(`/faq/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

