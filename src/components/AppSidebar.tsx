import { useState, type ComponentType } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home, Newspaper, CalendarDays, Users, ClipboardList, FolderOpen, Receipt,
  Palette, BookOpen, GraduationCap, Shield, Headphones, TrendingUp,
  Settings, ChevronDown, X, Plane, Wallet, Megaphone, Search, Briefcase,
  ListChecks, Magnet, Building2, Share2, Globe2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Marca } from "@/components/Marca";
import { IconeRdStation } from "@/components/IconeRdStation";
import type { AppModulo } from "@/lib/types";

interface ItemNav {
  titulo: string;
  rota: string;
  icone: ComponentType<{ className?: string }>;
  modulo?: AppModulo;
}

/** `grupo` é a chave (estado salvo no navegador); `rotulo` é o texto exibido, quando difere. */
export const grupos: { grupo: string; rotulo?: string; itens: ItemNav[] }[] = [
  {
    grupo: "Principal",
    itens: [
      { titulo: "Início", rota: "/", icone: Home },
      { titulo: "Mural", rota: "/feed", icone: Newspaper },
      { titulo: "Calendário", rota: "/calendario", icone: CalendarDays },
      { titulo: "Colaboradores", rota: "/colaboradores", icone: Users },
      { titulo: "Tarefas", rota: "/tarefas", icone: ListChecks, modulo: "tarefas" },
    ],
  },
  {
    grupo: "Gestão de Clientes",
    itens: [
      { titulo: "Visão geral", rota: "/clientes", icone: Briefcase, modulo: "clientes" },
      { titulo: "Cadastro de Empresas", rota: "/empresas", icone: Building2, modulo: "clientes" },
      { titulo: "Painel de CS", rota: "/cs", icone: Headphones, modulo: "cs" },
      { titulo: "Painel SEO e GEO", rota: "/seo-geo", icone: Search, modulo: "seo_geo" },
      { titulo: "Gestão de Tráfego", rota: "/trafego", icone: Megaphone, modulo: "trafego" },
      { titulo: "Inbound", rota: "/inbound", icone: Magnet, modulo: "inbound" },
      { titulo: "Redes Sociais", rota: "/redes-sociais", icone: Share2, modulo: "social" },
      { titulo: "Sites e Hotsites", rota: "/sites", icone: Globe2, modulo: "sites" },
      { titulo: "Projetos RD", rota: "/projetos-rd", icone: IconeRdStation, modulo: "projetos_rd" },
    ],
  },
  {
    grupo: "Repositórios",
    itens: [
      { titulo: "Repositórios", rota: "/repositorios", icone: FolderOpen },
      { titulo: "Contracheques", rota: "/contracheques", icone: Receipt },
      { titulo: "Solicitações", rota: "/solicitacoes", icone: ClipboardList },
      { titulo: "Relatório de Viagens", rota: "/viagens", icone: Plane },
      { titulo: "Ativos da Marca", rota: "/ativos", icone: Palette },
      { titulo: "Manual Interno", rota: "/manual", icone: BookOpen },
      { titulo: "Treinamentos", rota: "/treinamentos", icone: GraduationCap },
      { titulo: "Políticas", rota: "/politicas", icone: Shield },
    ],
  },
  {
    grupo: "Gestão",
    rotulo: "Restrito Diretoria",
    itens: [
      { titulo: "Resultados de Vendas", rota: "/vendas", icone: TrendingUp, modulo: "vendas" },
      { titulo: "Dashboard Financeiro", rota: "/financeiro", icone: Wallet, modulo: "financeiro" },
    ],
  },
];

/** A rota do menu está ativa neste endereço? (a inicial só no endereço exato) */
function rotaAtiva(rota: string, pathname: string) {
  return rota === "/" ? pathname === "/" : pathname === rota || pathname.startsWith(rota + "/");
}

/** Grupo e título da tela aberta, para o caminho da barra superior. */
export function telaAtual(pathname: string): { grupo?: string; titulo: string; rota: string } | null {
  if (rotaAtiva("/perfil", pathname)) return { titulo: "Meu perfil", rota: "/perfil" };
  if (rotaAtiva("/admin", pathname)) return { titulo: "Painel Admin", rota: "/admin" };
  for (const { grupo, rotulo, itens } of grupos) {
    const item = itens.find((i) => rotaAtiva(i.rota, pathname));
    if (item) return { grupo: rotulo ?? grupo, titulo: item.titulo, rota: item.rota };
  }
  return null;
}

// Preferência só de tela: quais grupos do menu a pessoa deixou fechados.
const CHAVE_GRUPOS = "central:menu-grupos-fechados";

