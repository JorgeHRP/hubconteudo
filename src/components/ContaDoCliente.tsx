import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Users, FolderKanban, Trophy, Plus, Trash2, Star, Mail, Phone, Link2, MapPin,
  Pencil, ExternalLink, Building2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  criarProjeto, encerrarProjeto, listarConquistasDaEmpresa, listarContatos, listarProfiles,
  listarProjetosDaEmpresa, removerConquista, removerContato, salvarContato, salvarConquista,
} from "@/data/store";
import {
  statusProjetoLabels, statusProjetoVariant, tipoProjetoLabels, tipoProjetoTom,
} from "@/lib/labels-clientes";
import { flagBadgeVariant, flagLabels, formatCurrency, formatDate } from "@/lib/cs-data";
import type { EmpresaDossie, StatusProjeto, TipoProjeto } from "@/lib/types";
import { EmpresaDialog } from "@/components/EmpresaDialog";
import { EquipeAlocada } from "@/components/EquipeAlocada";
import { VendaAdicional } from "@/components/VendaAdicional";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const contatoVazio = {
  nome: "", cargo: "", email: "", telefone: "", linkedin: "", area: "", principal: false,
};
const projetoVazio = {
  tipo: "cs" as TipoProjeto, nome: "", status: "em_andamento" as StatusProjeto,
  responsavel_id: "", mrr: "", inicio: "", renovacao: "", observacoes: "",
};
const conquistaVazia = { titulo: "", indicador: "", descricao: "", data: "", destaque: true };

const destinoDoProjeto: Record<TipoProjeto, (id: string) => string> = {
  cs: (id) => `/cs/${id}`,
  seo: (id) => `/seo-geo/${id}`,
  trafego: () => "/trafego",
  rd: () => "/projetos-rd",
  inbound: (id) => `/inbound/${id}`,
  sites: () => "/sites",
  social: () => "/redes-sociais",
};

/** Linhas de espera das listas, enquanto os dados chegam. */
function LinhasEspera({ linhas = 2 }: { linhas?: number }) {
  return (
    <div className="divide-y border-t" aria-hidden>
      {Array.from({ length: linhas }, (_, i) => (
        <div key={i} className="space-y-2 px-5 py-3">
          <Skeleton className="h-3.5 w-2/5" />
          <Skeleton className="h-3 w-3/5" />
        </div>
      ))}
    </div>
  );
}

/** Aviso de lista vazia dentro do cartão, sem abrir outro cartão por dentro. */
function VazioNoCartao({ icone: Icone, titulo, descricao }: {
  icone: LucideIcon; titulo: string; descricao: string;
}) {
  return (
    <div className="flex items-start gap-3 border-t px-5 py-4">
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
      >
        <Icone className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium">{titulo}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{descricao}</p>
      </div>
    </div>
  );
}

const cabecalhoCartao =
  "flex-row flex-wrap items-center justify-between gap-x-4 gap-y-2 space-y-0 pb-4";
const caixaMarcar = "h-4 w-4 shrink-0 accent-[hsl(var(--primary))]";

