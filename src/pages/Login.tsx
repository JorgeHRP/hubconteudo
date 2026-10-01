import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, MailCheck, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { seedProfiles } from "@/data/seed";
import { pedirTrocaDeSenha } from "@/integrations/supabase/sessao";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Marca } from "@/components/Marca";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const { login, loginReal } = useAuth();
  const navigate = useNavigate();
  const master = seedProfiles[0];

  const [email, setEmail] = useState(loginReal ? "" : master.email);
  const [senha, setSenha] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function entrar() {
    setErro(null);
    setAviso(null);
    if (loginReal && (!email.trim() || !senha)) {
      setErro("Informe o e-mail e a senha.");
      return;
    }
    setEntrando(true);
    const falha = await login(email, senha);
    setEntrando(false);
    if (falha) {
      setErro(falha);
      return;
    }
    navigate("/", { replace: true });
  }

  async function esqueciSenha() {
    setErro(null);
    setAviso(null);
    if (!email.trim()) {
      setErro("Digite seu e-mail no campo acima para receber o link.");
      return;
    }
    const falha = await pedirTrocaDeSenha(email);
    if (falha) setErro(falha);
    // A mesma resposta com ou sem cadastro: a tela não revela quem tem conta.
    else setAviso("Se este e-mail tiver cadastro, o link para criar uma senha nova chega em instantes.");
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
              id="email" type="email" className="mt-1.5" autoComplete="username"
              value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@conteudomartech.com.br"
            />
          </div>
          <div>
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha" type="password" className="mt-1.5" autoComplete="current-password"
              value={senha} onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {erro && (
            <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {erro}
            </p>
          )}
          {aviso && (
            <p className="flex items-start gap-2 rounded-md bg-muted/60 p-3 text-sm text-muted-foreground">
              <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{aviso}</span>
            </p>
          )}

          <Button type="submit" className="w-full" disabled={entrando}>
            <LogIn /> {entrando ? "Entrando…" : "Entrar"}
          </Button>

          {loginReal && (
            <button
              type="button" onClick={esqueciSenha}
              className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Esqueci minha senha
            </button>
          )}
        </form>

        <div className="mt-4 flex items-start gap-2 rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          {loginReal ? (
            <span>
              Não há cadastro público: contas são criadas no painel de Colaboradores e o
              primeiro acesso chega por e-mail.
            </span>
          ) : (
            <span>
              Modo de demonstração: o banco ainda não está conectado, então o botão entra
              direto como <strong>{master.nome}</strong> (master), sem conferir a senha.
            </span>
          )}
        </div>
      </Card>
    </div>
  );
}
