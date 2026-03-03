package main

import (
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	secret := os.Getenv("NEXTAUTH_SECRET")
	if secret == "" {
		fmt.Fprintln(os.Stderr, "NEXTAUTH_SECRET não configurada")
		os.Exit(1)
	}

	email := "suporteti@fadex.org.br"
	if len(os.Args) > 1 {
		email = os.Args[1]
	}

	claims := jwt.MapClaims{
		"email": email,
		"name":  "Admin GED",
		"sub":   "test-user-1",
		"iat":   time.Now().Unix(),
		"exp":   time.Now().Add(1 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(secret))
	if err != nil {
		fmt.Fprintf(os.Stderr, "erro ao assinar token: %v\n", err)
		os.Exit(1)
	}

	fmt.Println(signed)
}
