#!/bin/sh
# Proteção temporária: gera o arquivo de senha do nginx a partir das variáveis
# do container. Roda sozinho na subida (pasta /docker-entrypoint.d da imagem).
#
# Sem usuário e senha definidos o container NÃO sobe. É de propósito: enquanto o
# login real não existe, subir sem senha é deixar a Central aberta para a internet.
set -eu

ARQUIVO=/etc/nginx/.htpasswd

if [ -z "${ACESSO_USUARIO:-}" ] || [ -z "${ACESSO_SENHA:-}" ]; then
  echo "ERRO: defina ACESSO_USUARIO e ACESSO_SENHA para subir a Central." >&2
  exit 1
fi

printf '%s\n' "$ACESSO_SENHA" | htpasswd -iBc "$ARQUIVO" "$ACESSO_USUARIO" >/dev/null 2>&1
chown nginx:nginx "$ARQUIVO"
chmod 640 "$ARQUIVO"

echo "Acesso protegido por senha (usuário: $ACESSO_USUARIO)."
