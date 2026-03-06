FROM node:18 AS deps

WORKDIR /app
ENV PATH=/app/node_modules/.bin:$PATH

COPY package*.json ./
RUN npm ci --legacy-peer-deps

FROM node:18 AS build

WORKDIR /app
ENV PATH=/app/node_modules/.bin:$PATH
ENV NODE_ENV=production
ENV TZ="Asia/Jakarta"
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build && npm prune --omit=dev && npm cache clean --force

FROM node:18 AS production

WORKDIR /app
ENV PATH=/app/node_modules/.bin:$PATH
ENV NODE_ENV=production
ENV TZ="Asia/Jakarta"
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public

CMD ["npm", "start"]
