-- Migration 002: per-node execution logging
-- Run once against your existing flowforge database:
--   docker exec -i flowforge-postgres psql -U postgres -d flowforge < config/migration_002_run_steps.sql

CREATE TABLE IF NOT EXISTS workflow_run_steps (
    id SERIAL PRIMARY KEY,
    run_id INT NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
    node_id VARCHAR(100) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'running'
        CHECK (status IN ('running', 'success', 'failed', 'retrying')),
    input_config JSONB,
    output_result JSONB,
    error_message TEXT,
    attempt INT NOT NULL DEFAULT 1,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_run_steps_run_id ON workflow_run_steps(run_id);
