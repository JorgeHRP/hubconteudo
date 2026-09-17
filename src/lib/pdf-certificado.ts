import { cargaLegivel, preencherModelo } from "./treinamentos";
import logoConteudo from "@/assets/logo-conteudo.png";
import { formatDate } from "./cs-data";
import type { Certificado, ModeloCertificado } from "./types";

/**
 * Desenha o certificado direto no PDF, em vetor.
 *
 * A primeira versão fotografava o HTML com html2canvas, mas a foto saía com a
 * escala de exibição já aplicada e era esticada na página — texto borrado.
 * Desenhando aqui, o texto fica nítido em qualquer zoom, é selecionável e o
 * arquivo tem uma fração do tamanho.
 */
/**
 * Prepara a logo para o PDF.
 *
 * Duas coisas acontecem aqui, e as duas são necessárias:
 *
 * 1. **Redimensiona.** O jsPDF embute a imagem no tamanho do arquivo, sem
 *    reduzir: mandar o original de 1470px deixava o certificado com 1,6 MB
 *    para uma logo de 1 cm. Redesenhada a 300 dpi, o arquivo volta a ~30 KB.
 * 2. **Desiste se demorar.** Sem prazo, uma imagem que nunca carrega deixa a
 *    geração pendurada e o botão preso em "Gerando…" para sempre. Estourado o
 *    prazo, quem chama cai no certificado com o nome escrito.
 */
async function logoParaPdf(url: string, alturaMm: number): Promise<string> {
  const img = new Image();

  const carregada = await new Promise<boolean>((ok) => {
    const prazo = window.setTimeout(() => ok(false), 5000);
    img.onload = () => { window.clearTimeout(prazo); ok(true); };
    img.onerror = () => { window.clearTimeout(prazo); ok(false); };
    img.src = url;
  });

  if (!carregada || !img.naturalWidth) throw new Error("Logo indisponível.");

  // 300 dpi: 1 mm = 11.81 px.
  const alturaPx = Math.round(alturaMm * 11.81);
  const larguraPx = Math.round((img.naturalWidth / img.naturalHeight) * alturaPx);

  const canvas = document.createElement("canvas");
  canvas.width = larguraPx;
  canvas.height = alturaPx;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível.");

  // O PNG é transparente; o JPEG não tem alfa. Sem este fundo, o vazio vira preto.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, larguraPx, alturaPx);
  ctx.drawImage(img, 0, 0, larguraPx, alturaPx);

  return canvas.toDataURL("image/jpeg", 0.92);
}

/** Proporção real do arquivo, para a logo não sair achatada. */
const LOGO_LARGURA = 1470;
const LOGO_ALTURA = 285;

