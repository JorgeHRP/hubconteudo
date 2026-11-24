import type { CSSProperties } from "react";
import icone from "@/assets/icone-rd-station.png";

/**
 * Ícone da RD Station que acompanha a cor do texto, como os ícones Lucide.
 * O PNG é branco com transparência e serve só de máscara; a cor vem de `currentColor`.
 */
export function IconeRdStation({ className }: { className?: string }) {
  const estilo: CSSProperties = {
    display: "inline-block",
    backgroundColor: "currentColor",
    maskImage: `url(${icone})`,
    WebkitMaskImage: `url(${icone})`,
    maskSize: "contain",
    WebkitMaskSize: "contain",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskPosition: "center",
    WebkitMaskPosition: "center",
  };
  return <span aria-hidden="true" className={className} style={estilo} />;
}
