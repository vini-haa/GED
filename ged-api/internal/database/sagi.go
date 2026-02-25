package database

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	_ "github.com/denisenkom/go-mssqldb"
	"github.com/rs/zerolog/log"
)

func ConnectSAGI(ctx context.Context, connectionString string) (*sql.DB, error) {
	db, err := sql.Open("sqlserver", connectionString)
	if err != nil {
		return nil, fmt.Errorf("erro ao abrir conexão SAGI: %w", err)
	}

	db.SetMaxOpenConns(5)
	db.SetMaxIdleConns(2)
	db.SetConnMaxLifetime(15 * time.Minute)

	if err := db.PingContext(ctx); err != nil {
		db.Close()
		return nil, fmt.Errorf("erro ao conectar SAGI (SQL Server): %w", err)
	}

	log.Info().Msg("SAGI (SQL Server) conectado com sucesso")
	return db, nil
}