export async function gerarPdfCertificado(
  certificado: Certificado,
  modelo: ModeloCertificado,
  nome: string
) {
  const { jsPDF } = await import("jspdf");

  // A4 deitado.
  const L = 297;
  const A = 210;
  const meio = L / 2;
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const azul: [number, number, number] = [30, 90, 168];
  const escuro: [number, number, number] = [26, 34, 51];
  const cinza: [number, number, number] = [107, 114, 128];

  /* moldura dupla */
  pdf.setDrawColor(...azul);
  pdf.setLineWidth(0.8);
  pdf.rect(12, 12, L - 24, A - 24);
  pdf.setLineWidth(0.3);
  pdf.rect(14, 14, L - 28, A - 28);

  /* marca */
  try {
    const alturaLogo = 11;
    const larguraLogo = (LOGO_LARGURA / LOGO_ALTURA) * alturaLogo;
    const dados = await logoParaPdf(logoConteudo, alturaLogo);
    pdf.addImage(dados, "JPEG", 22, 22, larguraLogo, alturaLogo, undefined, "FAST");
  } catch {
    // Sem a imagem, o certificado sai com o nome escrito — melhor que sair sem marca.
    pdf.setTextColor(...escuro);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("Conteúdo Martech", 22, 30);
  }

  /* título */
  pdf.setTextColor(...azul);
  pdf.setFont("times", "normal");
  pdf.setFontSize(32);
  pdf.text(modelo.titulo, meio, 62, { align: "center" });

  pdf.setDrawColor(...azul);
  pdf.setLineWidth(1);
  pdf.line(meio - 18, 70, meio + 18, 70);

  /* corpo */
  const horasTexto = cargaLegivel(certificado.carga_horaria);

  // O nome ganha uma linha própria, como num certificado de verdade. O modelo
  // continua sendo um texto só: a quebra sai do próprio {nome}.
  const partes = modelo.texto.split("{nome}");
  const temNome = partes.length === 2;

  const trocar = (t: string) =>
    t.replaceAll("{curso}", certificado.titulo).replaceAll("{horas}", horasTexto);

  const antes = temNome ? trocar(partes[0]).trim() : "";
  const depois = temNome
    ? trocar(partes[1]).trim()
    : preencherModelo(modelo.texto, {
        nome,
        curso: certificado.titulo,
        horas: certificado.carga_horaria,
      });

  // Faixa livre entre a linha do título e o rodapé. O bloco é centrado nela,
  // senão sobra um vão no meio da folha quando o texto é curto.
  const TOPO = 80;
  const FIM = 150;

  pdf.setFont("times", "normal");
  pdf.setFontSize(15);
  const linhasDepois = pdf.splitTextToSize(depois, L - 80) as string[];

  const H_ANTES = temNome ? 8 : 0;
  const H_NOME = temNome ? 20 : 0;
  const H_LINHA = 9.5;
  const alturaBloco = H_ANTES + H_NOME + (linhasDepois.length - 1) * H_LINHA;
  let y = (TOPO + FIM) / 2 - alturaBloco / 2;

  if (temNome) {
    pdf.setTextColor(...cinza);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.text(antes, meio, y, { align: "center" });
    y += H_ANTES;

    pdf.setTextColor(...azul);
    pdf.setFont("times", "bold");
    pdf.setFontSize(26);
    pdf.text(nome, meio, y + 8, { align: "center" });

    // Régua sob o nome, na largura do próprio nome.
    const largura = Math.min(pdf.getTextWidth(nome) + 20, L - 80);
    pdf.setDrawColor(...azul);
    pdf.setLineWidth(0.4);
    pdf.line(meio - largura / 2, y + 13, meio + largura / 2, y + 13);
    y += H_NOME;
  }

  pdf.setTextColor(...escuro);
  pdf.setFont("times", "normal");
  pdf.setFontSize(15);
  linhasDepois.forEach((linha, i) => {
    pdf.text(linha, meio, y + i * H_LINHA, { align: "center" });
  });

  /* rodapé */
  const base = A - 42;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(...cinza);
  pdf.text("Código de verificação", 24, base);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(...escuro);
  pdf.text(certificado.codigo, 24, base + 5);

  pdf.setDrawColor(...escuro);
  pdf.setLineWidth(0.3);
  pdf.line(meio - 40, base, meio + 40, base);
  pdf.setFont("times", "bold");
  pdf.setFontSize(12);
  pdf.text(modelo.assinante, meio, base + 6, { align: "center" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...cinza);
  pdf.text(modelo.cargo_assinante, meio, base + 11, { align: "center" });

  const direita = L - 24;
  pdf.setFontSize(7.5);
  pdf.text(modelo.cidade, direita, base, { align: "right" });
  pdf.text(formatDate(certificado.emitido_em.slice(0, 10)), direita, base + 4.5, { align: "right" });
  pdf.text(cargaLegivel(certificado.carga_horaria), direita, base + 9, { align: "right" });

  const arquivo = `certificado-${certificado.titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}.pdf`;

  pdf.save(arquivo);
  return arquivo;
}
