DROP INDEX IF EXISTS idx_activity_logs_protocol_id;
ALTER TABLE activity_logs
    DROP COLUMN IF EXISTS protocol_source,
    DROP COLUMN IF EXISTS protocol_number,
    DROP COLUMN IF EXISTS protocol_id,
    DROP COLUMN IF EXISTS user_agent;
