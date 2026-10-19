# One image for every environment: local Docker Compose, CI and (later) Railway.

# Build: install the app's packages, build the web app, and collect the API's production files.
FROM node:24-slim AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY api/package.json api/
COPY web/package.json web/
COPY acceptance-tests/package.json acceptance-tests/
RUN pnpm install --frozen-lockfile --filter api --filter web
COPY . .
RUN pnpm build && pnpm --filter api deploy --prod --legacy /prod/api

# Run: only the API with its production dependencies, and the built web app.
FROM node:24-slim
WORKDIR /app
COPY --from=build /prod/api api
COPY --from=build /app/web/dist web/dist
WORKDIR /app/api
ENV NODE_ENV=production PORT=3001 WEB_DIST=../web/dist
EXPOSE 3001
CMD ["node_modules/.bin/tsx", "src/main.ts"]
