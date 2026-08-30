# Build database stage
FROM --platform=$BUILDPLATFORM python:3.13-alpine3.23 AS db_builder

RUN apk -U upgrade && \
    apk add --no-cache curl unzip

WORKDIR /data

COPY scripts/generate_database /data

RUN --mount=type=secret,id=build_secrets \
    set -a && . /run/secrets/build_secrets && set +a && \
    /data/run.sh

RUN chmod 444 /data/database.db

# Build the SolidJS UI stage
FROM --platform=$BUILDPLATFORM node:24-alpine3.23 AS ui_builder

RUN apk -U upgrade

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && \
    pnpm install --frozen-lockfile

COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY src/ ./src/
COPY public/ ./public/

RUN --mount=type=secret,id=build_secrets \
    set -a && . /run/secrets/build_secrets && set +a && \
    pnpm run build

# Build web server stage
FROM --platform=$BUILDPLATFORM docker.io/golang:1.26-bookworm AS app_builder

# Install cross-compiler for CGo (required by go-sqlite3)
# gcc-x86-64-linux-gnu provides the x86_64 cross-compiler for CGO
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc-x86-64-linux-gnu libc6-dev-amd64-cross tzdata && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY --from=ui_builder /app/asset/assets ./asset/assets
COPY cmd/ ./cmd/
COPY internal/ ./internal/
COPY asset/efs.go ./asset/efs.go

# Build a fully static binary
# Cross-compile for linux/amd64 using the x86_64 cross-compiler
RUN CC=x86_64-linux-gnu-gcc \
    CGO_ENABLED=1 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-linkmode external -extldflags=-static" \
    -o /app/app \
    ./cmd/web

# Final stage
FROM dhi.io/alpine-base:3.23

COPY --from=app_builder /app/app /usr/local/bin/app
COPY --from=app_builder /usr/share/zoneinfo /usr/share/zoneinfo
COPY --from=db_builder /data/database.db /data/database.db

USER nonroot

ENTRYPOINT ["/usr/local/bin/app"]
