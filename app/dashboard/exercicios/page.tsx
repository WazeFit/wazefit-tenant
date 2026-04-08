"use client";

import { useEffect, useState, useCallback } from "react";
import { api, ApiError, type Exercicio } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Plus, Search, Dumbbell, Pencil, Trash2, Video } from "lucide-react";

const gruposMusculares = [
  "Peito",
  "Costas",
  "Ombro",
  "Biceps",
  "Triceps",
  "Quadriceps",
  "Posterior",
  "Gluteo",
  "Panturrilha",
  "Abdomen",
  "Antebraco",
  "Cardio",
  "Full Body",
];

const emptyForm = {
  nome: "",
  grupo_muscular: "",
  equipamento: "",
  video_url: "",
  instrucoes: "",
  tipo_exercicio: "",
  dificuldade: "",
};

export default function ExerciciosPage() {
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [grupoFilter, setGrupoFilter] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchExercicios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.exercicios.list();
      setExercicios(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar exercicios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExercicios();
  }, [fetchExercicios]);

  const filtered = exercicios.filter((e) => {
    const matchSearch =
      !search || e.nome.toLowerCase().includes(search.toLowerCase());
    const matchGrupo =
      grupoFilter === "todos" || e.grupo_muscular === grupoFilter;
    return matchSearch && matchGrupo;
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (ex: Exercicio) => {
    setEditingId(ex.id);
    setForm({
      nome: ex.nome,
      grupo_muscular: ex.grupo_muscular,
      equipamento: ex.equipamento || "",
      video_url: ex.video_url || "",
      instrucoes: ex.instrucoes || "",
      tipo_exercicio: ex.tipo_exercicio || "",
      dificuldade: ex.dificuldade || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome || !form.grupo_muscular) return;
    try {
      setSaving(true);
      const payload = {
        nome: form.nome,
        grupo_muscular: form.grupo_muscular,
        equipamento: form.equipamento || null,
        video_url: form.video_url || null,
        instrucoes: form.instrucoes || null,
        tipo_exercicio: form.tipo_exercicio || null,
        dificuldade: form.dificuldade || null,
      };
      if (editingId) {
        await api.exercicios.update(editingId, payload);
      } else {
        await api.exercicios.create(payload);
      }
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      fetchExercicios();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar exercicio");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await api.exercicios.delete(deleteId);
      setDeleteId(null);
      fetchExercicios();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao excluir exercicio");
    } finally {
      setDeleting(false);
    }
  };

  const getYoutubeId = (url: string) => {
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Exercicios</h1>
          <p className="text-muted-foreground">Biblioteca de exercicios.</p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="w-4 h-4" /> Novo Exercicio
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar exercicio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={grupoFilter} onValueChange={setGrupoFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Grupo muscular" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os grupos</SelectItem>
            {gruposMusculares.map((g) => (
              <SelectItem key={g} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Dumbbell className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhum exercicio encontrado</h3>
            <p className="text-muted-foreground mt-1">
              {search || grupoFilter !== "todos"
                ? "Tente ajustar os filtros."
                : "Adicione exercicios a sua biblioteca."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ex) => {
            const ytId = ex.video_url ? getYoutubeId(ex.video_url) : null;
            return (
              <Card key={ex.id} className="group">
                {ytId && (
                  <div className="aspect-video relative overflow-hidden rounded-t-lg">
                    <img
                      src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                      alt={ex.nome}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={ex.video_url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full bg-white/20 backdrop-blur"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Video className="w-6 h-6 text-white" />
                      </a>
                    </div>
                  </div>
                )}
                <CardContent className={`p-4 ${ytId ? "" : "pt-6"}`}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <h3 className="font-medium truncate">{ex.nome}</h3>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                          {ex.grupo_muscular}
                        </Badge>
                        {ex.equipamento && (
                          <Badge variant="outline">{ex.equipamento}</Badge>
                        )}
                        {ex.tipo_exercicio && (
                          <Badge variant="secondary">{ex.tipo_exercicio}</Badge>
                        )}
                        {ex.dificuldade && (
                          <Badge variant="secondary">{ex.dificuldade}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(ex)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-400 hover:text-red-300"
                        onClick={() => setDeleteId(ex.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  {ex.instrucoes && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {ex.instrucoes}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Exercicio" : "Novo Exercicio"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do exercicio.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder="Ex: Supino reto com barra"
              />
            </div>
            <div className="space-y-2">
              <Label>Grupo Muscular *</Label>
              <Select
                value={form.grupo_muscular}
                onValueChange={(v) => setForm((f) => ({ ...f, grupo_muscular: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {gruposMusculares.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Equipamento</Label>
              <Input
                value={form.equipamento}
                onChange={(e) => setForm((f) => ({ ...f, equipamento: e.target.value }))}
                placeholder="Ex: Barra, Halteres, Maquina"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={form.tipo_exercicio}
                onValueChange={(v) => setForm((f) => ({ ...f, tipo_exercicio: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="composto">Composto</SelectItem>
                  <SelectItem value="isolado">Isolado</SelectItem>
                  <SelectItem value="cardio">Cardio</SelectItem>
                  <SelectItem value="funcional">Funcional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Dificuldade</Label>
              <Select
                value={form.dificuldade}
                onValueChange={(v) => setForm((f) => ({ ...f, dificuldade: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="iniciante">Iniciante</SelectItem>
                  <SelectItem value="intermediario">Intermediario</SelectItem>
                  <SelectItem value="avancado">Avancado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>URL do Video (YouTube)</Label>
              <Input
                value={form.video_url}
                onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
            <div className="space-y-2">
              <Label>Instrucoes</Label>
              <Textarea
                value={form.instrucoes}
                onChange={(e) => setForm((f) => ({ ...f, instrucoes: e.target.value }))}
                placeholder="Descricao do movimento..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.nome || !form.grupo_muscular}
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingId ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir exercicio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao nao pode ser desfeita. O exercicio sera removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleting}
            >
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
