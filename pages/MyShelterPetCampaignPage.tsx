import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { campaignsApi, sheltersApi, type ShelterCampaignResponse } from '../api/client';
import type { Pet } from '../types/pet';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { BackQuickMenu } from '../components/navigation/BackQuickMenu';
import { PageLoader } from '../components/ui/page-loader';
import { Button } from '../components/ui/button';
import { formatCalendarDate } from '../utils/pet-helpers';

export default function MyShelterPetCampaignPage() {
  const { shelterId, petId } = useParams<{ shelterId: string; petId: string }>();
  const [loading, setLoading] = useState(true);
  const [pet, setPet] = useState<Pet | null>(null);
  const [campaigns, setCampaigns] = useState<ShelterCampaignResponse[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    helpDetails: '',
    goalAmount: '',
    endsAt: '',
  });
  const [collectedForm, setCollectedForm] = useState({ amount: '' });
  const [closeForm, setCloseForm] = useState({ collectedAmount: '', closeReason: '' });

  const reload = async () => {
    if (!petId) return;
    const rows = await campaignsApi.listByPet(petId);
    setCampaigns(rows);
  };

  useEffect(() => {
    if (!shelterId || !petId) return;
    setLoading(true);
    Promise.all([sheltersApi.listPets(shelterId, { limit: 300 }), campaignsApi.listByPet(petId)])
      .then(([pets, camp]) => {
        setPet(pets.find((p) => p.id === petId) ?? null);
        setCampaigns(camp);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, [shelterId, petId]);

  const active = useMemo(() => campaigns.find((x) => x.status === 'active') ?? null, [campaigns]);
  const draft = useMemo(() => campaigns.find((x) => x.status === 'draft') ?? null, [campaigns]);
  const current = active ?? draft;
  const completed = useMemo(() => campaigns.filter((x) => x.status === 'completed'), [campaigns]);

  if (!shelterId || !petId) return <Navigate to="/my-shelters" replace />;
  if (loading) return <PageLoader />;
  if (!pet) return <Navigate to={`/my-shelters/${shelterId}/pets`} replace />;

  const createCampaign = async () => {
    const title = form.title.trim();
    const help = form.helpDetails.trim();
    const goal = Number(form.goalAmount);
    if (title.length < 3 || help.length < 10 || !Number.isFinite(goal) || goal < 1) {
      toast.error('Проверьте название, цель и реквизиты');
      return;
    }
    setSaving(true);
    try {
      await campaignsApi.createForPet(petId, {
        title,
        description: form.description.trim() || undefined,
        help_details: help,
        goal_amount: Math.round(goal),
        ends_at: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
      });
      setForm({ title: '', description: '', helpDetails: '', goalAmount: '', endsAt: '' });
      await reload();
      toast.success('Сбор создан');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не удалось создать сбор');
    } finally {
      setSaving(false);
    }
  };

  const activateCampaign = async (campaignId: string) => {
    setSaving(true);
    try {
      await campaignsApi.activate(campaignId);
      await reload();
      toast.success('Сбор запущен');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не удалось запустить сбор');
    } finally {
      setSaving(false);
    }
  };

  const closeCampaign = async (campaignId: string) => {
    const amount = Number(closeForm.collectedAmount);
    const reason = closeForm.closeReason.trim();
    if (!Number.isFinite(amount) || amount < 0 || reason.length < 3) {
      toast.error('Укажите сумму и причину закрытия');
      return;
    }
    setSaving(true);
    try {
      await campaignsApi.close(campaignId, {
        action: 'completed',
        collected_amount: Math.round(amount),
        close_reason: reason,
      });
      setCloseForm({ collectedAmount: '', closeReason: '' });
      await reload();
      toast.success('Сбор закрыт');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не удалось закрыть сбор');
    } finally {
      setSaving(false);
    }
  };

  const updateCollected = async (campaignId: string) => {
    const amount = Number(collectedForm.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error('Укажите корректную сумму');
      return;
    }
    setSaving(true);
    try {
      await campaignsApi.updateCollected(campaignId, Math.round(amount));
      await reload();
      toast.success('Сумма обновлена');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не удалось обновить сумму');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header showCitySelector />
      <main className="flex-1 py-6 sm:py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
          <BackQuickMenu />
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Питомец</p>
            <h1 className="mt-1 text-2xl font-bold">{pet.name?.trim() || pet.breed || pet.animalType}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{pet.description}</p>
            <Link to={`/shelter-pet/${pet.id}`} className="mt-2 inline-block text-sm text-primary hover:text-primary/80">
              Открыть публичную страницу питомца
            </Link>
          </div>

          {current ? (
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <h2 className="text-xl font-semibold">Текущий сбор</h2>
              <p className="font-medium">{current.title}</p>
              <p className="text-sm text-muted-foreground">{current.description || '—'}</p>
              <p className="text-sm">Цель: {current.goal_amount} BYN</p>
              <div className="rounded-lg border border-border bg-background p-3 text-sm whitespace-pre-line">
                {current.help_details || '—'}
              </div>
              {current.status === 'draft' ? (
                <Button type="button" disabled={saving} onClick={() => void activateCampaign(current.id)}>
                  Запустить сбор
                </Button>
              ) : null}
              {current.status === 'active' ? (
                <div className="grid gap-3 rounded-lg border border-border bg-background p-3">
                  <p className="text-sm text-muted-foreground">
                    Обновлено: {formatCalendarDate(new Date(current.updated_at))}
                  </p>
                  <p className="text-sm font-medium">Обновить сумму «собрано»</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={collectedForm.amount}
                      onChange={(e) => setCollectedForm({ amount: e.target.value })}
                      className="h-10 w-52 rounded-lg border border-border bg-background px-3 text-sm"
                      placeholder="Собрано (BYN)"
                    />
                    <Button type="button" variant="outline" disabled={saving} onClick={() => void updateCollected(current.id)}>
                      Обновить сумму
                    </Button>
                  </div>
                  <p className="text-sm font-medium">Закрытие активного сбора</p>
                  <input
                    type="number"
                    min={0}
                    value={closeForm.collectedAmount}
                    onChange={(e) => setCloseForm((p) => ({ ...p, collectedAmount: e.target.value }))}
                    className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
                    placeholder="Сколько собрано (BYN)"
                  />
                  <textarea
                    value={closeForm.closeReason}
                    onChange={(e) => setCloseForm((p) => ({ ...p, closeReason: e.target.value }))}
                    className="min-h-24 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="Причина закрытия"
                  />
                  <Button type="button" disabled={saving} onClick={() => void closeCampaign(current.id)}>
                    Завершить сбор
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <h2 className="text-xl font-semibold">Создать сбор</h2>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                placeholder="Название сбора"
              />
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="Описание сбора"
              />
              <textarea
                value={form.helpDetails}
                onChange={(e) => setForm((p) => ({ ...p, helpDetails: e.target.value }))}
                className="min-h-28 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="Как пополнить/отправить средства: реквизиты и инструкция"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="number"
                  min={1}
                  value={form.goalAmount}
                  onChange={(e) => setForm((p) => ({ ...p, goalAmount: e.target.value }))}
                  className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
                  placeholder="Цель (BYN)"
                />
                <input
                  type="date"
                  value={form.endsAt}
                  onChange={(e) => setForm((p) => ({ ...p, endsAt: e.target.value }))}
                  className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
                />
              </div>
              <Button type="button" disabled={saving} onClick={() => void createCampaign()}>
                Создать сбор
              </Button>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-xl font-semibold">Завершенные сборы</h2>
            {completed.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Пока нет завершенных сборов.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {completed.map((item) => (
                  <div key={item.id} className="rounded-lg border border-border p-3">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Собрано: {item.collected_amount} / {item.goal_amount} BYN
                    </p>
                    <p className="text-sm text-muted-foreground">Причина: {item.close_reason || '—'}</p>
                    {item.closed_at ? (
                      <p className="text-xs text-muted-foreground">
                        Закрыт: {formatCalendarDate(new Date(item.closed_at))}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
