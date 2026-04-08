"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ImagePlus, Loader2, Send } from "lucide-react";

interface PostFormProps {
  onCreated?: () => void;
}

export function PostForm({ onCreated }: PostFormProps) {
  const [conteudo, setConteudo] = useState("");
  const [midiaUrl, setMidiaUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!conteudo.trim() && !midiaUrl.trim()) return;
    try {
      setSubmitting(true);
      setError(null);
      await api.feed.create({
        conteudo: conteudo.trim() || undefined,
        tipo: midiaUrl.trim() ? "foto" : "texto",
        midia_url: midiaUrl.trim() || undefined,
      });
      setConteudo("");
      setMidiaUrl("");
      setShowImageInput(false);
      onCreated?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao publicar.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <Textarea
          placeholder="Compartilhe algo com a comunidade..."
          value={conteudo}
          onChange={(e) => setConteudo(e.target.value)}
          rows={3}
          className="resize-none"
        />
        {showImageInput && (
          <Input
            placeholder="URL da imagem (opcional)"
            value={midiaUrl}
            onChange={(e) => setMidiaUrl(e.target.value)}
          />
        )}
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-muted-foreground"
            onClick={() => setShowImageInput(!showImageInput)}
          >
            <ImagePlus className="w-4 h-4" /> Imagem
          </Button>
          <Button
            size="sm"
            className="gap-1"
            onClick={handleSubmit}
            disabled={submitting || (!conteudo.trim() && !midiaUrl.trim())}
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Publicar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
