-- ACF Coaching App Database Schema
-- Run this in Supabase SQL Editor after creating your project

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for future auth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  full_name TEXT,
  user_type TEXT CHECK (user_type IN ('coach', 'individual')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coaching sessions
CREATE TABLE coaching_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_type TEXT CHECK (session_type IN ('coach_led', 'self_coaching')) NOT NULL,
  current_stage INTEGER DEFAULT 1 CHECK (current_stage BETWEEN 1 AND 5),
  is_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stage responses (stores data from each of the 5 stages)
CREATE TABLE stage_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES coaching_sessions(id) ON DELETE CASCADE NOT NULL,
  stage_number INTEGER CHECK (stage_number BETWEEN 1 AND 5) NOT NULL,
  stage_name TEXT NOT NULL,
  responses JSONB NOT NULL DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, stage_number)
);

-- Action plans (generated from Finish stage)
CREATE TABLE action_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES coaching_sessions(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  goal_statement TEXT NOT NULL,
  smart_criteria JSONB NOT NULL DEFAULT '{}',
  priority INTEGER CHECK (priority BETWEEN 1 AND 5) DEFAULT 3,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
  timeline_start DATE,
  timeline_end DATE,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Milestones and action items
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_plan_id UUID REFERENCES action_plans(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_sessions_user_id ON coaching_sessions(user_id);
CREATE INDEX idx_sessions_created_at ON coaching_sessions(created_at DESC);
CREATE INDEX idx_stage_responses_session_id ON stage_responses(session_id);
CREATE INDEX idx_action_plans_session_id ON action_plans(session_id);
CREATE INDEX idx_milestones_action_plan_id ON milestones(action_plan_id);

-- Enable Row Level Security (RLS) for future auth
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- Temporary policy: Allow all operations (remove when implementing auth)
CREATE POLICY "Allow all for development" ON coaching_sessions FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON stage_responses FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON action_plans FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON milestones FOR ALL USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON coaching_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_action_plans_updated_at BEFORE UPDATE ON action_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON milestones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
