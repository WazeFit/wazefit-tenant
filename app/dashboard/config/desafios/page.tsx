"use client";

import { useEffect, useState, useCallback } from "react";
import { api, ApiError, type Desafio, type DesafioDetalhe } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Plus, Loader2, Trophy, Users, Target, Calendar } from "lucide-react";

const initialForm = {
  nome: "",
  descricao: "",
  tipo: "individual",
  meta_tipo: "",
  meta_valor: "",
  data_inicio: "",
  data_fim: "",
};

export default function ExpertDesafiosPage() {
  const [desafios, setDesafios] = useState<Desafio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [selectedDesafio, setSelectedDesafio] = useState<DesafioDetalhe | null>(null);

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

  const handleCreate = async () => {
    if (!form.nome || !form.meta_tipo || !form.meta_valor || !form.data_inicio || !form.data_fim) return;
    try {
      setCreating(true);
      await api.desafios.create({
        nome: form.nome,
        descricao: form.descricao || undefined,
        tipo: form.tipo as "individual" | "equipe" | "comunidade",
        meta_tipo: form.meta_tipo,
        meta_valor: Number(form.meta_valor),
        data_inicio: form.data_inicio,
        data_fim: form.data_fim,
      });
      setForm(initialForm);
      setDialogOpen(false);
      fetchDesafios();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao criar desafio.");
    } finally {
      setCreating(false);
    }
  };

  const handleViewDetail = async (desafioId: string) => {
    try {
      const detail = await api.desafios.get(desafioId);
      setSelectedDesafio(detail);
    } catch {
      // ignore
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  const tipoColor: Record<string, string> = {
    individual: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    equipe: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    comunidade: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Desafios</h1>
          <p className="text-muted-foreground">
            Crie e gerencie desafios para seus alunos.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4" /> Novo Desafio
        </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Desafio</DialogTitle>
              <DialogDescription>
                Configure os detalhes do novo desafio.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Desafio 30 dias"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descricao</Label>
                <Textarea
                  id="descricao"
                  value={form.descricao}
                  onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                  placeholder="Descreva o desafio..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="equipe">Equipe</SelectItem>
                      <SelectItem value="comunidade">Comunidade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta_tipo">Meta Tipo *</Label>
                  <Input
                    id="meta_tipo"
                    value={form.meta_tipo}
                    onChange={(e) => setForm((f) => ({ ...f, meta_tipo: e.target.value }))}
                    placeholder="treinos, km, etc."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="meta_valor">Meta Valor *</Label>
                <Input
                  id="meta_valor"
                  type="number"
                  value={form.meta_valor}
                  onChange={(e) => setForm((f) => ({ ...f, meta_valor: e.target.value }))}
                  placeholder="30"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data_inicio">Inicio *</Label>
                  <Input
                    id="data_inicio"
                    type="date"
                    value={form.data_inicio}
                    onChange={(e) => setForm((f) => ({ ...f, data_inicio: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_fim">Fim *</Label>
                  <Input
                    id="data_fim"
                    type="date"
                    value={form.data_fim}
                    onChange={(e) => setForm((f) => ({ ...f, data_fim: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={creating || !form.nome || !form.meta_tipo || !form.meta_valor || !form.data_inicio || !form.data_fim}
              >
                {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar Desafio
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Desafios</CardTitle>
            <Sparkles className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "-" : desafios.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Participantes</CardTitle>
            <Users className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "-" : desafios.reduce((sum, d) => sum + (d.participantes_count ?? 0), 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Em Andamento</CardTitle>
            <Target className="w-4 h-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "-" : desafios.filter((d) => new Date(d.data_fim) >= new Date()).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : desafios.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhum desafio criado</h3>
            <p className="text-muted-foreground mt-1">
              Crie seu primeiro desafio para motivar seus alunos!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {desafios.map((d) => (
            <Card
              key={d.id}
              className="cursor-pointer transition-colors hover:border-primary/50"
              onClick={() => handleViewDetail(d.id)}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold truncate">{d.nome}</h3>
                  <Badge variant="outline" className={tipoColor[d.tipo] || ""}>
                    {d.tipo}
                  </Badge>
                </div>
                {d.descricao && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{d.descricao}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(d.data_inicio)} - {formatDate(d.data_fim)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {d.participantes_count ?? 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    {d.meta_valor} {d.meta_tipo}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedDesafio} onOpenChange={() => setSelectedDesafio(null)}>
        <DialogContent className="max-w-lg">
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
                <span>{formatDate(selectedDesafio.data_inicio)} - {formatDate(selectedDesafio.data_fim)}</span>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-yellow-400" /> Ranking dos Participantes
                </h4>
                {selectedDesafio.leaderboard.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum participante ainda.</p>
                ) : (
                  <div className="space-y-3">
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
                          <Badge variant="outline" className="text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
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
