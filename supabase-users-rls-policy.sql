-- Add missing RLS policy for users table
-- This policy allows all operations for development
-- Remove or update this when implementing authentication

CREATE POLICY "Allow all for development" ON users FOR ALL USING (true);
