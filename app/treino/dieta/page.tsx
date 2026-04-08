"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  UtensilsCrossed,
  Flame,
  Beef,
  Wheat,
  Droplets,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { api, type PlanoNutricional, type Refeicao } from "@/lib/api";

interface MacroBarProps {
  label: string;
  value: number | null;
  max: number;
  unit: string;
  color: string;
  icon: typeof Flame;
}

function MacroBar({ label, value, max, unit, color, icon: Icon }: MacroBarProps) {
  const v = value ?? 0;
  const pct = max > 0 ? Math.min((v / max) * 100, 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5">
          <Icon className={`w-4 h-4 ${color}`} />
          <span className="font-medium">{label}</span>
        </div>
        <span className="text-muted-foreground">
          {v}{unit} / {max}{unit}
        </span>
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  );
}

export default function DietaPage() {
  const [plano, setPlano] = useState<PlanoNutricional | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const userStr = localStorage.getItem("wf_user");
      if (!userStr) throw new Error("Usuario nao encontrado");
      const user = JSON.parse(userStr);
      const planos = await api.nutricao.planos.list(user.id);
      const ativo = planos.find((p) => p.ativo) ?? planos[0] ?? null;
      if (ativo) {
        const full = await api.nutricao.planos.get(ativo.id);
        setPlano(full);
      } else {
        setPlano(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dieta");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <p className="text-destructive font-medium text-center">{error}</p>
        <Button onClick={load} variant="outline">Tentar novamente</Button>
      </div>
    );
  }

  if (!plano) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <UtensilsCrossed className="w-12 h-12 text-muted-foreground opacity-30" />
        <h2 className="text-xl font-semibold">Nenhum Plano Nutricional</h2>
        <p className="text-muted-foreground text-center text-sm">
          Seu nutricionista ainda nao cadastrou um plano alimentar para voce.
        </p>
      </div>
    );
  }

  const macros = [
    { label: "Calorias", value: plano.calorias_diarias, max: plano.calorias_diarias ?? 2000, unit: "kcal", color: "text-orange-500", icon: Flame },
    { label: "Proteina", value: plano.proteina_g, max: plano.proteina_g ?? 150, unit: "g", color: "text-red-500", icon: Beef },
    { label: "Carboidratos", value: plano.carboidrato_g, max: plano.carboidrato_g ?? 250, unit: "g", color: "text-yellow-500", icon: Wheat },
    { label: "Gordura", value: plano.gordura_g, max: plano.gordura_g ?? 80, unit: "g", color: "text-blue-500", icon: Droplets },
  ];

  const refeicoes = plano.refeicoes ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{plano.nome}</h1>
        {plano.objetivo && (
          <Badge variant="secondary" className="mt-1">{plano.objetivo}</Badge>
        )}
      </div>

      {/* Macros Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Macros Diarios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {macros.map((m) => (
            <MacroBar key={m.label} {...m} />
          ))}
        </CardContent>
      </Card>

      {/* Meals */}
      {refeicoes.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          Nenhuma refeicao cadastrada neste plano
        </Card>
      ) : (
        refeicoes
          .sort((a, b) => a.ordem - b.ordem)
          .map((ref: Refeicao) => (
            <Card key={ref.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{ref.nome}</CardTitle>
                  {ref.horario && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {ref.horario}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {(ref.alimentos ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem alimentos cadastrados</p>
                ) : (
                  <div className="space-y-2">
                    {ref.alimentos.map((alimento) => (
                      <div key={alimento.id} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                        <div>
                          <p className="text-sm font-medium">{alimento.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {alimento.quantidade}{alimento.unidade}
                          </p>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <p>{alimento.calorias} kcal</p>
                          <p>P:{alimento.proteina_g}g C:{alimento.carboidrato_g}g G:{alimento.gordura_g}g</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
      )}

      {plano.observacoes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Observacoes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{plano.observacoes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
