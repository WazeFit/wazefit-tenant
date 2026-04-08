"use client";

import { useEffect, useState, useCallback } from "react";
import { api, ApiError, type Ficha, type FichaExercicio, type Exercicio, type Aluno, type PaginatedResponse } from "@/lib/api";
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
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  Plus,
  Search,
  ClipboardList,
  Pencil,
  Trash2,
  GripVertical,
  X,
  UserPlus,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

const tiposFicha = ["A", "B", "C", "D", "E"];

interface ExercicioItem {
  exercicio_id: string;
  nome: string;
  series: number;
  repeticoes: string;
  descanso_seg: number;
  ordem: number;
  observacoes: string;
}

const emptyForm = {
  nome: "",
  tipo: "A",
  descricao: "",
};

export default function FichasPage() {
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Create/edit state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [exerciciosList, setExerciciosList] = useState<ExercicioItem[]>([]);
  const [exercicioSearch, setExercicioSearch] = useState("");

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Assign state
  const [assignFichaId, setAssignFichaId] = useState<string | null>(null);
  const [assignAlunoId, setAssignAlunoId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [fichasData, exerciciosData, alunosData] = await Promise.allSettled([
        api.fichas.list(),
        api.exercicios.list(),
        api.alunos.list(1, 100),
      ]);
      if (fichasData.status === "fulfilled") setFichas(fichasData.value);
      if (exerciciosData.status === "fulfilled") setExercicios(exerciciosData.value);
      if (alunosData.status === "fulfilled") {
        const res = alunosData.value as PaginatedResponse<Aluno>;
        setAlunos(res.data);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = fichas.filter(
    (f) => !search || f.nome.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setExerciciosList([]);
    setDialogOpen(true);
  };

  const openEdit = (ficha: Ficha) => {
    setEditingId(ficha.id);
    setForm({ nome: ficha.nome, tipo: ficha.tipo, descricao: ficha.descricao || "" });
    setExerciciosList(
      (ficha.exercicios || []).map((e) => ({
        exercicio_id: e.exercicio_id,
        nome: e.exercicio?.nome || e.exercicio_id,
        series: e.series,
        repeticoes: e.repeticoes,
        descanso_seg: e.descanso_seg,
        ordem: e.ordem,
        observacoes: e.observacoes || "",
      }))
    );
    setDialogOpen(true);
  };

  const addExercicio = (ex: Exercicio) => {
    setExerciciosList((prev) => [
      ...prev,
      {
        exercicio_id: ex.id,
        nome: ex.nome,
        series: 3,
        repeticoes: "12",
        descanso_seg: 60,
        ordem: prev.length + 1,
        observacoes: "",
      },
    ]);
    setExercicioSearch("");
  };

  const removeExercicio = (idx: number) => {
    setExerciciosList((prev) =>
      prev.filter((_, i) => i !== idx).map((e, i) => ({ ...e, ordem: i + 1 }))
    );
  };

  const moveExercicio = (idx: number, dir: -1 | 1) => {
    setExerciciosList((prev) => {
      const next = [...prev];
      const swapIdx = idx + dir;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next.map((e, i) => ({ ...e, ordem: i + 1 }));
    });
  };

  const updateExField = (idx: number, field: keyof ExercicioItem, value: string | number) => {
    setExerciciosList((prev) =>
      prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e))
    );
  };

  const handleSave = async () => {
    if (!form.nome) return;
    try {
      setSaving(true);
      const payload = {
        nome: form.nome,
        tipo: form.tipo,
        descricao: form.descricao || undefined,
        exercicios: exerciciosList.map((e) => ({
          exercicio_id: e.exercicio_id,
          series: e.series,
          repeticoes: e.repeticoes,
          descanso_seg: e.descanso_seg,
          ordem: e.ordem,
          observacoes: e.observacoes || undefined,
        })),
      };
      if (editingId) {
        await api.fichas.update(editingId, payload as Partial<Ficha>);
      } else {
        await api.fichas.create(payload);
      }
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar ficha");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await api.fichas.delete(deleteId);
      setDeleteId(null);
      fetchData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao excluir ficha");
    } finally {
      setDeleting(false);
    }
  };

  const handleAssign = async () => {
    if (!assignFichaId || !assignAlunoId) return;
    try {
      setAssigning(true);
      await api.fichas.atribuir(assignFichaId, assignAlunoId);
      setAssignFichaId(null);
      setAssignAlunoId("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao atribuir ficha");
    } finally {
      setAssigning(false);
    }
  };

  const filteredExercicios = exercicios.filter(
    (e) =>
      exercicioSearch &&
      e.nome.toLowerCase().includes(exercicioSearch.toLowerCase()) &&
      !exerciciosList.some((x) => x.exercicio_id === e.id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fichas de Treino</h1>
          <p className="text-muted-foreground">Crie e gerencie fichas de treino.</p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="w-4 h-4" /> Nova Ficha
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar ficha..."
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
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20" /></CardContent></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ClipboardList className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhuma ficha encontrada</h3>
            <p className="text-muted-foreground mt-1">Crie sua primeira ficha de treino.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ficha) => (
            <Card key={ficha.id} className="group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      {ficha.tipo}
                    </Badge>
                    <CardTitle className="text-base">{ficha.nome}</CardTitle>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setAssignFichaId(ficha.id)}>
                      <UserPlus className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(ficha)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => setDeleteId(ficha.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                {ficha.descricao && <CardDescription>{ficha.descricao}</CardDescription>}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {ficha.exercicios?.length || 0} exercicios
                </p>
                {ficha.is_template && <Badge variant="secondary" className="mt-2">Template</Badge>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Ficha" : "Nova Ficha"}</DialogTitle>
            <DialogDescription>Configure a ficha e adicione exercicios.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    value={form.nome}
                    onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                    placeholder="Nome da ficha"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {tiposFicha.map((t) => (
                        <SelectItem key={t} value={t}>Treino {t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Exercise selector */}
              <div className="space-y-2">
                <Label>Adicionar Exercicio</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={exercicioSearch}
                    onChange={(e) => setExercicioSearch(e.target.value)}
                    placeholder="Buscar exercicio para adicionar..."
                    className="pl-10"
                  />
                </div>
                {filteredExercicios.length > 0 && (
                  <div className="border rounded-lg max-h-40 overflow-y-auto">
                    {filteredExercicios.slice(0, 10).map((ex) => (
                      <button
                        key={ex.id}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex items-center justify-between"
                        onClick={() => addExercicio(ex)}
                      >
                        <span>{ex.nome}</span>
                        <Badge variant="outline" className="text-xs">{ex.grupo_muscular}</Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Exercise list */}
              {exerciciosList.length > 0 && (
                <div className="space-y-2">
                  <Label>Exercicios ({exerciciosList.length})</Label>
                  <div className="space-y-2">
                    {exerciciosList.map((ex, idx) => (
                      <div key={idx} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-muted-foreground w-5">{ex.ordem}</span>
                            <span className="font-medium text-sm">{ex.nome}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveExercicio(idx, -1)} disabled={idx === 0}>
                              <ChevronUp className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveExercicio(idx, 1)} disabled={idx === exerciciosList.length - 1}>
                              <ChevronDown className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400" onClick={() => removeExercicio(idx)}>
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs">Series</Label>
                            <Input
                              type="number"
                              min={1}
                              value={ex.series}
                              onChange={(e) => updateExField(idx, "series", parseInt(e.target.value) || 1)}
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Repeticoes</Label>
                            <Input
                              value={ex.repeticoes}
                              onChange={(e) => updateExField(idx, "repeticoes", e.target.value)}
                              placeholder="12"
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Descanso (seg)</Label>
                            <Input
                              type="number"
                              min={0}
                              value={ex.descanso_seg}
                              onChange={(e) => updateExField(idx, "descanso_seg", parseInt(e.target.value) || 0)}
                              className="h-8"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.nome}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingId ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={!!assignFichaId} onOpenChange={(o) => !o && setAssignFichaId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir Ficha</DialogTitle>
            <DialogDescription>Selecione o aluno para atribuir esta ficha.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={assignAlunoId} onValueChange={setAssignAlunoId}>
              <SelectTrigger><SelectValue placeholder="Selecione o aluno" /></SelectTrigger>
              <SelectContent>
                {alunos.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignFichaId(null)}>Cancelar</Button>
            <Button onClick={handleAssign} disabled={assigning || !assignAlunoId}>
              {assigning && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Atribuir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ficha?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
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
