package service

import (
	"context"
	"fmt"
	"io"
	"path"
	"strings"
	"sync"
	"time"

	"github.com/rs/zerolog/log"
	"google.golang.org/api/drive/v3"
	"google.golang.org/api/option"
)

// DriveService gerencia upload/download de arquivos no Google Drive (Shared Drive).
type DriveService struct {
	svc          *drive.Service
	rootFolderID string // ID do Shared Drive ou pasta raiz
	driveID      string // ID do Shared Drive (pode ser igual ao rootFolderID)
	folderCache  sync.Map
}

// NewDriveService cria uma instância do DriveService com Service Account.
// driveID é o ID do Shared Drive; rootFolderID é a pasta raiz dentro dele (ou o próprio driveID).
func NewDriveService(credentialsFile, rootFolderID, driveID string) (*DriveService, error) {
	ctx := context.Background()
	svc, err := drive.NewService(ctx, option.WithCredentialsFile(credentialsFile))
	if err != nil {
		return nil, fmt.Errorf("erro ao criar serviço Google Drive: %w", err)
	}

	if driveID == "" {
		driveID = rootFolderID
	}

	return &DriveService{
		svc:          svc,
		rootFolderID: rootFolderID,
		driveID:      driveID,
	}, nil
}

// Upload envia um arquivo ao Google Drive na pasta ROOT/{ano}/{mes}/{protocolNumber}/.
func (d *DriveService) Upload(ctx context.Context, protocolNumber, fileName, mimeType string, reader io.Reader) (fileID, webURL, folderID string, err error) {
	folderID, err = d.ensureProtocolFolder(ctx, protocolNumber)
	if err != nil {
		return "", "", "", fmt.Errorf("erro ao criar pasta no Drive: %w", err)
	}

	f := &drive.File{
		Name:     sanitizeFileName(fileName),
		Parents:  []string{folderID},
		MimeType: mimeType,
	}

	result, err := d.svc.Files.Create(f).
		Context(ctx).
		SupportsAllDrives(true).
		Media(reader).
		Fields("id, webViewLink").
		Do()
	if err != nil {
		return "", "", "", fmt.Errorf("erro ao fazer upload no Drive: %w", err)
	}

	return result.Id, result.WebViewLink, folderID, nil
}

// Download baixa um arquivo do Google Drive.
func (d *DriveService) Download(ctx context.Context, fileID string) (io.ReadCloser, string, int64, error) {
	// Buscar metadados
	f, err := d.svc.Files.Get(fileID).Context(ctx).SupportsAllDrives(true).Fields("name, size, mimeType").Do()
	if err != nil {
		return nil, "", 0, fmt.Errorf("erro ao buscar metadados do arquivo no Drive: %w", err)
	}

	// Download do conteúdo
	resp, err := d.svc.Files.Get(fileID).Context(ctx).SupportsAllDrives(true).Download()
	if err != nil {
		return nil, "", 0, fmt.Errorf("erro ao baixar arquivo do Drive: %w", err)
	}

	return resp.Body, f.Name, f.Size, nil
}

// Delete remove um arquivo do Google Drive.
func (d *DriveService) Delete(ctx context.Context, fileID string) error {
	if err := d.svc.Files.Delete(fileID).Context(ctx).SupportsAllDrives(true).Do(); err != nil {
		return fmt.Errorf("erro ao deletar arquivo do Drive: %w", err)
	}
	return nil
}

// ensureProtocolFolder cria (ou retorna do cache) a pasta hierárquica para o protocolo.
func (d *DriveService) ensureProtocolFolder(ctx context.Context, protocolNumber string) (string, error) {
	now := time.Now()
	yearStr := fmt.Sprintf("%d", now.Year())
	monthStr := fmt.Sprintf("%02d", now.Month())
	cacheKey := yearStr + "/" + monthStr + "/" + protocolNumber

	if id, ok := d.folderCache.Load(cacheKey); ok {
		return id.(string), nil
	}

	yearFolderID, err := d.findOrCreateFolder(ctx, yearStr, d.rootFolderID)
	if err != nil {
		return "", err
	}

	monthFolderID, err := d.findOrCreateFolder(ctx, monthStr, yearFolderID)
	if err != nil {
		return "", err
	}

	protoFolderID, err := d.findOrCreateFolder(ctx, protocolNumber, monthFolderID)
	if err != nil {
		return "", err
	}

	d.folderCache.Store(cacheKey, protoFolderID)
	return protoFolderID, nil
}

// findOrCreateFolder busca ou cria uma pasta no Shared Drive.
func (d *DriveService) findOrCreateFolder(ctx context.Context, name, parentID string) (string, error) {
	q := fmt.Sprintf(
		"name = '%s' and '%s' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
		strings.ReplaceAll(name, "'", "\\'"),
		parentID,
	)

	listCall := d.svc.Files.List().
		Context(ctx).
		Q(q).
		IncludeItemsFromAllDrives(true).
		SupportsAllDrives(true).
		Fields("files(id)").
		PageSize(1)

	if d.driveID != "" {
		listCall = listCall.DriveId(d.driveID).Corpora("drive")
	}

	list, err := listCall.Do()
	if err != nil {
		return "", fmt.Errorf("erro ao buscar pasta '%s' no Drive: %w", name, err)
	}

	if len(list.Files) > 0 {
		return list.Files[0].Id, nil
	}

	// Criar pasta no Shared Drive
	folder := &drive.File{
		Name:     name,
		Parents:  []string{parentID},
		MimeType: "application/vnd.google-apps.folder",
	}
	created, err := d.svc.Files.Create(folder).
		Context(ctx).
		SupportsAllDrives(true).
		Fields("id").
		Do()
	if err != nil {
		return "", fmt.Errorf("erro ao criar pasta '%s' no Drive: %w", name, err)
	}

	log.Info().Str("folder", name).Str("parent", parentID).Str("id", created.Id).Msg("pasta criada no Google Drive")
	return created.Id, nil
}

// sanitizeFileName limpa o nome do arquivo para upload.
func sanitizeFileName(name string) string {
	name = path.Base(name)
	// Remover caracteres problemáticos
	replacer := strings.NewReplacer(
		"/", "_",
		"\\", "_",
		":", "_",
		"*", "_",
		"?", "_",
		"\"", "_",
		"<", "_",
		">", "_",
		"|", "_",
	)
	return replacer.Replace(name)
}
