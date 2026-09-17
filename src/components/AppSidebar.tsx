import { NavLink, useNavigate } from "react-router-dom";
import {
  Home, Newspaper, CalendarDays, Users, ClipboardList, FolderOpen, Receipt,
  Palette, BookOpen, GraduationCap, Shield, Headphones, TrendingUp, LogOut,
  Settings, PanelLeftClose, PanelLeft, Plane, Wallet, Megaphone, Search, Rocket, Briefcase,
  ListChecks, Magnet, Building2, Share2, Globe2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { getInitials, roleLabels } from "@/lib/mock-data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Marca } from "@/components/Marca";
import type { AppModulo } from "@/lib/types";

interface ItemNav {
  titulo: string;
  rota: string;
  icone: typeof Home;
  modulo?: AppModulo;
}

const grupos: { grupo: string; itens: ItemNav[] }[] = [
  {
    grupo: "Principal",
    itens: [
      { titulo: "Início", rota: "/", icone: Home },
      { titulo: "Feed / Mural", rota: "/feed", icone: Newspaper },
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
      { titulo: "SEO / GEO", rota: "/seo-geo", icone: Search, modulo: "seo_geo" },
      { titulo: "Gestão de Tráfego", rota: "/trafego", icone: Megaphone, modulo: "trafego" },
      { titulo: "Inbound", rota: "/inbound", icone: Magnet, modulo: "inbound" },
      { titulo: "Redes Sociais", rota: "/redes-sociais", icone: Share2, modulo: "social" },
      { titulo: "Sites e Hotsites", rota: "/sites", icone: Globe2, modulo: "sites" },
      { titulo: "Projetos RD", rota: "/projetos-rd", icone: Rocket, modulo: "projetos_rd" },
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
    itens: [
      { titulo: "Resultados de Vendas", rota: "/vendas", icone: TrendingUp, modulo: "vendas" },
      { titulo: "Dashboard Financeiro", rota: "/financeiro", icone: Wallet, modulo: "financeiro" },
    ],
  },
];

export function AppSidebar({
  recolhida,
  onAlternar,
}: {
  recolhida: boolean;
  onAlternar: () => void;
}) {
  const { profile, role, temModulo, isMaster, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside
      className={cn(
        "gradient-sidebar flex h-screen flex-col border-r border-sidebar-border text-sidebar-foreground transition-all duration-200",
        recolhida ? "w-[68px]" : "w-64"
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
        {/* Barra escura: a versão clara da marca é a que se lê aqui. */}
        {recolhida ? (
          <Marca tipo="emblema" tom="clara" altura={22} className="shrink-0" />
        ) : (
          <div className="min-w-0 flex-1">
            <Marca tom="clara" altura={20} />
            <p className="mt-1 truncate text-[10px] tracking-wide text-sidebar-foreground/60">
              Central Interna
            </p>
          </div>
        )}
        <button
          onClick={onAlternar}
          className="rounded-md p-1.5 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-white"
          aria-label={recolhida ? "Expandir menu" : "Recolher menu"}
        >
          {recolhida ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {grupos.map(({ grupo, itens }) => {
          const visiveis = itens.filter((i) => !i.modulo || temModulo(i.modulo));
          if (visiveis.length === 0) return null;
          return (
            <div key={grupo}>
              {!recolhida && (
                <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                  {grupo}
                </p>
              )}
              <div className="space-y-0.5">
                {visiveis.map(({ titulo, rota, icone: Icone }) => (
                  <NavLink
                    key={rota}
                    to={rota}
                    end={rota === "/"}
                    title={recolhida ? titulo : undefined}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-sidebar-primary font-medium text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white"
                      )
                    }
                  >
                    <Icone className="h-4 w-4 shrink-0" />
                    {!recolhida && <span className="truncate">{titulo}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={() => navigate("/perfil")}
          className="mb-1 flex w-full items-center gap-2.5 rounded-md p-1.5 text-left transition-colors hover:bg-sidebar-accent"
        >
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-sidebar-accent text-[10px] text-white">
              {getInitials(profile?.nome ?? "?")}
            </AvatarFallback>
          </Avatar>
          {!recolhida && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white">{profile?.nome}</p>
              <p className="truncate text-[10px] text-sidebar-foreground/60">
                {role ? roleLabels[role] : ""}
              </p>
            </div>
          )}
        </button>

        {isMaster && (
          <NavLink
            to="/admin"
            title={recolhida ? "Painel Admin" : undefined}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white"
              )
            }
          >
            <Settings className="h-4 w-4 shrink-0" />
            {!recolhida && <span>Painel Admin</span>}
          </NavLink>
        )}

        <button
          onClick={logout}
          title={recolhida ? "Sair" : undefined}
          className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-white"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!recolhida && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
