"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

const PODIUM_COLORS = ["text-yellow-400", "text-slate-300", "text-amber-600"];
const PODIUM_RINGS = ["ring-yellow-400", "ring-slate-300", "ring-amber-600"];
const PODIUM_BG = ["bg-yellow-400/10", "bg-slate-300/10", "bg-amber-600/10"];

export default function RankingAlunoPage() {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const userStr = localStorage.getItem("wf_user");
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUserId(user.id);
      }
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
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-3 justify-center">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <p className="text-destructive font-medium text-center">{error}</p>
        <Button onClick={load} variant="outline">Tentar novamente</Button>
      </div>
    );
  }

  if (ranking.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Trophy className="w-12 h-12 text-muted-foreground opacity-30" />
        <h2 className="text-xl font-semibold">Ranking Vazio</h2>
        <p className="text-muted-foreground text-sm text-center">
          Complete treinos para aparecer no ranking!
        </p>
      </div>
    );
  }

  const top3 = ranking.slice(0, 3);
  const myEntry = ranking.find((e) => e.aluno_id === currentUserId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Ranking</h1>
      </div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-3 py-4">
        {[1, 0, 2].map((idx) => {
          const entry = top3[idx];
          if (!entry) return <div key={idx} className="w-20" />;
          const isMe = entry.aluno_id === currentUserId;
          return (
            <div
              key={entry.aluno_id}
              className={`flex flex-col items-center gap-1.5 ${idx === 0 ? "pb-3" : ""}`}
            >
              {idx === 0 && <Trophy className="w-5 h-5 text-yellow-400" />}
              <Avatar className={`w-14 h-14 ring-2 ${PODIUM_RINGS[idx]} ${PODIUM_BG[idx]} ${isMe ? "ring-4" : ""}`}>
                <AvatarFallback className={`text-sm font-bold ${PODIUM_COLORS[idx]}`}>
                  {initials(entry.nome)}
                </AvatarFallback>
              </Avatar>
              <span className={`text-xs font-bold ${PODIUM_COLORS[idx]}`}>#{idx + 1}</span>
              <span className="text-xs font-medium text-center max-w-[80px] truncate">
                {entry.nome}
              </span>
              <span className="text-[10px] text-muted-foreground">{entry.pontos} pts</span>
            </div>
          );
        })}
      </div>

      {/* Current user highlight */}
      {myEntry && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <span className="font-bold text-primary w-8">#{myEntry.posicao}</span>
              <Avatar className="w-8 h-8 ring-2 ring-primary">
                <AvatarFallback className="text-xs">{initials(myEntry.nome)}</AvatarFallback>
              </Avatar>
              <span className="font-semibold">Voce</span>
            </div>
            <span className="font-bold text-primary">{myEntry.pontos} pts</span>
          </CardContent>
        </Card>
      )}

      {/* Full list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Medal className="w-4 h-4" />
            Classificacao
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {ranking.map((entry) => {
              const isMe = entry.aluno_id === currentUserId;
              return (
                <div
                  key={entry.aluno_id}
                  className={`flex items-center justify-between py-2.5 px-2 rounded-lg ${
                    isMe ? "bg-primary/10" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-muted-foreground w-6">
                      {entry.posicao}
                    </span>
                    <Avatar className="w-7 h-7">
                      <AvatarFallback className="text-[10px]">{initials(entry.nome)}</AvatarFallback>
                    </Avatar>
                    <span className={`text-sm ${isMe ? "font-bold" : "font-medium"}`}>
                      {isMe ? `${entry.nome} (Voce)` : entry.nome}
                    </span>
                  </div>
                  <span className="text-sm font-semibold">{entry.pontos}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
