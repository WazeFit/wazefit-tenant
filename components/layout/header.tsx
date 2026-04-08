"use client";

import { useAuth } from "@/lib/auth";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const { user, tenant } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-4 border-b bg-background/95 backdrop-blur-sm px-4 lg:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-6" />
      <div className="flex-1 min-w-0">
        <h2 className="text-sm font-medium text-muted-foreground truncate">{tenant?.nome}</h2>
      </div>
      <Button variant="ghost" size="icon" className="relative shrink-0">
        <Bell className="w-5 h-5" />
      </Button>
      <div className="w-8 h-8 shrink-0 bg-primary/20 rounded-full flex items-center justify-center text-primary text-sm font-semibold">
        {(user?.nome || "?").charAt(0)}
      </div>
    </header>
  );
}
