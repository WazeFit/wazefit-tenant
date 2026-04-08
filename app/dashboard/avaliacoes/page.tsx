"use client";

import { useEffect, useState, useCallback } from "react";
import { api, ApiError, type Avaliacao, type Aluno, type PaginatedResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Plus, Search, ClipboardCheck, Trash2, Eye } from "lucide-react";

const tipoAvaliacoes = [
  { value: "anamnese", label: "Anamnese", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "fisica", label: "Fisica", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { value: "bioimpedancia", label: "Bioimpedancia", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
];

const emptyForm = {
  aluno_id: "",
  tipo: "",
  data: "",
  observacoes: "",
  dados_json: "{}",
};

export default function AvaliacoesPage() {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState("todos");

  // Create
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  // Detail
  const [detailAval, setDetailAval] = useState<Avaliacao | null>(null);

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [avalData, alunosData] = await Promise.all([
        api.avaliacoes.list(),
        api.alunos.list(1, 100),
      ]);
      setAvaliacoes(avalData);
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

  const filtered = avaliacoes.filter((a) => {
    const matchSearch =
      !search || (a.aluno_nome || "").toLowerCase().includes(search.toLowerCase());
    const matchTipo = tipoFilter === "todos" || a.tipo === tipoFilter;
    return matchSearch && matchTipo;
  });

  const getTipoBadge = (tipo: string) => {
    const t = tipoAvaliacoes.find((x) => x.value === tipo);
    return t ? (
      <Badge variant="outline" className={t.color}>{t.label}</Badge>
    ) : (
      <Badge variant="outline">{tipo}</Badge>
    );
  };

  const handleCreate = async () => {
    if (!form.aluno_id || !form.tipo || !form.data) return;
    try {
      setSaving(true);
      let dadosJson: Record<string, unknown> = {};
      try {
        dadosJson = JSON.parse(form.dados_json);
      } catch {
        dadosJson = {};
      }
      await api.avaliacoes.create({
        aluno_id: form.aluno_id,
        tipo: form.tipo,
        data: form.data,
        observacoes: form.observacoes || null,
        dados_json: dadosJson,
      });
      setDialogOpen(false);
      setForm(emptyForm);
      fetchData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao criar avaliacao");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await api.avaliacoes.delete(deleteId);
      setDeleteId(null);
      fetchData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao excluir avaliacao");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Avaliacoes</h1>
          <p className="text-muted-foreground">Avaliacoes fisicas e de saude dos alunos.</p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4" /> Nova Avaliacao
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por aluno..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            {tipoAvaliacoes.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ClipboardCheck className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhuma avaliacao encontrada</h3>
            <p className="text-muted-foreground mt-1">
              {search || tipoFilter !== "todos"
                ? "Tente ajustar os filtros."
                : "Registre a primeira avaliacao."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Observacoes</TableHead>
                <TableHead className="w-24">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((aval) => (
                <TableRow key={aval.id}>
                  <TableCell className="font-medium">{aval.aluno_nome || "-"}</TableCell>
                  <TableCell>{getTipoBadge(aval.tipo)}</TableCell>
                  <TableCell>{new Date(aval.data).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {aval.observacoes || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setDetailAval(aval)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-400"
                        onClick={() => setDeleteId(aval.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Avaliacao</DialogTitle>
            <DialogDescription>Registre uma nova avaliacao.</DialogDescription>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {tipoAvaliacoes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Dados (JSON)</Label>
              <Textarea
                value={form.dados_json}
                onChange={(e) => setForm((f) => ({ ...f, dados_json: e.target.value }))}
                placeholder='{"peso": 80, "altura": 175, ...}'
                rows={4}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Observacoes</Label>
              <Textarea
                value={form.observacoes}
                onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
                placeholder="Observacoes da avaliacao..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving || !form.aluno_id || !form.tipo || !form.data}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailAval} onOpenChange={(o) => !o && setDetailAval(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avaliacao - {detailAval?.aluno_nome}</DialogTitle>
            <DialogDescription>
              {detailAval && getTipoBadge(detailAval.tipo)}{" "}
              {detailAval && new Date(detailAval.data).toLocaleDateString("pt-BR")}
            </DialogDescription>
          </DialogHeader>
          {detailAval && (
            <div className="space-y-4 py-4">
              {detailAval.observacoes && (
                <div>
                  <p className="text-sm font-medium mb-1">Observacoes</p>
                  <p className="text-sm text-muted-foreground">{detailAval.observacoes}</p>
                </div>
              )}
              {detailAval.dados_json && Object.keys(detailAval.dados_json).length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Dados</p>
                  <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                    {Object.entries(detailAval.dados_json).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                        <span className="font-medium">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir avaliacao?</AlertDialogTitle>
            <AlertDialogDescription>Esta acao nao pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700" disabled={deleting}>
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
