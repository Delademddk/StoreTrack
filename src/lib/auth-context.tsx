import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: "Admin" | "Manager" | "Cashier" | "Keeper";
  avatarInitials: string;
  storeName: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  login: (username: string, password: string, remember: boolean) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "storetrack-session";

const DEMO_USER: AuthUser = {
  id: "usr_01",
  name: "Alex Rivera",
  username: "alex",
  email: "alex@storetrack.io",
  role: "Admin",
  avatarInitials: "AR",
  storeName: "Northside Hub — Main Depot",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw) as AuthUser);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const login = async (username: string, _password: string, remember: boolean) => {
    // Frontend-only mock — accept anything, remember decides storage.
    await new Promise((r) => setTimeout(r, 450));
    const next: AuthUser = {
      ...DEMO_USER,
      username: username || DEMO_USER.username,
      avatarInitials: (username || "AR").slice(0, 2).toUpperCase(),
    };
    setUser(next);
    const store = remember ? localStorage : sessionStorage;
    store.setItem(STORAGE_KEY, JSON.stringify(next));
    if (!remember) localStorage.removeItem(STORAGE_KEY);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: !!user, hydrated, login, logout }),
    [user, hydrated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
