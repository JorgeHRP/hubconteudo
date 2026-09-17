import { useState } from "react";
import { Download, Award } from "lucide-react";
import { toast } from "sonner";
import { cargaLegivel, preencherModelo } from "@/lib/treinamentos";
import { gerarPdfCertificado } from "@/lib/pdf-certificado";
import logoCertificado from "@/assets/logo-conteudo.png";
import { formatDate } from "@/lib/cs-data";
import type { Certificado as TipoCertificado, ModeloCertificado } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

const LARGURA = 1040;
const ALTURA = 735;
/** Quanto a prévia encolhe para caber no diálogo. Não afeta o PDF. */
const ESCALA = 0.62;

/**
 * Prévia do documento na tela. O PDF não sai daqui — é desenhado em vetor por
 * `gerarPdfCertificado`. As cores são literais de propósito: o certificado é
 * branco em qualquer tema, inclusive no modo escuro.
 */
function Folha({
  certificado,
  modelo,
  nome,
}: {
  certificado: TipoCertificado;
  modelo: ModeloCertificado;
  nome: string;
}) {
  return (
    <div
      style={{
        width: LARGURA, height: ALTURA, background: "#ffffff", color: "#1a2233",
        padding: 56, fontFamily: "Georgia, 'Times New Roman', serif",
        display: "flex", flexDirection: "column", position: "relative",
      }}
    >
      <div style={{
        border: "3px double #1e5aa8", flex: 1,
        padding: "44px 56px", display: "flex", flexDirection: "column",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src={logoCertificado} alt="Conteúdo Martech" style={{ height: 38, width: "auto" }} />
        </div>

        <h1 style={{
          marginTop: 44, marginBottom: 0, fontSize: 38, letterSpacing: 1,
          textAlign: "center", color: "#1e5aa8",
        }}>
          {modelo.titulo}
        </h1>

        <div style={{
          width: 90, height: 3, background: "#1e5aa8",
          margin: "18px auto 0", borderRadius: 2,
        }} />

        {/* Mesmo desenho do PDF: o nome ganha uma linha própria quando o
            modelo traz {nome}. A prévia precisa mostrar o que vai sair. */}
        {(() => {
          const partes = modelo.texto.split("{nome}");
          const temNome = partes.length === 2;
          const trocar = (t: string) =>
            t
              .replaceAll("{curso}", certificado.titulo)
              .replaceAll("{horas}", cargaLegivel(certificado.carga_horaria));
          const depois = temNome
            ? trocar(partes[1]).trim()
            : preencherModelo(modelo.texto, {
                nome,
                curso: certificado.titulo,
                horas: certificado.carga_horaria,
              });

          return (
            <div style={{ marginTop: 46, textAlign: "center", padding: "0 40px" }}>
              {temNome && (
                <>
                  <p style={{
                    margin: 0, fontSize: 15, color: "#6b7280",
                    fontFamily: "system-ui, sans-serif",
                  }}>
                    {trocar(partes[0]).trim()}
                  </p>
                  <p style={{
                    margin: "10px 0 0", fontSize: 36, fontWeight: 700, color: "#1e5aa8",
                  }}>
                    {nome}
                  </p>
                  <div style={{
                    height: 1, background: "#1e5aa8", margin: "6px auto 0",
                    width: `${Math.min(nome.length * 15 + 40, 620)}px`,
                  }} />
                </>
              )}
              <p style={{ margin: "18px 0 0", fontSize: 19, lineHeight: 1.7 }}>
                {depois}
              </p>
            </div>
          );
        })()}

        <div style={{ marginTop: "auto", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: "#6b7280" }}>
            <p style={{ margin: 0 }}>Código de verificação</p>
            <p style={{ margin: 0, fontWeight: 600, color: "#1a2233", letterSpacing: 1 }}>
              {certificado.codigo}
            </p>
          </div>

          <div style={{ textAlign: "center", minWidth: 300 }}>
            <div style={{ borderTop: "1px solid #1a2233", paddingTop: 8 }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{modelo.assinante}</p>
              <p style={{ margin: 0, fontSize: 12, color: "#6b7280", fontFamily: "system-ui, sans-serif" }}>
                {modelo.cargo_assinante}
              </p>
            </div>
          </div>

          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: "#6b7280", textAlign: "right" }}>
            <p style={{ margin: 0 }}>{modelo.cidade}</p>
            <p style={{ margin: 0 }}>{formatDate(certificado.emitido_em.slice(0, 10))}</p>
            <p style={{ margin: 0 }}>{cargaLegivel(certificado.carga_horaria)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Visualização do certificado com o botão de baixar em PDF. */
export function VisualizadorCertificado({
  certificado,
  modelo,
  nome,
  aberto,
  onFechar,
}: {
  certificado: TipoCertificado | null;
  modelo: ModeloCertificado;
  nome: string;
  aberto: boolean;
  onFechar: () => void;
}) {
  const [baixando, setBaixando] = useState(false);

  const baixar = async () => {
    if (!certificado) return;
    setBaixando(true);
    try {
      await gerarPdfCertificado(certificado, modelo, nome);
      toast.success("Certificado baixado");
    } catch {
      toast.error("Não foi possível gerar o PDF. Tente de novo.");
    } finally {
      setBaixando(false);
    }
  };

  if (!certificado) return null;

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-warning" /> {certificado.titulo}
          </DialogTitle>
        </DialogHeader>

        {/* Encolhe só a exibição; o PDF sai no tamanho cheio. O invólucro reserva
            a altura já reduzida, senão sobra um vão branco embaixo. */}
        <div className="overflow-x-auto rounded-lg border bg-muted/30 p-3">
          <div style={{ width: LARGURA * ESCALA, height: ALTURA * ESCALA }}>
            <div className="origin-top-left" style={{ transform: `scale(${ESCALA})` }}>
              <Folha certificado={certificado} modelo={modelo} nome={nome} />
            </div>
          </div>
        </div>

        <Button onClick={baixar} disabled={baixando}>
          <Download /> {baixando ? "Gerando…" : "Baixar em PDF"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
