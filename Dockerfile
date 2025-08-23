# syntax=docker/dockerfile:1

# Etapa 1: instalar dependências
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci

# Etapa 2: build da aplicação
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Usa o script de build já definido (Next 15 com Turbopack)
RUN npm run build

# Etapa 3: imagem final de runtime
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Instala apenas dependências de produção
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev

# Copia artefatos de build e assets públicos
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/public ./public

EXPOSE 3000
USER node
CMD ["npm", "start"]
