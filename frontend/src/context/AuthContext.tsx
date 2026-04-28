import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../api/client';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, role: string, username: string) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<User | null>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore session from the backend cookie if one exists
  useEffect(() => {
    api.auth.checkStatus()
      .then(status => {
        if (status.logged_in) return api.users.me().then(setUser);
      })
      .catch(() => {}) // backend not reachable — stay logged out silently
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.auth.login(email, password);
    setUser(res.user);
    return res.user;
  };

  const refresh = async (): Promise<User | null> => {
    try {
      const me = await api.users.me();
      setUser(me);
      return me;
    } catch {
      setUser(null);
      return null;
    }
  };

  const register = async (email: string, password: string, role: string, username: string): Promise<User> => {
    await api.auth.register(email, password, role, username);
    return login(email, password);
  };

  const logout = async () => {
    await api.auth.logout().catch(() => {});
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
