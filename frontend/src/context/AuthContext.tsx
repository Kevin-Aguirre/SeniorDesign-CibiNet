import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '../types';

const MOCK_AUTH = true;

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (MOCK_AUTH) {
      const saved = localStorage.getItem('mock_user');
      if (saved) setUser(JSON.parse(saved));
      setLoading(false);
      return;
    }
    // TODO: restore real auth check when backend is ready
    // api.auth.checkStatus() ...
    setLoading(false);
  }, []);

  const login = async (email: string, _password: string) => {
    if (MOCK_AUTH) {
      const mockUser: User = { id: 1, email, role: 'Donor' };
      localStorage.setItem('mock_user', JSON.stringify(mockUser));
      setUser(mockUser);
      return;
    }
    // TODO: restore real login when backend is ready
  };

  const register = async (email: string, _password: string, role: string) => {
    if (MOCK_AUTH) {
      const mockUser: User = { id: Date.now(), email, role: role as User['role'] };
      localStorage.setItem('mock_user', JSON.stringify(mockUser));
      setUser(mockUser);
      return;
    }
    // TODO: restore real register when backend is ready
  };

  const logout = async () => {
    localStorage.removeItem('mock_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
