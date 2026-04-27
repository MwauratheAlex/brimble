FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    curl \
    git \
    docker.io \
    python3 \
    make \
    g++ \
    ca-certificates \
    tar \
  && rm -rf /var/lib/apt/lists/*

RUN curl -sSL https://railpack.com/install.sh | sh

RUN corepack enable

COPY package.json pnpm-lock.yaml* ./

RUN pnpm install --frozen-lockfile || pnpm install

RUN pnpm rebuild better-sqlite3

RUN node -e "const Database = require('better-sqlite3'); new Database(':memory:'); console.log('better-sqlite3 ok')"

COPY tsconfig.json ./
COPY src ./src

EXPOSE 6492

CMD ["pnpm", "dev"]
