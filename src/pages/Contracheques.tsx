import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Receipt, Download, Lock, Plus, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { criarDocumento, listarDocumentos, listarProfiles, removerDocumento } from "@/data/store";
import { formatDate } from "@/lib/cs-data";
import { PageHeader } from "@/components/PageHeader";
import { ContrachequesLote } from "@/components/ContrachequesLote";
import { EstadoVazio } from "@/components/EstadoVazio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Contracheques() {
  const { userId, temModulo } = useAuth();
  const qc = useQueryClient();
  const podeGerir = temModulo("colaboradores");

  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState({
    user_id: "", nome: "", categoria: "contracheque" as "contracheque" | "documento_pessoal",
    competencia: "", arquivo_nome: "",
  });

  const { data: documentos } = useQuery({ queryKey: ["documentos"], queryFn: listarDocumentos });
  const { data: profiles } = useQuery({ queryKey: ["profiles"], queryFn: listarProfiles });
  const invalidar = () => qc.invalidateQueries({ queryKey: ["documentos"] });

  const enviar = useMutation({
    mutationFn: () =>
      criarDocumento({
        user_id: form.user_id, nome: form.nome.trim(), descricao: null,
        categoria: form.categoria, competencia: form.competencia || null, arquivo_url: null,
        arquivo_nome: form.arquivo_nome.trim() || null, uploaded_by: userId,
      }),
    onSuccess: () => {
      setAberto(false);
      setForm({ user_id: "", nome: "", categoria: "contracheque", competencia: "", arquivo_nome: "" });
      invalidar();
      toast.success("Documento vinculado ao colaborador");
    },
  });

  const apagar = useMutation({
    mutationFn: (id: string) => removerDocumento(id),
    onSuccess: () => { invalidar(); toast.success("Documento removido"); },
  });

  const pessoais = (documentos ?? []).filter((d) => d.user_id !== null);
  const meus = pessoais.filter((d) => d.user_id === userId);
  const nomeDe = (id: string | null) => profiles?.find((p) => p.user_id === id)?.nome ?? "—";

  const Lista = ({ itens, mostrarDono }: { itens: typeof pessoais; mostrarDono?: boolean }) => (
    <div className="space-y-2">
      {itens.map((d) => (
        <Card key={d.id}>
          <CardContent className="flex items-center gap-3 p-4 pt-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{d.nome}</p>
              <p className="text-xs text-muted-foreground">
                {mostrarDono && <span className="font-medium">{nomeDe(d.user_id)} · </span>}
                {d.competencia
                  ? new Date(d.competencia + "T12:00:00").toLocaleDateString("pt-BR", {
                      month: "long", year: "numeric",
                    })
                  : (d.arquivo_nome ?? "—")}{" "}
                · enviado em {formatDate(d.created_at.slice(0, 10))}
              </p>
            </div>
            <Badge variant="secondary" className="hidden shrink-0 text-[9px] sm:inline-flex">
              {d.categoria === "contracheque" ? "Contracheque" : "Documento pessoal"}
            </Badge>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"
              onClick={() => toast.info("Download disponível quando o Storage for conectado")}>
              <Download className="h-4 w-4" />
            </Button>
            {podeGerir && (
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => apagar.mutate(d.id)}>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
      {itens.length === 0 && (
        <EstadoVazio
          icone={Receipt}
          titulo="Nenhum documento"
          descricao={
            mostrarDono
              ? "Envie contracheques e documentos vinculados a cada colaborador."
              : "Seus contracheques aparecem aqui assim que o RH enviar."
          }
        />
      )}
    </div>
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        icone={Receipt}
        titulo="Contracheques e documentos"
        subtitulo="Área restrita — cada pessoa vê apenas os próprios documentos"
        acao={
          podeGerir && (
            <div className="flex gap-2">
              <ContrachequesLote />
            <Dialog open={aberto} onOpenChange={setAberto}>
              <DialogTrigger asChild>
                <Button><Plus /> Enviar documento</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enviar documento</DialogTitle>
                  <DialogDescription>Fica visível apenas para a pessoa escolhida e para o RH.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Colaborador</Label>
                    <Select value={form.user_id} onValueChange={(v) => setForm({ ...form, user_id: v })}>
                      <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {profiles?.map((p) => (
                          <SelectItem key={p.user_id} value={p.user_id}>{p.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Categoria</Label>
                    <Select value={form.categoria}
                      onValueChange={(v) => setForm({ ...form, categoria: v as typeof form.categoria })}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contracheque">Contracheque</SelectItem>
                        <SelectItem value="documento_pessoal">Documento pessoal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="cc-nome">Nome</Label>
                    <Input id="cc-nome" className="mt-1.5" placeholder="Contracheque — Setembro/2026"
                      value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="cc-comp">Competência</Label>
                    <Input id="cc-comp" type="month" className="mt-1.5" value={form.competencia}
                      onChange={(e) => setForm({ ...form, competencia: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="cc-arq">Nome do arquivo</Label>
                    <Input id="cc-arq" className="mt-1.5" placeholder="holerite-09-2026.pdf"
                      value={form.arquivo_nome}
                      onChange={(e) => setForm({ ...form, arquivo_nome: e.target.value })} />
                  </div>
                  <Button className="w-full" disabled={!form.user_id || !form.nome.trim()}
                    onClick={() => enviar.mutate()}>
                    Enviar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          )
        }
      />

      <div className="mb-4 flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-3 text-xs">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
        <span className="text-muted-foreground">
          Estes arquivos são pessoais. No Supabase eles precisam ficar em bucket privado —
          veja o Bloco A de <code>docs/migrations/2026-09-01-correcoes.sql</code>.
        </span>
      </div>

      {podeGerir ? (
        <Tabs defaultValue="meus">
          <TabsList>
            <TabsTrigger value="meus">Meus documentos</TabsTrigger>
            <TabsTrigger value="todos">Todos ({pessoais.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="meus"><Lista itens={meus} /></TabsContent>
          <TabsContent value="todos"><Lista itens={pessoais} mostrarDono /></TabsContent>
        </Tabs>
      ) : (
        <Lista itens={meus} />
      )}
    </div>
  );
}
