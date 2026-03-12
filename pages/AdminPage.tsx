import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { AdminPanel } from '../components/admin-panel';
import { petsApi, usersApi, reportsApi } from '../api/client';
import { Pet } from '../types/pet';
import { User } from '../context/AuthContext';
import { Report, ReportReason, reportReasonLabels } from '../types/admin';
import { toast, Toaster } from 'sonner';
import { useTheme } from '../context/ThemeContext';

export default function AdminPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [pets, setPets] = useState<Pet[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const isAdmin = isAuthenticated && user?.role === 'admin';

  useEffect(() => {
    if (isLoading) return;
    if (!isAdmin) {
      navigate('/', { replace: true });
      return;
    }

    setDataLoading(true);
    Promise.all([
      petsApi.list().catch(() => [] as Pet[]),
      usersApi.list().catch(() => [] as User[]),
      reportsApi.list().catch(() => [] as Report[]),
    ]).then(([p, u, r]) => {
      setPets(p);
      setUsers(u);
      setReports(r);
    }).finally(() => setDataLoading(false));
  }, [isLoading, isAdmin, navigate]);

  if (isLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const handleUpdatePet = async (updatedPet: Pet) => {
    try {
      const p = await petsApi.update(updatedPet.id, {
        isArchived: updatedPet.isArchived,
        archiveReason: updatedPet.archiveReason,
        moderationStatus: updatedPet.moderationStatus,
        moderationReason: updatedPet.moderationReason,
      });
      setPets((prev) => prev.map((x) => (x.id === p.id ? p : x)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка');
      return;
    }
    const msg = updatedPet.moderationStatus === 'approved'
      ? 'Объявление одобрено'
      : updatedPet.moderationStatus === 'rejected'
        ? 'Объявление отклонено'
        : 'Объявление обновлено';
    toast.success(msg);
  };

  const handleDeletePet = async (petId: string) => {
    try {
      await petsApi.delete(petId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка');
      return;
    }
    setPets((prev) => prev.filter((p) => p.id !== petId));
    toast.success('Объявление удалено');
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      const u = await usersApi.update(updatedUser.id, {
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        is_blocked: updatedUser.isBlocked,
        blocked_reason: updatedUser.blockedReason,
      });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? u : x)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка');
      return;
    }
    toast.success('Пользователь обновлён');
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await usersApi.delete(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success('Пользователь удалён');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка');
    }
  };

  const handleUpdateReport = async (updatedReport: Report) => {
    try {
      await reportsApi.update(updatedReport.id, {
        status: updatedReport.status,
        resolution: updatedReport.resolution,
      });
      const list = await reportsApi.list();
      setReports(list);
      if (updatedReport.status === 'resolved' && updatedReport.petId) {
        const reasonLabel = reportReasonLabels[updatedReport.reason as ReportReason] || updatedReport.reason;
        const pet = pets.find((p) => p.id === updatedReport.petId);
        if (pet) {
          const reasonText = `Жалоба одобрена: ${reasonLabel}`;
          if (['spam', 'inappropriate', 'fake', 'other'].includes(updatedReport.reason)) {
            const p = await petsApi.update(pet.id, {
              moderationStatus: 'rejected',
              moderationReason: reasonText,
            });
            setPets((prev) => prev.map((x) => (x.id === p.id ? p : x)));
          } else if (updatedReport.reason === 'duplicate') {
            const p = await petsApi.update(pet.id, {
              isArchived: true,
              archiveReason: reasonText,
            });
            setPets((prev) => prev.map((x) => (x.id === p.id ? p : x)));
          } else if (updatedReport.reason === 'found') {
            const p = await petsApi.update(pet.id, {
              status: 'found',
              isArchived: true,
              archiveReason: reasonText,
            });
            setPets((prev) => prev.map((x) => (x.id === p.id ? p : x)));
          }
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка');
      return;
    }
    toast.success('Жалоба обработана');
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await reportsApi.delete(reportId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка');
      return;
    }
    setReports((prev) => prev.filter((r) => r.id !== reportId));
    toast.success('Жалоба удалена');
  };

  return (
    <>
      <Toaster position="top-center" richColors theme={theme} />
      <AdminPanel
        pets={pets}
        users={users}
        reports={reports}
        onBack={() => navigate('/')}
        onUpdatePet={handleUpdatePet}
        onDeletePet={handleDeletePet}
        onUpdateUser={handleUpdateUser}
        onDeleteUser={handleDeleteUser}
        onUpdateReport={handleUpdateReport}
        onDeleteReport={handleDeleteReport}
      />
    </>
  );
}
