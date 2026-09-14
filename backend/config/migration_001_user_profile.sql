-- Migration 001: add name and phone to users
-- Run once against your existing flowforge database:
--   docker exec -i flowforge-postgres psql -U postgres -d flowforge < config/migration_001_user_profile.sql

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS name    VARCHAR(100),
  ADD COLUMN IF NOT EXISTS phone   VARCHAR(30);

-- backfill name from email prefix for any existing accounts
UPDATE users SET name = split_part(email, '@', 1) WHERE name IS NULL;