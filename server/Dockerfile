FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY shared ./shared
COPY server ./server

RUN npm install --workspace server
RUN npm run build --workspace server

FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/server ./server
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "run", "dev", "--workspace", "server"]
