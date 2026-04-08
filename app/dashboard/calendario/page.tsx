"use client";

import { useEffect, useState, useCallback } from "react";
import { api, ApiError, type Aluno, type Ficha, type CalendarioData, type PaginatedResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Calendar, Save, X } from "lucide-react";

const diasSemana = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
const diasNomes = ["Domingo", "Segunda-feira", "Terca-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sabado"];

export default function CalendarioPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [selectedAluno, setSelectedAluno] = useState("");
  const [calendario, setCalendario] = useState<CalendarioData>({});
  const [loading, setLoading] = useState(true);
  const [loadingCalendario, setLoadingCalendario] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchBase = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [alunosRes, fichasRes] = await Promise.all([
        api.alunos.list(1, 100),
        api.fichas.list(),
      ]);
      setAlunos((alunosRes as PaginatedResponse<Aluno>).data);
      setFichas(fichasRes);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBase();
  }, [fetchBase]);

  const fetchCalendario = useCallback(async (alunoId: string) => {
    try {
      setLoadingCalendario(true);
      setError(null);
      const data = await api.calendario.get(alunoId);
      setCalendario(data || {});
      setHasChanges(false);
    } catch (err) {
      setCalendario({});
      if (err instanceof ApiError && err.status !== 404) {
        setError(err.message);
      }
    } finally {
      setLoadingCalendario(false);
    }
  }, []);

  useEffect(() => {
    if (selectedAluno) fetchCalendario(selectedAluno);
  }, [selectedAluno, fetchCalendario]);

  const setDia = (dia: string, fichaId: string | null) => {
    setCalendario((prev) => ({
      ...prev,
      [dia]: fichaId ? { ficha_id: fichaId, ficha_nome: fichas.find((f) => f.id === fichaId)?.nome } : null,
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!selectedAluno) return;
    try {
      setSaving(true);
      setError(null);
      await api.calendario.save(selectedAluno, calendario);
      setHasChanges(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar calendario");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendario</h1>
          <p className="text-muted-foreground">Configure o calendario semanal de treinos.</p>
        </div>
        {hasChanges && (
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar
          </Button>
        )}
      </div>

      {/* Student selector */}
      <div className="max-w-sm">
        <Select value={selectedAluno} onValueChange={setSelectedAluno}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um aluno" />
          </SelectTrigger>
          <SelectContent>
            {alunos.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400">{error}</div>
      )}

      {!selectedAluno ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Selecione um aluno</h3>
            <p className="text-muted-foreground mt-1">
              Escolha um aluno para configurar seu calendario semanal.
            </p>
          </CardContent>
        </Card>
      ) : loadingCalendario ? (
        <div className="grid grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-3">
          {diasSemana.map((dia, i) => {
            const entry = calendario[dia];
            return (
              <Card
                key={dia}
                className={`${entry ? "border-emerald-500/30" : ""}`}
              >
                <CardHeader className="pb-2 px-3 pt-3">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase text-center">
                    {diasNomes[i]}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-2">
                  <Select
                    value={entry?.ficha_id || "descanso"}
                    onValueChange={(v) => setDia(dia, v === "descanso" ? null : v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="descanso">Descanso</SelectItem>
                      {fichas.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.tipo} - {f.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {entry && (
                    <div className="text-center">
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                        {entry.ficha_nome || fichas.find((f) => f.id === entry.ficha_id)?.nome || "Treino"}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
