"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  MessageSquare,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { api, type ChatMensagem } from "@/lib/api";

export default function ChatAlunoPage() {
  const [messages, setMessages] = useState<ChatMensagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const loadMessages = useCallback(async (uid: string, silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await api.chat.mensagens(uid);
      setMessages(data);
    } catch (err) {
      if (!silent) setError(err instanceof Error ? err.message : "Erro ao carregar mensagens");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem("wf_user");
    if (!userStr) {
      setError("Usuario nao encontrado");
      setLoading(false);
      return;
    }
    const user = JSON.parse(userStr);
    setUserId(user.id);
    loadMessages(user.id);

    // Polling every 3s
    pollingRef.current = setInterval(() => {
      loadMessages(user.id, true);
    }, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function handleSend() {
    if (!text.trim() || !userId || sending) return;
    const content = text.trim();
    setText("");
    setSending(true);
    try {
      await api.chat.enviar(userId, content);
      await loadMessages(userId, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar mensagem");
      setText(content);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-10rem)] gap-3">
        <Skeleton className="h-8 w-48" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-12 w-1/2 ml-auto" />
          <Skeleton className="h-12 w-2/3" />
        </div>
        <Skeleton className="h-12" />
      </div>
    );
  }

  if (error && messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <p className="text-destructive font-medium text-center">{error}</p>
        <Button onClick={() => userId && loadMessages(userId)} variant="outline">
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <div className="flex items-center gap-2 pb-3 border-b border-border mb-3">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-bold">Chat com seu Personal</h1>
      </div>

      <ScrollArea className="flex-1 pr-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <MessageSquare className="w-10 h-10 opacity-30 mb-3" />
            <p>Nenhuma mensagem ainda</p>
            <p className="text-sm">Envie a primeira mensagem para seu personal!</p>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            {messages.map((msg) => {
              const isMe = msg.remetente_id === userId;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      isMe
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted rounded-bl-md"
                    }`}
                  >
                    {!isMe && msg.remetente_nome && (
                      <p className="text-xs font-semibold mb-0.5 opacity-70">{msg.remetente_nome}</p>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.conteudo}</p>
                    <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {new Date(msg.criado_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      <div className="flex items-center gap-2 pt-3 border-t border-border">
        <Input
          placeholder="Digite sua mensagem..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          disabled={sending}
          className="flex-1"
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={sending || !text.trim()}
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
