-- 000010_admins_setor.up.sql
-- Adiciona campo setor na tabela admins para vincular admin a um setor SAGI.

ALTER TABLE admins ADD COLUMN IF NOT EXISTS setor VARCHAR(10) DEFAULT '';
