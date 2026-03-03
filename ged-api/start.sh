#!/bin/bash
cd /home/vinicius/Documentos/GED/ged-api
# Mata processo anterior se existir
pkill -f "go run ./cmd/server" 2>/dev/null
PID=$(lsof -i :4017 -t 2>/dev/null) && kill $PID 2>/dev/null
sleep 2
# Carrega .env e inicia
set -a
source .env
set +a
go run ./cmd/server &
sleep 3
echo "API iniciada na porta 4017"
curl -s http://localhost:4017/api/health
