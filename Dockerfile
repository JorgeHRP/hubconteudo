# Build: instala dependências e gera dist/
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Runtime: serve o build estático com nginx
FROM nginx:alpine
# htpasswd, usado pela proteção temporária de acesso
RUN apk add --no-cache apache2-utils
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/10-acesso.sh /docker-entrypoint.d/10-acesso.sh
RUN chmod +x /docker-entrypoint.d/10-acesso.sh

EXPOSE 80