function lerGruposFechados(): string[] {
  try {
    const valor = JSON.parse(localStorage.getItem(CHAVE_GRUPOS) ?? "[]");
    return Array.isArray(valor) ? valor : [];
  } catch {
    return [];
  }
}

const classeItem = (ativo: boolean) =>
  cn(
    "group relative flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/60",
    ativo
      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
      : "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
  );

const classeIcone = (ativo: boolean) =>
  cn(
    "h-[18px] w-[18px] shrink-0",
    ativo ? "text-sidebar-primary" : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground"
  );

/** Barra fina na lateral do item ativo. */
function MarcaAtivo() {
  return <span aria-hidden className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-sidebar-primary" />;
}

export function AppSidebar({
  recolhida,
  onAlternar,
  movel = false,
}: {
  recolhida: boolean;
  onAlternar: () => void;
  /** Menu deslizante do celular: mostra o botão de fechar no topo. */
  movel?: boolean;
}) {
  const { temModulo, isMaster } = useAuth();
  const { pathname } = useLocation();
  const [fechados, setFechados] = useState<string[]>(lerGruposFechados);

  function alternarGrupo(grupo: string) {
    setFechados((atual) => {
      const novo = atual.includes(grupo) ? atual.filter((g) => g !== grupo) : [...atual, grupo];
      try {
        localStorage.setItem(CHAVE_GRUPOS, JSON.stringify(novo));
      } catch {
        // Sem armazenamento local, a preferência vale só até recarregar.
      }
      return novo;
    });
  }

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        recolhida ? "w-[68px]" : "w-64"
      )}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border",
          recolhida ? "justify-center px-2" : "px-5"
        )}
      >
        {recolhida ? (
          <Marca tipo="emblema" altura={24} className="shrink-0" />
        ) : (
          <Marca altura={30} className="min-w-0 max-w-full flex-1 object-left" />
        )}
        {movel && (
          <button
            onClick={onAlternar}
            className="rounded-md p-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav
        aria-label="Menu principal"
        className={cn(
          "rolagem-sidebar flex-1 overflow-y-auto overscroll-contain py-4",
          recolhida ? "space-y-3 px-2.5" : "space-y-1 px-3"
        )}
      >
        {grupos.map(({ grupo, rotulo, itens }, indice) => {
          const visiveis = itens.filter((i) => !i.modulo || temModulo(i.modulo));
          if (visiveis.length === 0) return null;
          const aberto = recolhida || !fechados.includes(grupo);
          const temAtivo = visiveis.some((i) => rotaAtiva(i.rota, pathname));
          const idLista = `menu-grupo-${indice}`;
          return (
            <div key={grupo} className={cn(recolhida && indice > 0 && "border-t border-sidebar-border pt-3")}>
              {!recolhida && (
                <button
                  type="button"
                  onClick={() => alternarGrupo(grupo)}
                  aria-expanded={aberto}
                  aria-controls={idLista}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/60 transition-colors hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/60"
                >
                  <span className="flex-1 truncate">{rotulo ?? grupo}</span>
                  {!aberto && temAtivo && (
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-sidebar-primary" />
                  )}
                  <ChevronDown
                    className={cn("h-3.5 w-3.5 shrink-0 transition-transform duration-200", !aberto && "-rotate-90")}
                  />
                </button>
              )}
              <div
                id={idLista}
                className={cn(
                  "grid transition-[grid-template-rows] duration-200 ease-out",
                  aberto ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
              >
                <div
                  className={cn(
                    "min-h-0 space-y-0.5 overflow-hidden",
                    !aberto && "invisible",
                    !recolhida && aberto && "pb-2"
                  )}
                >
                  {visiveis.map(({ titulo, rota, icone: Icone }) => (
                    <NavLink
                      key={rota}
                      to={rota}
                      end={rota === "/"}
                      title={recolhida ? titulo : undefined}
                      className={({ isActive }) => cn(classeItem(isActive), recolhida && "justify-center px-0")}
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && <MarcaAtivo />}
                          <Icone className={classeIcone(isActive)} />
                          {!recolhida && <span className="truncate">{titulo}</span>}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {isMaster && (
        <div className={cn("border-t border-sidebar-border py-3", recolhida ? "px-2.5" : "px-3")}>
          <NavLink
            to="/admin"
            title={recolhida ? "Painel Admin" : undefined}
            className={({ isActive }) => cn(classeItem(isActive), recolhida && "justify-center px-0")}
          >
            {({ isActive }) => (
              <>
                {isActive && <MarcaAtivo />}
                <Settings className={classeIcone(isActive)} />
                {!recolhida && <span>Painel Admin</span>}
              </>
            )}
          </NavLink>
        </div>
      )}
    </aside>
  );
}
