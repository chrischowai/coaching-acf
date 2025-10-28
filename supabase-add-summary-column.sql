-- Migration: Add summary column to coaching_sessions
-- This stores the AI-generated summary to avoid regenerating it every time

ALTER TABLE coaching_sessions 
ADD COLUMN summary TEXT;

-- Add comment to document the column
COMMENT ON COLUMN coaching_sessions.summary IS 'Cached AI-generated summary of the complete coaching session';
