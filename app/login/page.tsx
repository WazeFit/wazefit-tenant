"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Dumbbell } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await api.auth.login(email, senha);
      const user = data.user as { id: string; nome: string; email: string; role: "expert" | "owner" | "aluno" | "admin"; avatar_url?: string | null };
      const tenant = data.tenant as { id: string; nome?: string; slug?: string; plano?: string };

      setAuth(
        { id: user.id, nome: user.nome, email: user.email, role: user.role, avatar_url: user.avatar_url },
        { id: tenant.id, nome: tenant.nome || "", slug: tenant.slug || "", plano: tenant.plano || "trial" },
        data.access_token,
      );

      // Redirecionar baseado no role
      if (user.role === "aluno") {
        router.push("/");
      } else {
        router.push("/");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Entrar</CardTitle>
          <CardDescription>Acesse sua plataforma fitness</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="senha" className="text-sm font-medium">Senha</label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <Input id="senha" type="password" placeholder="Sua senha" value={senha} onChange={(e) => setSenha(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Entrar
            </Button>
            <p className="text-xs text-center text-muted-foreground pt-2">
              Esqueceu o email de acesso?{" "}
              <Link href="/forgot-password" className="text-primary hover:underline">
                Recuperar acesso
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
