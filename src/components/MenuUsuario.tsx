import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { roleLabels } from "@/lib/mock-data";
import { AvatarPessoa } from "@/components/AvatarPessoa";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const classeOpcao =
  "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none";

/** Avatar da barra superior: abre perfil, painel admin (master) e sair. */
export function MenuUsuario() {
  const { profile, role, isMaster, logout } = useAuth();
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(false);

  function ir(rota: string) {
    setAberto(false);
    navigate(rota);
  }

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <button
          aria-label="Abrir menu da conta"
          className="flex items-center gap-2.5 rounded-md py-1 pl-1 pr-1.5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <AvatarPessoa
            nome={profile?.nome ?? "?"} foto={profile?.foto_url}
            className="h-9 w-9 shrink-0" classeIniciais="bg-primary text-xs text-primary-foreground"
          />
          <span className="hidden min-w-0 sm:block">
            <span className="block max-w-[11rem] truncate text-sm font-medium leading-tight">{profile?.nome}</span>
            <span className="block truncate text-xs leading-tight text-muted-foreground">
              {role ? roleLabels[role] : ""}
            </span>
          </span>
          <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60 p-1.5">
        <div className="border-b px-2.5 pb-2.5 pt-1.5 sm:hidden">
          <p className="truncate text-sm font-medium">{profile?.nome}</p>
          <p className="truncate text-xs text-muted-foreground">{role ? roleLabels[role] : ""}</p>
        </div>
        <button className={classeOpcao} onClick={() => ir("/perfil")}>
          <UserRound className="h-4 w-4 text-muted-foreground" /> Meu perfil
        </button>
        {isMaster && (
          <button className={classeOpcao} onClick={() => ir("/admin")}>
            <Settings className="h-4 w-4 text-muted-foreground" /> Painel Admin
          </button>
        )}
        <div className="my-1 border-t" />
        <button
          className={`${classeOpcao} text-destructive hover:bg-destructive/10 focus-visible:bg-destructive/10`}
          onClick={() => { setAberto(false); logout(); }}
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </PopoverContent>
    </Popover>
  );
}
