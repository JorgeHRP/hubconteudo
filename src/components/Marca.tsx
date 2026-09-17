import logoEscura from "@/assets/logo-conteudo.png";
import logoClara from "@/assets/logo-conteudo-claro.png";
import emblemaEscuro from "@/assets/emblema-conteudo.png";
import emblemaClaro from "@/assets/emblema-conteudo-claro.png";
import { cn } from "@/lib/utils";

/**
 * A marca da Conteúdo Martech, num lugar só.
 *
 * São quatro arquivos porque a logo tem o texto em duas cores: escuro para
 * fundo claro, claro para fundo escuro. O losango colorido é igual nos dois.
 * Escolher pelo `tom` do fundo evita a logo sumir na barra lateral escura.
 */
export function Marca({
  tipo = "completa",
  tom = "escura",
  altura = 32,
  className,
}: {
  /** `completa` traz o nome ao lado do símbolo; `emblema` é só o símbolo. */
  tipo?: "completa" | "emblema";
  /** Cor do texto: `escura` para fundo claro, `clara` para fundo escuro. */
  tom?: "escura" | "clara";
  altura?: number;
  className?: string;
}) {
  const fonte =
    tipo === "emblema"
      ? tom === "clara" ? emblemaClaro : emblemaEscuro
      : tom === "clara" ? logoClara : logoEscura;

  return (
    <img
      src={fonte}
      alt="Conteúdo Martech"
      style={{ height: altura }}
      className={cn("w-auto object-contain", className)}
    />
  );
}
