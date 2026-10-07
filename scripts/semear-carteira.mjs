// Coloca no banco a carteira de clientes importada do Portal MarTech.
//
// Uso:
//   npm run db:semear            grava o que ainda não existe
//   npm run db:semear -- --ver   só mostra o que seria gravado
//
// A carteira não vai mais embutida no site (site é arquivo público). Ela mora na
// tabela central_registros e este script é quem a põe lá, uma vez.
//
// Não sobrescreve nada: registro que já existe no banco fica como está, mesmo
// que alguém o tenha editado ou removido pela tela.
//
// Precisa de SUPABASE_URL e da chave secreta em SUPABASE_KEY, no .env. A chave
// secreta nunca vai para o site nem para o git.

import { createClient } from "@supabase/supabase-js";
import { existsSync } from "node:fs";
import * as carteira from "./dados/carteira.ts";

for (const arquivo of [".env.local", ".env"]) {
  if (existsSync(arquivo)) process.loadEnvFile(arquivo);
}

const { SUPABASE_URL: url, SUPABASE_KEY: chave } = process.env;
if (!url || !chave) {
  console.error("Faltam SUPABASE_URL e SUPABASE_KEY (chave secreta) no .env.");
  process.exit(1);
}

const colecoes = {
  empresas: carteira.empresasImportadas,
  contatos: carteira.contatosImportados,
  personas: carteira.personasImportadas,
  produtos: carteira.produtosImportados,
  reunioesEmpresa: carteira.reunioesImportadas,
  timeline: carteira.timelineImportada,
  documentosEmpresa: carteira.documentosImportados,
  escopos: carteira.escoposImportados,
};

const soVer = process.argv.includes("--ver");
const sb = createClient(url, chave, { auth: { persistSession: false } });

for (const [colecao, itens] of Object.entries(colecoes)) {
  const { data: existentes, error } = await sb
    .from("central_registros").select("id").eq("colecao", colecao);
  if (error) {
    console.error(`Não consegui ler ${colecao}: ${error.message}`);
    console.error("A tabela central_registros existe? Rode a migração 000007 antes.");
    process.exit(1);
  }

  const jaTem = new Set(existentes.map((l) => l.id));
  const novos = itens
    .filter((item) => !jaTem.has(item.id))
    .map((item) => ({ colecao, id: item.id, dados: item }));

  if (!soVer && novos.length) {
    const { error: erroGravar } = await sb.from("central_registros").insert(novos);
    if (erroGravar) {
      console.error(`Falhou ao gravar ${colecao}: ${erroGravar.message}`);
      process.exit(1);
    }
  }
  console.log(
    `${colecao.padEnd(18)} ${String(novos.length).padStart(3)} ${soVer ? "a gravar" : "gravados"}, ${jaTem.size} já estavam lá`
  );
}
