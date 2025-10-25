-- Update action_plans table for tracking and reminders
-- Run this in Supabase SQL Editor

-- Add tracking columns to action_plans
ALTER TABLE action_plans ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE action_plans ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE action_plans ADD COLUMN IF NOT EXISTS reminder_frequency TEXT DEFAULT 'daily' CHECK (reminder_frequency IN ('none', 'daily', 'weekly', 'custom'));
ALTER TABLE action_plans ADD COLUMN IF NOT EXISTS last_reminder_sent TIMESTAMPTZ;
ALTER TABLE action_plans ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT true;

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  telegram_enabled BOOLEAN DEFAULT false,
  telegram_chat_id TEXT,
  frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'custom')),
  quiet_hours_start TIME DEFAULT '22:00:00',
  quiet_hours_end TIME DEFAULT '08:00:00',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_action_plans_status ON action_plans(status);
CREATE INDEX IF NOT EXISTS idx_action_plans_due_date ON action_plans(due_date);
CREATE INDEX IF NOT EXISTS idx_action_plans_session_id ON action_plans(session_id);

-- Add comments for documentation
COMMENT ON COLUMN action_plans.completed_at IS 'Timestamp when the action was marked as complete';
COMMENT ON COLUMN action_plans.notes IS 'User notes and reflections about this action';
COMMENT ON COLUMN action_plans.reminder_frequency IS 'How often to send reminders: none, daily, weekly, or custom';
COMMENT ON COLUMN action_plans.last_reminder_sent IS 'Last time a reminder was sent for this action';
COMMENT ON COLUMN action_plans.reminder_enabled IS 'Whether reminders are enabled for this action';

COMMENT ON TABLE notification_preferences IS 'User preferences for receiving action plan reminders';
