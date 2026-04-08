"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, type Aluno, type PaginatedResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  Plus,
  Search,
  Users,
  UserCheck,
  UserX,
  Clock,
} from "lucide-react";

const statusColor: Record<string, string> = {
  ativo: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  trial: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  inativo: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function AlunosPage() {
  const router = useRouter();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", telefone: "" });
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginatedResponse<Aluno>["meta"] | null>(null);

  const fetchAlunos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.alunos.list(page, 50);
      setAlunos(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar alunos");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchAlunos();
  }, [fetchAlunos]);

  const filtered = alunos.filter((a) => {
    const matchSearch =
      !search ||
      a.nome.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "todos" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: alunos.length,
    ativos: alunos.filter((a) => a.status === "ativo").length,
    trial: alunos.filter((a) => a.status === "trial").length,
    inativos: alunos.filter((a) => a.status === "inativo").length,
  };

  const handleCreate = async () => {
    if (!form.nome || !form.email) return;
    try {
      setCreating(true);
      await api.alunos.create({
        nome: form.nome,
        email: form.email,
        telefone: form.telefone || undefined,
      });
      setForm({ nome: "", email: "", telefone: "" });
      setDialogOpen(false);
      fetchAlunos();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao criar aluno");
    } finally {
      setCreating(false);
    }
  };

  const initials = (name: string) =>
    name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alunos</h1>
          <p className="text-muted-foreground">
            Gerencie seus alunos e acompanhe seu progresso.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4" /> Novo Aluno
        </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Aluno</DialogTitle>
              <DialogDescription>
                Preencha os dados do novo aluno.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={form.nome}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nome: e.target.value }))
                  }
                  placeholder="Nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={form.telefone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, telefone: e.target.value }))
                  }
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={creating || !form.nome || !form.email}
              >
                {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Cadastrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total", value: stats.total, icon: Users, color: "text-blue-400" },
          { label: "Ativos", value: stats.ativos, icon: UserCheck, color: "text-emerald-400" },
          { label: "Trial", value: stats.trial, icon: Clock, color: "text-amber-400" },
          { label: "Inativos", value: stats.inativos, icon: UserX, color: "text-red-400" },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "-" : s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="inativo">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhum aluno encontrado</h3>
            <p className="text-muted-foreground mt-1">
              {search || statusFilter !== "todos"
                ? "Tente ajustar os filtros."
                : "Cadastre seu primeiro aluno para comecar."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((aluno) => (
            <Card
              key={aluno.id}
              className="cursor-pointer transition-colors hover:border-emerald-500/50"
              onClick={() => router.push(`/dashboard/alunos/${aluno.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={aluno.avatar_url || undefined} />
                    <AvatarFallback className="bg-emerald-500/20 text-emerald-400">
                      {initials(aluno.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{aluno.nome}</p>
                      <Badge
                        variant="outline"
                        className={statusColor[aluno.status] || ""}
                      >
                        {aluno.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {aluno.email}
                    </p>
                    {aluno.objetivo && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {aluno.objetivo}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-muted-foreground">
                  <span>{aluno.pontos} pts</span>
                  <span className="capitalize">{aluno.grupo}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Pagina {meta.page} de {meta.total_pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= meta.total_pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Proxima
          </Button>
        </div>
      )}
    </div>
  );
}
