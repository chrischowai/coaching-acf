-- Migration: Remove timeline_start and timeline_end fields, update status constraint
-- Run this in Supabase SQL Editor
-- Created: 2025-10-29

-- Step 1: Drop the columns timeline_start and timeline_end
-- These are no longer needed as we're using due_date exclusively
ALTER TABLE action_plans DROP COLUMN IF EXISTS timeline_start;
ALTER TABLE action_plans DROP COLUMN IF EXISTS timeline_end;

-- Step 2: Update the status check constraint to remove 'blocked'
-- First, drop the existing constraint
ALTER TABLE action_plans DROP CONSTRAINT IF EXISTS action_plans_status_check;

-- Add the new constraint without 'blocked'
ALTER TABLE action_plans ADD CONSTRAINT action_plans_status_check 
  CHECK (status IN ('pending', 'in_progress', 'completed'));

-- Step 3: Update any existing 'blocked' status records to 'pending'
-- This ensures data consistency before the constraint is enforced
UPDATE action_plans SET status = 'pending' WHERE status = 'blocked';

-- Step 4: Verify the changes
-- Run these queries to confirm the migration worked:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'action_plans';
-- SELECT DISTINCT status FROM action_plans;
