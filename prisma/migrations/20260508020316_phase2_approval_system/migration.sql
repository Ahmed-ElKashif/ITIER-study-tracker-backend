-- ==========================================================
-- Phase 2 Migration: Approval System & Role Hierarchy
-- Generated: 2026-05-08
-- ==========================================================

-- ==================== STEP 1: NEW ENUMS ====================

-- Create the StudentStatus enum
CREATE TYPE "StudentStatus" AS ENUM (
  'PENDING_APPROVAL',
  'ACTIVE',
  'SUSPENDED',
  'ARCHIVED'
);

-- Add ADMIN to the existing Role enum (safe, additive operation)
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ADMIN';

-- ==================== STEP 2: ALTER USERS TABLE ====================

-- Add status column with a safe default for all existing rows
ALTER TABLE "users"
  ADD COLUMN "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE';

-- Existing users were implicitly approved in Phase 1 — keep them ACTIVE
-- (New registrations post-migration will default to PENDING_APPROVAL via app logic)

-- Allow trackId to be nullable (admins have no track)
ALTER TABLE "users"
  ALTER COLUMN "trackId" DROP NOT NULL;

-- Add indexes for common query patterns
CREATE INDEX IF NOT EXISTS "users_status_idx" ON "users"("status");
CREATE INDEX IF NOT EXISTS "users_role_idx"   ON "users"("role");

-- ==================== STEP 3: ALTER TRACKS TABLE ====================

-- Add new management columns
ALTER TABLE "tracks"
  ADD COLUMN "description" TEXT,
  ADD COLUMN "duration"    VARCHAR(50),
  ADD COLUMN "maxStudents" INTEGER,
  ADD COLUMN "isActive"    BOOLEAN NOT NULL DEFAULT true;

-- Add createdById column (will replace the stale supervisorId)
ALTER TABLE "tracks"
  ADD COLUMN "createdById" INTEGER;

-- Migrate existing tracks: assign the first supervisor as their creator
DO $$
DECLARE
  first_supervisor_id INTEGER;
BEGIN
  SELECT id INTO first_supervisor_id
    FROM "users"
   WHERE "role" = 'SUPERVISOR'
   LIMIT 1;

  IF first_supervisor_id IS NOT NULL THEN
    UPDATE "tracks"
       SET "createdById" = first_supervisor_id
     WHERE "createdById" IS NULL;
  END IF;
END $$;

-- Now enforce NOT NULL on createdById
ALTER TABLE "tracks"
  ALTER COLUMN "createdById" SET NOT NULL;

-- Add proper foreign key constraint
ALTER TABLE "tracks"
  ADD CONSTRAINT "tracks_createdById_fkey"
    FOREIGN KEY ("createdById")
    REFERENCES "users"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- Drop the old stale supervisorId column (no FK, was just a plain int)
ALTER TABLE "tracks"
  DROP COLUMN IF EXISTS "supervisorId";

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS "tracks_createdById_idx" ON "tracks"("createdById");
CREATE INDEX IF NOT EXISTS "tracks_isActive_idx"    ON "tracks"("isActive");
