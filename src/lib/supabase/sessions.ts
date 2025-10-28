import { createClient } from './client';

export interface SessionData {
  id?: string;
  session_type: 'coach_led' | 'self_coaching';
  current_stage: number;
  is_complete: boolean;
  summary?: string;
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
  console.log('Creating new coaching session...');
  
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
    console.error('Error details:', JSON.stringify(error, null, 2));
    throw error;
  }

  if (!data) {
    throw new Error('Session created but no data returned');
  }

  console.log('Session created successfully:', data.id);
  
  // Verify the session was actually saved by reading it back
  const { data: verifyData, error: verifyError } = await supabase
    .from('coaching_sessions')
    .select('*')
    .eq('id', data.id)
    .single();

  if (verifyError || !verifyData) {
    console.error('Session verification failed:', verifyError);
    throw new Error('Session created but could not be verified');
  }

  console.log('Session verified:', verifyData.id);
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

  // First verify the session exists
  const { data: sessionCheck, error: sessionError } = await supabase
    .from('coaching_sessions')
    .select('id')
    .eq('id', stageData.session_id)
    .maybeSingle();

  if (sessionError) {
    console.error('Error checking session existence:', sessionError);
    throw new Error(`Failed to verify session exists: ${sessionError.message}`);
  }

  if (!sessionCheck) {
    console.error('Session not found in database:', stageData.session_id);
    throw new Error('Session not found. Please refresh and start a new session.');
  }

  console.log('Session verified, proceeding with stage response save');

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
  console.log('getSession called with sessionId:', sessionId);
  
  if (!sessionId || sessionId.trim() === '') {
    throw new Error('Invalid sessionId: ID cannot be empty');
  }
  
  const { data: session, error: sessionError } = await supabase
    .from('coaching_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  console.log('getSession result:', { 
    hasSession: !!session, 
    hasError: !!sessionError,
    errorMessage: sessionError?.message,
    errorCode: sessionError?.code,
    errorDetails: sessionError?.details 
  });

  if (sessionError) {
    const errorMsg = `Failed to fetch session ${sessionId}: ${sessionError.message || sessionError.code || 'Unknown error'}`;
    console.error(errorMsg, sessionError);
    throw new Error(errorMsg);
  }
  
  if (!session) {
    const errorMsg = `Session not found: ${sessionId}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
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

/**
 * Save the AI-generated summary for a session
 */
export async function saveSummary(sessionId: string, summary: string) {
  const { data, error } = await supabase
    .from('coaching_sessions')
    .update({ summary })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    console.error('Error saving summary:', error);
    throw error;
  }

  return data;
}

/**
 * Get the cached summary for a session
 * Returns null if no summary exists
 */
export async function getCachedSummary(sessionId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('coaching_sessions')
    .select('summary')
    .eq('id', sessionId)
    .single();

  if (error) {
    console.error('Error fetching cached summary:', error);
    throw error;
  }

  return data?.summary || null;
}
