.PHONY: run build test test-sagi test-sagi-all \
       docker-up docker-down docker-logs docker-build \
       migrate-up migrate-down migrate-version migrate-force \
       sqlc-generate backup-now restore

DATABASE_URL ?= postgres://ged_user:ged_password@localhost:5432/ged_fadex?sslmode=disable

# --- Desenvolvimento ---

run:
	go run ./cmd/server

run-migrate:
	go run ./cmd/server --migrate

build:
	CGO_ENABLED=0 go build -ldflags="-s -w" -o bin/ged-api ./cmd/server

# --- Testes ---

test:
	go test ./... -v

test-sagi:
	go test ./internal/repository/ -v -run TestSAGI -count=1

test-sagi-all:
	go test ./internal/repository/ -v -count=1

# --- Docker ---

docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-build:
	docker compose build --no-cache

docker-logs:
	docker compose logs -f

# --- Migrations ---

migrate-up:
	migrate -path migrations -database "$(DATABASE_URL)" up

migrate-down:
	migrate -path migrations -database "$(DATABASE_URL)" down

migrate-version:
	migrate -path migrations -database "$(DATABASE_URL)" version

migrate-force:
	migrate -path migrations -database "$(DATABASE_URL)" force $(VERSION)

# --- sqlc ---

sqlc-generate:
	cd sqlc && sqlc generate

# --- Backup / Restore ---

backup-now:
	docker compose exec backup /usr/local/bin/backup.sh

restore:
	@if [ -z "$(FILE)" ]; then \
		echo "Uso: make restore FILE=ged_fadex_YYYYMMDD_HHMMSS.sql.gz"; \
		echo ""; \
		echo "Backups disponíveis:"; \
		ls -lh backups/ged_fadex_*.sql.gz 2>/dev/null || echo "  Nenhum backup encontrado"; \
	else \
		docker compose exec backup /bin/sh -c "gunzip -c /backups/$(FILE) | psql --single-transaction --set ON_ERROR_STOP=on"; \
	fi
