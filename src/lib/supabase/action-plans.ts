import { createClient } from './client';

export interface ActionPlanExtended {
  id: string;
  session_id: string;
  title: string;
  description?: string;
  goal_statement?: string;
  smart_criteria?: any;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  due_date?: string;
  completed_at?: string;
  notes?: string;
  coaching_theme?: string;  // Coaching theme from session summary
  created_at: string;
  updated_at: string;
}

// Helper to convert integer priority from DB to string for TypeScript
function normalizePriority(priority: any): 'low' | 'medium' | 'high' {
  if (typeof priority === 'string') {
    return priority as 'low' | 'medium' | 'high';
  }
  // Database stores as integer (1-5)
  const numPriority = Number(priority);
  if (numPriority >= 4) return 'high';
  if (numPriority >= 2) return 'medium';
  return 'low';
}

// Helper to convert string priority to integer for DB
function priorityToInt(priority: 'low' | 'medium' | 'high'): number {
  switch (priority) {
    case 'high': return 5;
    case 'medium': return 3;
    case 'low': return 1;
    default: return 3;
  }
}

// Normalize action plan data from database
function normalizeActionPlan(data: any): ActionPlanExtended {
  return {
    ...data,
    priority: normalizePriority(data.priority),
  };
}

const supabase = createClient();

/**
 * Get all action plans (optionally filter by status)
 */
export async function getAllActionPlans(status?: string) {
  let query = supabase
    .from('action_plans')
    .select('*')
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching action plans:', error);
    throw error;
  }

  return data ? data.map(normalizeActionPlan) : [];
}

/**
 * Get a single action plan by ID
 */
export async function getActionPlanById(id: string) {
  const { data, error } = await supabase
    .from('action_plans')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching action plan:', error);
    throw error;
  }

  return data ? normalizeActionPlan(data) : null;
}

/**
 * Get action plans for a specific session
 */
export async function getActionPlansBySession(sessionId: string) {
  const { data, error } = await supabase
    .from('action_plans')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching session action plans:', error);
    throw error;
  }

  return data ? data.map(normalizeActionPlan) : [];
}

/**
 * Update action plan
 */
export async function updateActionPlan(
  id: string,
  updates: Partial<ActionPlanExtended>
) {
  // Convert priority to integer if present
  const dbUpdates: any = { ...updates };
  if (updates.priority) {
    dbUpdates.priority = priorityToInt(updates.priority);
  }
  
  const { data, error } = await supabase
    .from('action_plans')
    .update({
      ...dbUpdates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating action plan:', error);
    throw error;
  }

  return data ? normalizeActionPlan(data) : data;
}

/**
 * Mark action as complete
 */
export async function completeActionPlan(id: string, notes?: string) {
  return updateActionPlan(id, {
    status: 'completed',
    completed_at: new Date().toISOString(),
    notes: notes,
  });
}

/**
 * Mark action as in progress
 */
export async function startActionPlan(id: string) {
  return updateActionPlan(id, {
    status: 'in_progress',
  });
}

/**
 * Delete an action plan
 */
export async function deleteActionPlan(id: string) {
  const { error } = await supabase
    .from('action_plans')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting action plan:', error);
    throw error;
  }

  return true;
}

/**
 * Get action plans due soon (within X days)
 */
export async function getActionsPlansDueSoon(days: number = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  const { data, error } = await supabase
    .from('action_plans')
    .select('*')
    .neq('status', 'completed')
    .lte('due_date', futureDate.toISOString())
    .gte('due_date', new Date().toISOString())
    .order('due_date', { ascending: true });

  if (error) {
    console.error('Error fetching due soon action plans:', error);
    throw error;
  }

  return data ? data.map(normalizeActionPlan) : [];
}

/**
 * Get overdue action plans
 */
export async function getOverdueActionPlans() {
  const { data, error } = await supabase
    .from('action_plans')
    .select('*')
    .neq('status', 'completed')
    .lt('due_date', new Date().toISOString())
    .order('due_date', { ascending: true });

  if (error) {
    console.error('Error fetching overdue action plans:', error);
    throw error;
  }

  return data ? data.map(normalizeActionPlan) : [];
}

/**
 * Get action plan statistics
 */
export async function getActionPlanStats() {
  const { data: all, error: allError } = await supabase
    .from('action_plans')
    .select('status');

  if (allError) {
    console.error('Error fetching stats:', allError);
    throw allError;
  }

  const stats = {
    total: all.length,
    pending: all.filter((a) => a.status === 'pending').length,
    inProgress: all.filter((a) => a.status === 'in_progress').length,
    completed: all.filter((a) => a.status === 'completed').length,
    completionRate: all.length > 0
      ? Math.round((all.filter((a) => a.status === 'completed').length / all.length) * 100)
      : 0,
  };

  return stats;
}
