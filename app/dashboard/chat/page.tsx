"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { api, ApiError, type Conversa, type ChatMensagem } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  Search,
  Send,
  MessageSquare,
  Check,
  CheckCheck,
} from "lucide-react";

export default function ChatPage() {
  const { user } = useAuth();
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [mensagens, setMensagens] = useState<ChatMensagem[]>([]);
  const [selectedAluno, setSelectedAluno] = useState<string | null>(null);
  const [selectedNome, setSelectedNome] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchConversas = useCallback(async () => {
    try {
      const data = await api.chat.conversas();
      setConversas(data);
    } catch (err) {
      if (!conversas.length) {
        setError(err instanceof ApiError ? err.message : "Erro ao carregar conversas");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversas();
    const interval = setInterval(fetchConversas, 5000);
    return () => clearInterval(interval);
  }, [fetchConversas]);

  const fetchMensagens = useCallback(async (alunoId: string) => {
    try {
      const data = await api.chat.mensagens(alunoId);
      setMensagens(data);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch {
      // silent for polling
    }
  }, []);

  const selectConversa = async (conversa: Conversa) => {
    setSelectedAluno(conversa.aluno_id);
    setSelectedNome(conversa.aluno_nome);
    setLoadingMessages(true);

    try {
      const data = await api.chat.mensagens(conversa.aluno_id);
      setMensagens(data);
      if (conversa.nao_lidas > 0) {
        await api.chat.marcarLidas(conversa.aluno_id);
        fetchConversas();
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar mensagens");
    } finally {
      setLoadingMessages(false);
    }

    // Start polling for this conversation
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(() => fetchMensagens(conversa.aluno_id), 5000);
  };

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const sendMessage = async () => {
    if (!selectedAluno || !messageInput.trim()) return;
    try {
      setSending(true);
      await api.chat.enviar(selectedAluno, messageInput.trim());
      setMessageInput("");
      fetchMensagens(selectedAluno);
      fetchConversas();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const initials = (name: string) =>
    name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  const filteredConversas = conversas.filter(
    (c) => !search || c.aluno_nome.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Chat</h1>
        <p className="text-muted-foreground">Converse com seus alunos.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400">{error}</div>
      )}

      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-220px)]">
        {/* Conversation list */}
        <div className="col-span-4 border rounded-lg flex flex-col">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar conversa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-3 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <MessageSquare className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma conversa</p>
              </div>
            ) : (
              <div>
                {filteredConversas.map((c) => (
                  <button
                    key={c.aluno_id}
                    className={`w-full text-left px-3 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors ${
                      selectedAluno === c.aluno_id ? "bg-muted/50" : ""
                    }`}
                    onClick={() => selectConversa(c)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-sm">
                        {initials(c.aluno_nome)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">{c.aluno_nome}</span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {formatTime(c.updated_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground truncate">
                          {c.ultima_mensagem}
                        </p>
                        {c.nao_lidas > 0 && (
                          <Badge className="bg-emerald-500 text-white ml-2 h-5 min-w-5 flex items-center justify-center text-xs rounded-full">
                            {c.nao_lidas}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Message thread */}
        <div className="col-span-8 border rounded-lg flex flex-col">
          {!selectedAluno ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Selecione uma conversa</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Escolha uma conversa ao lado para comecar.
              </p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="px-4 py-3 border-b flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-xs">
                    {initials(selectedNome)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{selectedNome}</span>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : mensagens.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>
                    <p className="text-xs text-muted-foreground mt-1">Envie a primeira mensagem!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mensagens.map((m) => {
                      const isMe = user?.id === m.remetente_id;
                      return (
                        <div
                          key={m.id}
                          className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                              isMe
                                ? "bg-emerald-600 text-white rounded-br-md"
                                : "bg-muted rounded-bl-md"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{m.conteudo}</p>
                            <div
                              className={`flex items-center gap-1 mt-1 text-xs ${
                                isMe ? "text-emerald-200" : "text-muted-foreground"
                              }`}
                            >
                              <span>{formatTime(m.criado_em)}</span>
                              {isMe && (
                                m.lida
                                  ? <CheckCheck className="w-3 h-3" />
                                  : <Check className="w-3 h-3" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite sua mensagem..."
                    disabled={sending}
                    className="flex-1"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={sending || !messageInput.trim()}
                    size="icon"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
