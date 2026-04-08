"use client";

import { usePathname, useRouter } from "next/navigation";
import { Dumbbell, Apple, Trophy, MessageSquare, User, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Treino", href: "/", icon: Dumbbell },
  { label: "Dieta", href: "/dieta", icon: Apple },
  { label: "Social", href: "/comunidade", icon: Heart },
  { label: "Ranking", href: "/ranking", icon: Trophy },
  { label: "Perfil", href: "/perfil", icon: User },
];

export function AlunoBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));
          const Icon = tab.icon;
          return (
            <button
              key={tab.href}
              onClick={() => router.push(tab.href)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium transition-colors min-w-[56px]",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
