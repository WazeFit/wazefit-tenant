"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BadgeItem } from "@/lib/api";

const raridadeColors: Record<string, string> = {
  comum: "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
  raro: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  epico: "border-purple-500/30 bg-purple-500/10 text-purple-400",
  lendario: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
};

const raridadeLabel: Record<string, string> = {
  comum: "Comum",
  raro: "Raro",
  epico: "Epico",
  lendario: "Lendario",
};

interface BadgeCardProps {
  badge: BadgeItem;
  earned?: boolean;
}

export function BadgeCard({ badge, earned = true }: BadgeCardProps) {
  const colorClass = raridadeColors[badge.raridade] || raridadeColors.comum;

  return (
    <Card className={cn("transition-all", earned ? "" : "opacity-40 grayscale")}>
      <CardContent className="p-4 flex flex-col items-center text-center gap-2">
        <div
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center text-2xl border-2",
            colorClass
          )}
        >
          {badge.icone}
        </div>
        <div>
          <p className="text-sm font-medium">{badge.nome}</p>
          {badge.descricao && (
            <p className="text-xs text-muted-foreground mt-0.5">{badge.descricao}</p>
          )}
        </div>
        <span
          className={cn(
            "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border",
            colorClass
          )}
        >
          {raridadeLabel[badge.raridade] || badge.raridade}
        </span>
        {earned && badge.conquistado_em && (
          <span className="text-[10px] text-muted-foreground">
            {new Date(badge.conquistado_em).toLocaleDateString("pt-BR")}
          </span>
        )}
      </CardContent>
    </Card>
  );
}
