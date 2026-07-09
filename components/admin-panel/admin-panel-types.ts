import type {
  BlogPostAdmin,
  FaqItem,
  MediaArticle,
  Partner,
  ProfilePetResponse,
} from '../../api/client';
import type { User } from '../../context/AuthContext';
import type { Report } from '../../types/admin';
import type { Pet } from '../../types/pet';

export interface AdminPanelProps {
  pets: Pet[];
  users: User[];
  reports: Report[];
  mediaArticles: MediaArticle[];
  partners: Partner[];
  profilePets: ProfilePetResponse[];
  onBack: () => void;
  onUpdatePet: (pet: Pet) => void;
  onDeletePet: (petId: string) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateReport: (report: Report) => void;
  onDeleteReport: (reportId: string) => void;
  onMediaCreate: (data: {
    logo_url?: string;
    title: string;
    published_at: string;
    link?: string;
  }) => void;
  onMediaUpdate: (
    id: string,
    data: Partial<{ logo_url: string; title: string; published_at: string; link: string }>,
  ) => void;
  onMediaDelete: (id: string) => void;
  onPartnerCreate: (data: {
    logo_url?: string;
    name: string;
    link?: string;
    is_medallion_partner?: boolean;
  }) => void;
  onPartnerUpdate: (
    id: string,
    data: Partial<{ logo_url: string; name: string; link: string; is_medallion_partner: boolean }>,
  ) => void;
  onPartnerDelete: (id: string) => void;
  onDeleteProfilePet: (id: string) => void;
  blogPosts: BlogPostAdmin[];
  onBlogCreate: (data: {
    slug: string;
    title: string;
    excerpt?: string;
    body_md: string;
    cover_image_url?: string;
    meta_description?: string;
    category?: string;
    status?: 'draft' | 'published';
  }) => void;
  onBlogUpdate: (
    id: string,
    data: Partial<{
      slug: string;
      title: string;
      excerpt: string;
      body_md: string;
      cover_image_url: string;
      meta_description: string;
      category: string;
      status: 'draft' | 'published';
    }>,
  ) => void;
  onBlogDelete: (id: string) => void;
  onBlogSendTelegram: (id: string) => void;
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
