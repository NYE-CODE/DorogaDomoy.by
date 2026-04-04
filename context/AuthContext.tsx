import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/client';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'volunteer' | 'shelter' | 'admin';
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
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string, contacts: User['contacts']) => Promise<void>;
  logout: () => Promise<void>;
  updateContacts: (contacts: User['contacts']) => Promise<void>;
  updateProfile: (name: string, email: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
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
    authApi.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const u = await authApi.login(email, password);
    setUser(u);
    setIsAuthModalOpen(false);
  };

  const register = async (email: string, name: string, password: string, contacts: User['contacts']) => {
    const u = await authApi.register(email, name, password, contacts);
    setUser(u);
    setIsAuthModalOpen(false);
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

  const updateProfile = async (name: string, email: string) => {
    if (!user) return;
    const u = await authApi.updateProfile({ name, email });
    setUser(u);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await authApi.changePassword(currentPassword, newPassword);
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
        register,
        logout,
        updateContacts,
        updateProfile,
        changePassword,
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
