import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { USUARIO_MASTER_ID, seedProfiles } from "@/data/seed";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Marca } from "@/components/Marca";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [entrando, setEntrando] = useState(false);
  const master = seedProfiles[0];

  async function entrar() {
    setEntrando(true);
    await login(USUARIO_MASTER_ID);
    navigate("/", { replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8">
        <Marca altura={40} className="mb-6" />
        <h1 className="text-2xl font-bold">Central Interna</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acesso restrito a colaboradores.
        </p>

        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => { e.preventDefault(); entrar(); }}
        >
          <div>
            <Label htmlFor="email">E-mail corporativo</Label>
            <Input
              id="email" type="email" className="mt-1.5"
              defaultValue={master.email}
              placeholder="nome@conteudomartech.com.br"
            />
          </div>
          <div>
            <Label htmlFor="senha">Senha</Label>
            <Input id="senha" type="password" className="mt-1.5" placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full" disabled={entrando}>
            <LogIn /> {entrando ? "Entrando…" : "Entrar"}
          </Button>
        </form>

        <div className="mt-4 flex items-start gap-2 rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>
            A validação de senha entra quando o Supabase for conectado. Enquanto isso, o
            botão entra direto como <strong>{master.nome}</strong> (master). Não há cadastro
            público: contas são criadas no painel de Colaboradores.
          </span>
        </div>
      </Card>
    </div>
  );
}
