"use client";

import type { BadgeItem } from "@/lib/api";
import { BadgeCard } from "./badge-card";
import { Award } from "lucide-react";

interface BadgeGalleryProps {
  badges: BadgeItem[];
  allBadges?: BadgeItem[];
}

export function BadgeGallery({ badges, allBadges }: BadgeGalleryProps) {
  if (badges.length === 0 && !allBadges?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Award className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Nenhuma conquista ainda</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Continue treinando para desbloquear badges!
        </p>
      </div>
    );
  }

  const earnedIds = new Set(badges.map((b) => b.id));

  // Show earned badges first, then unearned from allBadges
  const displayBadges = [
    ...badges.map((b) => ({ ...b, earned: true })),
    ...(allBadges ?? [])
      .filter((b) => !earnedIds.has(b.id))
      .map((b) => ({ ...b, earned: false })),
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {displayBadges.map((badge) => (
        <BadgeCard key={badge.id} badge={badge} earned={badge.earned} />
      ))}
    </div>
  );
}
