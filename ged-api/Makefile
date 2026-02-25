.PHONY: run build docker-up docker-down migrate-up migrate-down sqlc-generate

run:
	go run ./cmd/server

build:
	CGO_ENABLED=0 go build -ldflags="-s -w" -o bin/ged-api ./cmd/server

docker-up:
	docker compose up -d

docker-down:
	docker compose down

migrate-up:
	goose -dir migrations postgres "$(DATABASE_URL)" up

migrate-down:
	goose -dir migrations postgres "$(DATABASE_URL)" down

sqlc-generate:
	sqlc generate -f sqlc/sqlc.yaml
