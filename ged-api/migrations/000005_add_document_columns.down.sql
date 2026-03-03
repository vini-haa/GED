ALTER TABLE documentos
  DROP COLUMN IF EXISTS descricao,
  DROP COLUMN IF EXISTS uploaded_by_name,
  DROP COLUMN IF EXISTS google_drive_folder_id;
