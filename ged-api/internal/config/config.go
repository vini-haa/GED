package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	// PostgreSQL
	DatabaseURL string

	// SQL Server (SAGI)
	SAGIHost     string
	SAGIPort     string
	SAGIDatabase string
	SAGIUser     string
	SAGIPassword string

	// Auth
	NextAuthSecret     string
	GEDSuperAdminEmail string

	// Google Drive
	GoogleCredentialsFile string
	GoogleDriveRootFolder string

	// Server
	Port       string
	CORSOrigin string
	GinMode    string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	cfg := &Config{
		DatabaseURL: os.Getenv("DATABASE_URL"),

		SAGIHost:     os.Getenv("SAGI_HOST"),
		SAGIPort:     getEnvOrDefault("SAGI_PORT", "1433"),
		SAGIDatabase: getEnvOrDefault("SAGI_DATABASE", "fade1"),
		SAGIUser:     os.Getenv("SAGI_USER"),
		SAGIPassword: os.Getenv("SAGI_PASSWORD"),

		NextAuthSecret:     os.Getenv("NEXTAUTH_SECRET"),
		GEDSuperAdminEmail: getEnvOrDefault("GED_SUPER_ADMIN_EMAIL", "suporteti@fadex.org.br"),

		GoogleCredentialsFile: getEnvOrDefault("GOOGLE_APPLICATION_CREDENTIALS", "./credentials.json"),
		GoogleDriveRootFolder: os.Getenv("GOOGLE_DRIVE_ROOT_FOLDER_ID"),

		Port:       getEnvOrDefault("PORT", "4017"),
		CORSOrigin: getEnvOrDefault("CORS_ORIGIN", "http://localhost:4016"),
		GinMode:    getEnvOrDefault("GIN_MODE", "debug"),
	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL é obrigatória")
	}

	return cfg, nil
}

func (c *Config) SAGIConnectionString() string {
	return fmt.Sprintf(
		"sqlserver://%s:%s@%s:%s?database=%s&encrypt=disable",
		c.SAGIUser, c.SAGIPassword, c.SAGIHost, c.SAGIPort, c.SAGIDatabase,
	)
}

func getEnvOrDefault(key, defaultValue string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultValue
}
