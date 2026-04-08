"use client";
export const runtime = "edge";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError, type PerfilPublico } from "@/lib/api";
import { PostCard } from "@/components/feed/post-card";
import { BadgeGallery } from "@/components/badges/badge-gallery";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Heart,
  MessageSquare,
  Trophy,
  Award,
  Loader2,
} from "lucide-react";

export default function PerfilPublicoPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const [perfil, setPerfil] = useState<PerfilPublico | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.badges.perfil(userId);
        setPerfil(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Erro ao carregar perfil.");
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetch();
  }, [userId]);

  const initials = (name: string) =>
    name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  if (loading) {
    return (
      <div className="space-y-6 max-w-lg mx-auto">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !perfil) {
    return (
      <div className="space-y-4 max-w-lg mx-auto">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-red-400">{error || "Perfil nao encontrado."}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Button>

      {/* Profile header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={perfil.user.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/20 text-primary text-xl">
            {initials(perfil.user.nome)}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{perfil.user.nome}</h1>
            {perfil.user.tipo === "expert" && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                Expert
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Posts", value: perfil.stats.posts, icon: MessageSquare },
          { label: "Curtidas", value: perfil.stats.curtidas_recebidas, icon: Heart },
          { label: "Desafios", value: perfil.stats.desafios_concluidos, icon: Trophy },
          { label: "Badges", value: perfil.stats.badges_total, icon: Award },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-3 text-center">
              <s.icon className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-lg font-bold">{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="badges" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="badges" className="flex-1">Badges</TabsTrigger>
          <TabsTrigger value="posts" className="flex-1">Posts</TabsTrigger>
        </TabsList>

        <TabsContent value="badges" className="mt-4">
          <BadgeGallery badges={perfil.badges} />
        </TabsContent>

        <TabsContent value="posts" className="mt-4">
          {perfil.posts_recentes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum post recente.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {perfil.posts_recentes.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
