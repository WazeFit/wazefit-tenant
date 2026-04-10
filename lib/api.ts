/**
 * WazeFit API Client — comunicacao tipada com api.wazefit.com
 */

const BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.wazefit.com";

export class ApiError extends Error {
  status: number;
  constructor(status: number, data: unknown) {
    const msg = extractError(data);
    super(msg);
    this.name = "ApiError";
    this.status = status;
  }
}

function extractError(data: unknown): string {
  if (!data || typeof data !== "object") return "Erro desconhecido";
  const d = data as Record<string, unknown>;
  if (typeof d.error === "string") return d.error;
  if (d.error && typeof d.error === "object") {
    const err = d.error as Record<string, unknown>;
    if (Array.isArray(err.issues) && err.issues.length > 0) {
      return (err.issues[0] as Record<string, unknown>).message as string || "Dados invalidos";
    }
  }
  return "Erro desconhecido";
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("wf_token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let data: unknown;
    try { data = await res.json(); } catch { data = { error: `HTTP ${res.status}` }; }
    throw new ApiError(res.status, data);
  }
  return res.json() as Promise<T>;
}

async function requestList<T>(method: string, path: string): Promise<T[]> {
  const res = await request<{ data: T[] } | T[]>(method, path);
  if (Array.isArray(res)) return res;
  if (res && typeof res === "object" && "data" in res && Array.isArray(res.data)) return res.data;
  return res as unknown as T[];
}

// ── Types ──

export interface Aluno {
  id: string; nome: string; email: string; telefone: string | null;
  avatar_url: string | null; grupo: string; pontos: number;
  objetivo: string | null; status: string; ativo: boolean;
  criado_em: string; ultimo_login: string | null;
}

export interface Exercicio {
  id: string; nome: string; grupo_muscular: string; equipamento: string | null;
  video_url: string | null; instrucoes: string | null;
  tipo_exercicio: string | null; subtipo: string | null;
  dificuldade: string | null; criado_em: string;
}

export interface FichaExercicio {
  exercicio_id: string; series: number; repeticoes: string;
  descanso_seg: number; ordem: number; observacoes?: string;
  exercicio?: Exercicio;
}

export interface Ficha {
  id: string; nome: string; descricao: string | null; tipo: string;
  exercicios: FichaExercicio[]; is_template: boolean; criado_em: string;
}

export interface Conversa {
  aluno_id: string; aluno_nome: string; ultima_mensagem: string;
  nao_lidas: number; updated_at: string;
}

export interface ChatMensagem {
  id: string; remetente_id: string; remetente_nome?: string;
  conteudo: string; tipo: string; lida: boolean; criado_em: string;
}

export interface PlanoNutricional {
  id: string; aluno_id: string; aluno_nome?: string; nome: string;
  objetivo: string | null; ativo: boolean;
  calorias_diarias: number | null; proteina_g: number | null;
  carboidrato_g: number | null; gordura_g: number | null;
  observacoes?: string | null; refeicoes?: Refeicao[];
  criado_em: string; atualizado_em: string;
}

export interface Refeicao {
  id: string; nome: string; horario: string; ordem: number;
  alimentos: Alimento[];
}

export interface Alimento {
  id: string; nome: string; quantidade: number; unidade: string;
  calorias: number; proteina_g: number; carboidrato_g: number; gordura_g: number;
}

export interface Avaliacao {
  id: string; aluno_id: string; aluno_nome?: string; tipo: string;
  data: string; dados_json?: Record<string, unknown>;
  observacoes: string | null; criado_em: string;
}

export interface Briefing {
  id: string; aluno_id: string; aluno_nome: string;
  status: string; total_perguntas: number; respostas_count: number;
  criado_em: string;
}

export interface LLMJob {
  id: string; tipo: string; status: string; aluno_nome?: string;
  resultado: Record<string, unknown> | null; erro: string | null;
  tokens_usados: number | null; custo_estimado: number | null;
  criado_em: string;
}

export interface Cobranca {
  id: string; aluno_id: string; aluno_nome?: string;
  descricao: string | null; valor_centavos: number;
  status: string; vencimento: string; criado_em: string;
}

export interface ResumoFinanceiro {
  resumo: { total_pendente_centavos: number; total_pago_centavos: number; total_vencido_centavos: number };
  por_mes: { mes: string; total: number }[];
}

