import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Type definition for action plan
type ActionPlan = {
  id?: string;
  session_id?: string;
  title: string;
  description?: string;
  notes?: string;
  due_date?: string;
  priority?: number | string;
  status?: string;
  created_at?: string;
  updated_at?: string;
};

// Helper function to update session summary with current action plans
async function updateSessionSummary(supabase: any, sessionId: string) {
  console.log('=== Starting updateSessionSummary for session:', sessionId);
  
  // Fetch all action plans for this session
  const { data: actionPlans, error: plansError } = await supabase
    .from('action_plans')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (plansError || !actionPlans) {
    console.error('Failed to fetch action plans:', plansError);
    return;
  }
  
  // Type assertion for action plans
  const typedActionPlans = actionPlans as ActionPlan[];
  
  console.log('Found action plans:', typedActionPlans.length);

  // Fetch current session summary
  const { data: session, error: sessionError } = await supabase
    .from('coaching_sessions')
    .select('summary')
    .eq('id', sessionId)
    .single();

  if (sessionError || !session?.summary) {
    console.error('Failed to fetch session summary:', sessionError);
    return;
  }

  let updatedSummary = session.summary;
  console.log('Original summary length:', updatedSummary.length);

  // Convert priority numbers to text
  const normalizePriority = (priority: any): string => {
    if (typeof priority === 'string') return priority;
    const numPriority = Number(priority);
    if (numPriority >= 4) return 'high';
    if (numPriority >= 2) return 'medium';
    return 'low';
  };

  // Generate new action plan text matching the original format
  const newActionPlanText = typedActionPlans.map((plan, index) => {
    // Format date to match original format if exists
    let deadline = '';
    if (plan.due_date) {
      const date = new Date(plan.due_date);
      // Format: "*Deadline: Within 5 days (e.g., by Friday, Current Date + 3 days)**"
      deadline = `. **Deadline: ${date.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}**`;
    }
    
    // Match the original format more closely
    const description = plan.description || plan.notes || '';
    return `${index + 1}. **${plan.title}:** ${description}${deadline}`;
  }).join('\n');

  console.log('Generated new action plan text:', newActionPlanText.substring(0, 200));

  // Try multiple regex patterns to find the Action Plan section
  const patterns = [
    // Pattern 1: **Action Plan** followed by content until next **header** or end
    /\*\*Action Plan\*\*[\s\S]*?(?=\n\n\*\*|\n\n##|$)/gi,
    // Pattern 2: Action Plan with specific formatting
    /\*\*Action Plan\*\*\n[^\*]*(?:\n\d+\.[^\n]+)+/gi,
    // Pattern 3: Broader pattern for Action Plan section
    /\*\*Action Plan\*\*[\s\S]*?(?=\n\*\*[^*]|$)/gi,
    // Pattern 4: Match everything from Action Plan to the end of numbered list
    /\*\*Action Plan\*\*[\s\S]*?(?:\n\d+\.[^\n]+\n?)+/gi
  ];

  let replaced = false;
  for (const pattern of patterns) {
    if (pattern.test(updatedSummary)) {
      console.log('Pattern matched:', pattern);
      updatedSummary = updatedSummary.replace(pattern, 
        `**Action Plan**\nList 3-7 specific actions with timeline:\n${newActionPlanText}`);
      replaced = true;
      break;
    }
  }

  if (!replaced) {
    console.log('No Action Plan section found, appending new one');
    // If no action plan section found, try to add it before Success Metrics or at the end
    const metricsIndex = updatedSummary.indexOf('**Success Metrics**');
    if (metricsIndex > -1) {
      // Insert before Success Metrics
      updatedSummary = updatedSummary.slice(0, metricsIndex) + 
        `**Action Plan**\nList 3-7 specific actions with timeline:\n${newActionPlanText}\n\n` +
        updatedSummary.slice(metricsIndex);
    } else {
      // Append at the end
      updatedSummary += `\n\n**Action Plan**\nList 3-7 specific actions with timeline:\n${newActionPlanText}`;
    }
  }

  console.log('Updated summary length:', updatedSummary.length);
  console.log('Summary updated successfully');

  // Update the session summary in database
  const { error: updateError } = await supabase
    .from('coaching_sessions')
    .update({ 
      summary: updatedSummary,
      updated_at: new Date().toISOString()
    })
    .eq('id', sessionId);

  if (updateError) {
    console.error('Failed to update session summary:', updateError);
    throw updateError;
  }
  
  console.log('=== Session summary updated successfully in database');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id } = await params;
    
    console.log('PATCH /api/action-plans/[id] - ID:', id);
    console.log('PATCH /api/action-plans/[id] - Body:', body);
    
    // Helper to convert string priority to integer for DB
    const priorityToInt = (priority: string): number => {
      switch (priority) {
        case 'high': return 5;
        case 'medium': return 3;
        case 'low': return 1;
        default: return 3;
      }
    };
    
    // Helper to normalize priority from DB
    const normalizePriority = (priority: any): string => {
      if (typeof priority === 'string') return priority;
      const numPriority = Number(priority);
      if (numPriority >= 4) return 'high';
      if (numPriority >= 2) return 'medium';
      return 'low';
    };
    
    const supabase = await createClient();
    
    // Prepare updates
    const dbUpdates: any = { ...body };
    if (body.priority) {
      dbUpdates.priority = priorityToInt(body.priority);
    }
    
    // Update in database
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
      console.error('==================== UPDATE ERROR ====================');
      console.error('Error updating action plan:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('======================================================');
      return NextResponse.json(
        { 
          error: 'Failed to update action plan',
          details: {
            message: error.message,
            code: error.code
          }
        },
        { status: 500 }
      );
    }
    
    // Normalize priority in response
    const normalized = {
      ...data,
      priority: normalizePriority(data.priority),
    };
    
    console.log('PATCH /api/action-plans/[id] - Updated:', normalized);

    // Update the session summary to reflect the changes
    try {
      await updateSessionSummary(supabase, data.session_id);
      console.log('Session summary updated for session:', data.session_id);
    } catch (summaryError) {
      console.error('Failed to update session summary:', summaryError);
      // Don't fail the request if summary update fails
    }

    return NextResponse.json(normalized);
  } catch (error: any) {
    console.error('Error updating action plan:', error);
    return NextResponse.json(
      { error: 'Failed to update action plan', message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    console.log('DELETE /api/action-plans/[id] - ID:', id);
    
    const supabase = await createClient();
    
    // First, get the session_id before deleting
    const { data: actionPlan, error: fetchError } = await supabase
      .from('action_plans')
      .select('session_id')
      .eq('id', id)
      .single();
    
    if (fetchError || !actionPlan) {
      console.error('Error fetching action plan:', fetchError);
      return NextResponse.json(
        { error: 'Action plan not found' },
        { status: 404 }
      );
    }
    
    const sessionId = actionPlan.session_id;
    
    // Delete the action plan
    const { error: deleteError } = await supabase
      .from('action_plans')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('Error deleting action plan:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete action plan', details: deleteError },
        { status: 500 }
      );
    }
    
    console.log('Action plan deleted:', id);
    
    // Update the session summary to remove the deleted action
    try {
      await updateSessionSummary(supabase, sessionId);
      console.log('Session summary updated after deletion for session:', sessionId);
    } catch (summaryError) {
      console.error('Failed to update session summary after deletion:', summaryError);
      // Don't fail the request if summary update fails
    }
    
    return NextResponse.json({ success: true, message: 'Action plan deleted' });
  } catch (error: any) {
    console.error('Error deleting action plan:', error);
    return NextResponse.json(
      { error: 'Failed to delete action plan', message: error.message },
      { status: 500 }
    );
  }
}
