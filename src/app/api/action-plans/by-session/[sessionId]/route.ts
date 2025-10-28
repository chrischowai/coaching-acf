import { NextRequest, NextResponse } from 'next/server';
import { getActionPlansBySession } from '@/lib/supabase/action-plans';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    console.log('GET /api/action-plans/by-session/[sessionId] - SessionID:', sessionId);
    
    const actionPlans = await getActionPlansBySession(sessionId);
    console.log('GET /api/action-plans/by-session/[sessionId] - Found plans:', actionPlans?.length);

    return NextResponse.json(actionPlans);
  } catch (error) {
    console.error('Error fetching session action plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch action plans' },
      { status: 500 }
    );
  }
}
