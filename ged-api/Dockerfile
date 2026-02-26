FROM golang:1.22-alpine AS builder

RUN apk add --no-cache gcc musl-dev

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /ged-api ./cmd/server

FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata wget

WORKDIR /app

COPY --from=builder /ged-api .
COPY --from=builder /app/migrations ./migrations

EXPOSE 4017

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --spider --quiet http://localhost:4017/api/health || exit 1

ENTRYPOINT ["./ged-api", "--migrate"]
