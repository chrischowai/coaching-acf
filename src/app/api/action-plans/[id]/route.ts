import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    return NextResponse.json(normalized);
  } catch (error: any) {
    console.error('Error updating action plan:', error);
    return NextResponse.json(
      { error: 'Failed to update action plan', message: error.message },
      { status: 500 }
    );
  }
}
