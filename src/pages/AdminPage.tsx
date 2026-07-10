import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/app/providers/AuthContext';
import { AdminPanel } from '../../components/admin-panel';
import { petsApi, usersApi, reportsApi, mediaApi, partnersApi, partnerAdsApi, profilePetsApi, blogApi, faqApi } from '@/shared/api/client';
import type { BlogPostAdmin, FaqItem, MediaArticle, Partner, PartnerAd, PartnerAdCreatePayload, ProfilePetResponse } from '@/shared/api/client';
import { Pet } from '@/entities/pet/model/types';
import { User } from '@/app/providers/AuthContext';
import { Report } from '@/entities/admin/model/types';
import { toast } from 'sonner';
import { useI18n } from '@/app/providers/I18nContext';
import { getHomePath } from '@/shared/lib/home-route';

export default function AdminPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useI18n();
  const ap = t.adminPanel;
  const navigate = useNavigate();

  const [pets, setPets] = useState<Pet[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [mediaArticles, setMediaArticles] = useState<MediaArticle[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [partnerAds, setPartnerAds] = useState<PartnerAd[]>([]);
  const [profilePets, setProfilePets] = useState<ProfilePetResponse[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPostAdmin[]>([]);
  const [faqItems, setFaqItems] = useState<FaqItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const isAdmin = isAuthenticated && user?.role === 'admin';

  useEffect(() => {
    if (isLoading) return;
    if (!isAdmin) {
      navigate(getHomePath(), { replace: true });
      return;
    }

    let cancelled = false;

    (async () => {
      setDataLoading(true);
      try {
        const [p, u, r, m, partnersList, adsList, pp, blogs, faqList] = await Promise.all([
          petsApi.list({ limit: 500 }).catch(() => [] as Pet[]),
          usersApi.list().catch(() => [] as User[]),
          reportsApi.list().catch(() => [] as Report[]),
          mediaApi.list().catch(() => [] as MediaArticle[]),
          partnersApi.list().catch(() => [] as Partner[]),
          partnerAdsApi.listAdmin().catch(() => [] as PartnerAd[]),
          profilePetsApi.list().catch(() => [] as ProfilePetResponse[]),
          blogApi.adminList().catch(() => [] as BlogPostAdmin[]),
          faqApi.list().catch(() => [] as FaqItem[]),
        ]);
        if (cancelled) return;
        setPets(p);
        setUsers(u);
        setReports(r);
        setMediaArticles(m);
        setPartners(partnersList);
        setPartnerAds(adsList);
        setProfilePets(pp);
        setBlogPosts(blogs);
        setFaqItems(faqList);
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoading, isAdmin, navigate]);

  if (isLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
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
      toast.error(err instanceof Error ? err.message : ap.toasts.genericError);
      return;
    }
    const msg =
      updatedPet.moderationStatus === 'approved'
        ? ap.toasts.petApproved
        : updatedPet.moderationStatus === 'rejected'
          ? ap.toasts.petRejected
          : ap.toasts.petUpdated;
    toast.success(msg);
  };

  const handleDeletePet = async (petId: string) => {
    try {
      await petsApi.delete(petId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ap.toasts.genericError);
      return;
    }
    setPets((prev) => prev.filter((p) => p.id !== petId));
    toast.success(ap.toasts.petDeleted);
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      const u = await usersApi.update(updatedUser.id, {
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        is_blocked: updatedUser.isBlocked,
        blocked_reason: updatedUser.blockedReason,
        contacts: updatedUser.contacts,
      });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? u : x)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ap.toasts.genericError);
      return;
    }
    toast.success(ap.toasts.userUpdated);
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await usersApi.delete(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success(ap.toasts.userDeleted);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ap.toasts.genericError);
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
        const reasons = ap.reports.reasons;
        const reasonLabel =
          reasons[updatedReport.reason as keyof typeof reasons] ?? String(updatedReport.reason);
        const pet = pets.find((p) => p.id === updatedReport.petId);
        if (pet) {
          const reasonText = ap.reports.approvedPetNote(reasonLabel);
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
      toast.error(err instanceof Error ? err.message : ap.toasts.genericError);
      return;
    }
    toast.success(ap.toasts.reportProcessed);
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await reportsApi.delete(reportId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ap.toasts.genericError);
      return;
    }
    setReports((prev) => prev.filter((r) => r.id !== reportId));
    toast.success(ap.toasts.reportDeleted);
  };

  const handleMediaCreate = async (data: { logo_url?: string; title: string; published_at: string; link?: string }) => {
    try {
      const m = await mediaApi.create(data);
      setMediaArticles((prev) => [m, ...prev]);
      toast.success(ap.toasts.mediaSaved);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ap.toasts.genericError);
    }
  };

  const handleMediaUpdate = async (id: string, data: Partial<{ logo_url: string; title: string; published_at: string; link: string }>) => {
    try {
      const m = await mediaApi.update(id, data);
      setMediaArticles((prev) => prev.map((x) => (x.id === m.id ? m : x)));
      toast.success(ap.toasts.mediaUpdated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ap.toasts.genericError);
    }
  };

  const handleMediaDelete = async (id: string) => {
    try {
      await mediaApi.delete(id);
      setMediaArticles((prev) => prev.filter((m) => m.id !== id));
      toast.success(ap.toasts.mediaDeleted);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ap.toasts.genericError);
    }
  };

  const handlePartnerCreate = async (data: { logo_url?: string; name: string; link?: string; is_medallion_partner?: boolean }) => {
    try {
      const p = await partnersApi.create(data);
      setPartners((prev) => [p, ...prev]);
      toast.success(ap.toasts.partnerSaved);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ap.toasts.genericError);
    }
  };

  const handlePartnerUpdate = async (id: string, data: Partial<{ logo_url: string; name: string; link: string; is_medallion_partner: boolean }>) => {
    try {
      const p = await partnersApi.update(id, data);
      setPartners((prev) => prev.map((x) => (x.id === p.id ? p : x)));
      toast.success(ap.toasts.partnerUpdated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ap.toasts.genericError);
    }
  };

  const handlePartnerDelete = async (id: string) => {
    try {
      await partnersApi.delete(id);
      setPartners((prev) => prev.filter((p) => p.id !== id));
      toast.success(ap.toasts.partnerDeleted);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ap.toasts.genericError);
    }
  };

  const handlePartnerAdCreate = async (data: PartnerAdCreatePayload) => {
    try {
      const ad = await partnerAdsApi.create(data);
      setPartnerAds((prev) => [ad, ...prev]);
      toast.success(ap.toasts.partnerAdSaved);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ap.toasts.genericError);
    }
  };

  const handlePartnerAdUpdate = async (id: string, data: Partial<PartnerAdCreatePayload>) => {
    try {
      const ad = await partnerAdsApi.update(id, data);
      setPartnerAds((prev) => prev.map((x) => (x.id === ad.id ? ad : x)));
      toast.success(ap.toasts.partnerAdUpdated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ap.toasts.genericError);
    }
  };

  const handlePartnerAdDelete = async (id: string) => {
    try {
      await partnerAdsApi.delete(id);
      setPartnerAds((prev) => prev.filter((a) => a.id !== id));
      toast.success(ap.toasts.partnerAdDeleted);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ap.toasts.genericError);
    }
  };

  const handleDeleteProfilePet = async (id: string) => {
    try {
      await profilePetsApi.delete(id);
      setProfilePets((prev) => prev.filter((p) => p.id !== id));
      toast.success(ap.toasts.profilePetDeleted);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ap.toasts.genericError);
    }
  };

  const handleBlogCreate = async (data: Parameters<typeof blogApi.adminCreate>[0]) => {
    try {
      const post = await blogApi.adminCreate(data);
      setBlogPosts((prev) => [post, ...prev]);
      toast.success(data.status === 'published' ? ap.toasts.blogPublished : ap.toasts.blogDraftSaved);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ap.toasts.genericError);
    }
  };

  const handleBlogUpdate = async (id: string, data: Parameters<typeof blogApi.adminUpdate>[1]) => {
    try {
      const post = await blogApi.adminUpdate(id, data);
      setBlogPosts((prev) => prev.map((x) => (x.id === post.id ? post : x)));
      toast.success(ap.toasts.blogArticleSaved);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ap.toasts.genericError);
    }
  };

  const handleBlogDelete = async (id: string) => {
    try {
      await blogApi.adminDelete(id);
      setBlogPosts((prev) => prev.filter((p) => p.id !== id));
      toast.success(ap.toasts.blogArticleDeleted);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ap.toasts.genericError);
    }
  };

  const handleBlogSendTelegram = async (id: string) => {
    try {
      const post = await blogApi.adminSendTelegram(id);
      setBlogPosts((prev) => prev.map((x) => (x.id === post.id ? post : x)));
      toast.success(ap.toasts.telegramSent);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ap.toasts.genericError);
    }
  };

  const handleFaqCreate = async (data: Parameters<typeof faqApi.create>[0]) => {
    try {
      const row = await faqApi.create(data);
      setFaqItems((prev) => [...prev, row]);
      toast.success(ap.toasts.faqSaved);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ap.toasts.genericError);
    }
  };

  const handleFaqUpdate = async (id: string, data: Parameters<typeof faqApi.update>[1]) => {
    try {
      const row = await faqApi.update(id, data);
      setFaqItems((prev) => prev.map((x) => (x.id === row.id ? row : x)));
      toast.success(ap.toasts.faqUpdated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ap.toasts.genericError);
    }
  };

  const handleFaqDelete = async (id: string) => {
    try {
      await faqApi.delete(id);
      setFaqItems((prev) => prev.filter((x) => x.id !== id));
      toast.success(ap.toasts.faqDeleted);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ap.toasts.genericError);
    }
  };

  return (
    <>
      <AdminPanel
        pets={pets}
        users={users}
        reports={reports}
        mediaArticles={mediaArticles}
        partners={partners}
        partnerAds={partnerAds}
        profilePets={profilePets}
        onBack={() => navigate(getHomePath())}
        onUpdatePet={handleUpdatePet}
        onDeletePet={handleDeletePet}
        onUpdateUser={handleUpdateUser}
        onDeleteUser={handleDeleteUser}
        onUpdateReport={handleUpdateReport}
        onDeleteReport={handleDeleteReport}
        onMediaCreate={handleMediaCreate}
        onMediaUpdate={handleMediaUpdate}
        onMediaDelete={handleMediaDelete}
        onPartnerCreate={handlePartnerCreate}
        onPartnerUpdate={handlePartnerUpdate}
        onPartnerDelete={handlePartnerDelete}
        onPartnerAdCreate={(data) => {
          void handlePartnerAdCreate(data);
        }}
        onPartnerAdUpdate={(id, data) => {
          void handlePartnerAdUpdate(id, data);
        }}
        onPartnerAdDelete={(id) => {
          void handlePartnerAdDelete(id);
        }}
        onDeleteProfilePet={handleDeleteProfilePet}
        blogPosts={blogPosts}
        onBlogCreate={(data) => {
          void handleBlogCreate(data);
        }}
        onBlogUpdate={(id, data) => {
          void handleBlogUpdate(id, data);
        }}
        onBlogDelete={(id) => {
          void handleBlogDelete(id);
        }}
        onBlogSendTelegram={(id) => {
          void handleBlogSendTelegram(id);
        }}
        faqItems={faqItems}
        onFaqCreate={(data) => {
          void handleFaqCreate(data);
        }}
        onFaqUpdate={(id, data) => {
          void handleFaqUpdate(id, data);
        }}
        onFaqDelete={(id) => {
          void handleFaqDelete(id);
        }}
      />
    </>
  );
}
