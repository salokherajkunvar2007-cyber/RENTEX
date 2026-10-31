import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { User } from '../types';
import { loginApi, registerApi, getProfileApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'owner';
  phone?: string;
  village?: string;
  district?: string;
  address?: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
  setUser: (user: User) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem('krv_token');
      const cachedUser = localStorage.getItem('krv_user');
      if (token && cachedUser) {
        try {
          setUserState(JSON.parse(cachedUser));
          const { data } = await getProfileApi();
          setUserState(data.user);
          localStorage.setItem('krv_user', JSON.stringify(data.user));
        } catch {
          localStorage.removeItem('krv_token');
          localStorage.removeItem('krv_user');
          setUserState(null);
        }
      }
      setIsLoading(false);
    };
    bootstrap();
  }, []);

  const setUser = useCallback((newUser: User) => {
    setUserState(newUser);
    localStorage.setItem('krv_user', JSON.stringify(newUser));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const { data } = await loginApi({ email, password });
        localStorage.setItem('krv_token', data.token);
        setUser(data.user);
        return data.user as User;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    [setUser]
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      try {
        const { data } = await registerApi(payload);
        localStorage.setItem('krv_token', data.token);
        setUser(data.user);
        return data.user as User;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    [setUser]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('krv_token');
    localStorage.removeItem('krv_user');
    setUserState(null);
    window.location.href = '/login';
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data } = await getProfileApi();
    setUser(data.user);
  }, [setUser]);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, register, logout, setUser, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
