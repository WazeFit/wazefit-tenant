"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, type Post } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  MessageCircle,
  Trash2,
  Flame,
  Zap,
  ThumbsUp,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CommentList } from "./comment-list";

const reactionIcons: Record<string, { icon: typeof Heart; label: string; color: string }> = {
  like: { icon: ThumbsUp, label: "Curtir", color: "text-blue-400" },
  forca: { icon: Zap, label: "Forca", color: "text-yellow-400" },
  fogo: { icon: Flame, label: "Fogo", color: "text-orange-400" },
  aplausos: { icon: Trophy, label: "Aplausos", color: "text-emerald-400" },
  coracao: { icon: Heart, label: "Coracao", color: "text-red-400" },
};

const tipoLabel: Record<string, string> = {
  treino: "Treino",
  conquista: "Conquista",
  desafio: "Desafio",
  foto: "Foto",
};

interface PostCardProps {
  post: Post;
  canDelete?: boolean;
  onDeleted?: () => void;
  currentUserId?: string;
}

export function PostCard({ post, canDelete, onDeleted, currentUserId }: PostCardProps) {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [curtidas, setCurtidas] = useState(post.curtidas_count);
  const [showComments, setShowComments] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const initials = (name: string) =>
    name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "agora";
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const handleReaction = async (tipo: string) => {
    try {
      if (liked) {
        await api.feed.descurtir(post.id);
        setCurtidas((c) => Math.max(c - 1, 0));
        setLiked(false);
      } else {
        await api.feed.curtir(post.id, tipo);
        setCurtidas((c) => c + 1);
        setLiked(true);
      }
    } catch {
      // silently ignore
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    try {
      setDeleting(true);
      await api.feed.delete(post.id);
      onDeleted?.();
    } catch {
      // silently ignore
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Avatar
            className="h-10 w-10 cursor-pointer"
            onClick={() => router.push(`/treino/perfil/${post.user_id}`)}
          >
            <AvatarFallback className="bg-primary/20 text-primary text-sm">
              {initials(post.user_nome)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="font-medium text-sm cursor-pointer hover:underline truncate"
                onClick={() => router.push(`/treino/perfil/${post.user_id}`)}
              >
                {post.user_nome}
              </span>
              {post.user_tipo === "expert" && (
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                  Expert
                </Badge>
              )}
              {post.tipo !== "texto" && tipoLabel[post.tipo] && (
                <Badge variant="outline" className="text-xs">
                  {tipoLabel[post.tipo]}
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{timeAgo(post.criado_em)}</span>
          </div>
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-red-400"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Content */}
        {post.conteudo && (
          <p className="text-sm whitespace-pre-wrap">{post.conteudo}</p>
        )}

        {/* Media */}
        {post.midia_url && post.tipo === "foto" && (
          <div className="rounded-lg overflow-hidden">
            <img
              src={post.midia_url}
              alt="Post"
              className="w-full max-h-96 object-cover"
            />
          </div>
        )}

        {/* Reactions bar */}
        <div className="flex items-center gap-1 pt-2 border-t">
          {Object.entries(reactionIcons).map(([tipo, { icon: Icon, label, color }]) => (
            <Button
              key={tipo}
              variant="ghost"
              size="sm"
              className={cn("h-8 px-2 text-xs gap-1", liked && tipo === "like" && color)}
              onClick={() => handleReaction(tipo)}
              title={label}
            >
              <Icon className="w-4 h-4" />
            </Button>
          ))}
          <span className="text-xs text-muted-foreground ml-1">
            {curtidas > 0 && `${curtidas}`}
          </span>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs gap-1"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="w-4 h-4" />
            {post.comentarios_count > 0 && post.comentarios_count}
          </Button>
        </div>

        {/* Comments */}
        {showComments && <CommentList postId={post.id} />}
      </CardContent>
    </Card>
  );
}
