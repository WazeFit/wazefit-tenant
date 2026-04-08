"use client";
import { create } from "zustand";

export interface User {
  id: string;
  nome: string;
  email: string;
  role: "expert" | "owner" | "aluno" | "admin";
  avatar_url?: string | null;
}

export interface Tenant {
  id: string;
  nome: string;
  slug: string;
  plano: string;
  cor_primaria?: string;
  cor_secundaria?: string;
  logo_url?: string | null;
}

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  token: string | null;
  isExpert: boolean;
  isAluno: boolean;
  setAuth: (user: User, tenant: Tenant, token: string) => void;
  logout: () => void;
  loadFromStorage: () => boolean;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  tenant: null,
  token: null,
  isExpert: false,
  isAluno: false,

  setAuth: (user, tenant, token) => {
    localStorage.setItem("wf_token", token);
    localStorage.setItem("wf_user", JSON.stringify(user));
    localStorage.setItem("wf_tenant", JSON.stringify(tenant));
    set({
      user,
      tenant,
      token,
      isExpert: user.role === "expert" || user.role === "owner" || user.role === "admin",
      isAluno: user.role === "aluno",
    });
  },

  logout: () => {
    localStorage.removeItem("wf_token");
    localStorage.removeItem("wf_user");
    localStorage.removeItem("wf_tenant");
    set({ user: null, tenant: null, token: null, isExpert: false, isAluno: false });
  },

  loadFromStorage: () => {
    try {
      const token = localStorage.getItem("wf_token");
      const userStr = localStorage.getItem("wf_user");
      const tenantStr = localStorage.getItem("wf_tenant");
      if (token && userStr && tenantStr) {
        const user = JSON.parse(userStr) as User;
        const tenant = JSON.parse(tenantStr) as Tenant;
        set({
          user,
          tenant,
          token,
          isExpert: user.role === "expert" || user.role === "owner" || user.role === "admin",
          isAluno: user.role === "aluno",
        });
        return true;
      }
    } catch { /* ignore */ }
    return false;
  },
}));
