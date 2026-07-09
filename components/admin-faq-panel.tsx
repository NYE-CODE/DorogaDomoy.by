import { useMemo, useState } from 'react';
import { Edit2, Plus, Save, Trash2 } from 'lucide-react';
import type { FaqItem } from '../api/client';
import { useI18n } from '../context/I18nContext';
import { adm } from './admin-panel-chrome';
import { AdminModalShell } from './admin/admin-modal-shell';

export interface AdminFaqPanelProps {
  faqItems: FaqItem[];
  onFaqCreate: (data: {
    question_ru?: string;
    question_be?: string;
    question_en?: string;
    answer_ru?: string;
    answer_be?: string;
    answer_en?: string;
    sort_order?: number;
  }) => void;
  onFaqUpdate: (
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
  ) => void;
  onFaqDelete: (id: string) => void;
}

export function AdminFaqPanel({ faqItems, onFaqCreate, onFaqUpdate, onFaqDelete }: AdminFaqPanelProps) {
  const { t } = useI18n();
  const ap = t.adminPanel;

  const [editingFaq, setEditingFaq] = useState<FaqItem | 'create' | null>(null);
  const [editFaqQr, setEditFaqQr] = useState('');
  const [editFaqQb, setEditFaqQb] = useState('');
  const [editFaqQe, setEditFaqQe] = useState('');
  const [editFaqAr, setEditFaqAr] = useState('');
  const [editFaqAb, setEditFaqAb] = useState('');
  const [editFaqAe, setEditFaqAe] = useState('');
  const [editFaqSort, setEditFaqSort] = useState(0);

  const faqRowsSorted = useMemo(
    () =>
      [...faqItems].sort((a, b) =>
        a.sort_order !== b.sort_order ? a.sort_order - b.sort_order : a.id.localeCompare(b.id),
      ),
    [faqItems],
  );

  const openFaqCreate = () => {
    const nextOrder = faqItems.length ? Math.max(...faqItems.map((f) => f.sort_order), 0) + 1 : 0;
    setEditingFaq('create');
    setEditFaqQr('');
    setEditFaqQb('');
    setEditFaqQe('');
    setEditFaqAr('');
    setEditFaqAb('');
    setEditFaqAe('');
    setEditFaqSort(nextOrder);
  };

  const openFaqEdit = (row: FaqItem) => {
    setEditingFaq(row);
    setEditFaqQr(row.question_ru);
    setEditFaqQb(row.question_be);
    setEditFaqQe(row.question_en);
    setEditFaqAr(row.answer_ru);
    setEditFaqAb(row.answer_be);
    setEditFaqAe(row.answer_en);
    setEditFaqSort(row.sort_order);
  };

  const handleSaveFaq = () => {
    if (editingFaq === 'create') {
      onFaqCreate({
        question_ru: editFaqQr,
        question_be: editFaqQb,
        question_en: editFaqQe,
        answer_ru: editFaqAr,
        answer_be: editFaqAb,
        answer_en: editFaqAe,
        sort_order: editFaqSort,
      });
    } else if (editingFaq && editingFaq !== 'create') {
      onFaqUpdate(editingFaq.id, {
        question_ru: editFaqQr,
        question_be: editFaqQb,
        question_en: editFaqQe,
        answer_ru: editFaqAr,
        answer_be: editFaqAb,
        answer_en: editFaqAe,
        sort_order: editFaqSort,
      });
    }
    setEditingFaq(null);
  };

  return (
    <div className={adm.page}>
      <div className={adm.headerRow}>
        <div className={adm.headerText}>
          <h2 className={adm.title}>{ap.faq.title}</h2>
          <p className={adm.subtitle}>{ap.faq.hint}</p>
        </div>
        <button type="button" onClick={openFaqCreate} className={adm.primaryBtn}>
          <Plus className="w-4 h-4" /> {ap.faq.add}
        </button>
      </div>

      <div className={adm.tableShell}>
        <div className={adm.tableWrap}>
          <table className={`${adm.table} min-w-[480px]`}>
            <thead className={adm.thead}>
              <tr>
                <th className={adm.th}>{ap.faq.colOrder}</th>
                <th className={adm.th}>{ap.faq.colQuestion}</th>
                <th className={adm.th}>{ap.faq.colActions}</th>
              </tr>
            </thead>
            <tbody className={adm.tbody}>
              {faqRowsSorted.length === 0 ? (
                <tr>
                  <td colSpan={3} className={adm.tdEmpty}>
                    {ap.faq.empty}
                  </td>
                </tr>
              ) : (
                faqRowsSorted.map((row) => (
                  <tr key={row.id} className={adm.tr}>
                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                      {row.sort_order}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground max-w-md truncate">
                      {row.question_ru || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openFaqEdit(row)}
                          className="p-1.5 text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded transition-colors"
                          title={ap.blog.editTooltip}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(ap.faq.deleteConfirm)) onFaqDelete(row.id);
                          }}
                          className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title={ap.blog.deleteTooltip}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminModalShell
        open={!!editingFaq}
        onClose={() => setEditingFaq(null)}
        title={editingFaq === 'create' ? ap.faq.modalAdd : ap.faq.modalEdit}
        maxWidthClass="max-w-2xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditingFaq(null)}
              className="px-4 py-3 text-sm text-foreground/90 border border-border rounded-lg hover:bg-accent dark:hover:bg-accent"
            >
              {t.common.cancel}
            </button>
            <button
              type="button"
              onClick={handleSaveFaq}
              className="flex items-center gap-2 px-4 py-3 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              <Save className="w-4 h-4" /> {t.common.save}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-1">{ap.faq.sortLabel}</label>
            <input
              type="number"
              value={editFaqSort}
              onChange={(e) => setEditFaqSort(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-1">{ap.faq.questionRu}</label>
            <textarea
              value={editFaqQr}
              onChange={(e) => setEditFaqQr(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg resize-y"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-1">{ap.faq.questionBe}</label>
            <textarea
              value={editFaqQb}
              onChange={(e) => setEditFaqQb(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg resize-y"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-1">{ap.faq.questionEn}</label>
            <textarea
              value={editFaqQe}
              onChange={(e) => setEditFaqQe(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg resize-y"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-1">{ap.faq.answerRu}</label>
            <textarea
              value={editFaqAr}
              onChange={(e) => setEditFaqAr(e.target.value)}
              rows={4}
              className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg resize-y"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-1">{ap.faq.answerBe}</label>
            <textarea
              value={editFaqAb}
              onChange={(e) => setEditFaqAb(e.target.value)}
              rows={4}
              className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg resize-y"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-1">{ap.faq.answerEn}</label>
            <textarea
              value={editFaqAe}
              onChange={(e) => setEditFaqAe(e.target.value)}
              rows={4}
              className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg resize-y"
            />
          </div>
        </div>
      </AdminModalShell>
    </div>
  );
}
