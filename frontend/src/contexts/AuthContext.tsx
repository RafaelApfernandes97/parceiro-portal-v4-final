import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

interface User {
  id: string;
  email: string;
  role: 'partner' | 'admin';
  nome: string;
  onboardingStep: 'pending_activation' | 'company_data' | 'contract' | 'active';
  contractSignedAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { nome: string; email: string; password: string }) => Promise<void>;
  activate: (token: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateLocalUser: (partial: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('mc_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('mc_token'));
  const navigate = useNavigate();

  const isLoggedIn = !!token && !!user;
  const isAdmin = user?.role === 'admin';

  const setSession = (t: string, u: User) => {
    localStorage.setItem('mc_token', t);
    localStorage.setItem('mc_user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    setSession(res.data.token, res.data.user);
  };

  const register = async (data: { nome: string; email: string; password: string }) => {
    await api.post('/auth/register', data);
  };

  const activate = async (activationToken: string): Promise<User> => {
    const res = await api.get(`/auth/activate/${activationToken}`);
    setSession(res.data.token, res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('mc_token');
    localStorage.removeItem('mc_user');
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  const refreshUser = async () => {
    const res = await api.get('/auth/me');
    const u = res.data.user;
    setUser(u);
    localStorage.setItem('mc_user', JSON.stringify(u));
  };

  const updateLocalUser = (partial: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...partial };
      setUser(updated);
      localStorage.setItem('mc_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoggedIn, isAdmin, login, register, activate, logout, refreshUser, updateLocalUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