/** Aba "Conta": identificação, projetos por frente, contatos e conquistas. */
export function ContaDoCliente({ empresa }: { empresa: EmpresaDossie }) {
  const id = empresa.id;
  const { userId } = useAuth();
  const qc = useQueryClient();

  const [contatoAberto, setContatoAberto] = useState(false);
  const [contato, setContato] = useState(contatoVazio);
  const [projetoAberto, setProjetoAberto] = useState(false);
  const [projeto, setProjeto] = useState(projetoVazio);
  const [conquistaAberta, setConquistaAberta] = useState(false);
  const [conquista, setConquista] = useState(conquistaVazia);

  const { data: contatos } = useQuery({ queryKey: ["contatos", id], queryFn: () => listarContatos(id) });
  const { data: projetos } = useQuery({ queryKey: ["projetos", id], queryFn: () => listarProjetosDaEmpresa(id) });
  const { data: conquistas } = useQuery({ queryKey: ["conquistas", id], queryFn: () => listarConquistasDaEmpresa(id) });
  const { data: profiles } = useQuery({ queryKey: ["profiles"], queryFn: listarProfiles });

  const recarregar = (chave: string) => {
    qc.invalidateQueries({ queryKey: [chave, id] });
    qc.invalidateQueries({ queryKey: [chave] });
    qc.invalidateQueries({ queryKey: ["empresas"] });
  };

  const addContato = useMutation({
    mutationFn: () => salvarContato({
      empresa_id: id, nome: contato.nome.trim(), cargo: contato.cargo.trim() || null,
      email: contato.email.trim() || null, telefone: contato.telefone.trim() || null,
      linkedin: contato.linkedin.trim() || null, area: contato.area.trim() || null,
      principal: contato.principal,
    }),
    onSuccess: () => {
      setContatoAberto(false); setContato(contatoVazio);
      recarregar("contatos"); toast.success("Contato salvo");
    },
  });

  const addProjeto = useMutation({
    mutationFn: () => criarProjeto({
      empresa_id: id, tipo: projeto.tipo,
      nome: projeto.nome.trim() || tipoProjetoLabels[projeto.tipo],
      status: projeto.status, responsavel_id: projeto.responsavel_id || null,
      mrr: Number(projeto.mrr) || 0, inicio: projeto.inicio || null,
      renovacao: projeto.renovacao || null,
      observacoes: projeto.observacoes.trim() || null, criado_por: userId,
    }),
    onSuccess: () => {
      setProjetoAberto(false); setProjeto(projetoVazio);
      recarregar("projetos");
      qc.invalidateQueries({ queryKey: ["projetosSeo"] });
      toast.success("Projeto aberto. O painel da frente já está disponível.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addConquista = useMutation({
    mutationFn: () => salvarConquista({
      empresa_id: id, projeto_id: null, titulo: conquista.titulo.trim(),
      indicador: conquista.indicador.trim() || null,
      descricao: conquista.descricao.trim() || null,
      data: conquista.data || new Date().toISOString().slice(0, 10),
      destaque: conquista.destaque, criado_por: userId,
    }),
    onSuccess: () => {
      setConquistaAberta(false); setConquista(conquistaVazia);
      recarregar("conquistas"); toast.success("Conquista registrada");
    },
  });

  const nomeDe = (uid: string | null) => profiles?.find((p) => p.user_id === uid)?.nome ?? "—";
  const endereco = [
    empresa.logradouro && `${empresa.logradouro}${empresa.numero ? `, ${empresa.numero}` : ""}`,
    empresa.bairro, [empresa.cidade, empresa.estado].filter(Boolean).join(" - "), empresa.cep,
  ].filter(Boolean).join(" · ");

  const frentesLivres = (Object.keys(tipoProjetoLabels) as TipoProjeto[])
    .filter((t) => !projetos?.some((p) => p.tipo === t));

  return (
    <div className="space-y-6">
      {/* identificação */}
      <Card>
        <CardHeader className={cn(cabecalhoCartao, "border-b")}>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-accent" aria-hidden /> Identificação
          </CardTitle>
          <EmpresaDialog empresa={empresa}
            gatilho={<Button variant="outline" size="sm"><Pencil /> Editar</Button>} />
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Razão social", empresa.razao_social],
              ["CNPJ", empresa.cnpj || "—"],
              ["Segmento", empresa.segmento ?? "—"],
              ["Responsável", nomeDe(empresa.responsavel_id)],
              ["Site", empresa.site ?? "—"],
              ["Entrada", empresa.entrada ? formatDate(empresa.entrada) : "—"],
              ["Contrato", empresa.contrato_tipo ?? "—"],
              ["Vigência", empresa.contrato_vigencia ?? "—"],
              ["Serviços", empresa.servicos_contratados ?? "—"],
            ].map(([r, v]) => (
              <div key={r} className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{r}</p>
                <p className="mt-1 break-words">{v}</p>
              </div>
            ))}
          </div>
          {endereco && (
            <p className="mt-4 flex items-start gap-2 border-t pt-4 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> <span className="min-w-0 break-words">{endereco}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* projetos */}
      <Card className="overflow-hidden">
        <CardHeader className={cabecalhoCartao}>
          <CardTitle className="flex items-center gap-2 text-base">
            <FolderKanban className="h-4 w-4 text-accent" aria-hidden /> Projetos por frente
          </CardTitle>
          <Dialog open={projetoAberto} onOpenChange={setProjetoAberto}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={frentesLivres.length === 0}><Plus /> Novo projeto</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo projeto para {empresa.nome_fantasia}</DialogTitle>
                <DialogDescription>
                  Abrir um projeto já libera o painel daquela frente para este cliente.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Frente</Label>
                  <Select value={projeto.tipo}
                    onValueChange={(v) => setProjeto({ ...projeto, tipo: v as TipoProjeto })}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {frentesLivres.map((t) => (
                        <SelectItem key={t} value={t}>{tipoProjetoLabels[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="pj-mrr">MRR (R$)</Label>
                    <Input id="pj-mrr" type="number" className="mt-1.5" value={projeto.mrr}
                      onChange={(e) => setProjeto({ ...projeto, mrr: e.target.value })} />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={projeto.status}
                      onValueChange={(v) => setProjeto({ ...projeto, status: v as StatusProjeto })}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(statusProjetoLabels) as StatusProjeto[]).map((s) => (
                          <SelectItem key={s} value={s}>{statusProjetoLabels[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="pj-ini">Início</Label>
                    <Input id="pj-ini" type="date" className="mt-1.5" value={projeto.inicio}
                      onChange={(e) => setProjeto({ ...projeto, inicio: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="pj-ren">Renovação</Label>
                    <Input id="pj-ren" type="date" className="mt-1.5" value={projeto.renovacao}
                      onChange={(e) => setProjeto({ ...projeto, renovacao: e.target.value })} />
                  </div>
                </div>
                <Button className="w-full" onClick={() => addProjeto.mutate()}>Abrir projeto</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        {!projetos ? (
          <LinhasEspera />
        ) : projetos.length === 0 ? (
          <VazioNoCartao icone={FolderKanban} titulo="Nenhum projeto aberto"
            descricao="Abra CS, tráfego, SEO ou implantação RD. Cada um libera o painel correspondente." />
        ) : (
          <ul className="divide-y border-t">
            {projetos.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
                <div className="min-w-0 flex-1 basis-56">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium", tipoProjetoTom[p.tipo])}>
                      {tipoProjetoLabels[p.tipo]}
                    </span>
                    <Badge variant={statusProjetoVariant[p.status]}>
                      {statusProjetoLabels[p.status]}
                    </Badge>
                    <Badge variant={flagBadgeVariant[p.flag]}>
                      {flagLabels[p.flag]}
                    </Badge>
                  </div>
                  <p className="mt-1.5 break-words text-xs text-muted-foreground">
                    Renova {formatDate(p.renovacao)} · {nomeDe(p.responsavel_id)}
                  </p>
                </div>
                <span className="font-display text-sm font-semibold tabular-nums">{formatCurrency(p.mrr)}</span>
                <div className="flex shrink-0 items-center gap-1">
                  {p.tipo !== "cs" && (
                    <Button size="sm" variant="outline" asChild>
                      <Link to={destinoDoProjeto[p.tipo](id)}>Abrir painel <ExternalLink /></Link>
                    </Button>
                  )}
                  <Button
                    variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive"
                    title="Encerrar projeto" aria-label={`Encerrar projeto ${tipoProjetoLabels[p.tipo]}`}
                    onClick={async () => {
                      await encerrarProjeto(p.id);
                      recarregar("projetos");
                      toast.success("Projeto encerrado");
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* venda adicional e equipe alocada */}
      <VendaAdicional empresaId={id} />

      <EquipeAlocada empresaId={id} />

      {/* contatos */}
      <Card className="overflow-hidden">
        <CardHeader className={cabecalhoCartao}>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-accent" aria-hidden /> Contatos
          </CardTitle>
          <Dialog open={contatoAberto} onOpenChange={setContatoAberto}>
            <DialogTrigger asChild><Button size="sm" variant="outline"><Plus /> Contato</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo contato</DialogTitle></DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="c-nome">Nome *</Label>
                  <Input id="c-nome" className="mt-1.5" value={contato.nome}
                    onChange={(e) => setContato({ ...contato, nome: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="c-cargo">Cargo</Label>
                  <Input id="c-cargo" className="mt-1.5" value={contato.cargo}
                    onChange={(e) => setContato({ ...contato, cargo: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="c-area">Área</Label>
                  <Input id="c-area" className="mt-1.5" value={contato.area}
                    onChange={(e) => setContato({ ...contato, area: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="c-mail">E-mail</Label>
                  <Input id="c-mail" className="mt-1.5" value={contato.email}
                    onChange={(e) => setContato({ ...contato, email: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="c-tel">Telefone</Label>
                  <Input id="c-tel" className="mt-1.5" value={contato.telefone}
                    onChange={(e) => setContato({ ...contato, telefone: e.target.value })} />
                </div>
                <label className="flex min-h-9 cursor-pointer items-center gap-2 text-sm text-muted-foreground sm:col-span-2">
                  <input type="checkbox" checked={contato.principal}
                    onChange={(e) => setContato({ ...contato, principal: e.target.checked })}
                    className={caixaMarcar} />
                  Contato principal da conta
                </label>
                <Button className="sm:col-span-2" disabled={!contato.nome.trim()}
                  onClick={() => addContato.mutate()}>Salvar contato</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        {!contatos ? (
          <LinhasEspera />
        ) : contatos.length === 0 ? (
          <VazioNoCartao icone={Users} titulo="Nenhum contato"
            descricao="Cadastre quem decide, quem aprova e quem opera do lado do cliente." />
        ) : (
          <ul className="divide-y border-t">
            {contatos.map((c) => (
              <li key={c.id} className="flex items-start gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="break-words text-sm font-medium">{c.nome}</p>
                    {c.principal && (
                      <Badge variant="info" className="shrink-0 gap-1">
                        <Star className="h-3 w-3" aria-hidden /> Principal
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 break-words text-xs text-muted-foreground">
                    {c.cargo ?? "—"}{c.area ? ` · ${c.area}` : ""}
                  </p>
                  {(c.email || c.telefone || c.linkedin) && (
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {c.email && <span className="flex min-w-0 items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden /> <span className="truncate">{c.email}</span></span>}
                      {c.telefone && <span className="flex items-center gap-1.5 tabular-nums">
                        <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden /> {c.telefone}</span>}
                      {c.linkedin && <span className="flex min-w-0 items-center gap-1.5">
                        <Link2 className="h-3.5 w-3.5 shrink-0" aria-hidden /> <span className="truncate">{c.linkedin}</span></span>}
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="icon"
                  className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                  title="Remover contato" aria-label={`Remover contato ${c.nome}`}
                  onClick={async () => { await removerContato(c.id); recarregar("contatos"); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* conquistas */}
      <Card className="overflow-hidden">
        <CardHeader className={cabecalhoCartao}>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-accent" aria-hidden /> Conquistas
          </CardTitle>
          <Dialog open={conquistaAberta} onOpenChange={setConquistaAberta}>
            <DialogTrigger asChild><Button size="sm" variant="outline"><Trophy /> Registrar</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar conquista</DialogTitle>
                <DialogDescription>
                  É o que se leva para a reunião de renovação. Um número vale mais que um parágrafo.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="q-ind">Indicador</Label>
                  <Input id="q-ind" className="mt-1.5" value={conquista.indicador}
                    placeholder="+38% de leads · CPL de R$ 42 para R$ 18"
                    onChange={(e) => setConquista({ ...conquista, indicador: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="q-tit">Título *</Label>
                  <Input id="q-tit" className="mt-1.5" value={conquista.titulo}
                    onChange={(e) => setConquista({ ...conquista, titulo: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="q-data">Data</Label>
                  <Input id="q-data" type="date" className="mt-1.5" value={conquista.data}
                    onChange={(e) => setConquista({ ...conquista, data: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="q-desc">Contexto</Label>
                  <Textarea id="q-desc" className="mt-1.5" value={conquista.descricao}
                    onChange={(e) => setConquista({ ...conquista, descricao: e.target.value })} />
                </div>
                <label className="flex min-h-9 cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" checked={conquista.destaque}
                    onChange={(e) => setConquista({ ...conquista, destaque: e.target.checked })}
                    className={caixaMarcar} />
                  Mostrar na visão geral
                </label>
                <Button className="w-full" disabled={!conquista.titulo.trim()}
                  onClick={() => addConquista.mutate()}>Registrar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        {!conquistas ? (
          <LinhasEspera />
        ) : conquistas.length === 0 ? (
          <VazioNoCartao icone={Trophy} titulo="Nenhuma conquista registrada"
            descricao="Registre os resultados que provam o trabalho. As de destaque aparecem na visão geral." />
        ) : (
          <ul className="divide-y border-t">
            {conquistas.map((c) => (
              <li key={c.id} className="flex items-start gap-3 px-5 py-3">
                <div className="flex min-w-0 flex-1 flex-col gap-x-4 gap-y-2 sm:flex-row sm:items-start">
                  {c.indicador && (
                    <p className="max-w-full self-start break-words rounded-md bg-accent/10 px-3 py-1.5 font-display text-base font-semibold leading-snug text-accent sm:max-w-[16rem] sm:shrink-0">
                      {c.indicador}
                    </p>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="break-words text-sm font-medium">{c.titulo}</p>
                      {c.destaque && (
                        <Badge variant="warning" className="gap-1">
                          <Star className="h-3 w-3" aria-hidden /> Destaque
                        </Badge>
                      )}
                    </div>
                    {c.descricao && (
                      <p className="mt-1 break-words text-sm leading-relaxed text-muted-foreground">{c.descricao}</p>
                    )}
                    <p className="mt-1 text-xs tabular-nums text-muted-foreground">{formatDate(c.data)}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon"
                  className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                  title="Remover conquista" aria-label={`Remover conquista ${c.titulo}`}
                  onClick={async () => { await removerConquista(c.id); recarregar("conquistas"); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
