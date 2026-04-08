"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export default function RootPage() {
  const router = useRouter();
  const { loadFromStorage, isExpert, isAluno, user } = useAuth();
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
    if (!ready || !user) return;
    if (isExpert) {
      router.push("/dashboard");
    } else if (isAluno) {
      router.push("/treino");
    }
  }, [ready, user, isExpert, isAluno]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