export interface RankingEntry {
  aluno_id: string; nome: string; pontos: number; posicao: number;
}

export interface AnalyticsDashboard {
  alunos_ativos: number; treinos_semana: number; taxa_aderencia: number;
  receita_mes: number; treinos_por_dia: { data: string; count: number }[];
  top_ranking: { aluno_nome: string; treinos: number }[];
}

export interface DominioTenant {
  id: string; dominio: string; status: string;
  verificado_em: string | null; criado_em: string;
}

export interface CalendarioData { [dia: string]: { ficha_id: string; ficha_nome?: string } | null }

export interface TreinoHoje { dia_semana: string; ficha: Ficha | null }

export interface EvolucaoData {
  total_treinos: number; frequencia_semanal: number;
  sequencia_atual: number; historico: { data: string; treinou: boolean }[];
}

export interface PaginatedResponse<T> { data: T[]; meta: { page: number; limit: number; total: number; total_pages: number } }

export interface Post {
  id: string; tenant_id: string; user_id: string; user_tipo: string;
  user_nome: string; conteudo: string | null; tipo: string;
  midia_url: string | null; execucao_id: string | null; badge_id: string | null;
  curtidas_count: number; comentarios_count: number; criado_em: string;
  minha_curtida?: string | null;
}

export interface Comentario {
  id: string; post_id: string; user_id: string; user_nome: string;
  conteudo: string; criado_em: string;
}

export interface Desafio {
  id: string; tenant_id: string; expert_id: string; nome: string;
  descricao: string | null; tipo: string; meta_tipo: string; meta_valor: number;
  data_inicio: string; data_fim: string; ativo: number;
  participantes_count?: number; criado_em: string;
}

export interface DesafioDetalhe extends Desafio {
  leaderboard: { user_id: string; user_nome: string; progresso: number; concluido: number; posicao: number }[];
}

export interface BadgeItem {
  id: string; nome: string; descricao: string | null; icone: string;
  categoria: string; raridade: string; conquistado_em?: string;
}

export interface PerfilPublico {
  user: { id: string; nome: string; avatar_url: string | null; tipo: string };
  stats: { posts: number; curtidas_recebidas: number; desafios_concluidos: number; badges_total: number };
  badges: BadgeItem[];
  posts_recentes: Post[];
}

