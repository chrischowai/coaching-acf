import { NextRequest, NextResponse } from 'next/server';

const STAGE_CONTEXTS = {
  1: {
    name: 'Assess the Situation',
    goal: 'Understand the current context, challenges, and what has been tried',
    openingQuestion: 'What would you like to focus on in this coaching session today?',
    followUpAreas: ['current situation', 'challenges faced', 'what has been tried', 'emotions and feelings', 'desired outcome'],
    minQuestions: 5,
    maxQuestions: 15,
  },
  2: {
    name: 'Creative Brainstorming',
    goal: 'Explore all possibilities without constraints and generate creative ideas',
    openingQuestion: 'Now that we understand the situation, what are some possible ways you could approach this?',
    followUpAreas: ['creative solutions', 'unconventional ideas', 'resources available', 'different perspectives', 'best/worst case scenarios'],
    minQuestions: 5,
    maxQuestions: 15,
  },
  3: {
    name: 'Formulate the Goal',
    goal: 'Define clear, specific, measurable objectives and success criteria',
    openingQuestion: 'Based on what we\'ve explored, what specific outcome would you like to achieve?',
    followUpAreas: ['specific metrics', 'timeline', 'success indicators', 'why this matters', 'realistic expectations'],
    minQuestions: 5,
    maxQuestions: 15,
  },
  4: {
    name: 'Initiate the Action Plan',
    goal: 'Create concrete, actionable steps with resources and timelines',
    openingQuestion: 'What\'s the first concrete step you can take toward your goal?',
    followUpAreas: ['action steps', 'resources needed', 'timeline', 'potential obstacles', 'backup plans'],
    minQuestions: 5,
    maxQuestions: 15,
  },
  5: {
    name: 'Nourish Accountability',
    goal: 'Set up tracking mechanisms, support systems, and anticipate obstacles',
    openingQuestion: 'How will you track your progress and stay accountable to your plan?',
    followUpAreas: ['tracking methods', 'support system', 'check-in frequency', 'obstacles to anticipate', 'celebration milestones'],
    minQuestions: 5,
    maxQuestions: 15,
  },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Received request:', JSON.stringify(body, null, 2));
    
    const { messages, currentStage, questionCount, sessionType } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    const stageInfo = STAGE_CONTEXTS[currentStage as keyof typeof STAGE_CONTEXTS];
    
    const systemPrompt = `You are an expert ACF (Assess, Creative, Formulate, Initiate, Nourish) coaching AI assistant. You are currently in Stage ${currentStage}: ${stageInfo.name}.

Your goal for this stage: ${stageInfo.goal}

${questionCount === 0 ? `Start by asking this opening question: "${stageInfo.openingQuestion}"` : ''}

Key areas to explore through follow-up questions: ${stageInfo.followUpAreas.join(', ')}

Guidelines:
- Ask ONE thoughtful, open-ended question at a time
- You should ask between ${stageInfo.minQuestions} to ${stageInfo.maxQuestions} questions for this stage
- Current question count: ${questionCount}
- Be empathetic, supportive, and encouraging
- Listen actively and build on the user's responses with follow-up questions
- After each response, acknowledge what they shared, then ask a natural follow-up question
- When you've gathered sufficient information (${stageInfo.minQuestions}-${stageInfo.maxQuestions} questions), acknowledge their insights and let them know they can move to the next stage
- Keep responses concise (2-3 sentences max)
- Use coaching techniques: powerful questions, reflective listening, acknowledgment
- After ${stageInfo.minQuestions} questions, you can say: "Great progress! Feel free to click 'Next Stage' when you're ready, or we can explore this further."
- IMPORTANT: If this is question ${stageInfo.maxQuestions} (current count: ${questionCount}), you MUST end with: "This is our final question for this stage. Please click the 'Continue to Next Stage' button below when you're ready to proceed."

Session type: ${sessionType === 'coach_led' ? 'Coach-Led (you are coaching someone else)' : 'Self-Coaching (user is working on their own goals)'}

Remember: You're a supportive coach, not a therapist. Focus on forward momentum and actionable insights. Ask only ONE question per response.`;

    // Use Google Gemini API
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Format messages for Gemini
    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const modelName = 'gemini-2.5-flash';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    console.log('Calling Gemini API:', apiUrl.replace(apiKey, 'REDACTED'));
    console.log('Request body:', JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt.substring(0, 100) + '...' }] },
      contents: formattedMessages,
      generationConfig: { temperature: 0.8, maxOutputTokens: 500 },
    }, null, 2));
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: formattedMessages,
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 100000,
          responseModalities: ['TEXT'],
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error status:', response.status);
      console.error('Gemini API error response:', errorData);
      
      // Try to parse error message
      try {
        const errorJson = JSON.parse(errorData);
        const errorMessage = errorJson.error?.message || 'AI API request failed';
        throw new Error(`Gemini API Error: ${errorMessage}`);
      } catch (parseError) {
        throw new Error(`AI API request failed: ${errorData}`);
      }
    }

    const data = await response.json();
    console.log('Gemini response:', JSON.stringify(data, null, 2));
    
    // Check for blocked content or safety issues
    if (data.promptFeedback?.blockReason) {
      console.error('Content blocked:', data.promptFeedback);
      return NextResponse.json(
        { error: `Content blocked: ${data.promptFeedback.blockReason}` },
        { status: 400 }
      );
    }
    
    // Validate response structure
    if (!data.candidates || data.candidates.length === 0) {
      console.error('No candidates in response:', data);
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }
    
    const candidate = data.candidates[0];
    
    // Check if content was filtered
    if (candidate.finishReason === 'SAFETY') {
      console.error('Response filtered for safety');
      return NextResponse.json(
        { error: 'Response filtered for safety reasons' },
        { status: 400 }
      );
    }
    
    // Handle thinking tokens - Gemini 2.5 Pro may use tokens for reasoning
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      console.error('No content parts in candidate:', candidate);
      
      // If it hit MAX_TOKENS during thinking, return a helpful message
      if (candidate.finishReason === 'MAX_TOKENS') {
        return NextResponse.json(
          { error: 'Response too complex. Please simplify your answer.' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: 'Empty response from AI' },
        { status: 500 }
      );
    }
    
    const aiMessage = candidate.content.parts[0].text;
    console.log('AI message:', aiMessage);

    if (!aiMessage || aiMessage.trim().length === 0) {
      return NextResponse.json(
        { error: 'Empty message from AI' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: aiMessage });
  } catch (error: any) {
    console.error('AI Coach error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Failed to get AI response' },
      { status: 500 }
    );
  }
}
