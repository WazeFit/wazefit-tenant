"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ExpertSidebar } from "@/components/layout/expert-sidebar";
import { Header } from "@/components/layout/header";
import { Loader2 } from "lucide-react";

export default function ExpertLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { loadFromStorage, isExpert, user } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loaded = loadFromStorage();
    if (!loaded) {
      router.push("/login");
      return;
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready && user && !isExpert) {
      router.push("/treino");
    }
  }, [ready, user, isExpert]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <ExpertSidebar />
      <SidebarInset className="overflow-auto">
        <Header />
        <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1400px]">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
