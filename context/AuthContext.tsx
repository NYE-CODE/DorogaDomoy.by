import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, getToken } from '../api/client';

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
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string, contacts: User['contacts']) => Promise<void>;
  logout: () => void;
  updateContacts: (contacts: User['contacts']) => Promise<void>;
  updateProfile: (name: string, email: string) => Promise<void>;
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
    if (!getToken()) {
      setIsLoading(false);
      return;
    }
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

  const logout = () => {
    authApi.logout();
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
