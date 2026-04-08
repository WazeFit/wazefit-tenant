"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, AlertTriangle } from "lucide-react";
import { api, type RankingEntry } from "@/lib/api";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
}

const PODIUM_STYLES = [
  { ring: "ring-yellow-400", bg: "bg-yellow-400/10", text: "text-yellow-400", label: "1o" },
  { ring: "ring-slate-300", bg: "bg-slate-300/10", text: "text-slate-300", label: "2o" },
  { ring: "ring-amber-600", bg: "bg-amber-600/10", text: "text-amber-600", label: "3o" },
];

export default function RankingPage() {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.ranking.list();
      setRanking(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar ranking");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4 justify-center">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-32" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <p className="text-destructive font-medium">{error}</p>
        <Button onClick={load} variant="outline">Tentar novamente</Button>
      </div>
    );
  }

  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ranking</h1>
        <p className="text-muted-foreground">Classificacao dos alunos por pontuacao</p>
      </div>

      {ranking.length === 0 ? (
        <Card className="p-12 text-center">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">Nenhum aluno no ranking ainda</p>
        </Card>
      ) : (
        <>
          {/* Podium */}
          <div className="flex items-end justify-center gap-4 py-6">
            {[1, 0, 2].map((idx) => {
              const entry = top3[idx];
              if (!entry) return <div key={idx} className="w-28" />;
              const style = PODIUM_STYLES[idx];
              const isFirst = idx === 0;
              return (
                <div
                  key={entry.aluno_id}
                  className={`flex flex-col items-center gap-2 ${isFirst ? "pb-4" : ""}`}
                >
                  <div className={`relative`}>
                    {isFirst && (
                      <Trophy className="w-6 h-6 text-yellow-400 absolute -top-7 left-1/2 -translate-x-1/2" />
                    )}
                    <Avatar className={`w-16 h-16 ring-2 ${style.ring} ${style.bg}`}>
                      <AvatarFallback className={`text-lg font-bold ${style.text}`}>
                        {initials(entry.nome)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <span className={`text-xs font-bold ${style.text}`}>{style.label}</span>
                  <span className="text-sm font-semibold text-center max-w-[100px] truncate">
                    {entry.nome}
                  </span>
                  <span className="text-xs text-muted-foreground">{entry.pontos} pts</span>
                </div>
              );
            })}
          </div>

          {/* Full Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Medal className="w-5 h-5" />
                Classificacao Completa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Aluno</TableHead>
                    <TableHead className="text-right">Pontos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ranking.map((entry) => (
                    <TableRow key={entry.aluno_id}>
                      <TableCell className="font-bold text-muted-foreground">{entry.posicao}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">{initials(entry.nome)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{entry.nome}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{entry.pontos}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