// ── API Client ──

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),

  auth: {
    login: (email: string, senha: string) => request<{ user: Record<string, unknown>; tenant: Record<string, unknown>; access_token: string; refresh_token: string }>("POST", "/api/v1/auth/login", { email, senha }),
    me: () => request<{ user: Record<string, unknown>; tenant: Record<string, unknown> }>("GET", "/api/v1/auth/me"),
    logout: () => request<void>("POST", "/api/v1/auth/logout"),
  },

  alunos: {
    list: (page = 1, limit = 20) => request<PaginatedResponse<Aluno>>("GET", `/api/v1/alunos?page=${page}&per_page=${limit}`),
    get: (id: string) => request<Aluno>("GET", `/api/v1/alunos/${id}`),
    create: (data: { nome: string; email: string; senha?: string; telefone?: string }) => request<Aluno>("POST", "/api/v1/alunos", data),
    update: (id: string, data: Partial<Aluno>) => request<Aluno>("PUT", `/api/v1/alunos/${id}`, data),
    delete: (id: string) => request<void>("DELETE", `/api/v1/alunos/${id}`),
  },

  exercicios: {
    list: (busca?: string, grupo?: string) => {
      const p = new URLSearchParams();
      if (busca) p.set("busca", busca);
      if (grupo) p.set("grupo_muscular", grupo);
      const q = p.toString();
      return requestList<Exercicio>("GET", `/api/v1/exercicios${q ? `?${q}` : ""}`);
    },
    create: (data: Partial<Exercicio>) => request<Exercicio>("POST", "/api/v1/exercicios", data),
    update: (id: string, data: Partial<Exercicio>) => request<Exercicio>("PUT", `/api/v1/exercicios/${id}`, data),
    delete: (id: string) => request<void>("DELETE", `/api/v1/exercicios/${id}`),
  },

  fichas: {
    list: () => requestList<Ficha>("GET", "/api/v1/fichas"),
    get: (id: string) => request<Ficha>("GET", `/api/v1/fichas/${id}`),
    create: (data: { nome: string; tipo?: string; objetivo?: string; exercicios: Omit<FichaExercicio, "exercicio">[] }) => request<Ficha>("POST", "/api/v1/fichas", data),
    update: (id: string, data: Partial<Ficha>) => request<Ficha>("PUT", `/api/v1/fichas/${id}`, data),
    delete: (id: string) => request<void>("DELETE", `/api/v1/fichas/${id}`),
    atribuir: (fichaId: string, alunoId: string) => request<void>("POST", `/api/v1/fichas/${fichaId}/atribuir`, { aluno_id: alunoId }),
  },

  calendario: {
    get: (alunoId: string) => request<CalendarioData>("GET", `/api/v1/alunos/${alunoId}/calendario`),
    save: (alunoId: string, data: CalendarioData) => request<void>("PUT", `/api/v1/alunos/${alunoId}/calendario`, data),
  },

  treino: { hoje: (alunoId: string) => request<TreinoHoje>("GET", `/api/v1/alunos/${alunoId}/treino-hoje`) },
  execucoes: { create: (data: { ficha_id: string; data?: string; duracao_min?: number }) => request<void>("POST", "/api/v1/execucoes", data) },
  ranking: { list: () => requestList<RankingEntry>("GET", "/api/v1/ranking") },
  evolucao: { get: (alunoId: string, dias = 30) => request<EvolucaoData>("GET", `/api/v1/evolucao/${alunoId}?dias=${dias}`) },

  chat: {
    conversas: () => requestList<Conversa>("GET", "/api/v1/chat/conversas"),
    mensagens: (alunoId: string, since?: string) => requestList<ChatMensagem>("GET", `/api/v1/chat/${alunoId}/mensagens${since ? `?since=${encodeURIComponent(since)}` : ""}`),
    enviar: (alunoId: string, conteudo: string) => request<ChatMensagem>("POST", `/api/v1/chat/${alunoId}/mensagens`, { conteudo, tipo: "texto" }),
    marcarLidas: (alunoId: string) => request<void>("PUT", `/api/v1/chat/${alunoId}/mensagens/lidas`),
  },

  nutricao: {
    planos: {
      list: (alunoId?: string) => requestList<PlanoNutricional>("GET", `/api/v1/nutricao/planos${alunoId ? `?aluno_id=${alunoId}` : ""}`),
      get: (id: string) => request<PlanoNutricional>("GET", `/api/v1/nutricao/planos/${id}`),
      create: (data: Partial<PlanoNutricional>) => request<PlanoNutricional>("POST", "/api/v1/nutricao/planos", data),
      update: (id: string, data: Partial<PlanoNutricional>) => request<PlanoNutricional>("PUT", `/api/v1/nutricao/planos/${id}`, data),
      delete: (id: string) => request<void>("DELETE", `/api/v1/nutricao/planos/${id}`),
    },
  },

  avaliacoes: {
    list: (alunoId?: string, tipo?: string) => {
      const p = new URLSearchParams();
      if (alunoId) p.set("aluno_id", alunoId);
      if (tipo) p.set("tipo", tipo);
      return requestList<Avaliacao>("GET", `/api/v1/avaliacoes${p.toString() ? `?${p}` : ""}`);
    },
    create: (data: Partial<Avaliacao>) => request<Avaliacao>("POST", "/api/v1/avaliacoes", data),
    delete: (id: string) => request<void>("DELETE", `/api/v1/avaliacoes/${id}`),
  },

  briefings: {
    list: (alunoId?: string) => requestList<Briefing>("GET", `/api/v1/briefings${alunoId ? `?aluno_id=${alunoId}` : ""}`),
    create: (alunoId: string) => request<Briefing>("POST", "/api/v1/briefings", { aluno_id: alunoId }),
    get: (id: string) => request<Briefing>("GET", `/api/v1/briefings/${id}`),
  },

  llm: {
    gerarTreino: (data: { aluno_id: string; objetivo: string; nivel: string; dias_semana: number; observacoes?: string }) => request<{ job_id: string }>("POST", "/api/v1/llm/gerar-treino", data),
    gerarDieta: (data: { aluno_id: string; objetivo: string; restricoes?: string; calorias_alvo?: number }) => request<{ job_id: string }>("POST", "/api/v1/llm/gerar-dieta", data),
    jobs: () => requestList<LLMJob>("GET", "/api/v1/llm/jobs"),
    job: (id: string) => request<LLMJob>("GET", `/api/v1/llm/jobs/${id}`),
  },

  cobrancas: {
    list: (status?: string) => requestList<Cobranca>("GET", `/api/v1/cobrancas${status ? `?status=${status}` : ""}`),
    create: (data: { aluno_id: string; valor_centavos: number; vencimento: string; descricao?: string }) => request<Cobranca>("POST", "/api/v1/cobrancas", data),
    update: (id: string, data: Partial<Cobranca>) => request<Cobranca>("PUT", `/api/v1/cobrancas/${id}`, data),
  },

  financeiro: { resumo: () => request<ResumoFinanceiro>("GET", "/api/v1/financeiro/resumo") },
  analytics: { dashboard: () => request<AnalyticsDashboard>("GET", "/api/v1/analytics/dashboard") },

  dominios: {
    list: () => requestList<DominioTenant>("GET", "/api/v1/tenant/dominios"),
    create: (dominio: string) => request<DominioTenant>("POST", "/api/v1/tenant/dominios", { dominio }),
    remove: (id: string) => request<void>("DELETE", `/api/v1/tenant/dominios/${id}`),
    verificar: (id: string) => request<{ verificado: boolean }>("POST", `/api/v1/tenant/dominios/${id}/verificar`),
  },

  tenant: {
    config: () => request<{ config: Record<string, string | null> }>("GET", "/api/v1/tenant/config"),
    updateConfig: (data: Record<string, string | null>) => request<void>("PUT", "/api/v1/tenant/config", data),
    slugAvailable: (slug: string) =>
      request<{ available: boolean; slug?: string; error?: string }>("GET", `/api/v1/tenant/slug-available?slug=${encodeURIComponent(slug)}`),
    updateSlug: (slug: string) =>
      request<{ slug: string; painel_url: string; aviso?: string }>("PUT", "/api/v1/tenant/slug", { slug }),
  },

  feed: {
    list: (page = 1, limit = 20) => request<PaginatedResponse<Post>>("GET", `/api/v1/feed?page=${page}&limit=${limit}`),
    create: (data: { conteudo?: string; tipo?: string; midia_url?: string }) => request<Post>("POST", "/api/v1/feed", data),
    delete: (id: string) => request<void>("DELETE", `/api/v1/feed/${id}`),
    curtir: (postId: string, tipo = "like") => request<{ message: string; tipo: string }>("POST", `/api/v1/feed/${postId}/curtir`, { tipo }),
    descurtir: (postId: string) => request<void>("DELETE", `/api/v1/feed/${postId}/curtir`),
    comentar: (postId: string, conteudo: string) => request<Comentario>("POST", `/api/v1/feed/${postId}/comentar`, { conteudo }),
    comentarios: (postId: string, page = 1) => request<{ data: Comentario[] }>("GET", `/api/v1/feed/${postId}/comentarios?page=${page}`),
  },

  desafios: {
    list: () => request<{ data: Desafio[] }>("GET", "/api/v1/desafios"),
    get: (id: string) => request<DesafioDetalhe>("GET", `/api/v1/desafios/${id}`),
    create: (data: { nome: string; descricao?: string; tipo?: string; meta_tipo: string; meta_valor: number; data_inicio: string; data_fim: string }) => request<Desafio>("POST", "/api/v1/desafios", data),
    participar: (id: string) => request<{ message: string }>("POST", `/api/v1/desafios/${id}/participar`),
    progresso: (id: string, incremento = 1) => request<{ progresso: number; concluido: boolean; meta_valor: number }>("PUT", `/api/v1/desafios/${id}/progresso`, { incremento }),
  },

  badges: {
    list: () => request<{ data: BadgeItem[] }>("GET", "/api/v1/badges"),
    meus: () => request<{ data: BadgeItem[] }>("GET", "/api/v1/badges/meus"),
    perfil: (userId: string) => request<PerfilPublico>("GET", `/api/v1/badges/perfil/${userId}`),
  },
};
