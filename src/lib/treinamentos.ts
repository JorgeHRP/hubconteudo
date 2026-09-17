import type { ModeloCertificado } from "./types";

/**
 * Modelo único de certificado. Só o nome da pessoa, o curso e a carga horária
 * mudam de um documento para outro — o resto é editado em Treinamentos → Modelo
 * de certificado e vale para todos.
 */
export const modeloCertificadoPadrao: ModeloCertificado = {
  titulo: "Certificado de Conclusão",
  texto:
    "Certificamos que {nome} concluiu o curso {curso}, " +
    "com carga horária de {horas}, promovido pela Conteúdo Martech.",
  assinante: "Thiago Lustosa",
  cargo_assinante: "CEO — Conteúdo Martech",
  cidade: "Goiânia",
};

/** Troca as marcações do modelo pelos dados reais. */
export function preencherModelo(
  texto: string,
  dados: { nome: string; curso: string; horas: number }
): string {
  const horas = dados.horas === 1 ? "1 hora" : `${dados.horas} horas`;
  return texto
    .replaceAll("{nome}", dados.nome)
    .replaceAll("{curso}", dados.curso)
    .replaceAll("{horas}", horas);
}

/**
 * Converte o link que a pessoa colou no endereço que roda dentro de um iframe.
 * Cobre YouTube (nas três formas), Vimeo e Google Drive; qualquer outro endereço
 * é devolvido como veio, para o caso de já ser um link de incorporação.
 */
export function urlDeIncorporacao(url: string | null): string | null {
  if (!url) return null;
  const limpo = url.trim();

  // youtu.be/ID  ·  youtube.com/watch?v=ID  ·  youtube.com/shorts/ID
  const yt =
    limpo.match(/youtu\.be\/([\w-]{6,})/) ??
    limpo.match(/[?&]v=([\w-]{6,})/) ??
    limpo.match(/youtube\.com\/(?:shorts|embed|live)\/([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;

  const vimeo = limpo.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;

  const drive = limpo.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (drive) return `https://drive.google.com/file/d/${drive[1]}/preview`;

  return limpo;
}

/** Um link que não vira incorporação conhecida só deve abrir em nova aba. */
export function ehIncorporavel(url: string | null): boolean {
  if (!url) return false;
  const e = urlDeIncorporacao(url) ?? "";
  return /youtube\.com\/embed|player\.vimeo\.com|drive\.google\.com.*preview/.test(e);
}

export const cargaLegivel = (horas: number) =>
  horas === 1 ? "1 hora" : `${horas} horas`;
