"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Palette, Save, Loader2, AlertTriangle, Upload, Trash2 } from "lucide-react";
import { api } from "@/lib/api";

interface IdentidadeConfig {
  nome: string;
  tagline: string;
  logo_url: string;
  cor_primaria: string;
  cor_secundaria: string;
  fonte: string;
}

const DEFAULTS: IdentidadeConfig = {
  nome: "",
  tagline: "",
  logo_url: "",
  cor_primaria: "#6366f1",
  cor_secundaria: "#22c55e",
  fonte: "Inter",
};

const FONTS = [
  { name: "Inter", stack: "'Inter', system-ui, sans-serif", label: "Moderno e clean" },
  { name: "Poppins", stack: "'Poppins', sans-serif", label: "Amigavel e redondo" },
  { name: "DM Sans", stack: "'DM Sans', sans-serif", label: "Sobrio e legivel" },
  { name: "Space Grotesk", stack: "'Space Grotesk', sans-serif", label: "Tech e marcante" },
  { name: "Roboto", stack: "'Roboto', sans-serif", label: "Classico Google" },
  { name: "Montserrat", stack: "'Montserrat', sans-serif", label: "Elegante e forte" },
];

function fontStack(name: string): string {
  return FONTS.find((f) => f.name === name)?.stack ?? FONTS[0].stack;
}

export default function IdentidadePage() {
  const [config, setConfig] = useState<IdentidadeConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.tenant.config();
      const c = res.config ?? {};
      setConfig({
        nome: (c.nome as string) ?? "",
        tagline: (c.tagline as string) ?? "",
        logo_url: (c.logo_url as string) ?? "",
        cor_primaria: (c.cor_primaria as string) ?? "#6366f1",
        cor_secundaria: (c.cor_secundaria as string) ?? "#22c55e",
        fonte: (c.fonte as string) ?? "Inter",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar configuracoes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Arquivo precisa ser uma imagem (PNG, JPG, SVG ou WebP).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Imagem muito grande. Maximo 2MB.");
      return;
    }

    setUploading(true);
    try {
      // Upload real para R2 via /api/v1/tenant/branding/upload
      const result = await api.tenant.uploadBranding("logo", file);
      setConfig((c) => ({ ...c, logo_url: result.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel enviar a logo.");
    } finally {
      setUploading(false);
    }
  }

  function triggerUpload() {
    fileInputRef.current?.click();
  }

  function removeLogo() {
    setConfig((c) => ({ ...c, logo_url: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await api.tenant.updateConfig({
        nome: config.nome || null,
        tagline: config.tagline || null,
        logo_url: config.logo_url || null,
        cor_primaria: config.cor_primaria || null,
        cor_secundaria: config.cor_secundaria || null,
        fonte: config.fonte || null,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Identidade Visual</h1>
        <p className="text-muted-foreground">Personalize a aparencia da sua plataforma</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm">
          Configuracoes salvas com sucesso!
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            White Label
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Nome da Plataforma</Label>
            <Input
              placeholder="Ex: Minha Academia Fitness"
              value={config.nome}
              onChange={(e) => setConfig((c) => ({ ...c, nome: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Tagline</Label>
            <Input
              placeholder="Ex: Transforme sua vida com treinos personalizados"
              value={config.tagline}
              onChange={(e) => setConfig((c) => ({ ...c, tagline: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Logo da plataforma</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
              className="hidden"
              onChange={handleFilePick}
            />
            {config.logo_url ? (
              <div className="p-4 border border-border rounded-lg bg-muted/30 flex items-center gap-4">
                <img
                  src={config.logo_url}
                  alt="Logo preview"
                  className="h-16 w-16 object-contain rounded-md bg-background"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Logo carregada</p>
                  <p className="text-xs text-muted-foreground truncate">Preview atualizado</p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={triggerUpload} disabled={uploading}>
                    <Upload className="w-3 h-3 mr-1" /> Trocar
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={removeLogo} className="text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={triggerUpload}
                disabled={uploading}
                className="w-full p-6 border-2 border-dashed border-border rounded-lg hover:border-primary/60 hover:bg-muted/30 transition-all flex flex-col items-center justify-center gap-2 disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                ) : (
                  <Upload className="w-6 h-6 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">
                  {uploading ? "Processando..." : "Clique para enviar a logo"}
                </span>
                <span className="text-xs text-muted-foreground">PNG, JPG, SVG ou WebP — ate 2MB</span>
              </button>
            )}
            <div className="pt-2">
              <Label className="text-xs text-muted-foreground">Ou cole uma URL publica</Label>
              <Input
                placeholder="https://..."
                value={config.logo_url.startsWith("data:") ? "" : config.logo_url}
                onChange={(e) => setConfig((c) => ({ ...c, logo_url: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Fonte</Label>
            <div className="grid grid-cols-2 gap-2">
              {FONTS.map((f) => {
                const active = config.fonte === f.name;
                return (
                  <button
                    key={f.name}
                    type="button"
                    onClick={() => setConfig((c) => ({ ...c, fonte: f.name }))}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      active ? "border-primary bg-primary/5" : "border-border hover:border-border/80"
                    }`}
                    style={{ fontFamily: f.stack }}
                  >
                    <div className="text-base font-medium">{f.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Aa Bb Cc 123 — {f.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cor Primaria</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={config.cor_primaria}
                  onChange={(e) => setConfig((c) => ({ ...c, cor_primaria: e.target.value }))}
                  className="w-10 h-10 rounded border border-border cursor-pointer bg-transparent"
                />
                <Input
                  value={config.cor_primaria}
                  onChange={(e) => setConfig((c) => ({ ...c, cor_primaria: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cor Secundaria</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={config.cor_secundaria}
                  onChange={(e) => setConfig((c) => ({ ...c, cor_secundaria: e.target.value }))}
                  className="w-10 h-10 rounded border border-border cursor-pointer bg-transparent"
                />
                <Input
                  value={config.cor_secundaria}
                  onChange={(e) => setConfig((c) => ({ ...c, cor_secundaria: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Preview</Label>
            <div
              className="p-6 rounded-lg border border-border"
              style={{
                background: `linear-gradient(135deg, ${config.cor_primaria}20, ${config.cor_secundaria}20)`,
                fontFamily: fontStack(config.fonte),
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                {config.logo_url && (
                  <img src={config.logo_url} alt="" className="w-10 h-10 object-contain rounded-md bg-background/50" />
                )}
                <span className="font-bold text-lg" style={{ color: config.cor_primaria }}>
                  {config.nome || "Sua Plataforma"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{config.tagline || "Sua tagline aqui"}</p>
              <div className="flex gap-2 mt-4">
                <button
                  className="px-4 py-2 rounded-md text-white text-sm font-medium"
                  style={{ backgroundColor: config.cor_primaria, fontFamily: fontStack(config.fonte) }}
                >
                  Botao Primario
                </button>
                <button
                  className="px-4 py-2 rounded-md text-white text-sm font-medium"
                  style={{ backgroundColor: config.cor_secundaria, fontFamily: fontStack(config.fonte) }}
                >
                  Botao Secundario
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-3">
                Fonte ativa: <strong className="text-foreground">{config.fonte}</strong>
              </p>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar Configuracoes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
