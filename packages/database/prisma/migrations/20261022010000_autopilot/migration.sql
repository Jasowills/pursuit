ALTER TABLE "workflow_drafts" ADD COLUMN "automation_key" TEXT;
CREATE UNIQUE INDEX "workflow_drafts_automation_key_key" ON "workflow_drafts"("automation_key");
CREATE TABLE "autopilot_configs" (
 "id" TEXT NOT NULL, "tenant_id" TEXT NOT NULL, "user_id" TEXT NOT NULL,
 "mode" TEXT NOT NULL DEFAULT 'research', "enabled" BOOLEAN NOT NULL DEFAULT false, "boards" JSONB NOT NULL DEFAULT '[]', "keywords" JSONB NOT NULL DEFAULT '[]',
 "interval_minutes" INTEGER NOT NULL DEFAULT 360, "max_drafts" INTEGER NOT NULL DEFAULT 3, "min_fit" INTEGER NOT NULL DEFAULT 40,
 "connection_id" TEXT, "resume" TEXT NOT NULL DEFAULT '', "revision" INTEGER NOT NULL DEFAULT 1,
 "next_run_at" TIMESTAMP(3), "lease_token" TEXT, "lease_until" TIMESTAMP(3),
 "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "autopilot_configs_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "autopilot_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "autopilot_configs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "autopilot_configs_tenant_id_user_id_key" ON "autopilot_configs"("tenant_id","user_id");
CREATE INDEX "autopilot_configs_enabled_next_run_at_idx" ON "autopilot_configs"("enabled","next_run_at");
CREATE TABLE "autopilot_runs" (
 "id" TEXT NOT NULL, "config_id" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'RUNNING',
 "discovered" INTEGER NOT NULL DEFAULT 0, "prepared" INTEGER NOT NULL DEFAULT 0, "skipped" INTEGER NOT NULL DEFAULT 0,
 "summary" JSONB NOT NULL DEFAULT '[]', "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "finished_at" TIMESTAMP(3),
 CONSTRAINT "autopilot_runs_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "autopilot_runs_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "autopilot_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "autopilot_runs_config_id_started_at_idx" ON "autopilot_runs"("config_id","started_at");
