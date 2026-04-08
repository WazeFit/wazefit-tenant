"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Palette, Save, Loader2, AlertTriangle, ImageIcon } from "lucide-react";
import { api } from "@/lib/api";

interface IdentidadeConfig {
  nome: string;
  tagline: string;
  logo_url: string;
  cor_primaria: string;
  cor_secundaria: string;
}

const DEFAULTS: IdentidadeConfig = {
  nome: "",
  tagline: "",
  logo_url: "",
  cor_primaria: "#6366f1",
  cor_secundaria: "#22c55e",
};

export default function IdentidadePage() {
  const [config, setConfig] = useState<IdentidadeConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar configuracoes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

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
            <Label>URL do Logo</Label>
            <Input
              placeholder="https://..."
              value={config.logo_url}
              onChange={(e) => setConfig((c) => ({ ...c, logo_url: e.target.value }))}
            />
            {config.logo_url ? (
              <div className="mt-2 p-4 border border-border rounded-lg bg-muted/30 flex items-center justify-center">
                <img
                  src={config.logo_url}
                  alt="Logo preview"
                  className="max-h-20 max-w-full object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            ) : (
              <div className="mt-2 p-4 border border-dashed border-border rounded-lg flex items-center justify-center text-muted-foreground gap-2">
                <ImageIcon className="w-5 h-5" />
                <span className="text-sm">Preview do logo aparecera aqui</span>
              </div>
            )}
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
              style={{ background: `linear-gradient(135deg, ${config.cor_primaria}20, ${config.cor_secundaria}20)` }}
            >
              <div className="flex items-center gap-3 mb-2">
                {config.logo_url && (
                  <img src={config.logo_url} alt="" className="w-8 h-8 object-contain" />
                )}
                <span className="font-bold text-lg" style={{ color: config.cor_primaria }}>
                  {config.nome || "Sua Plataforma"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{config.tagline || "Sua tagline aqui"}</p>
              <div className="flex gap-2 mt-4">
                <button
                  className="px-4 py-2 rounded-md text-white text-sm font-medium"
                  style={{ backgroundColor: config.cor_primaria }}
                >
                  Botao Primario
                </button>
                <button
                  className="px-4 py-2 rounded-md text-white text-sm font-medium"
                  style={{ backgroundColor: config.cor_secundaria }}
                >
                  Botao Secundario
                </button>
              </div>
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
