'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight, Send, Loader2, Users, User, CheckCircle, Sparkles, Target, ListChecks, TrendingUp, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { createSession, updateSession, saveStageResponse, getSession } from '@/lib/supabase/sessions';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface StageData {
  stageNumber: number;
  stageName: string;
  messages: Message[];
}

interface InteractiveCoachingSessionProps {
  sessionType: 'coach_led' | 'self_coaching';
  // Optional props for resuming sessions
  existingSessionId?: string;
  resumeFromStage?: number;
  existingMessages?: Message[];
  existingQuestionCount?: number;
}

const STAGE_NAMES = [
  'Assess the Situation',
  'Creative Brainstorming',
  'Formulate the Goal',
  'Initiate the Action Plan',
  'Nourish Accountability',
];

export default function InteractiveCoachingSession({ 
  sessionType,
  existingSessionId,
  resumeFromStage,
  existingMessages,
  existingQuestionCount,
}: InteractiveCoachingSessionProps) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(existingSessionId || null);
  const [currentStage, setCurrentStage] = useState(resumeFromStage || 1);
  const [messages, setMessages] = useState<Message[]>(existingMessages || []);
  const [allStageData, setAllStageData] = useState<StageData[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(existingQuestionCount || 0);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isResuming, setIsResuming] = useState(!!existingSessionId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const progress = (currentStage / 5) * 100;

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      // If resuming, don't create new session
      if (isResuming) {
        console.log('Resuming session:', sessionId, 'at stage', currentStage);
        toast.success(`Resumed from Stage ${currentStage}: ${STAGE_NAMES[currentStage - 1]}`, {
          duration: 4000,
        });
        setIsResuming(false);
        return;
      }

      try {
        const session = await createSession(sessionType);
        console.log('Session created:', session.id);
        setSessionId(session.id);
        toast.success('Session started');
        // Small delay to ensure DB transaction commits
        await new Promise(resolve => setTimeout(resolve, 500));
        startStage(1);
      } catch (error) {
        console.error('Failed to create session:', error);
        toast.error('Failed to start session');
      }
    };

    if (!sessionId && messages.length === 0) {
      initSession();
    } else if (isResuming) {
      initSession();
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-save messages to database
  useEffect(() => {
    const autoSave = async () => {
      // Validate session exists and we have messages to save
      if (!sessionId || messages.length === 0 || isSaving) {
        console.log('Skipping auto-save:', { sessionId, messageCount: messages.length, isSaving });
        return;
      }

      // Only auto-save if we have at least one AI response (not just the initial question)
      const hasAIResponse = messages.some(m => m.role === 'assistant');
      if (!hasAIResponse) {
        console.log('Skipping auto-save: no AI responses yet');
        return;
      }

      try {
        await saveStageResponse({
          session_id: sessionId,
          stage_number: currentStage,
          stage_name: STAGE_NAMES[currentStage - 1],
          responses: { messages },
        });
        console.log('Auto-saved stage', currentStage);
      } catch (error) {
        console.error('Auto-save failed:', error);
        // Don't show error toast for auto-save failures to avoid annoying user
      }
    };

    // Debounce auto-save (wait 3 seconds after last message to ensure DB is ready)
    const timer = setTimeout(autoSave, 3000);
    return () => clearTimeout(timer);
  }, [messages, sessionId, currentStage, isSaving]);

  const startStage = async (stageNum: number) => {
    setIsLoading(true);
    try {
      const initialMessage = getStageIntroduction(stageNum);
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: initialMessage }],
          currentStage: stageNum,
          questionCount: 0,
          sessionType,
        }),
      });

      if (!response.ok) throw new Error('Failed to get AI response');

      const data = await response.json();
      setMessages([{ role: 'assistant', content: data.message }]);
      setQuestionCount(1);
    } catch (error) {
      toast.error('Failed to start coaching session');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStageIntroduction = (stageNum: number): string => {
    const intros = [
      "Start Stage 1: Assess the Situation. Begin by asking the coachee: What would you like to focus on in this coaching session today?",
      "Start Stage 2: Creative Brainstorming. Transition smoothly from Stage 1 and ask: Now that we understand the situation, what are some possible ways you could approach this?",
      "Start Stage 3: Formulate the Goal. Transition smoothly and ask: Based on what we've explored, what specific outcome would you like to achieve?",
      "Start Stage 4: Initiate the Action Plan. Transition smoothly and ask: What's the first concrete step you can take toward your goal?",
      "Start Stage 5: Nourish Accountability. Transition smoothly and ask: How will you track your progress and stay accountable to your plan?",
    ];
    return intros[stageNum - 1];
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          currentStage,
          questionCount,
          sessionType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      const data = await response.json();
      console.log('AI Response:', data);
      
      if (!data.message) {
        throw new Error('No message in response');
      }
      
      const aiMessage: Message = { role: 'assistant', content: data.message };
      setMessages([...updatedMessages, aiMessage]);
      setQuestionCount(questionCount + 1);
    } catch (error: any) {
      toast.error(error.message || 'Failed to get coach response');
      console.error('Error details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStage = async () => {
    console.log('handleNextStage called', { sessionId, currentStage, questionCount });
    
    if (!sessionId) {
      console.error('No sessionId, cannot proceed');
      toast.error('Session not initialized. Please refresh and try again.');
      return;
    }

    if (questionCount < 8) {
      toast.error(`Please answer at least 8 questions before proceeding (current: ${questionCount})`);
      return;
    }

    // Prevent auto-save from interfering
    setIsSaving(true);

    // Save current stage data
    const stageData: StageData = {
      stageNumber: currentStage,
      stageName: STAGE_NAMES[currentStage - 1],
      messages,
    };

    console.log('Saving stage data and moving to next stage...');
    try {
      // Verify session exists in database before saving
      try {
        const { session } = await getSession(sessionId);
        if (!session) {
          throw new Error('Session not found in database');
        }
        console.log('Verified session exists:', session.id);
      } catch (verifyError) {
        console.error('Session verification failed:', verifyError);
        toast.error('Session not found. Please refresh and start a new session.');
        setIsSaving(false);
        return;
      }

      // Save stage as completed
      await saveStageResponse({
        session_id: sessionId,
        stage_number: currentStage,
        stage_name: STAGE_NAMES[currentStage - 1],
        responses: { messages },
        completed_at: new Date().toISOString(),
      });

      setAllStageData([...allStageData, stageData]);

      if (currentStage < 5) {
        // Update session to next stage
        await updateSession(sessionId, {
          current_stage: currentStage + 1,
          is_complete: false,
        });

        setCurrentStage(currentStage + 1);
        setMessages([]);
        setQuestionCount(0);
        setIsSaving(false);
        startStage(currentStage + 1);
        toast.success(`Moving to Stage ${currentStage + 1}`);
      } else {
        // Mark session as complete
        await updateSession(sessionId, {
          current_stage: 5,
          is_complete: true,
        });

        setIsSaving(false);
        // Generate summary
        generateSummary([...allStageData, stageData]);
      }
    } catch (error) {
      console.error('Failed to save progress:', error);
      toast.error('Failed to save progress');
      setIsSaving(false);
    }
  };

  const generateSummary = async (allData: StageData[]) => {
    setIsLoading(true);
    console.log('🔵 Starting summary generation for session:', sessionId);
    
    try {
      // Step 1: Generate and save summary (includes coaching_theme extraction)
      console.log('📝 Generating summary via API...');
      const response = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,  // CRITICAL: Include sessionId to save summary and coaching_theme
          allStageConversations: allData,
          sessionType,
          forceRegenerate: false,  // Use cache if available
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Summary API failed:', errorText);
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      console.log('✅ Summary generated successfully');
      console.log('   - Cached:', data.cached);
      console.log('   - Summary length:', data.summary?.length || 0);
      
      setSummary(data.summary);
      
      // Step 2: Wait a moment for database to update
      console.log('⏳ Waiting for database to update...');
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
      
      // Step 3: Extract and save action plans
      console.log('🎯 Creating action plans from summary...');
      try {
        const actionsResponse = await fetch('/api/extract-actions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            summary: data.summary,
          }),
        });

        if (actionsResponse.ok) {
          const actionsData = await actionsResponse.json();
          console.log(`✅ Created ${actionsData.count} action plans successfully`);
          toast.success(`🎉 Session completed! ${actionsData.count} action plans created.`, {
            duration: 5000,
          });
        } else {
          const errorData = await actionsResponse.json();
          console.error('❌ Failed to create action plans:', errorData);
          toast.warning('Session completed! Please check Action Plans page.', {
            duration: 5000,
          });
        }
      } catch (actionError) {
        console.error('❌ Action extraction error:', actionError);
        toast.warning('Session completed! Action plans may not have been created.', {
          duration: 5000,
        });
      }
      
      console.log('✅ All summary generation steps completed');
      setShowSummary(true);
    } catch (error) {
      console.error('❌ Summary generation failed:', error);
      toast.error('Failed to generate summary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (showSummary) {
    // Parse summary for key sections (matching Session Summary page)
    const parseSummary = (text: string) => {
      const sections: any = {};
      
      // More flexible regex patterns to capture content
      const executiveSummaryMatch = text.match(/\*\*Executive Summary\*\*[:\s]*\n*([\s\S]*?)(?=\n\*\*|$)/i);
      const keyInsightsMatch = text.match(/\*\*Key Insights\*\*[:\s]*\n*([\s\S]*?)(?=\n\*\*|$)/i);
      const goalMatch = text.match(/\*\*Goal Statement\*\*[:\s]*\n*([\s\S]*?)(?=\n\*\*|$)/i);
      const actionsMatch = text.match(/\*\*Action Plan\*\*[:\s]*\n*([\s\S]*?)(?=\n\*\*|$)/i);
      const metricsMatch = text.match(/\*\*Success Metrics\*\*[:\s]*\n*([\s\S]*?)(?=\n\*\*|$)/i);
      const supportMatch = text.match(/\*\*Support & Accountability\*\*[:\s]*\n*([\s\S]*?)(?=\n\*\*|$)/i);
      
      sections.executiveSummary = executiveSummaryMatch ? executiveSummaryMatch[1].trim() : '';
      sections.keyInsights = keyInsightsMatch ? keyInsightsMatch[1].trim() : '';
      sections.goal = goalMatch ? goalMatch[1].trim() : '';
      sections.actions = actionsMatch ? actionsMatch[1].trim() : '';
      sections.metrics = metricsMatch ? metricsMatch[1].trim() : '';
      sections.support = supportMatch ? supportMatch[1].trim() : '';
      sections.fullText = text;
      
      return sections;
    };
    
    const extractKeyHeading = (text: string): string => {
      // Try to extract the main focus from executive summary or goal
      const goalMatch = text.match(/to become.*?(?=\.|,|within)/i);
      if (goalMatch) {
        return goalMatch[0].replace(/^to become\s*/i, '').trim();
      }
      
      // Fallback: extract first meaningful sentence
      const sentenceMatch = text.match(/(?:session|coaching)\s+focused on\s+([^.]+)/i);
      if (sentenceMatch) {
        return sentenceMatch[1].trim();
      }
      
      return 'Professional Development Journey';
    };
    
    const handleExitWithConfirmation = () => {
      const confirmed = window.confirm(
        'Are you sure you want to leave this page? \n\nMake sure you have saved or printed your coaching summary before leaving.'
      );
      if (confirmed) {
        router.push('/');
      }
    };
    
    const summaryData = parseSummary(summary);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 shadow-sm no-print">
          <div className="max-w-[1000px] mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                onClick={handleExitWithConfirmation}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
              <div className="text-right">
                <h1 className="text-2xl font-bold text-slate-900">Session Complete</h1>
                <p className="text-sm text-slate-500">
                  {sessionType === 'coach_led' ? 'Coach-Led Session' : 'Self-Coaching Session'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1000px] mx-auto px-6 py-8">
          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mb-6 no-print">
            <Button
              onClick={() => window.print()}
              size="lg"
              variant="outline"
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button
              onClick={handleExitWithConfirmation}
              size="lg"
              className="gap-2 shadow-lg"
            >
              <CheckCircle className="h-4 w-4" />
              Complete & Exit
            </Button>
          </div>

          {/* PDF Content Area */}
          <div className="bg-white print:p-8">
            {/* Professional Header */}
            <Card className="border-none shadow-none mb-6">
              <CardHeader className="space-y-4 pb-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-sm font-medium">
                      <CheckCircle className="h-3 w-3 mr-1.5" />
                      Completed {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </Badge>
                    <Badge className="bg-indigo-600">
                      {sessionType === 'coach_led' ? 'Coach-Led' : 'Self-Coaching'}
                    </Badge>
                  </div>
                  <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
                    Coaching Session Summary
                  </h1>
                  <p className="text-xl text-indigo-600 font-semibold">
                    {extractKeyHeading(summaryData.executiveSummary || summaryData.goal || summary)}
                  </p>
                </div>
              </CardHeader>
            </Card>

          {/* Executive Summary */}
          {summaryData.executiveSummary && (
            <Card className="mb-6 border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardTitle className="text-lg font-semibold text-slate-900">Executive Summary</CardTitle>
                <CardDescription>Overview of the coaching session</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-slate-700 leading-relaxed text-base space-y-3">
                  {summaryData.executiveSummary.split(/\. (?=[A-Z])/).map((sentence: string, idx: number) => {
                    const trimmed = sentence.trim();
                    if (!trimmed) return null;
                    const withPeriod = trimmed.endsWith('.') ? trimmed : trimmed + '.';
                    // Highlight quoted text
                    const parts = withPeriod.split(/"([^"]+)"/);
                    return (
                      <p key={idx} className="text-slate-700">
                        {parts.map((part: string, i: number) => 
                          i % 2 === 1 ? (
                            <span key={i} className="font-semibold text-blue-700">"{part}"</span>
                          ) : (
                            part
                          )
                        )}
                      </p>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Key Insights */}
          {summaryData.keyInsights && (
            <Card className="mb-6 border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <div className="p-1.5 bg-purple-100 rounded-lg">
                    <Target className="h-4 w-4 text-purple-600" />
                  </div>
                  Key Insights
                </CardTitle>
                <CardDescription>Discoveries from the 5 coaching stages</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {summaryData.keyInsights.split(/\*\*([^*]+)\*\*/g).map((part: string, i: number) => {
                    if (i % 2 === 1) {
                      // This is a heading
                      return (
                        <div key={i} className="mb-2">
                          <h4 className="font-bold text-purple-800 text-sm mb-2">{part}</h4>
                        </div>
                      );
                    } else if (part.trim()) {
                      // This is content with bullet points
                      const lines = part.trim()
                        .split('\n')
                        .filter((line: string) => line.trim())
                        .map((line: string) => line.replace(/^[*•]\s*/, '').trim())
                        .filter(Boolean);
                      
                      if (lines.length === 0) return null;
                      
                      return (
                        <ul key={i} className="space-y-2">
                          {lines.map((line: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-slate-700 text-sm">
                              <span className="text-purple-600 font-bold mt-0.5 flex-shrink-0">•</span>
                              <span className="flex-1">{line}</span>
                            </li>
                          ))}
                        </ul>
                      );
                    }
                    return null;
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Goal Statement */}
          {summaryData.goal && (
            <Card className="mb-6 border-2 border-emerald-200 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-emerald-50 via-white to-teal-50">
              <CardHeader className="border-b border-emerald-100">
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-md">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div>Goal Statement</div>
                    <p className="text-sm font-normal text-emerald-600 mt-0.5">SMART Goal</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-white rounded-lg p-4 border border-emerald-100">
                  <p className="text-base font-medium text-slate-800 leading-relaxed">
                    {summaryData.goal}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Plan */}
          {summaryData.actions && (
            <Card className="mb-6 border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <div className="p-1.5 bg-amber-100 rounded-lg">
                    <ListChecks className="h-4 w-4 text-amber-600" />
                  </div>
                  Action Plan & Timeline
                </CardTitle>
                <CardDescription>Specific actions with timelines</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div 
                  className="space-y-4"
                  dangerouslySetInnerHTML={{ 
                    __html: summaryData.actions
                      .split(/(?=\d+\.)/)
                      .filter((item: string) => item.trim())
                      .map((item: string) => {
                        const match = item.match(/(\d+)\.\s*\*\*([^*]+)\*\*(.+)/s);
                        if (match) {
                          const [, num, title, details] = match;
                          const deadline = details.match(/\(Deadline:([^)]+)\)/)?.[1]?.trim() || '';
                          const cleanDetails = details.replace(/\(Deadline:[^)]+\)/g, '').trim();
                          return `
                            <div class="flex items-start gap-4 p-4 bg-amber-50/50 rounded-lg border border-amber-200">
                              <div class="flex-shrink-0">
                                <span class="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-full text-base font-bold shadow-sm">${num}</span>
                              </div>
                              <div class="flex-1 space-y-2">
                                <h4 class="font-bold text-slate-900 text-base">${title}</h4>
                                <p class="text-slate-700 text-sm leading-relaxed">${cleanDetails}</p>
                                ${deadline ? `<div class="flex items-center gap-2 text-amber-700 text-sm font-medium"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span>Deadline: ${deadline}</span></div>` : ''}
                              </div>
                            </div>
                          `;
                        }
                        return '';
                      })
                      .filter(Boolean)
                      .join('')
                  }}
                />
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Success Metrics */}
            {summaryData.metrics && (
              <Card className="border-l-4 border-l-cyan-500 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50">
                  <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <div className="p-1.5 bg-cyan-100 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-cyan-600" />
                    </div>
                    Success Metrics
                  </CardTitle>
                  <CardDescription>How progress will be measured</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div 
                    className="space-y-2"
                    dangerouslySetInnerHTML={{ 
                      __html: summaryData.metrics
                        .split('\n')
                        .filter((line: string) => line.trim())
                        .map((line: string) => {
                          const cleaned = line.replace(/^[*•]\s*/, '').trim();
                          if (cleaned) {
                            return `<div class="flex items-start gap-2 p-2 rounded hover:bg-cyan-50 transition-colors"><span class="text-cyan-600 font-bold text-lg mt-0.5">✓</span><span class="text-slate-700 text-sm flex-1">${cleaned}</span></div>`;
                          }
                          return '';
                        })
                        .filter(Boolean)
                        .join('')
                    }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Support & Accountability */}
            {summaryData.support && (
              <Card className="border-l-4 border-l-rose-500 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50">
                  <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <div className="p-1.5 bg-rose-100 rounded-lg">
                      <Users className="h-4 w-4 text-rose-600" />
                    </div>
                    Support & Accountability
                  </CardTitle>
                  <CardDescription>Your support system</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div 
                    className="space-y-2"
                    dangerouslySetInnerHTML={{ 
                      __html: summaryData.support
                        .split('\n')
                        .filter((line: string) => line.trim())
                        .map((line: string) => {
                          const cleaned = line.replace(/^[*•]\s*/, '').trim();
                          if (cleaned) {
                            return `<div class="flex items-start gap-2 p-2 rounded hover:bg-rose-50 transition-colors"><span class="text-rose-600 text-lg mt-0.5">👥</span><span class="text-slate-700 text-sm flex-1">${cleaned}</span></div>`;
                          }
                          return '';
                        })
                        .filter(Boolean)
                        .join('')
                    }}
                  />
                </CardContent>
              </Card>
            )}
          </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <p className="text-sm text-slate-500 text-center">
                Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} • ACF Coaching Framework
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Bar */}
      <div className="flex-shrink-0 border-b border-indigo-200 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/')}
                className="hover:bg-indigo-50"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Exit Session
              </Button>
              <div className="h-6 w-px bg-indigo-200" />
              <div className="flex items-center gap-3">
                {sessionType === 'coach_led' ? (
                  <>
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Coach-Led Session</p>
                      <p className="text-xs text-slate-500">ACF Coaching Framework</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Self-Coaching Session</p>
                      <p className="text-xs text-slate-500">ACF Coaching Framework</p>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Stage {currentStage} of 5</p>
                <p className="text-sm font-bold text-slate-900">{STAGE_NAMES[currentStage - 1]}</p>
              </div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-2 rounded-full border border-indigo-200">
                <CheckCircle className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-semibold text-indigo-900">{Math.round(progress)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator - Enhanced with Stage Pills */}
      <div className="flex-shrink-0 bg-gradient-to-r from-white via-indigo-50/30 to-white border-b border-indigo-200 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="space-y-3">
            {/* Stage Pills */}
            <div className="flex items-center justify-between">
              {STAGE_NAMES.map((stageName, index) => {
                const stageNumber = index + 1;
                const isActive = stageNumber === currentStage;
                const isCompleted = stageNumber < currentStage;
                const isUpcoming = stageNumber > currentStage;
                
                return (
                  <div
                    key={stageNumber}
                    className="group relative flex-1 cursor-help"
                    title={`Stage ${stageNumber}: ${stageName} ${isCompleted ? '(Completed)' : isActive ? '(In Progress)' : '(Upcoming)'}`}
                  >
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                      isActive 
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg scale-105' 
                        : isCompleted
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-md'
                        : 'bg-slate-200'
                    }`}>
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        isActive || isCompleted ? 'bg-white/30 text-white' : 'bg-white text-slate-600'
                      }`}>
                        {isCompleted ? '✓' : stageNumber}
                      </div>
                      <span className={`text-xs font-semibold truncate ${
                        isActive || isCompleted ? 'text-white' : 'text-slate-600'
                      }`}>
                        {stageName.split(' ')[0]}
                      </span>
                    </div>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                      <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
                        <div className="font-bold">{stageName}</div>
                        <div className="text-slate-300 mt-1">
                          {isCompleted && 'Completed ✓'}
                          {isActive && 'In Progress'}
                          {isUpcoming && 'Upcoming'}
                        </div>
                      </div>
                      <div className="w-2 h-2 bg-slate-900 rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1"></div>
                    </div>
                    
                    {/* Connector Line */}
                    {index < STAGE_NAMES.length - 1 && (
                      <div className={`absolute top-1/2 left-full w-full h-1 -translate-y-1/2 ${
                        stageNumber < currentStage ? 'bg-green-400' : 'bg-slate-300'
                      }`}></div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Ready to Proceed Indicator */}
            {questionCount >= 8 && (
              <div className="flex justify-center">
                <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-full border-2 border-green-200 shadow-sm animate-pulse">
                  ✓ Ready to Proceed to Next Stage
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Messages - Maximized Space */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-[1800px] mx-auto px-6 py-6">
          <div className="h-full bg-white rounded-xl shadow-xl border border-indigo-100 flex flex-col">
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-4 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                    message.role === 'user' 
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                      : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="h-6 w-6 text-white" />
                    ) : (
                      <Sparkles className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1 max-w-[80%]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-bold uppercase tracking-wider ${
                        message.role === 'user' ? 'text-blue-600' : 'text-indigo-600'
                      }`}>
                        {message.role === 'user' ? 'You' : 'AI Coach'}
                      </span>
                      <div className="h-1 w-1 rounded-full bg-slate-300" />
                      <span className="text-xs text-slate-400">Just now</span>
                    </div>
                    <div
                      className={`rounded-2xl px-6 py-4 shadow-sm ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200'
                          : 'bg-white border border-slate-200'
                      }`}
                    >
                      <p className={`text-base leading-relaxed whitespace-pre-wrap ${
                        message.role === 'user' ? 'text-slate-800' : 'text-slate-700'
                      }`}>{message.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg animate-pulse">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 max-w-[80%]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">AI Coach</span>
                      <div className="h-1 w-1 rounded-full bg-slate-300" />
                      <span className="text-xs text-slate-400">Thinking</span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                        <span className="text-base text-slate-600">Crafting thoughtful response...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      </div>

      {/* Input Area - Fixed Bottom */}
      <div className="flex-shrink-0 border-t border-indigo-200 bg-white/95 backdrop-blur-sm shadow-2xl">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Share your thoughts here... (Press Enter to send, Shift+Enter for new line)"
                className="min-h-[80px] border-2 border-slate-200 focus:border-indigo-400 rounded-xl resize-none text-base px-4 py-3 shadow-sm"
                disabled={isLoading}
              />
            </div>
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg h-full px-8 rounded-xl"
              >
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <Send className="h-6 w-6" />
                    <span className="ml-2 font-semibold">Send</span>
                  </>
                )}
              </Button>
            </div>
          </div>
          {questionCount >= 8 && (
            <div className="mt-4">
              <Button
                onClick={handleNextStage}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-4 rounded-xl shadow-lg"
                size="lg"
              >
                {currentStage < 5 ? (
                  <>
                    <CheckCircle className="mr-3 h-5 w-5" />
                    Continue to Next Stage
                    <ArrowRight className="ml-3 h-5 w-5" />
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-3 h-5 w-5" />
                    Generate Your Coaching Summary
                    <CheckCircle className="ml-3 h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}




