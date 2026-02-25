package database

import (
	"errors"
	"fmt"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/rs/zerolog/log"
)

func RunMigrations(databaseURL string, migrationsPath string) error {
	source := fmt.Sprintf("file://%s", migrationsPath)

	m, err := migrate.New(source, databaseURL)
	if err != nil {
		return fmt.Errorf("erro ao inicializar migrations: %w", err)
	}
	defer m.Close()

	if err := m.Up(); err != nil {
		if errors.Is(err, migrate.ErrNoChange) {
			log.Info().Msg("migrations: nenhuma alteração pendente")
			return nil
		}
		return fmt.Errorf("erro ao executar migrations: %w", err)
	}

	version, dirty, _ := m.Version()
	log.Info().Uint("version", version).Bool("dirty", dirty).Msg("migrations aplicadas com sucesso")
	return nil
}
