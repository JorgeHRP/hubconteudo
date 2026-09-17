import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { AppSidebar } from "./AppSidebar";
import { SinoNotificacoes } from "./SinoNotificacoes";
import { Marca } from "./Marca";

export function AppLayout({ children }: { children: ReactNode }) {
  const [recolhida, setRecolhida] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const { pathname } = useLocation();

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
            className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
          />
          <div className="animate-fade-in absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-xl">
            <AppSidebar recolhida={false} onAlternar={() => setMenuAberto(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* No celular o topo abre o menu; em telas maiores ele existe para o sino. */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-card px-4">
          <button
            onClick={() => setMenuAberto(true)}
            aria-label="Abrir menu"
            aria-expanded={menuAberto}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
          >
            {menuAberto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Marca altura={24} className="shrink-0 md:hidden" />

          <div className="ml-auto">
            <SinoNotificacoes />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
