// ACF Coaching Flow Type Definitions

export type CoachingStage = 1 | 2 | 3 | 4 | 5;

export type UserType = 'coach' | 'individual';

export type SessionType = 'coach_led' | 'self_coaching';

export interface User {
  id: string;
  email?: string;
  full_name?: string;
  user_type: UserType;
  created_at: string;
}

export interface CoachingSession {
  id: string;
  user_id?: string;
  session_type: SessionType;
  current_stage: CoachingStage;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

// Stage 1: Check In
export interface CheckInData {
  presence_level: number; // 1-10
  emotional_state: string[];
  previous_actions_reviewed: boolean;
  previous_actions_completed: string[];
  readiness: number; // 1-10
  notes?: string;
}

// Stage 2: Starting Point (A)
export interface StartingPointData {
  topic: string;
  topic_category: string;
  importance: number; // 1-10
  problem_statement: string;
  current_state_rating: number; // 1-10
  strengths: string[];
  obstacles: string[];
  resources: string[];
  context_notes?: string;
  key_themes: string[];
}

// Stage 3: Connect (C)
export interface ConnectData {
  options_generated: string[];
  insights_captured: string[];
  assumptions_challenged: string[];
  barriers: string[];
  resources_identified: string[];
  future_vision: string;
  energy_level: number; // 1-10
}

// Stage 4: Finish (F)
export interface FinishData {
  goal_statement: string;
  goal_type: string;
  smart_criteria: SMARTCriteria;
  action_steps: ActionStep[];
  obstacles_anticipated: string[];
  contingency_plans: string[];
  commitment_level: number; // 1-10
  confidence_level: number; // 1-10
  accountability_method: string;
  next_check_in?: string;
}

export interface SMARTCriteria {
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  time_bound: string;
}

export interface ActionStep {
  action: string;
  deadline: string;
  resources_needed: string[];
  responsible_party: string;
  completed?: boolean;
}

// Stage 5: Check Out
export interface CheckOutData {
  key_learnings: string[];
  insights_captured: string[];
  action_commitments_confirmed: boolean;
  session_value_rating: number; // 1-10
  clarity_level: number; // 1-10
  client_feedback?: string;
  next_session_scheduled?: string;
}

export interface StageResponse {
  id: string;
  session_id: string;
  stage_number: CoachingStage;
  stage_name: string;
  responses: CheckInData | StartingPointData | ConnectData | FinishData | CheckOutData;
  completed_at?: string;
  created_at: string;
}

export interface ActionPlan {
  id: string;
  session_id: string;
  title: string;
  description?: string;
  goal_statement: string;
  smart_criteria: SMARTCriteria;
  priority: number; // 1-5
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  timeline_start?: string;
  timeline_end?: string;
  created_at: string;
}

export interface Milestone {
  id: string;
  action_plan_id: string;
  title: string;
  description?: string;
  due_date?: string;
  completed: boolean;
  completed_at?: string;
  created_at: string;
}

// UI State Types
export interface UIState {
  currentStage: CoachingStage;
  isNavigating: boolean;
  isSaving: boolean;
  showHelp: boolean;
  darkMode: boolean;
}

// Question Bank Types
export interface Question {
  id: string;
  stage: CoachingStage;
  category: string;
  text: string;
  type: 'open' | 'scale' | 'multi_choice' | 'checklist';
  options?: string[];
  placeholder?: string;
}
