"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu,
  SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard, Users, Dumbbell, FileText, Calendar, MessageSquare,
  Apple, ClipboardList, Brain, Sparkles, DollarSign, BarChart3, Trophy,
  Palette, Globe, Target, LogOut, Heart,
} from "lucide-react";

const nav = [
  { group: "Principal", items: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Alunos", href: "/dashboard/alunos", icon: Users },
  ]},
  { group: "Gestao", items: [
    { label: "Exercicios", href: "/dashboard/exercicios", icon: Dumbbell },
    { label: "Fichas", href: "/dashboard/fichas", icon: FileText },
    { label: "Calendario", href: "/dashboard/calendario", icon: Calendar },
    { label: "Periodizacao", href: "/dashboard/periodizacao", icon: Target },
  ]},
  { group: "Comunicacao", items: [
    { label: "Chat", href: "/dashboard/chat", icon: MessageSquare },
    { label: "Comunidade", href: "/dashboard/comunidade", icon: Heart },
  ]},
  { group: "Saude", items: [
    { label: "Nutricao", href: "/dashboard/nutricao", icon: Apple },
    { label: "Avaliacoes", href: "/dashboard/avaliacoes", icon: ClipboardList },
    { label: "Briefings", href: "/dashboard/briefings", icon: ClipboardList },
  ]},
  { group: "IA", items: [
    { label: "Gerar com IA", href: "/dashboard/ia", icon: Brain },
  ]},
  { group: "Negocio", items: [
    { label: "Financeiro", href: "/dashboard/financeiro", icon: DollarSign },
    { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { label: "Ranking", href: "/dashboard/ranking", icon: Trophy },
  ]},
  { group: "Config", items: [
    { label: "Identidade", href: "/dashboard/config/identidade", icon: Palette },
    { label: "Dominios", href: "/dashboard/config/dominios", icon: Globe },
    { label: "Desafios", href: "/dashboard/config/desafios", icon: Sparkles },
  ]},
];

export function ExpertSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, tenant, logout } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm">
            {(tenant?.nome || "W").charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{tenant?.nome || "WazeFit"}</p>
            <p className="text-xs text-muted-foreground">Painel Expert</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {nav.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton isActive={isActive} onClick={() => router.push(item.href)}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => { logout(); router.push("/login"); }}>
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="flex items-center gap-3 mt-2 px-2">
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary text-sm font-semibold">
            {(user?.nome || "?").charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.nome}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
