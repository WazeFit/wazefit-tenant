"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { api, ApiError, type LLMJob, type Aluno, type PaginatedResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  Sparkles,
  Dumbbell,
  Apple,
  History,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pendente: { label: "Pendente", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Clock },
  processando: { label: "Processando", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Loader2 },
  concluido: { label: "Concluido", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
  erro: { label: "Erro", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle },
};

export default function IAPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [jobs, setJobs] = useState<LLMJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("treino");

  // Treino form
  const [treinoForm, setTreinoForm] = useState({
    aluno_id: "",
    objetivo: "",
    nivel: "",
    dias_semana: "3",
    observacoes: "",
  });
  const [generatingTreino, setGeneratingTreino] = useState(false);

  // Dieta form
  const [dietaForm, setDietaForm] = useState({
    aluno_id: "",
    objetivo: "",
    restricoes: "",
    calorias_alvo: "",
  });
  const [generatingDieta, setGeneratingDieta] = useState(false);

  // Polling
  const [pollingJobId, setPollingJobId] = useState<string | null>(null);
  const [pollingJob, setPollingJob] = useState<LLMJob | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [alunosRes, jobsRes] = await Promise.all([
        api.alunos.list(1, 100),
        api.llm.jobs(),
      ]);
      setAlunos((alunosRes as PaginatedResponse<Aluno>).data);
      setJobs(jobsRes);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Polling for active job
  useEffect(() => {
    if (!pollingJobId) return;
    const poll = async () => {
      try {
        const job = await api.llm.job(pollingJobId);
        setPollingJob(job);
        if (job.status === "concluido" || job.status === "erro") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setPollingJobId(null);
          fetchData(); // refresh job list
        }
      } catch {
        // silent
      }
    };
    poll();
    pollingRef.current = setInterval(poll, 2000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [pollingJobId, fetchData]);

  const handleGerarTreino = async () => {
    if (!treinoForm.aluno_id || !treinoForm.objetivo || !treinoForm.nivel) return;
    try {
      setGeneratingTreino(true);
      setError(null);
      const res = await api.llm.gerarTreino({
        aluno_id: treinoForm.aluno_id,
        objetivo: treinoForm.objetivo,
        nivel: treinoForm.nivel,
        dias_semana: parseInt(treinoForm.dias_semana),
        observacoes: treinoForm.observacoes || undefined,
      });
      setPollingJobId(res.job_id);
      setPollingJob({ id: res.job_id, tipo: "treino", status: "pendente" } as LLMJob);
      setActiveTab("historico");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao gerar treino");
    } finally {
      setGeneratingTreino(false);
    }
  };

  const handleGerarDieta = async () => {
    if (!dietaForm.aluno_id || !dietaForm.objetivo) return;
    try {
      setGeneratingDieta(true);
      setError(null);
      const res = await api.llm.gerarDieta({
        aluno_id: dietaForm.aluno_id,
        objetivo: dietaForm.objetivo,
        restricoes: dietaForm.restricoes || undefined,
        calorias_alvo: dietaForm.calorias_alvo ? parseInt(dietaForm.calorias_alvo) : undefined,
      });
      setPollingJobId(res.job_id);
      setPollingJob({ id: res.job_id, tipo: "dieta", status: "pendente" } as LLMJob);
      setActiveTab("historico");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao gerar dieta");
    } finally {
      setGeneratingDieta(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const cfg = statusConfig[status] || { label: status, color: "", icon: Clock };
    return (
      <Badge variant="outline" className={cfg.color}>
        {status === "processando" && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
        {cfg.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-400" />
            Inteligencia Artificial
          </h1>
          <p className="text-muted-foreground">Gere treinos e dietas com IA.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400">{error}</div>
      )}

      {/* Active job status */}
      {pollingJob && (pollingJob.status === "pendente" || pollingJob.status === "processando") && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-4 flex items-center gap-4">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
            <div>
              <p className="font-medium">
                Gerando {pollingJob.tipo === "treino" ? "treino" : "dieta"}...
              </p>
              <p className="text-sm text-muted-foreground">
                A IA esta processando sua solicitacao. Aguarde.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={(v: string | null) => setActiveTab(v || "")}>
        <TabsList>
          <TabsTrigger value="treino" className="gap-2">
            <Dumbbell className="w-4 h-4" /> Gerar Treino
          </TabsTrigger>
          <TabsTrigger value="dieta" className="gap-2">
            <Apple className="w-4 h-4" /> Gerar Dieta
          </TabsTrigger>
          <TabsTrigger value="historico" className="gap-2">
            <History className="w-4 h-4" /> Historico
          </TabsTrigger>
        </TabsList>

        {/* Gerar Treino */}
        <TabsContent value="treino">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-emerald-400" />
                Gerar Treino com IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Aluno *</Label>
                  <Select
                    value={treinoForm.aluno_id}
                    onValueChange={(v) => setTreinoForm((f) => ({ ...f, aluno_id: v }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {alunos.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Objetivo *</Label>
                  <Select
                    value={treinoForm.objetivo}
                    onValueChange={(v) => setTreinoForm((f) => ({ ...f, objetivo: v }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hipertrofia">Hipertrofia</SelectItem>
                      <SelectItem value="emagrecimento">Emagrecimento</SelectItem>
                      <SelectItem value="forca">Forca</SelectItem>
                      <SelectItem value="resistencia">Resistencia</SelectItem>
                      <SelectItem value="funcional">Funcional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nivel *</Label>
                  <Select
                    value={treinoForm.nivel}
                    onValueChange={(v) => setTreinoForm((f) => ({ ...f, nivel: v }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="iniciante">Iniciante</SelectItem>
                      <SelectItem value="intermediario">Intermediario</SelectItem>
                      <SelectItem value="avancado">Avancado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Dias por Semana</Label>
                  <Select
                    value={treinoForm.dias_semana}
                    onValueChange={(v) => setTreinoForm((f) => ({ ...f, dias_semana: v }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 5, 6].map((d) => (
                        <SelectItem key={d} value={String(d)}>{d} dias</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Observacoes</Label>
                <Textarea
                  value={treinoForm.observacoes}
                  onChange={(e) => setTreinoForm((f) => ({ ...f, observacoes: e.target.value }))}
                  placeholder="Lesoes, preferencias, restricoes..."
                  rows={3}
                />
              </div>
              <Button
                onClick={handleGerarTreino}
                disabled={generatingTreino || !treinoForm.aluno_id || !treinoForm.objetivo || !treinoForm.nivel}
                className="gap-2"
              >
                {generatingTreino ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Gerar Treino
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gerar Dieta */}
        <TabsContent value="dieta">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Apple className="w-5 h-5 text-emerald-400" />
                Gerar Dieta com IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Aluno *</Label>
                  <Select
                    value={dietaForm.aluno_id}
                    onValueChange={(v) => setDietaForm((f) => ({ ...f, aluno_id: v }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {alunos.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Objetivo *</Label>
                  <Select
                    value={dietaForm.objetivo}
                    onValueChange={(v) => setDietaForm((f) => ({ ...f, objetivo: v }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cutting">Cutting</SelectItem>
                      <SelectItem value="bulking">Bulking</SelectItem>
                      <SelectItem value="manutencao">Manutencao</SelectItem>
                      <SelectItem value="recomposicao">Recomposicao</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Restricoes Alimentares</Label>
                <Input
                  value={dietaForm.restricoes}
                  onChange={(e) => setDietaForm((f) => ({ ...f, restricoes: e.target.value }))}
                  placeholder="Ex: Vegetariano, sem lactose, sem gluten..."
                />
              </div>
              <div className="space-y-2">
                <Label>Calorias Alvo (kcal)</Label>
                <Input
                  type="number"
                  value={dietaForm.calorias_alvo}
                  onChange={(e) => setDietaForm((f) => ({ ...f, calorias_alvo: e.target.value }))}
                  placeholder="2000"
                />
              </div>
              <Button
                onClick={handleGerarDieta}
                disabled={generatingDieta || !dietaForm.aluno_id || !dietaForm.objetivo}
                className="gap-2"
              >
                {generatingDieta ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Gerar Dieta
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historico */}
        <TabsContent value="historico">
          {loading ? (
            <Card>
              <CardContent className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </CardContent>
            </Card>
          ) : jobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <History className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhuma geracao</h3>
                <p className="text-muted-foreground mt-1">Use a IA para gerar treinos e dietas.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tokens</TableHead>
                    <TableHead>Custo</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {job.tipo === "treino" ? (
                            <Dumbbell className="w-3 h-3 mr-1" />
                          ) : (
                            <Apple className="w-3 h-3 mr-1" />
                          )}
                          {job.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{job.aluno_nome || "-"}</TableCell>
                      <TableCell>{getStatusBadge(job.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {job.tokens_usados || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {job.custo_estimado ? `R$ ${job.custo_estimado.toFixed(4)}` : "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(job.criado_em).toLocaleDateString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
