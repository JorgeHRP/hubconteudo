import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home, Menu, PanelLeft, PanelLeftClose } from "lucide-react";
import { AppSidebar, telaAtual } from "./AppSidebar";
import { SinoNotificacoes } from "./SinoNotificacoes";
import { MenuUsuario } from "./MenuUsuario";
import { Marca } from "./Marca";

const classeBotaoBarra =
  "rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

export function AppLayout({ children }: { children: ReactNode }) {
  const [recolhida, setRecolhida] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const { pathname } = useLocation();
  const tela = telaAtual(pathname);

  // Navegou: fecha o menu do celular.
  useEffect(() => setMenuAberto(false), [pathname]);

  // Menu aberto trava o rolamento do fundo.
  useEffect(() => {
    document.body.style.overflow = menuAberto ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuAberto]);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuAberto(false);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* barra lateral fixa, do tablet para cima */}
      <div className="hidden md:block">
        <AppSidebar recolhida={recolhida} onAlternar={() => setRecolhida((v) => !v)} />
      </div>

      {/* menu deslizante no celular */}
      {menuAberto && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Fechar menu"
            onClick={() => setMenuAberto(false)}
            className="absolute inset-0 bg-foreground/50 backdrop-blur-[2px]"
          />
          <div className="animate-fade-in absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-pop">
            <AppSidebar movel recolhida={false} onAlternar={() => setMenuAberto(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-card px-3 sm:px-4 md:px-6">
          {/* celular: abre o menu deslizante */}
          <button
            onClick={() => setMenuAberto(true)}
            aria-label="Abrir menu"
            aria-expanded={menuAberto}
            className={`${classeBotaoBarra} md:hidden`}
          >
            <Menu className="h-5 w-5" />
          </button>
          <Marca altura={22} className="shrink-0 md:hidden" />

          {/* telas maiores: recolhe o menu e mostra onde a pessoa está */}
          <button
            onClick={() => setRecolhida((v) => !v)}
            aria-label={recolhida ? "Expandir menu" : "Recolher menu"}
            className={`${classeBotaoBarra} -ml-2 hidden md:block`}
          >
            {recolhida ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
          <nav aria-label="Você está em" className="hidden min-w-0 items-center gap-1.5 text-sm md:flex">
            <Link
              to="/"
              aria-label="Início"
              className="rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Home className="h-4 w-4" />
            </Link>
            {tela && tela.rota !== "/" && (
              <>
                {tela.grupo && (
                  <>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                    <span className="hidden truncate text-muted-foreground lg:inline">{tela.grupo}</span>
                    <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground/60 lg:inline" />
                  </>
                )}
                {!tela.grupo && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />}
                {pathname === tela.rota ? (
                  <span aria-current="page" className="truncate font-medium">{tela.titulo}</span>
                ) : (
                  <Link
                    to={tela.rota}
                    className="truncate rounded-sm font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    {tela.titulo}
                  </Link>
                )}
              </>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <SinoNotificacoes />
            <span aria-hidden className="hidden h-6 w-px bg-border sm:block" />
            <MenuUsuario />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
