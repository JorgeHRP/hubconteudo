import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CircleAlert, Eye, EyeOff, MailCheck, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { seedProfiles } from "@/data/seed";
import { pedirTrocaDeSenha } from "@/integrations/supabase/sessao";
import { Button } from "@/components/ui/button";
import { TelaDeEntrada } from "@/components/TelaDeEntrada";
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
  // Só troca o tipo do campo na tela; não altera o que é enviado.
  const [senhaVisivel, setSenhaVisivel] = useState(false);

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
    <TelaDeEntrada>
      <Marca altura={36} />

      <h1 className="mt-8 text-[1.75rem] font-semibold leading-tight">Acesse a Central</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Entre com o seu e-mail da Conteúdo para continuar de onde parou.
      </p>

      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => { e.preventDefault(); entrar(); }}
      >
        <div>
          <Label htmlFor="email">E-mail corporativo</Label>
          <Input
            id="email" type="email" className="mt-2 h-11" autoComplete="username"
            value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="nome@conteudomartech.com.br"
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="senha">Senha</Label>
            {loginReal && (
              <button
                type="button" onClick={esqueciSenha}
                className="rounded-sm text-sm font-medium text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                Esqueci minha senha
              </button>
            )}
          </div>
          <div className="relative mt-2">
            <Input
              id="senha" type={senhaVisivel ? "text" : "password"} className="h-11 pr-11"
              autoComplete="current-password"
              value={senha} onChange={(e) => setSenha(e.target.value)}
              placeholder="Sua senha"
            />
            <button
              type="button"
              onClick={() => setSenhaVisivel((v) => !v)}
              aria-label={senhaVisivel ? "Ocultar senha" : "Mostrar senha"}
              aria-pressed={senhaVisivel}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {senhaVisivel ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {erro && (
          <p role="alert" className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{erro}</span>
          </p>
        )}
        {aviso && (
          <p role="status" className="flex items-start gap-2 rounded-md border bg-muted/60 p-3 text-sm text-muted-foreground">
            <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <span>{aviso}</span>
          </p>
        )}

        <Button type="submit" size="lg" className="group w-full" disabled={entrando}>
          {entrando ? "Entrando…" : "Entrar"}
          <ArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </Button>
      </form>

      {/* Só aparece sem banco conectado (prévia local); em produção a tela termina no formulário. */}
      {!loginReal && (
        <div className="mt-5 flex items-start gap-2 rounded-md border bg-muted/60 p-3 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <span>
            Modo de demonstração: o banco ainda não está conectado, então o botão entra
            direto como <strong>{master.nome}</strong> (master), sem conferir a senha.
          </span>
        </div>
      )}

      <p className="mt-10 text-xs text-muted-foreground">
        Acesso restrito ao time da Conteúdo Martech.
      </p>
    </TelaDeEntrada>
  );
}
