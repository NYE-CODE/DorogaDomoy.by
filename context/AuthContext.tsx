import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, type TelegramAuthPayload } from '../api/client';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'volunteer' | 'admin';
  registeredAsVolunteer?: boolean;
  helperCode?: string | null;
  helperConfirmedCount?: number;
  pointsBalance?: number;
  pointsEarnedTotal?: number;
  contacts: {
    phone?: string;
    telegram?: string;
    viber?: string;
  };
  isBlocked?: boolean;
  blockedReason?: string;
  telegramId?: number | null;
  telegramUsername?: string | null;
  telegramLinkedAt?: string | null;
  profileCompleted?: boolean;
  passwordSet?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithTelegram: (payload: TelegramAuthPayload) => Promise<User>;
  register: (
    email: string,
    name: string,
    password: string,
    contacts: User['contacts'],
    signupRole?: 'user' | 'volunteer',
  ) => Promise<void>;
  completeProfile: (data: {
    email: string;
    role: 'user' | 'volunteer';
    password?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateContacts: (contacts: User['contacts']) => Promise<void>;
  updateProfile: (name: string, email: string, opts?: { role?: 'volunteer' }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  setPassword: (newPassword: string) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  refreshUser: () => Promise<void>;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  isAuthModalOpen: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const u = await authApi.me();
        if (!cancelled) setUser(u);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const u = await authApi.login(email, password);
    setUser(u);
    setIsAuthModalOpen(false);
  };

  const loginWithTelegram = async (payload: TelegramAuthPayload) => {
    const u = await authApi.loginWithTelegram(payload);
    setUser(u);
    setIsAuthModalOpen(false);
    return u;
  };

  const register = async (
    email: string,
    name: string,
    password: string,
    contacts: User['contacts'],
    signupRole: 'user' | 'volunteer' = 'user',
  ) => {
    const u = await authApi.register(email, name, password, contacts, signupRole);
    setUser(u);
    setIsAuthModalOpen(false);
  };

  const completeProfile = async (data: {
    email: string;
    role: 'user' | 'volunteer';
    password?: string;
  }) => {
    const u = await authApi.completeProfile(data);
    setUser(u);
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  const updateContacts = async (contacts: User['contacts']) => {
    if (!user) return;
    const u = await authApi.updateProfile({ contacts });
    setUser(u);
  };

  const updateProfile = async (name: string, email: string, opts?: { role?: 'volunteer' }) => {
    if (!user) return;
    const u = await authApi.updateProfile({
      name,
      email,
      ...(opts?.role ? { role: opts.role } : {}),
    });
    setUser(u);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await authApi.changePassword(currentPassword, newPassword);
    const u = await authApi.me();
    setUser(u);
  };

  const setPassword = async (newPassword: string) => {
    await authApi.setPassword(newPassword);
    const u = await authApi.me();
    setUser(u);
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    await authApi.uploadAvatar(file);
    const u = await authApi.me();
    setUser(u);
  };

  const refreshUser = async () => {
    try {
      const u = await authApi.me();
      setUser(u);
    } catch {
      setUser(null);
    }
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithTelegram,
        register,
        completeProfile,
        logout,
        updateContacts,
        updateProfile,
        changePassword,
        setPassword,
        uploadAvatar,
        refreshUser,
        openAuthModal,
        closeAuthModal,
        isAuthModalOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
