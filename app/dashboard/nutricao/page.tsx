"use client";

import { useEffect, useState, useCallback } from "react";
import { api, ApiError, type PlanoNutricional, type Aluno, type PaginatedResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  Plus,
  Search,
  Apple,
  Flame,
  Eye,
  Trash2,
  Pencil,
} from "lucide-react";

const emptyForm = {
  aluno_id: "",
  nome: "",
  objetivo: "",
  calorias_diarias: "",
  proteina_g: "",
  carboidrato_g: "",
  gordura_g: "",
  observacoes: "",
};

export default function NutricaoPage() {
  const [planos, setPlanos] = useState<PlanoNutricional[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Create/edit
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  // Detail view
  const [detailPlan, setDetailPlan] = useState<PlanoNutricional | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [planosData, alunosData] = await Promise.all([
        api.nutricao.planos.list(),
        api.alunos.list(1, 100),
      ]);
      setPlanos(planosData);
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

  const filtered = planos.filter(
    (p) => !search || p.nome.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome || !form.aluno_id) return;
    try {
      setSaving(true);
      const payload: Partial<PlanoNutricional> = {
        aluno_id: form.aluno_id,
        nome: form.nome,
        objetivo: form.objetivo || null,
        calorias_diarias: form.calorias_diarias ? parseInt(form.calorias_diarias) : null,
        proteina_g: form.proteina_g ? parseInt(form.proteina_g) : null,
        carboidrato_g: form.carboidrato_g ? parseInt(form.carboidrato_g) : null,
        gordura_g: form.gordura_g ? parseInt(form.gordura_g) : null,
        observacoes: form.observacoes || null,
      };
      if (editingId) {
        await api.nutricao.planos.update(editingId, payload);
      } else {
        await api.nutricao.planos.create(payload);
      }
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar plano");
    } finally {
      setSaving(false);
    }
  };

  const viewDetail = async (id: string) => {
    try {
      setLoadingDetail(true);
      const data = await api.nutricao.planos.get(id);
      setDetailPlan(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar plano");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await api.nutricao.planos.delete(deleteId);
      setDeleteId(null);
      fetchData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao excluir plano");
    } finally {
      setDeleting(false);
    }
  };

  const macroBar = (value: number | null, max: number, color: string) => {
    const pct = value && max ? Math.min((value / max) * 100, 100) : 0;
    return (
      <div className="space-y-1">
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nutricao</h1>
          <p className="text-muted-foreground">Planos nutricionais dos alunos.</p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="w-4 h-4" /> Novo Plano
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar plano..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400">{error}</div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-32" /></CardContent></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Apple className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhum plano encontrado</h3>
            <p className="text-muted-foreground mt-1">Crie o primeiro plano nutricional.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((plano) => (
            <Card key={plano.id} className="group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{plano.nome}</CardTitle>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => viewDetail(plano.id)}>
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => setDeleteId(plano.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                {plano.aluno_nome && (
                  <CardDescription>{plano.aluno_nome}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {plano.calorias_diarias && (
                  <div className="flex items-center gap-2 text-sm">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="font-medium">{plano.calorias_diarias} kcal</span>
                  </div>
                )}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Proteina</span>
                    <span className="font-medium">{plano.proteina_g || 0}g</span>
                  </div>
                  {macroBar(plano.proteina_g, 300, "bg-red-500")}

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Carboidrato</span>
                    <span className="font-medium">{plano.carboidrato_g || 0}g</span>
                  </div>
                  {macroBar(plano.carboidrato_g, 500, "bg-amber-500")}

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Gordura</span>
                    <span className="font-medium">{plano.gordura_g || 0}g</span>
                  </div>
                  {macroBar(plano.gordura_g, 150, "bg-blue-500")}
                </div>

                {plano.ativo ? (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Ativo</Badge>
                ) : (
                  <Badge variant="secondary">Inativo</Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Plano" : "Novo Plano"}</DialogTitle>
            <DialogDescription>Configure o plano nutricional.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Aluno *</Label>
              <Select value={form.aluno_id} onValueChange={(v) => setForm((f) => ({ ...f, aluno_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o aluno" /></SelectTrigger>
                <SelectContent>
                  {alunos.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nome do Plano *</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder="Ex: Plano Cutting"
              />
            </div>
            <div className="space-y-2">
              <Label>Objetivo</Label>
              <Input
                value={form.objetivo}
                onChange={(e) => setForm((f) => ({ ...f, objetivo: e.target.value }))}
                placeholder="Ex: Perda de gordura"
              />
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Calorias (kcal)</Label>
                <Input
                  type="number"
                  value={form.calorias_diarias}
                  onChange={(e) => setForm((f) => ({ ...f, calorias_diarias: e.target.value }))}
                  placeholder="2000"
                />
              </div>
              <div className="space-y-2">
                <Label>Proteina (g)</Label>
                <Input
                  type="number"
                  value={form.proteina_g}
                  onChange={(e) => setForm((f) => ({ ...f, proteina_g: e.target.value }))}
                  placeholder="150"
                />
              </div>
              <div className="space-y-2">
                <Label>Carboidrato (g)</Label>
                <Input
                  type="number"
                  value={form.carboidrato_g}
                  onChange={(e) => setForm((f) => ({ ...f, carboidrato_g: e.target.value }))}
                  placeholder="250"
                />
              </div>
              <div className="space-y-2">
                <Label>Gordura (g)</Label>
                <Input
                  type="number"
                  value={form.gordura_g}
                  onChange={(e) => setForm((f) => ({ ...f, gordura_g: e.target.value }))}
                  placeholder="60"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observacoes</Label>
              <Textarea
                value={form.observacoes}
                onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
                placeholder="Observacoes adicionais..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.nome || !form.aluno_id}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingId ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailPlan} onOpenChange={(o) => !o && setDetailPlan(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detailPlan?.nome}</DialogTitle>
            <DialogDescription>
              {detailPlan?.aluno_nome} - {detailPlan?.calorias_diarias || 0} kcal/dia
            </DialogDescription>
          </DialogHeader>
          {loadingDetail ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : detailPlan ? (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="rounded-lg bg-red-500/10 p-3">
                    <p className="text-xs text-muted-foreground">Proteina</p>
                    <p className="text-lg font-bold text-red-400">{detailPlan.proteina_g || 0}g</p>
                  </div>
                  <div className="rounded-lg bg-amber-500/10 p-3">
                    <p className="text-xs text-muted-foreground">Carboidrato</p>
                    <p className="text-lg font-bold text-amber-400">{detailPlan.carboidrato_g || 0}g</p>
                  </div>
                  <div className="rounded-lg bg-blue-500/10 p-3">
                    <p className="text-xs text-muted-foreground">Gordura</p>
                    <p className="text-lg font-bold text-blue-400">{detailPlan.gordura_g || 0}g</p>
                  </div>
                </div>

                {detailPlan.observacoes && (
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Observacoes</p>
                    <p>{detailPlan.observacoes}</p>
                  </div>
                )}

                {detailPlan.refeicoes && detailPlan.refeicoes.length > 0 && (
                  <div className="space-y-3">
                    <p className="font-medium">Refeicoes</p>
                    {detailPlan.refeicoes.map((ref) => (
                      <div key={ref.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{ref.nome}</span>
                          <Badge variant="outline" className="text-xs">{ref.horario}</Badge>
                        </div>
                        {ref.alimentos.length > 0 && (
                          <div className="space-y-1">
                            {ref.alimentos.map((alimento) => (
                              <div key={alimento.id} className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{alimento.nome} ({alimento.quantidade}{alimento.unidade})</span>
                                <span>{alimento.calorias} kcal</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir plano?</AlertDialogTitle>
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
