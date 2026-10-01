// Sobe as tabelas da Central em um projeto Supabase.
//
// Uso:
//   npm run db:subir         aplica o que ainda não foi aplicado
//   npm run db:conferir      só mostra o que seria aplicado, sem mexer em nada
//
// Trocou de projeto no Supabase? Troque SUPABASE_DB_URL no .env e rode de novo.
//
// O que ele faz: aplica, em ordem, os arquivos de supabase/migrations/ e anota
// no próprio banco quais já rodaram. Rodar duas vezes não duplica nada, e
// tabelas que já existem no projeto e não são da Central ficam como estão.

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

for (const arquivo of [".env.local", ".env"]) {
  if (existsSync(arquivo)) process.loadEnvFile(arquivo);
}

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error(
    [
      "Falta SUPABASE_DB_URL no .env.",
      "",
      "No painel do Supabase: Connect > Connection string > Session pooler.",
      "Copie a linha, troque [YOUR-PASSWORD] pela senha do banco e cole assim:",
      "",
      '  SUPABASE_DB_URL="postgresql://postgres.<ref>:<senha>@<host>:5432/postgres"',
      "",
      "Senha com @ # / : ou ? precisa ir codificada (ex.: @ vira %40).",
    ].join("\n")
  );
  process.exit(1);
}

const soConferir = process.argv.includes("--conferir");
const args = ["supabase", "db", "push", "--db-url", url];
if (soConferir) args.push("--dry-run");
else args.push("--yes");

const r = spawnSync("npx", args, { stdio: "inherit", shell: process.platform === "win32" });
process.exit(r.status ?? 1);
