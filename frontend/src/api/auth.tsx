import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api, setToken, clearToken } from './client';

interface User {
  logged_in: boolean;
  name: string;
  email: string;
  premium: boolean;
  is_admin: boolean;
  expire_at: string;
  expired: boolean;
  demo: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.me().then(setUser).finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const data = await api.login(email, password);
    setToken(data.token);
    setUser({
      logged_in: true,
      name: data.name,
      email,
      premium: data.premium,
      is_admin: data.is_admin,
      expire_at: data.expire_at || '',
      expired: false,
      demo: false,
    });
  }

  async function register(email: string, password: string, name: string, code: string) {
    const data = await api.register(email, password, name, code);
    setToken(data.token);
    setUser({
      logged_in: true,
      name: data.name,
      email,
      premium: true,
      is_admin: true,
      expire_at: '',
      expired: false,
      demo: false,
    });
  }

  async function logout() {
    await api.logout();
    clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
