import { createClient } from './client';

export interface SessionData {
  id?: string;
  session_type: 'coach_led' | 'self_coaching';
  current_stage: number;
  is_complete: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StageResponse {
  id?: string;
  session_id: string;
  stage_number: number;
  stage_name: string;
  responses: any; // JSON object with all messages
  completed_at?: string;
}

export interface ActionPlan {
  id?: string;
  session_id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'in_progress' | 'completed';
}

const supabase = createClient();

/**
 * Create a new coaching session
 */
export async function createSession(sessionType: 'coach_led' | 'self_coaching') {
  const { data, error } = await supabase
    .from('coaching_sessions')
    .insert({
      session_type: sessionType,
      current_stage: 1,
      is_complete: false,
      user_id: null, // Will be null until we add auth
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating session:', error);
    throw error;
  }

  return data;
}

/**
 * Update session stage and completion status
 */
export async function updateSession(
  sessionId: string,
  updates: Partial<SessionData>
) {
  const { data, error } = await supabase
    .from('coaching_sessions')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    console.error('Error updating session:', error);
    throw error;
  }

  return data;
}

/**
 * Save stage responses (conversation history)
 */
export async function saveStageResponse(stageData: StageResponse) {
  console.log('Attempting to save stage response:', {
    session_id: stageData.session_id,
    stage_number: stageData.stage_number,
    stage_name: stageData.stage_name,
    has_responses: !!stageData.responses,
  });

  const { data, error } = await supabase
    .from('stage_responses')
    .upsert({
      session_id: stageData.session_id,
      stage_number: stageData.stage_number,
      stage_name: stageData.stage_name,
      responses: stageData.responses,
      completed_at: stageData.completed_at,
    }, {
      onConflict: 'session_id,stage_number',
      ignoreDuplicates: false
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving stage response:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error details:', error.details);
    console.error('Error hint:', error.hint);
    console.error('Full error:', JSON.stringify(error, null, 2));
    throw error;
  }

  console.log('Stage response saved successfully:', data?.id);
  return data;
}

/**
 * Get all sessions (latest first)
 */
export async function getSessions() {
  const { data, error } = await supabase
    .from('coaching_sessions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching sessions:', error);
    throw error;
  }

  return data;
}

/**
 * Get a single session with all stage responses
 */
export async function getSession(sessionId: string) {
  const { data: session, error: sessionError } = await supabase
    .from('coaching_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (sessionError) {
    console.error('Error fetching session:', sessionError);
    throw sessionError;
  }

  const { data: stages, error: stagesError } = await supabase
    .from('stage_responses')
    .select('*')
    .eq('session_id', sessionId)
    .order('stage_number', { ascending: true });

  if (stagesError) {
    console.error('Error fetching stage responses:', stagesError);
    throw stagesError;
  }

  return { session, stages };
}

/**
 * Delete a session and all related data
 */
export async function deleteSession(sessionId: string) {
  const { error } = await supabase
    .from('coaching_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) {
    console.error('Error deleting session:', error);
    throw error;
  }

  return true;
}

/**
 * Save action plans from session summary
 */
export async function saveActionPlans(sessionId: string, actions: ActionPlan[]) {
  const { data, error } = await supabase
    .from('action_plans')
    .insert(
      actions.map((action) => ({
        session_id: sessionId,
        title: action.title,
        description: action.description,
        due_date: action.due_date,
        priority: action.priority || 'medium',
        status: action.status || 'pending',
      }))
    )
    .select();

  if (error) {
    console.error('Error saving action plans:', error);
    throw error;
  }

  return data;
}

/**
 * Get all action plans for a session
 */
export async function getActionPlans(sessionId: string) {
  const { data, error } = await supabase
    .from('action_plans')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching action plans:', error);
    throw error;
  }

  return data;
}
