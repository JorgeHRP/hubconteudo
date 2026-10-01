import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Marca } from "@/components/Marca";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TAMANHO_MINIMO = 8;

/**
 * Onde cai quem abriu o link do convite ou do "esqueci minha senha".
 * O link já traz a pessoa autenticada; falta só ela escolher a senha.
 */
export default function DefinirSenha() {
  const { isAuthenticated, loading, profile, definirSenha } = useAuth();
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Carregando…
      </div>
    );
  }
  // Link vencido ou já usado: sem sessão não há de quem trocar a senha.
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  async function salvar() {
    setErro(null);
    if (senha.length < TAMANHO_MINIMO) {
      setErro(`A senha precisa ter pelo menos ${TAMANHO_MINIMO} caracteres.`);
      return;
    }
    if (senha !== confirmacao) {
      setErro("As duas senhas não são iguais.");
      return;
    }
    setSalvando(true);
    const falha = await definirSenha(senha);
    setSalvando(false);
    if (falha) {
      setErro(falha);
      return;
    }
    toast.success("Senha criada.");
    navigate("/", { replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8">
        <Marca altura={40} className="mb-6" />
        <h1 className="text-2xl font-bold">Crie sua senha</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {profile?.nome ? `${profile.nome}, escolha` : "Escolha"} a senha que você vai usar
          para entrar na Central.
        </p>

        <form className="mt-6 space-y-3" onSubmit={(e) => { e.preventDefault(); salvar(); }}>
          <div>
            <Label htmlFor="senha">Senha nova</Label>
            <Input
              id="senha" type="password" className="mt-1.5" autoComplete="new-password"
              value={senha} onChange={(e) => setSenha(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="confirmacao">Repita a senha</Label>
            <Input
              id="confirmacao" type="password" className="mt-1.5" autoComplete="new-password"
              value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)}
            />
          </div>

          {erro && (
            <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {erro}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={salvando}>
            <KeyRound /> {salvando ? "Salvando…" : "Salvar e entrar"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
