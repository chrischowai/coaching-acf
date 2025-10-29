-- Add coaching_theme field to action_plans table
-- This field will store the coaching theme heading from the Session Summary
ALTER TABLE action_plans
ADD COLUMN coaching_theme TEXT;

-- Add coaching_theme field to coaching_sessions table 
-- This will be the source of truth for the theme
ALTER TABLE coaching_sessions
ADD COLUMN coaching_theme TEXT;

-- Create index for better query performance
CREATE INDEX idx_action_plans_coaching_theme ON action_plans(coaching_theme);
CREATE INDEX idx_coaching_sessions_coaching_theme ON coaching_sessions(coaching_theme);

-- Update existing action_plans to populate coaching_theme from session data
-- This will be done via application code when sessions are completed
