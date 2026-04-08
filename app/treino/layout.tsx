"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { AlunoBottomNav } from "@/components/layout/aluno-bottom-nav";
import { Header } from "@/components/layout/header";
import { Loader2 } from "lucide-react";

export default function AlunoLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loadFromStorage } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loaded = loadFromStorage();
    if (!loaded) {
      router.push("/login");
      return;
    }
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-4 pb-20">{children}</main>
      <AlunoBottomNav />
    </div>
  );
}
