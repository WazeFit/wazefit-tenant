"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Trophy,
  Dumbbell,
  LogOut,
  Loader2,
} from "lucide-react";
import { useAuth, type User as AuthUser } from "@/lib/auth";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
}

export default function PerfilPage() {
  const router = useRouter();
  const { user, logout: authLogout, loadFromStorage } = useAuth();
  const [ready, setReady] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [stats, setStats] = useState<{ pontos: number; treinos: number }>({ pontos: 0, treinos: 0 });

  useEffect(() => {
    const loaded = loadFromStorage();
    if (loaded) {
      try {
        const userStr = localStorage.getItem("wf_user");
        if (userStr) {
          const u = JSON.parse(userStr);
          setStats({ pontos: u.pontos ?? 0, treinos: u.total_treinos ?? 0 });
        }
      } catch { /* ignore */ }
    }
    // Use microtask to avoid synchronous setState in effect
    queueMicrotask(() => setReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLogout() {
    setLoggingOut(true);
    authLogout();
    router.push("/login");
  }

  if (!ready) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayUser = user;

  if (!displayUser) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <User className="w-12 h-12 text-muted-foreground opacity-30" />
        <p className="text-muted-foreground">Nenhuma informacao de usuario encontrada</p>
        <Button onClick={() => router.push("/login")} variant="outline">Fazer Login</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Profile Header */}
      <Card>
        <CardContent className="flex flex-col items-center py-8">
          <Avatar className="w-20 h-20 ring-2 ring-primary mb-4">
            <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
              {initials(displayUser.nome)}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-xl font-bold">{displayUser.nome}</h1>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
            <Mail className="w-3.5 h-3.5" />
            {displayUser.email}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="flex flex-col items-center py-4">
            <Trophy className="w-6 h-6 text-yellow-400 mb-1" />
            <p className="text-2xl font-bold">{stats.pontos}</p>
            <p className="text-xs text-muted-foreground">Pontos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-4">
            <Dumbbell className="w-6 h-6 text-primary mb-1" />
            <p className="text-2xl font-bold">{stats.treinos}</p>
            <p className="text-xs text-muted-foreground">Treinos</p>
          </CardContent>
        </Card>
      </div>

      {/* Info Details */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Informacoes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Nome</span>
            <span className="text-sm font-medium">{displayUser.nome}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium">{displayUser.email}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tipo</span>
            <span className="text-sm font-medium capitalize">{displayUser.role}</span>
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        variant="destructive"
        className="w-full"
        onClick={handleLogout}
        disabled={loggingOut}
      >
        {loggingOut ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <LogOut className="w-4 h-4 mr-2" />
        )}
        Sair da Conta
      </Button>
    </div>
  );
}
