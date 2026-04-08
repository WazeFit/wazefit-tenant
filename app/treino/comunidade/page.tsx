"use client";

import { useEffect, useState, useCallback } from "react";
import { api, ApiError, type Post, type PaginatedResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PostCard } from "@/components/feed/post-card";
import { PostForm } from "@/components/feed/post-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Loader2 } from "lucide-react";

export default function AlunoComunidadePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchFeed = useCallback(async (pageNum: number, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const res = await api.feed.list(pageNum, 20);
      if (append) {
        setPosts((prev) => [...prev, ...res.data]);
      } else {
        setPosts(res.data);
      }
      setHasMore(pageNum < res.meta.total_pages);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar feed.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed(1);
  }, [fetchFeed]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchFeed(nextPage, true);
  };

  const refresh = () => {
    setPage(1);
    fetchFeed(1);
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Heart className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold">Comunidade</h1>
      </div>

      {/* Post form */}
      <PostForm onCreated={refresh} />

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Feed */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Heart className="w-10 h-10 text-muted-foreground mb-3" />
            <h3 className="text-base font-medium">Nenhum post ainda</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Seja o primeiro a compartilhar!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              canDelete={post.user_id === user?.id}
              onDeleted={refresh}
              currentUserId={user?.id}
            />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && !loading && posts.length > 0 && (
        <div className="flex justify-center pb-4">
          <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
            {loadingMore && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Carregar mais
          </Button>
        </div>
      )}
    </div>
  );
}
