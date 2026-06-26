CREATE TABLE "employee_face_profiles" (
  "id" TEXT NOT NULL,
  "employee_id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "embedding" JSONB NOT NULL,
  "embedding_model" TEXT NOT NULL,
  "embedding_dim" INTEGER NOT NULL,
  "match_threshold" DOUBLE PRECISION NOT NULL,
  "quality_score" DOUBLE PRECISION,
  "reference_image_key" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "employee_face_profiles_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "employee_face_profiles_workspace_id_idx"
  ON "employee_face_profiles"("workspace_id");

CREATE INDEX "employee_face_profiles_employee_id_is_active_idx"
  ON "employee_face_profiles"("employee_id", "is_active");

CREATE UNIQUE INDEX "employee_face_profiles_one_active_per_employee_idx"
  ON "employee_face_profiles"("employee_id")
  WHERE "is_active" = true;

ALTER TABLE "employee_face_profiles"
  ADD CONSTRAINT "employee_face_profiles_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "employees"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "employee_face_profiles"
  ADD CONSTRAINT "employee_face_profiles_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
