"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Dumbbell, MessageSquare, DollarSign, TrendingUp, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function DashboardPage() {
  const router = useRouter();
  const { user, tenant } = useAuth();
  const [stats, setStats] = useState({ alunos: 0, treinos: 0, mensagens: 0, receita: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [alunos, conversas, financeiro] = await Promise.allSettled([
          api.alunos.list(1, 1),
          api.chat.conversas(),
          api.financeiro.resumo(),
        ]);
        setStats({
          alunos: alunos.status === "fulfilled" ? (alunos.value?.meta?.total ?? 0) : 0,
          treinos: 0,
          mensagens: conversas.status === "fulfilled" ? ((conversas.value as { nao_lidas?: number }[])?.reduce((a, c) => a + (c.nao_lidas ?? 0), 0) ?? 0) : 0,
          receita: financeiro.status === "fulfilled" ? (((financeiro.value as { resumo?: { total_pago_centavos?: number } })?.resumo?.total_pago_centavos ?? 0) / 100) : 0,
        });
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const cards = [
    { icon: Users, label: "Alunos Ativos", value: stats.alunos, color: "text-primary", href: "/dashboard/alunos" },
    { icon: Dumbbell, label: "Treinos Hoje", value: stats.treinos, color: "text-blue-500", href: "/dashboard/fichas" },
    { icon: MessageSquare, label: "Mensagens", value: stats.mensagens, color: "text-orange-500", href: "/dashboard/chat" },
    { icon: DollarSign, label: "Receita", value: `R$ ${stats.receita.toFixed(2)}`, color: "text-emerald-400", href: "/dashboard/financeiro" },
  ];

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ola, {user?.nome?.split(" ")[0]}</h1>
        <p className="text-muted-foreground">Bem-vindo ao painel do {tenant?.nome || "WazeFit"}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="cursor-pointer hover:border-primary/50 transition-all" onClick={() => router.push(card.href)}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {stats.alunos === 0 && (
        <Card className="p-8 text-center">
          <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Comece agora!</h2>
          <p className="text-muted-foreground mb-4">Cadastre seu primeiro aluno e comece a transformar vidas.</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => router.push("/dashboard/alunos")}>Adicionar Aluno</Button>
            <Button variant="outline" onClick={() => router.push("/dashboard/exercicios")}>Criar Exercicios</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
