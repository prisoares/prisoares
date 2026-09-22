import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, AuthUser } from '../api/client';

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  login: (cpf: string, password: string) => Promise<void>;
  register: (input: {
    name: string;
    email: string;
    cpf: string;
    password: string;
    phone?: string;
    role: 'USER' | 'PARTNER';
  }) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: 'USER' | 'PARTNER') => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);
const TOKEN_KEY = 'ludi.token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(TOKEN_KEY);
        if (saved) {
          const me = await api.me(saved);
          setToken(saved);
          setUser(me);
        }
      } catch {
        await AsyncStorage.removeItem(TOKEN_KEY);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (accessToken: string, next: AuthUser) => {
    await AsyncStorage.setItem(TOKEN_KEY, accessToken);
    setToken(accessToken);
    setUser(next);
  }, []);

  const login = useCallback(
    async (cpf: string, password: string) => {
      const res = await api.login(cpf, password);
      await persist(res.accessToken, res.user);
    },
    [persist],
  );

  const register = useCallback(
    async (input: {
      name: string;
      email: string;
      cpf: string;
      password: string;
      phone?: string;
      role: 'USER' | 'PARTNER';
    }) => {
      const res = await api.register(input);
      await persist(res.accessToken, res.user);
    },
    [persist],
  );

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const switchRole = useCallback(
    async (role: 'USER' | 'PARTNER') => {
      if (!token) return;
      const res = await api.switchRole(token, role);
      await persist(res.accessToken, res.user);
    },
    [persist, token],
  );

  const refresh = useCallback(async () => {
    if (!token) return;
    const me = await api.me(token);
    setUser(me);
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      register,
      logout,
      switchRole,
      refresh,
    }),
    [token, user, loading, login, register, logout, switchRole, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}
