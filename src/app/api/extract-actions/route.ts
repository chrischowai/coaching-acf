import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, summary } = await req.json();

    if (!sessionId || !summary) {
      return NextResponse.json(
        { error: 'Missing sessionId or summary' },
        { status: 400 }
      );
    }

    // Extract action items from the summary using AI
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const extractionPrompt = `Analyze this coaching session summary and extract ONLY the action items into a structured JSON format.

Summary:
${summary}

Extract each action item and format as JSON array. For each action:
1. Extract the title (main action description)
2. Extract or infer a due date (if mentioned, otherwise suggest based on context)
3. Determine priority (high/medium/low based on importance and urgency)
4. Add a brief description if context is available

IMPORTANT: 
- Return ONLY valid JSON, no markdown formatting
- Use this exact structure: [{"title": "...", "description": "...", "due_date": "YYYY-MM-DD", "priority": "high|medium|low"}]
- If no specific due date mentioned, suggest reasonable deadlines (1-4 weeks from now)
- Priority: high = urgent/critical, medium = important, low = nice to have
- Minimum 3 actions, maximum 7 actions

Example output:
[
  {
    "title": "Complete online course module 1",
    "description": "Finish the first module of the coding bootcamp",
    "due_date": "2025-11-02",
    "priority": "high"
  },
  {
    "title": "Practice coding exercises daily",
    "description": "Dedicate 30 minutes each day to coding practice",
    "due_date": "2025-11-30",
    "priority": "medium"
  }
]`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: extractionPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3, // Lower temperature for more consistent output
            maxOutputTokens: 2000,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      throw new Error('AI API request failed');
    }

    const data = await response.json();
    let actionsText = data.candidates[0].content.parts[0].text;

    // Clean up the response (remove markdown code blocks if present)
    actionsText = actionsText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse the JSON
    let actions;
    try {
      actions = JSON.parse(actionsText);
    } catch (parseError) {
      console.error('Failed to parse actions JSON:', actionsText);
      // Fallback: Create a single action plan from the goal
      const goalMatch = summary.match(/\*\*Goal Statement\*\*[:\s]*([^*]+)/i);
      actions = [{
        title: goalMatch ? goalMatch[1].trim().substring(0, 200) : 'Complete coaching action items',
        description: 'Review your session summary and complete the identified actions',
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 weeks from now
        priority: 'medium'
      }];
    }

    // Validate and clean actions
    const validActions = actions
      .filter((action: any) => action.title && action.title.trim().length > 0)
      .map((action: any) => ({
        title: action.title.substring(0, 255), // Limit title length
        description: action.description?.substring(0, 1000) || '', // Limit description
        due_date: action.due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: ['low', 'medium', 'high'].includes(action.priority) ? action.priority : 'medium',
        status: 'pending' as const,
      }));

    if (validActions.length === 0) {
      throw new Error('No valid actions extracted from summary');
    }

    // Save to database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // CRITICAL: Verify the session exists before creating action plans
    console.log('Verifying session exists before creating action plans:', sessionId);
    const { data: sessionCheck, error: sessionCheckError } = await supabase
      .from('coaching_sessions')
      .select('id, is_complete')
      .eq('id', sessionId)
      .maybeSingle();
    
    if (sessionCheckError) {
      console.error('Error verifying session:', sessionCheckError);
      throw new Error(`Failed to verify session: ${sessionCheckError.message}`);
    }
    
    if (!sessionCheck) {
      console.error('Session not found in database:', sessionId);
      throw new Error(`Session ${sessionId} not found. Cannot create action plans.`);
    }
    
    console.log('Session verified:', sessionCheck);
    
    // First get the goal statement for the action plans table
    const goalMatch = summary.match(/\*\*Goal Statement\*\*[:\s]*([^*]+)/i);
    const goalStatement = goalMatch ? goalMatch[1].trim().substring(0, 500) : 'Coaching session goals';

    const { data: savedActions, error } = await supabase
      .from('action_plans')
      .insert(
        validActions.map((action: any) => ({
          session_id: sessionId,
          title: action.title,
          description: action.description,
          goal_statement: goalStatement,
          smart_criteria: {}, // Could be enhanced to extract SMART criteria
          priority: action.priority === 'high' ? 5 : action.priority === 'medium' ? 3 : 1,
          status: 'pending',
          due_date: action.due_date,
          timeline_start: new Date().toISOString().split('T')[0],
          timeline_end: action.due_date,
        }))
      )
      .select();

    if (error) {
      console.error('Error saving action plans:', error);
      throw error;
    }

    console.log(`Saved ${savedActions.length} action plans for session ${sessionId}`);

    return NextResponse.json({ 
      success: true, 
      actions: savedActions,
      count: savedActions.length 
    });
  } catch (error) {
    console.error('Action extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract and save action plans' },
      { status: 500 }
    );
  }
}
