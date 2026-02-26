package repository

import (
	"context"
	"database/sql"
	"os"
	"testing"
	"time"

	_ "github.com/denisenkom/go-mssqldb"
)

// sagiDB retorna uma conexão real com o SAGI para testes de integração.
// Requer a variável SAGI_CONNECTION_STRING definida.
func sagiDB(t *testing.T) *sql.DB {
	t.Helper()

	connStr := os.Getenv("SAGI_CONNECTION_STRING")
	if connStr == "" {
		t.Skip("SAGI_CONNECTION_STRING não definida — pulando teste de integração SAGI")
	}

	db, err := sql.Open("sqlserver", connStr)
	if err != nil {
		t.Fatalf("erro ao abrir conexão SAGI: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		db.Close()
		t.Fatalf("erro ao conectar SAGI: %v", err)
	}

	t.Cleanup(func() { db.Close() })
	return db
}

func TestSAGIConnection(t *testing.T) {
	db := sagiDB(t)
	repo := NewSAGIRepository(db)

	ctx := context.Background()

	var result int
	err := repo.db.QueryRowContext(ctx, "SELECT 1").Scan(&result)
	if err != nil {
		t.Fatalf("query básica falhou: %v", err)
	}
	if result != 1 {
		t.Fatalf("esperado 1, recebeu %d", result)
	}
}

func TestListProtocolos(t *testing.T) {
	db := sagiDB(t)
	repo := NewSAGIRepository(db)

	ctx := context.Background()

	protocolos, err := repo.ListProtocolos(ctx, ProtocoloFiltros{
		Limit:  10,
		Offset: 0,
	})
	if err != nil {
		t.Fatalf("ListProtocolos falhou: %v", err)
	}

	t.Logf("retornou %d protocolos", len(protocolos))

	if len(protocolos) > 10 {
		t.Fatalf("esperado no máximo 10 protocolos, recebeu %d", len(protocolos))
	}

	for i, p := range protocolos {
		if p.NumeroProtocolo == 0 {
			t.Errorf("protocolo[%d]: NumeroProtocolo é 0", i)
		}
		if p.AnoProtocolo == 0 {
			t.Errorf("protocolo[%d]: AnoProtocolo é 0", i)
		}
		t.Logf("  protocolo[%d]: %d/%d — assunto=%v setor_origem=%v",
			i, p.NumeroProtocolo, p.AnoProtocolo, p.Assunto, p.SetorOrigem)
	}
}

func TestCountProtocolos(t *testing.T) {
	db := sagiDB(t)
	repo := NewSAGIRepository(db)

	ctx := context.Background()

	count, err := repo.CountProtocolos(ctx, ProtocoloFiltros{})
	if err != nil {
		t.Fatalf("CountProtocolos falhou: %v", err)
	}

	t.Logf("total de protocolos: %d", count)

	if count < 0 {
		t.Fatalf("count negativo: %d", count)
	}
}

func TestListProtocolosComFiltros(t *testing.T) {
	db := sagiDB(t)
	repo := NewSAGIRepository(db)

	ctx := context.Background()

	busca := "teste"
	protocolos, err := repo.ListProtocolos(ctx, ProtocoloFiltros{
		Busca:  &busca,
		Limit:  5,
		Offset: 0,
	})
	if err != nil {
		t.Fatalf("ListProtocolos com busca falhou: %v", err)
	}

	t.Logf("busca '%s': retornou %d protocolos", busca, len(protocolos))
}

func TestGetProtocoloByNumeroAno(t *testing.T) {
	db := sagiDB(t)
	repo := NewSAGIRepository(db)

	ctx := context.Background()

	// Busca primeiro um protocolo existente para testar
	protocolos, err := repo.ListProtocolos(ctx, ProtocoloFiltros{Limit: 1})
	if err != nil {
		t.Fatalf("ListProtocolos falhou: %v", err)
	}

	if len(protocolos) == 0 {
		t.Skip("nenhum protocolo encontrado para testar GetProtocoloByNumeroAno")
	}

	p := protocolos[0]
	resultado, err := repo.GetProtocoloByNumeroAno(ctx, p.NumeroProtocolo, p.AnoProtocolo)
	if err != nil {
		t.Fatalf("GetProtocoloByNumeroAno(%d, %d) falhou: %v", p.NumeroProtocolo, p.AnoProtocolo, err)
	}

	if resultado.NumeroProtocolo != p.NumeroProtocolo {
		t.Errorf("esperado numero=%d, recebeu %d", p.NumeroProtocolo, resultado.NumeroProtocolo)
	}
	if resultado.AnoProtocolo != p.AnoProtocolo {
		t.Errorf("esperado ano=%d, recebeu %d", p.AnoProtocolo, resultado.AnoProtocolo)
	}

	t.Logf("protocolo %d/%d encontrado: assunto=%v", resultado.NumeroProtocolo, resultado.AnoProtocolo, resultado.Assunto)
}

func TestGetSetoresByEmail(t *testing.T) {
	db := sagiDB(t)
	repo := NewSAGIRepository(db)

	ctx := context.Background()

	setores, err := repo.GetSetoresByEmail(ctx, "suporteti@fadex.org.br")
	if err != nil {
		t.Fatalf("GetSetoresByEmail falhou: %v", err)
	}

	t.Logf("setores para suporteti@fadex.org.br: %d", len(setores))
	for _, s := range setores {
		t.Logf("  setor: %d — %s", s.Codigo, s.Nome)
	}
}

func TestListSetores(t *testing.T) {
	db := sagiDB(t)
	repo := NewSAGIRepository(db)

	ctx := context.Background()

	setores, err := repo.ListSetores(ctx)
	if err != nil {
		t.Fatalf("ListSetores falhou: %v", err)
	}

	t.Logf("total de setores ativos: %d", len(setores))

	if len(setores) == 0 {
		t.Error("nenhum setor retornado — esperava pelo menos 1")
	}

	for _, s := range setores {
		if s.Codigo == 0 {
			t.Error("setor com codigo 0")
		}
		if s.Nome == "" {
			t.Errorf("setor %d com nome vazio", s.Codigo)
		}
	}
}

func TestBuildWhere(t *testing.T) {
	t.Run("sem filtros", func(t *testing.T) {
		where, args := buildWhere(ProtocoloFiltros{})
		if where != "WHERE 1=1" {
			t.Errorf("esperado 'WHERE 1=1', recebeu '%s'", where)
		}
		if len(args) != 0 {
			t.Errorf("esperado 0 args, recebeu %d", len(args))
		}
	})

	t.Run("com situacao", func(t *testing.T) {
		sit := "A"
		where, args := buildWhere(ProtocoloFiltros{Situacao: &sit})
		if len(args) != 1 {
			t.Errorf("esperado 1 arg, recebeu %d", len(args))
		}
		if where == "WHERE 1=1" {
			t.Error("esperava filtro de situacao no WHERE")
		}
	})

	t.Run("com todos filtros", func(t *testing.T) {
		sit := "A"
		setor := 5
		busca := "oficio"
		where, args := buildWhere(ProtocoloFiltros{
			Situacao: &sit,
			Setor:    &setor,
			Busca:    &busca,
		})
		if len(args) != 3 {
			t.Errorf("esperado 3 args, recebeu %d", len(args))
		}
		if where == "WHERE 1=1" {
			t.Error("esperava filtros no WHERE")
		}
		t.Logf("where: %s", where)
		t.Logf("args: %v", args)
	})
}
