import { NextRequest, NextResponse } from 'next/server';
import { saveSummary, getCachedSummary } from '@/lib/supabase/sessions';

export async function POST(req: NextRequest) {
  try {
    const { allStageConversations, sessionType, sessionId, forceRegenerate = false } = await req.json();

    // Check if we have a cached summary (unless force regenerate is true)
    if (sessionId && !forceRegenerate) {
      try {
        const cachedSummary = await getCachedSummary(sessionId);
        if (cachedSummary) {
          console.log('Returning cached summary for session:', sessionId);
          return NextResponse.json({ summary: cachedSummary, cached: true });
        }
      } catch (error) {
        console.warn('Failed to fetch cached summary, generating new one:', error);
      }
    }

    const systemPrompt = `You are an expert coaching summarizer. Based on a complete 5-stage ACF coaching session, generate a comprehensive summary with action plan.

The 5 ACF stages are:
1. Assess the Situation
2. Creative Brainstorming
3. Formulate the Goal
4. Initiate the Action Plan
5. Nourish Accountability

Create a structured summary with these EXACT sections:

**Executive Summary**
(2-3 sentences capturing the essence of the coaching session)

**Key Insights**
• Bullet points summarizing discoveries from each of the 5 stages
• Focus on breakthroughs and realizations

**Goal Statement**
Clearly state the primary goal identified during the session. Make it SMART (Specific, Measurable, Achievable, Relevant, Time-bound).

**Action Plan**
List 3-7 specific actions with timeline:
1. Action item with deadline
2. Action item with deadline
(Continue as needed)

**Success Metrics**
Describe how progress will be measured and tracked.

**Support & Accountability**
Identify who/what will provide support and how accountability will be maintained.

Format: Use clear markdown with bold headers. Be specific and actionable.`;

    const userPrompt = `Here are the complete conversations from all 5 coaching stages. Please generate a summary with action plan:

${allStageConversations.map((stage: any, index: number) => `
### Stage ${index + 1}: ${stage.stageName}
${stage.messages.map((msg: any) => `**${msg.role === 'user' ? 'Coachee' : 'Coach'}:** ${msg.content}`).join('\n')}
`).join('\n---\n')}

Session Type: ${sessionType === 'coach_led' ? 'Coach-Led Session' : 'Self-Coaching Session'}`;

    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: userPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 100000,
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
    const summary = data.candidates[0].content.parts[0].text;

    // Save the summary to the database for future use
    if (sessionId) {
      try {
        await saveSummary(sessionId, summary);
        console.log('Summary cached successfully for session:', sessionId);
      } catch (error) {
        console.error('Failed to cache summary:', error);
        // Don't fail the request if caching fails
      }
    }

    return NextResponse.json({ summary, cached: false });
  } catch (error) {
    console.error('Summary generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
