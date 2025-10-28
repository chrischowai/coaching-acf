import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, actionItems } = body;
    
    console.log('POST /api/action-plans/create-from-summary');
    console.log('SessionID:', sessionId);
    console.log('Action items to create:', actionItems.length);

    if (!sessionId || !actionItems || !Array.isArray(actionItems)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Convert priority string to integer for database
    const priorityToInt = (priority: string): number => {
      switch (priority) {
        case 'high': return 5;
        case 'medium': return 3;
        case 'low': return 1;
        default: return 3;
      }
    };

    // Helper to validate and format date
    const formatDueDate = (dateStr: string | undefined | null): string | null => {
      if (!dateStr) return null;
      
      // Check if it's already in valid ISO/yyyy-MM-dd format
      const isoDatePattern = /^\d{4}-\d{2}-\d{2}/;
      if (isoDatePattern.test(dateStr)) {
        return dateStr;
      }
      
      // Try to parse as a date
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
      
      // If can't parse, return null (we'll keep the text in description)
      return null;
    };
    
    // Create action plans in the database
    const actionPlansToInsert = actionItems.map((item: any, index: number) => ({
      session_id: sessionId,
      title: item.title,
      description: item.description || '',
      goal_statement: item.title, // Use title as goal statement
      smart_criteria: {}, // Empty JSONB object
      status: item.status || 'pending',
      priority: priorityToInt(item.priority || 'medium'),
      due_date: formatDueDate(item.dueDate),
      reminder_enabled: item.reminderEnabled !== undefined ? item.reminderEnabled : true,
      reminder_frequency: item.reminderFrequency || 'daily',
      notes: item.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    console.log('Inserting action plans:', actionPlansToInsert);
    
    const { data, error } = await supabase
      .from('action_plans')
      .insert(actionPlansToInsert)
      .select();

    if (error) {
      console.error('==================== DATABASE ERROR ====================');
      console.error('Error creating action plans:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      console.error('========================================================');
      return NextResponse.json(
        { 
          error: 'Failed to create action plans', 
          details: {
            message: error.message,
            code: error.code,
            hint: error.hint,
            details: error.details
          }
        },
        { status: 500 }
      );
    }
    
    console.log('Successfully created action plans:', data?.length);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in create-from-summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
