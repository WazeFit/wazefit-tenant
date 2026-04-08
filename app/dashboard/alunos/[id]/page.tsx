"use client";
export const runtime = "edge";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError, type Aluno, type Ficha, type CalendarioData, type EvolucaoData } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  ArrowLeft,
  Mail,
  Phone,
  Target,
  Trophy,
  Calendar,
  Dumbbell,
  MessageSquare,
  TrendingUp,
  Flame,
  BarChart3,
} from "lucide-react";

const statusColor: Record<string, string> = {
  ativo: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  trial: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  inativo: "bg-red-500/20 text-red-400 border-red-500/30",
};

const diasSemana = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
const diasNomes = ["Domingo", "Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado"];

export default function AlunoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [calendario, setCalendario] = useState<CalendarioData | null>(null);
  const [evolucao, setEvolucao] = useState<EvolucaoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const alunoData = await api.alunos.get(id);
      setAluno(alunoData);

      // Load secondary data in parallel
      const [fichasData, calData, evoData] = await Promise.allSettled([
        api.fichas.list(),
        api.calendario.get(id),
        api.evolucao.get(id),
      ]);

      if (fichasData.status === "fulfilled") setFichas(fichasData.value);
      if (calData.status === "fulfilled") setCalendario(calData.value);
      if (evoData.status === "fulfilled") setEvolucao(evoData.value);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar dados do aluno");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const initials = (name: string) =>
    name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48 md:col-span-2" />
        </div>
      </div>
    );
  }

  if (error || !aluno) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push("/dashboard/alunos")} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-red-400">{error || "Aluno nao encontrado"}</p>
            <Button variant="outline" className="mt-4" onClick={fetchData}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <Button variant="ghost" onClick={() => router.push("/dashboard/alunos")} className="gap-2">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Button>

      <div className="flex items-start gap-6">
        <Avatar className="h-20 w-20">
          <AvatarImage src={aluno.avatar_url || undefined} />
          <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-2xl">
            {initials(aluno.nome)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{aluno.nome}</h1>
            <Badge variant="outline" className={statusColor[aluno.status] || ""}>
              {aluno.status}
            </Badge>
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> {aluno.email}
            </span>
            {aluno.telefone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> {aluno.telefone}
              </span>
            )}
          </div>
          {aluno.objetivo && (
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              <Target className="w-3.5 h-3.5" /> {aluno.objetivo}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => router.push("/dashboard/chat")}
        >
          <MessageSquare className="w-4 h-4" /> Chat
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v: string | null) => setActiveTab(v || "")}>
        <TabsList>
          <TabsTrigger value="overview">Visao Geral</TabsTrigger>
          <TabsTrigger value="fichas">Fichas</TabsTrigger>
          <TabsTrigger value="calendario">Calendario</TabsTrigger>
          <TabsTrigger value="evolucao">Evolucao</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pontos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span className="text-2xl font-bold">{aluno.pontos}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Grupo</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold capitalize">{aluno.grupo}</span>
              </CardContent>
            </Card>
            {evolucao && (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Treinos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Dumbbell className="w-5 h-5 text-emerald-400" />
                      <span className="text-2xl font-bold">{evolucao.total_treinos}</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Sequencia</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Flame className="w-5 h-5 text-orange-400" />
                      <span className="text-2xl font-bold">{evolucao.sequencia_atual} dias</span>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Informacoes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Membro desde</span>
                  <p className="font-medium">{new Date(aluno.criado_em).toLocaleDateString("pt-BR")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Ultimo login</span>
                  <p className="font-medium">
                    {aluno.ultimo_login
                      ? new Date(aluno.ultimo_login).toLocaleDateString("pt-BR")
                      : "Nunca"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fichas */}
        <TabsContent value="fichas" className="space-y-4">
          {fichas.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Dumbbell className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="font-medium">Nenhuma ficha atribuida</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Atribua fichas de treino na pagina de fichas.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push("/dashboard/fichas")}
                >
                  Ir para Fichas
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {fichas.map((ficha) => (
                <Card key={ficha.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{ficha.nome}</CardTitle>
                      <Badge variant="outline">{ficha.tipo}</Badge>
                    </div>
                    {ficha.descricao && (
                      <CardDescription>{ficha.descricao}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {ficha.exercicios?.length || 0} exercicios
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Calendario */}
        <TabsContent value="calendario" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" /> Calendario Semanal
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!calendario ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum calendario configurado.
                </p>
              ) : (
                <div className="grid grid-cols-7 gap-2">
                  {diasSemana.map((dia, i) => {
                    const entry = calendario[dia];
                    return (
                      <div key={dia} className="text-center space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase">
                          {diasNomes[i]?.slice(0, 3)}
                        </p>
                        <div
                          className={`rounded-lg p-3 min-h-[80px] flex items-center justify-center text-xs ${
                            entry
                              ? "bg-emerald-500/10 border border-emerald-500/30"
                              : "bg-muted/30 border border-border"
                          }`}
                        >
                          {entry ? (
                            <span className="font-medium text-emerald-400">
                              {entry.ficha_nome || "Treino"}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Descanso</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evolucao */}
        <TabsContent value="evolucao" className="space-y-4">
          {!evolucao ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <BarChart3 className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="font-medium">Sem dados de evolucao</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Os dados aparecerao conforme o aluno registrar treinos.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Total Treinos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className="text-2xl font-bold">{evolucao.total_treinos}</span>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Frequencia Semanal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className="text-2xl font-bold">{evolucao.frequencia_semanal}x</span>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Sequencia Atual</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Flame className="w-5 h-5 text-orange-400" />
                      <span className="text-2xl font-bold">{evolucao.sequencia_atual} dias</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Historico (ultimos 30 dias)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-1 flex-wrap">
                    {evolucao.historico.map((h, i) => (
                      <div
                        key={i}
                        title={`${new Date(h.data).toLocaleDateString("pt-BR")} - ${h.treinou ? "Treinou" : "Descanso"}`}
                        className={`w-8 h-8 rounded-sm ${
                          h.treinou
                            ? "bg-emerald-500/60"
                            : "bg-muted/40"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-sm bg-emerald-500/60" /> Treinou
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-sm bg-muted/40" /> Descanso
                    </span>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
