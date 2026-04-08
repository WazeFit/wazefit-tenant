"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dumbbell,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  CalendarDays,
  PartyPopper,
} from "lucide-react";
import { api, type TreinoHoje, type FichaExercicio } from "@/lib/api";

export default function TreinoHojePage() {
  const [treino, setTreino] = useState<TreinoHoje | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const userStr = localStorage.getItem("wf_user");
      if (!userStr) throw new Error("Usuario nao encontrado");
      const user = JSON.parse(userStr);
      const data = await api.treino.hoje(user.id);
      setTreino(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar treino");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function toggleExercise(ordem: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(ordem)) next.delete(ordem);
      else next.add(ordem);
      return next;
    });
  }

  async function handleCheckIn() {
    if (!treino?.ficha) return;
    setCompleting(true);
    try {
      await api.execucoes.create({ ficha_id: treino.ficha.id });
      setCompleted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registrar treino");
    } finally {
      setCompleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
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

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <PartyPopper className="w-16 h-16 text-primary" />
        <h2 className="text-2xl font-bold">Treino Concluido!</h2>
        <p className="text-muted-foreground text-center">Parabens! Voce completou o treino de hoje.</p>
        <Button onClick={() => { setCompleted(false); setChecked(new Set()); load(); }} variant="outline">
          Voltar
        </Button>
      </div>
    );
  }

  if (!treino?.ficha) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <CalendarDays className="w-12 h-12 text-muted-foreground opacity-30" />
        <h2 className="text-xl font-semibold">Dia de Descanso</h2>
        <p className="text-muted-foreground text-center">
          {treino?.dia_semana ? `Nenhum treino programado para ${treino.dia_semana}.` : "Nenhum treino programado para hoje."}
        </p>
        <p className="text-sm text-muted-foreground">Aproveite para descansar e recuperar!</p>
      </div>
    );
  }

  const exercicios = treino.ficha.exercicios ?? [];
  const allChecked = exercicios.length > 0 && checked.size === exercicios.length;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground uppercase tracking-wide">
          {treino.dia_semana ?? "Hoje"}
        </p>
        <h1 className="text-2xl font-bold">{treino.ficha.nome}</h1>
        {treino.ficha.descricao && (
          <p className="text-muted-foreground text-sm mt-1">{treino.ficha.descricao}</p>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Dumbbell className="w-4 h-4" />
        <span>{exercicios.length} exercicios</span>
        <span className="mx-1">-</span>
        <Badge variant="secondary">{treino.ficha.tipo}</Badge>
      </div>

      {exercicios.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          Nenhum exercicio nesta ficha
        </Card>
      ) : (
        <div className="space-y-3">
          {exercicios.map((ex: FichaExercicio, idx: number) => {
            const isChecked = checked.has(ex.ordem);
            return (
              <Card
                key={ex.ordem}
                className={`transition-all ${isChecked ? "border-primary/50 bg-primary/5" : ""}`}
              >
                <CardContent className="flex items-start gap-3 py-4">
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggleExercise(ex.ordem)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`font-semibold ${isChecked ? "line-through text-muted-foreground" : ""}`}>
                        {ex.exercicio?.nome ?? `Exercicio ${idx + 1}`}
                      </h3>
                      <span className="text-xs text-muted-foreground shrink-0">#{ex.ordem}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span>{ex.series} series</span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                      <span>{ex.repeticoes} reps</span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {ex.descanso_seg}s
                      </span>
                    </div>
                    {ex.observacoes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">{ex.observacoes}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Button
        className="w-full h-12 text-lg"
        onClick={handleCheckIn}
        disabled={completing || !allChecked}
      >
        {completing ? (
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
        ) : (
          <CheckCircle2 className="w-5 h-5 mr-2" />
        )}
        {allChecked ? "Concluir Treino" : `Marque todos os exercicios (${checked.size}/${exercicios.length})`}
      </Button>
    </div>
  );
}
