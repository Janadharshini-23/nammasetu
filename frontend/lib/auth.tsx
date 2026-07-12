"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type AuthState = { name: string; email: string } | null;
const AuthContext = createContext<{
  user: AuthState;
  login: (token: string, name: string, email: string) => void;
  logout: () => void;
}>({ user: null, login: () => {}, logout: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthState>(null);
  useEffect(() => {
    const name = localStorage.getItem("name");
    const email = localStorage.getItem("email");
    if (localStorage.getItem("token") && name && email) setUser({ name, email });
  }, []);
  const login = (token: string, name: string, email: string) => {
    localStorage.setItem("token", token);
    localStorage.setItem("name", name);
    localStorage.setItem("email", email);
    setUser({ name, email });
  };
  const logout = () => {
    ["token", "name", "email"].forEach((k) => localStorage.removeItem(k));
    setUser(null);
  };
  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
