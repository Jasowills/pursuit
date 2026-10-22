CREATE TABLE "user_connections" (
  "id" TEXT NOT NULL, "tenant_id" TEXT NOT NULL, "user_id" TEXT NOT NULL,
  "provider" TEXT NOT NULL, "ciphertext" TEXT NOT NULL,
  "models" JSONB NOT NULL DEFAULT '[]', "model" TEXT, "tested_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_connections_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "user_connections_tenant_id_user_id_provider_key"
  ON "user_connections"("tenant_id", "user_id", "provider");
CREATE TABLE "workflow_drafts" (
  "id" TEXT NOT NULL, "tenant_id" TEXT NOT NULL, "user_id" TEXT NOT NULL,
  "job_id" TEXT NOT NULL, "connection_id" TEXT NOT NULL, "model" TEXT NOT NULL,
  "source_resume" TEXT NOT NULL, "content" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT', "approval_hash" TEXT,
  "expires_at" TIMESTAMP(3), "receipt" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "workflow_drafts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "workflow_drafts_tenant_id_user_id_created_at_idx"
  ON "workflow_drafts"("tenant_id", "user_id", "created_at");
