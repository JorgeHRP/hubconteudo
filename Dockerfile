# Build: instala dependências e gera dist/
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# O Vite embute estas duas no build. Sem elas o site sai em modo de demonstração.
# A chave anon é pública por natureza; a service_role nunca entra aqui.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
RUN npm run build

# Runtime: serve o build estático com nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/20-config.sh /docker-entrypoint.d/20-config.sh
RUN chmod +x /docker-entrypoint.d/20-config.sh

EXPOSE 80
