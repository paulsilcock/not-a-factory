# One image for every environment: local Docker Compose, CI and (later) Railway.
FROM node:24-slim
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY api/package.json api/
COPY web/package.json web/
COPY acceptance-tests/package.json acceptance-tests/
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

WORKDIR /app/api
ENV NODE_ENV=production PORT=3001 WEB_DIST=../web/dist
EXPOSE 3001
CMD ["pnpm", "start"]
