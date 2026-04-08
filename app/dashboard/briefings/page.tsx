"use client";

import { useEffect, useState, useCallback } from "react";
import { api, ApiError, type Briefing, type Aluno, type PaginatedResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Plus, FileText, Eye } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string }> = {
  pendente: { label: "Pendente", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  gerando: { label: "Gerando", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  aguardando: { label: "Aguardando", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  completo: { label: "Completo", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
};

export default function BriefingsPage() {
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create
  const [createOpen, setCreateOpen] = useState(false);
  const [createAlunoId, setCreateAlunoId] = useState("");
  const [creating, setCreating] = useState(false);

  // Detail
  const [detailBriefing, setDetailBriefing] = useState<Briefing | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [briefData, alunosData] = await Promise.all([
        api.briefings.list(),
        api.alunos.list(1, 100),
      ]);
      setBriefings(briefData);
      setAlunos((alunosData as PaginatedResponse<Aluno>).data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async () => {
    if (!createAlunoId) return;
    try {
      setCreating(true);
      await api.briefings.create(createAlunoId);
      setCreateOpen(false);
      setCreateAlunoId("");
      fetchData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao criar briefing");
    } finally {
      setCreating(false);
    }
  };

  const viewDetail = async (id: string) => {
    try {
      setLoadingDetail(true);
      const data = await api.briefings.get(id);
      setDetailBriefing(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar briefing");
    } finally {
      setLoadingDetail(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const cfg = statusConfig[status] || { label: status, color: "" };
    return <Badge variant="outline" className={cfg.color}>{cfg.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Briefings</h1>
          <p className="text-muted-foreground">Briefings de onboarding dos alunos.</p>
        </div>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" /> Novo Briefing
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400">{error}</div>
      )}

      {/* Table */}
      {loading ? (
        <Card>
          <CardContent className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </CardContent>
        </Card>
      ) : briefings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhum briefing</h3>
            <p className="text-muted-foreground mt-1">Crie um briefing para coletar informacoes do aluno.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-20">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {briefings.map((b) => {
                const pct = b.total_perguntas > 0 ? (b.respostas_count / b.total_perguntas) * 100 : 0;
                return (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.aluno_nome}</TableCell>
                    <TableCell>{getStatusBadge(b.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={pct} className="w-20 h-2" />
                        <span className="text-xs text-muted-foreground">
                          {b.respostas_count}/{b.total_perguntas}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(b.criado_em).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => viewDetail(b.id)}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Briefing</DialogTitle>
            <DialogDescription>Selecione o aluno para criar o briefing.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={createAlunoId} onValueChange={(v: string | null) => setCreateAlunoId(v || "")}>
              <SelectTrigger><SelectValue placeholder="Selecione o aluno" /></SelectTrigger>
              <SelectContent>
                {alunos.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating || !createAlunoId}>
              {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailBriefing} onOpenChange={(o) => !o && setDetailBriefing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Briefing - {detailBriefing?.aluno_nome}</DialogTitle>
            <DialogDescription>
              {detailBriefing && getStatusBadge(detailBriefing.status)}
            </DialogDescription>
          </DialogHeader>
          {loadingDetail ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : detailBriefing ? (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Total Perguntas</p>
                  <p className="text-lg font-bold">{detailBriefing.total_perguntas}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Respostas</p>
                  <p className="text-lg font-bold">{detailBriefing.respostas_count}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Progresso</p>
                <Progress
                  value={detailBriefing.total_perguntas > 0 ? (detailBriefing.respostas_count / detailBriefing.total_perguntas) * 100 : 0}
                  className="mt-2"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Criado em {new Date(detailBriefing.criado_em).toLocaleDateString("pt-BR")}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
