"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  Clock,
  AlertTriangle,
  Plus,
  Loader2,
} from "lucide-react";
import { api, type Cobranca, type ResumoFinanceiro, type Aluno } from "@/lib/api";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "secondary" },
  pago: { label: "Pago", variant: "default" },
  vencido: { label: "Vencido", variant: "destructive" },
  cancelado: { label: "Cancelado", variant: "outline" },
};

function cents(v: number) {
  return `R$ ${(v / 100).toFixed(2)}`;
}

export default function FinanceiroPage() {
  const [resumo, setResumo] = useState<ResumoFinanceiro | null>(null);
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ aluno_id: "", valor: "", vencimento: "", descricao: "" });
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [r, c, a] = await Promise.all([
        api.financeiro.resumo(),
        api.cobrancas.list(filterStatus === "todos" ? undefined : filterStatus),
        api.alunos.list(1, 100),
      ]);
      setResumo(r);
      setCobrancas(c);
      setAlunos(a.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados financeiros");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    if (!form.aluno_id || !form.valor || !form.vencimento) return;
    setCreating(true);
    try {
      await api.cobrancas.create({
        aluno_id: form.aluno_id,
        valor_centavos: Math.round(parseFloat(form.valor) * 100),
        vencimento: form.vencimento,
        descricao: form.descricao || undefined,
      });
      setForm({ aluno_id: "", valor: "", vencimento: "", descricao: "" });
      setDialogOpen(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar cobranca");
    } finally {
      setCreating(false);
    }
  }

  if (loading && !resumo) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error && !resumo) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <p className="text-destructive font-medium">{error}</p>
        <Button onClick={load} variant="outline">Tentar novamente</Button>
      </div>
    );
  }

  const summaryCards = [
    {
      icon: DollarSign,
      label: "Receita Total (Pago)",
      value: cents(resumo?.resumo.total_pago_centavos ?? 0),
      color: "text-emerald-400",
    },
    {
      icon: Clock,
      label: "Pendente",
      value: cents(resumo?.resumo.total_pendente_centavos ?? 0),
      color: "text-yellow-500",
    },
    {
      icon: AlertTriangle,
      label: "Vencido",
      value: cents(resumo?.resumo.total_vencido_centavos ?? 0),
      color: "text-destructive",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">Gerencie cobrancas e acompanhe sua receita</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button><Plus className="w-4 h-4 mr-2" />Nova Cobranca</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Cobranca</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Aluno</Label>
                <Select value={form.aluno_id} onValueChange={(v: string | null) => setForm((f) => ({ ...f, aluno_id: v ?? "" }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {alunos.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.valor}
                  onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Vencimento</Label>
                <Input
                  type="date"
                  value={form.vencimento}
                  onChange={(e) => setForm((f) => ({ ...f, vencimento: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Descricao (opcional)</Label>
                <Textarea
                  placeholder="Descricao da cobranca..."
                  value={form.descricao}
                  onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                />
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={creating || !form.aluno_id || !form.valor || !form.vencimento}>
                {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Criar Cobranca
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Cobrancas</CardTitle>
          <Select value={filterStatus} onValueChange={(v: string | null) => setFilterStatus(v ?? "todos")}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="vencido">Vencido</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {cobrancas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma cobranca encontrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Descricao</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cobrancas.map((c) => {
                  const st = STATUS_MAP[c.status] ?? { label: c.status, variant: "outline" as const };
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.aluno_nome ?? "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{c.descricao ?? "-"}</TableCell>
                      <TableCell>{cents(c.valor_centavos)}</TableCell>
                      <TableCell>{new Date(c.vencimento).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
