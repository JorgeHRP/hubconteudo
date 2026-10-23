// Junta uma edge function e os arquivos de _compartilhado em um arquivo só, para
// colar no painel do Supabase (Edge Functions > Deploy a new function > Via Editor).
//
//   node scripts/gerar-colar.mjs sync-clickup
//
// Gera supabase/colar-<nome>.ts. Edite sempre em supabase/functions/ e gere de novo.
import { readFileSync, writeFileSync } from "node:fs";

const nome = process.argv[2];
if (!nome) {
  console.error("Uso: node scripts/gerar-colar.mjs <nome-da-funcao>");
  process.exit(1);
}

const ler = (caminho) => readFileSync(new URL(`../supabase/functions/${caminho}`, import.meta.url), "utf8");
const principal = ler(`${nome}/index.ts`);

const compartilhados = [...principal.matchAll(/from "\.\.\/_compartilhado\/([\w-]+\.ts)"/g)].map((m) => m[1]);
const importsExternos = new Set();
const corpos = [];

for (const arquivo of compartilhados) {
  const linhas = [];
  for (const linha of ler(`_compartilhado/${arquivo}`).split("\n")) {
    if (/^import .* from "(jsr|npm|https?):/.test(linha)) importsExternos.add(linha.trim());
    else linhas.push(linha.replace(/^export (async function|function|const)/, "$1"));
  }
  corpos.push(linhas.join("\n").trim());
}

const corpoPrincipal = principal
  .split("\n")
  .filter((l) => {
    if (/from "\.\.\/_compartilhado\//.test(l)) return false;
    if (/^import .* from "(jsr|npm|https?):/.test(l)) { importsExternos.add(l.trim()); return false; }
    return true;
  })
  .join("\n")
  .trim();

const saida = [
  `// ${nome} em arquivo único, para colar no painel do Supabase`,
  `// (Edge Functions > Deploy a new function > Via Editor, com o nome ${nome}).`,
  "// Gerado a partir de supabase/functions/ — não edite aqui.",
  "",
  ...importsExternos,
  "",
  ...corpos.flatMap((c) => [c, ""]),
  corpoPrincipal,
  "",
].join("\n");

writeFileSync(new URL(`../supabase/colar-${nome}.ts`, import.meta.url), saida);
console.log(`supabase/colar-${nome}.ts gerado.`);
