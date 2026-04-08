"use client";

import { useEffect, useState, useCallback } from "react";
import { api, ApiError, type Aluno, type PaginatedResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Plus, Search, CalendarRange, Layers } from "lucide-react";

interface Periodizacao {
  id: string;
  aluno_id: string;
  aluno_nome?: string;
  tipo: string;
  nome: string;
  descricao?: string | null;
  duracao_semanas: number;
  fase_atual?: number;
  total_fases?: number;
  ativo: boolean;
  criado_em: string;
}

const tiposPeriodizacao = [
  { value: "linear", label: "Linear", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "ondulada", label: "Ondulada", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { value: "bloco", label: "Bloco", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { value: "dup", label: "DUP", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
];

const emptyForm = {
  aluno_id: "",
  tipo: "",
  nome: "",
  descricao: "",
  duracao_semanas: "12",
};

export default function PeriodizacaoPage() {
  const [periodizacoes, setPeriodizacoes] = useState<Periodizacao[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Create
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [periodRes, alunosRes] = await Promise.all([
        api.get<{ data: Periodizacao[] } | Periodizacao[]>("/api/v1/periodizacao"),
        api.alunos.list(1, 100),
      ]);
      const list = Array.isArray(periodRes)
        ? periodRes
        : (periodRes as { data: Periodizacao[] }).data || [];
      setPeriodizacoes(list);
      setAlunos((alunosRes as PaginatedResponse<Aluno>).data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = periodizacoes.filter(
    (p) =>
      !search ||
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      (p.aluno_nome || "").toLowerCase().includes(search.toLowerCase())
  );

  const getTipoBadge = (tipo: string) => {
    const t = tiposPeriodizacao.find((x) => x.value === tipo);
    return t ? (
      <Badge variant="outline" className={t.color}>{t.label}</Badge>
    ) : (
      <Badge variant="outline">{tipo}</Badge>
    );
  };

  const handleCreate = async () => {
    if (!form.aluno_id || !form.tipo || !form.nome) return;
    try {
      setSaving(true);
      await api.post("/api/v1/periodizacao", {
        aluno_id: form.aluno_id,
        tipo: form.tipo,
        nome: form.nome,
        descricao: form.descricao || null,
        duracao_semanas: parseInt(form.duracao_semanas) || 12,
      });
      setDialogOpen(false);
      setForm(emptyForm);
      fetchData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao criar periodizacao");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Periodizacao</h1>
          <p className="text-muted-foreground">Planejamento periodizado de treinos.</p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4" /> Nova Periodizacao
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou aluno..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400">{error}</div>
      )}

      {/* List */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-28" /></CardContent></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Layers className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhuma periodizacao encontrada</h3>
            <p className="text-muted-foreground mt-1">
              {search ? "Tente ajustar a busca." : "Crie seu primeiro planejamento periodizado."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const phasePct = p.total_fases && p.fase_atual
              ? (p.fase_atual / p.total_fases) * 100
              : 0;
            return (
              <Card key={p.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{p.nome}</CardTitle>
                    {getTipoBadge(p.tipo)}
                  </div>
                  {p.aluno_nome && (
                    <CardDescription>{p.aluno_nome}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Duracao</span>
                      <p className="font-medium">{p.duracao_semanas} semanas</p>
                    </div>
                    {p.total_fases && (
                      <div>
                        <span className="text-muted-foreground">Fase</span>
                        <p className="font-medium">{p.fase_atual || 1} de {p.total_fases}</p>
                      </div>
                    )}
                  </div>

                  {p.total_fases && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Progresso</span>
                        <span>{Math.round(phasePct)}%</span>
                      </div>
                      <Progress value={phasePct} className="h-2" />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    {p.ativo ? (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Ativa</Badge>
                    ) : (
                      <Badge variant="secondary">Inativa</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(p.criado_em).toLocaleDateString("pt-BR")}
                    </span>
                  </div>

                  {p.descricao && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{p.descricao}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Periodizacao</DialogTitle>
            <DialogDescription>Configure o planejamento periodizado.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Aluno *</Label>
              <Select value={form.aluno_id} onValueChange={(v) => setForm((f) => ({ ...f, aluno_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {alunos.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder="Ex: Periodizacao Linear - Hipertrofia"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {tiposPeriodizacao.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duracao (semanas)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.duracao_semanas}
                  onChange={(e) => setForm((f) => ({ ...f, duracao_semanas: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descricao</Label>
              <Textarea
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                placeholder="Descricao do planejamento..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving || !form.aluno_id || !form.tipo || !form.nome}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
