#!/bin/sh
# Entrega ao site o endereço e a chave pública do Supabase a partir das variáveis
# do container, na subida. Assim trocar de projeto é trocar a variável e
# reiniciar, sem depender de a hospedagem repassar variáveis para o build.
#
# Só estas duas saem daqui. A chave precisa ser a pública (anon/publishable):
# este arquivo é servido a qualquer pessoa que abre o site.
set -eu

ARQUIVO=/usr/share/nginx/html/config.js
URL="${VITE_SUPABASE_URL:-}"
CHAVE="${VITE_SUPABASE_ANON_KEY:-}"

case "$CHAVE" in
  sb_secret_*)
    echo "ERRO: VITE_SUPABASE_ANON_KEY está com a chave secreta. Use a publishable." >&2
    exit 1
    ;;
esac

# Aspas e barras invertidas não existem em URL nem em chave válidas; se
# aparecerem, é valor colado errado e o arquivo sairia quebrado.
case "$URL$CHAVE" in
  *\"*|*\*)
    echo "ERRO: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY com aspas ou barra invertida." >&2
    exit 1
    ;;
esac

printf 'window.__CENTRAL_CONFIG__ = { supabaseUrl: "%s", supabaseAnonKey: "%s" };\n' \
  "$URL" "$CHAVE" > "$ARQUIVO"

if [ -n "$URL" ] && [ -n "$CHAVE" ]; then
  echo "Supabase configurado: login real ligado."
else
  echo "Sem VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY: site em modo de demonstração."
fi
