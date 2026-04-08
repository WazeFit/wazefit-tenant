"use client";

import { useEffect, useState, useCallback } from "react";
import { api, ApiError, type Desafio, type DesafioDetalhe } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles, Trophy, Users, Target, Loader2, Calendar } from "lucide-react";

export default function AlunoDesafiosPage() {
  const { user } = useAuth();
  const [desafios, setDesafios] = useState<Desafio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState<string | null>(null);
  const [selectedDesafio, setSelectedDesafio] = useState<DesafioDetalhe | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchDesafios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.desafios.list();
      setDesafios(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar desafios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDesafios();
  }, [fetchDesafios]);

  const handleParticipar = async (desafioId: string) => {
    try {
      setJoining(desafioId);
      await api.desafios.participar(desafioId);
      fetchDesafios();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao participar.");
    } finally {
      setJoining(null);
    }
  };

  const handleViewDetail = async (desafioId: string) => {
    try {
      setDetailLoading(true);
      const detail = await api.desafios.get(desafioId);
      setSelectedDesafio(detail);
    } catch {
      // ignore
    } finally {
      setDetailLoading(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

  const tipoColor: Record<string, string> = {
    individual: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    equipe: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    comunidade: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold">Desafios</h1>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : desafios.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Target className="w-10 h-10 text-muted-foreground mb-3" />
            <h3 className="text-base font-medium">Nenhum desafio ativo</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Novos desafios serao criados pelo seu expert.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {desafios.map((d) => (
            <Card key={d.id} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => handleViewDetail(d.id)}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm truncate">{d.nome}</h3>
                      <Badge variant="outline" className={tipoColor[d.tipo] || ""}>
                        {d.tipo}
                      </Badge>
                    </div>
                    {d.descricao && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {d.descricao}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(d.data_inicio)} - {formatDate(d.data_fim)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {d.participantes_count ?? 0} participantes
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    Meta: {d.meta_valor} {d.meta_tipo}
                  </span>
                </div>

                <Button
                  size="sm"
                  className="w-full"
                  onClick={(e) => { e.stopPropagation(); handleParticipar(d.id); }}
                  disabled={joining === d.id}
                >
                  {joining === d.id && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Participar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedDesafio} onOpenChange={() => setSelectedDesafio(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedDesafio?.nome}</DialogTitle>
          </DialogHeader>
          {selectedDesafio && (
            <div className="space-y-4">
              {selectedDesafio.descricao && (
                <p className="text-sm text-muted-foreground">{selectedDesafio.descricao}</p>
              )}
              <div className="flex items-center gap-4 text-sm">
                <span>Meta: {selectedDesafio.meta_valor} {selectedDesafio.meta_tipo}</span>
                <Badge variant="outline" className={tipoColor[selectedDesafio.tipo] || ""}>
                  {selectedDesafio.tipo}
                </Badge>
              </div>

              {/* Leaderboard */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-yellow-400" /> Ranking
                </h4>
                {selectedDesafio.leaderboard.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhum participante ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedDesafio.leaderboard.map((p) => (
                      <div key={p.user_id} className="flex items-center gap-3">
                        <span className="text-sm font-bold w-6 text-center">
                          {p.posicao === 1 ? "🥇" : p.posicao === 2 ? "🥈" : p.posicao === 3 ? "🥉" : `${p.posicao}.`}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm truncate">{p.user_nome}</span>
                            <span className="text-xs text-muted-foreground">
                              {p.progresso}/{selectedDesafio.meta_valor}
                            </span>
                          </div>
                          <Progress
                            value={Math.min((p.progresso / selectedDesafio.meta_valor) * 100, 100)}
                            className="h-1.5 mt-1"
                          />
                        </div>
                        {p.concluido === 1 && (
                          <Badge variant="outline" className="text-xs bg-emerald-500/20 text-emerald-400">
                            Concluido
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
