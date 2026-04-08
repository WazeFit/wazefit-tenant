"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Globe,
  Plus,
  ShieldCheck,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { api, type DominioTenant } from "@/lib/api";

const DOMAIN_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive"; icon: typeof CheckCircle2 }> = {
  active: { label: "Ativo", variant: "default", icon: CheckCircle2 },
  pending: { label: "Pendente", variant: "secondary", icon: Clock },
  failed: { label: "Falhou", variant: "destructive", icon: XCircle },
};

export default function DominiosPage() {
  const [dominios, setDominios] = useState<DominioTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [adding, setAdding] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.dominios.list();
      setDominios(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dominios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd() {
    if (!newDomain.trim()) return;
    setAdding(true);
    try {
      await api.dominios.create(newDomain.trim());
      setNewDomain("");
      setDialogOpen(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar dominio");
    } finally {
      setAdding(false);
    }
  }

  async function handleVerify(id: string) {
    setVerifying(id);
    try {
      await api.dominios.verificar(id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao verificar DNS");
    } finally {
      setVerifying(null);
    }
  }

  async function handleRemove(id: string) {
    try {
      await api.dominios.remove(id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover dominio");
    }
  }

  if (loading && dominios.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dominios</h1>
          <p className="text-muted-foreground">Gerencie dominios personalizados para sua plataforma</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button><Plus className="w-4 h-4 mr-2" />Adicionar Dominio</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Dominio</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Dominio</Label>
                <Input
                  placeholder="app.seudominio.com.br"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
                <p className="text-xs text-muted-foreground">
                  Adicione um registro CNAME apontando para cname.wazefit.com
                </p>
              </div>
              <Button className="w-full" onClick={handleAdd} disabled={adding || !newDomain.trim()}>
                {adding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Adicionar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {dominios.length === 0 ? (
        <Card className="p-12 text-center">
          <Globe className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-lg font-medium mb-2">Nenhum dominio configurado</p>
          <p className="text-muted-foreground text-sm mb-4">
            Adicione um dominio personalizado para seus alunos acessarem a plataforma
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {dominios.map((d) => {
            const st = DOMAIN_STATUS[d.status] ?? DOMAIN_STATUS.pending;
            const StIcon = st.icon;
            return (
              <Card key={d.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{d.dominio}</p>
                      <p className="text-xs text-muted-foreground">
                        Adicionado em {new Date(d.criado_em).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={st.variant} className="gap-1">
                      <StIcon className="w-3 h-3" />
                      {st.label}
                    </Badge>
                    {d.status !== "active" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVerify(d.id)}
                        disabled={verifying === d.id}
                      >
                        {verifying === d.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ShieldCheck className="w-4 h-4 mr-1" />
                        )}
                        Verificar DNS
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger render={<Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>} />
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover dominio?</AlertDialogTitle>
                          <AlertDialogDescription>
                            O dominio <strong>{d.dominio}</strong> sera removido permanentemente.
                            Essa acao nao pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemove(d.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
