.PHONY: run build docker-up docker-down migrate-up migrate-down sqlc-generate

DATABASE_URL ?= postgres://ged_user:ged_password@localhost:5432/ged_fadex?sslmode=disable

run:
	go run ./cmd/server

run-migrate:
	go run ./cmd/server --migrate

build:
	CGO_ENABLED=0 go build -ldflags="-s -w" -o bin/ged-api ./cmd/server

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

migrate-up:
	migrate -path migrations -database "$(DATABASE_URL)" up

migrate-down:
	migrate -path migrations -database "$(DATABASE_URL)" down

migrate-version:
	migrate -path migrations -database "$(DATABASE_URL)" version

migrate-force:
	migrate -path migrations -database "$(DATABASE_URL)" force $(VERSION)

sqlc-generate:
	cd sqlc && sqlc generate
