# ---- Build: compila TypeScript y genera el cliente de Prisma ----
FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --ignore-scripts && npx prisma generate
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

# ---- Runtime: solo lo necesario para correr ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=build /app/dist ./dist
COPY prisma ./prisma
RUN mkdir -p uploads && chown -R node:node /app
USER node
EXPOSE 3000
# Aplica migraciones pendientes y arranca. Si falla la migración, el contenedor no levanta (mejor enterarse).
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
