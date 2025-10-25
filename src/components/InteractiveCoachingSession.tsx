'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight, Send, Loader2, Users, User, CheckCircle, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { createSession, updateSession, saveStageResponse } from '@/lib/supabase/sessions';

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
}

const STAGE_NAMES = [
  'Assess the Situation',
  'Creative Brainstorming',
  'Formulate the Goal',
  'Initiate the Action Plan',
  'Nourish Accountability',
];

export default function InteractiveCoachingSession({ sessionType }: InteractiveCoachingSessionProps) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [allStageData, setAllStageData] = useState<StageData[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const progress = (currentStage / 5) * 100;

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      try {
        const session = await createSession(sessionType);
        setSessionId(session.id);
        console.log('Session created:', session.id);
        toast.success('Session started');
        startStage(1);
      } catch (error) {
        console.error('Failed to create session:', error);
        toast.error('Failed to start session');
      }
    };

    if (!sessionId && messages.length === 0) {
      initSession();
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-save messages to database
  useEffect(() => {
    const autoSave = async () => {
      if (!sessionId || messages.length === 0 || isSaving) return;

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
      }
    };

    // Debounce auto-save (wait 2 seconds after last message)
    const timer = setTimeout(autoSave, 2000);
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
      toast.error('Session not initialized');
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
    try {
      const response = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allStageConversations: allData,
          sessionType,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate summary');

      const data = await response.json();
      setSummary(data.summary);
      setShowSummary(true);
      toast.success('Session completed! Review your summary below.');
    } catch (error) {
      toast.error('Failed to generate summary');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (showSummary) {
    // Parse summary for key sections
    const parseSummary = (text: string) => {
      const sections: any = {};
      
      // Extract key sections using markers
      const goalMatch = text.match(/\*\*Goal Statement\*\*[:\s]*([^*]+)/i);
      const actionsMatch = text.match(/\*\*Action Plan\*\*[:\s]*([^*]+)/i);
      const metricsMatch = text.match(/\*\*Success Metrics\*\*[:\s]*([^*]+)/i);
      
      sections.goal = goalMatch ? goalMatch[1].trim() : '';
      sections.actions = actionsMatch ? actionsMatch[1].trim() : '';
      sections.metrics = metricsMatch ? metricsMatch[1].trim() : '';
      sections.fullText = text;
      
      return sections;
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header */}
        <div className="border-b border-indigo-200 bg-white/80 backdrop-blur-sm shadow-sm">
          <div className="max-w-[1400px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                onClick={handleExitWithConfirmation}
                className="hover:bg-indigo-50"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Session Complete</p>
                  <p className="text-xs text-slate-500">Your Coaching Summary</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-6 py-8">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 mb-8 shadow-2xl">
            <div className="flex items-center gap-4 mb-4">
              <CheckCircle className="h-12 w-12 text-white" />
              <div>
                <h1 className="text-3xl font-bold text-white">Coaching Session Complete!</h1>
                <p className="text-indigo-100 mt-1">Congratulations on completing all 5 ACF stages</p>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-3 mt-6">
              {STAGE_NAMES.map((name, idx) => (
                <div key={idx} className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center">
                  <CheckCircle className="h-5 w-5 text-white mx-auto mb-1" />
                  <p className="text-xs text-white font-semibold">{name.split(' ')[0]}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Key Highlights */}
            <div className="space-y-6">
              {/* Goal Card */}
              {summaryData.goal && (
                <Card className="border-2 border-green-200 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="p-2 bg-green-600 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                      Your Goal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-base leading-relaxed text-slate-700 font-medium">
                      {summaryData.goal}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Success Metrics Card */}
              {summaryData.metrics && (
                <Card className="border-2 border-blue-200 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="p-2 bg-blue-600 rounded-lg">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      Success Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-sm leading-relaxed text-slate-700">
                      {summaryData.metrics}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button 
                  onClick={() => window.print()} 
                  variant="outline" 
                  className="w-full py-6 text-base font-semibold border-2"
                  size="lg"
                >
                  <span className="mr-2">📄</span> Print Summary
                </Button>
                <Button 
                  onClick={handleExitWithConfirmation} 
                  className="w-full py-6 text-base font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  size="lg"
                >
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Complete Session
                </Button>
              </div>
            </div>

            {/* Right Column - Action Plan & Full Summary */}
            <div className="lg:col-span-2 space-y-6">
              {/* Action Plan Highlight */}
              {summaryData.actions && (
                <Card className="border-2 border-amber-200 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <div className="p-2 bg-amber-600 rounded-lg">
                        <ArrowRight className="h-6 w-6 text-white" />
                      </div>
                      Action Plan & Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="prose prose-slate max-w-none">
                      <div className="text-base leading-relaxed whitespace-pre-wrap">
                        {summaryData.actions}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Full Summary */}
              <Card className="border-2 border-slate-200 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                  <CardTitle className="text-xl">Complete Session Summary</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="prose prose-slate max-w-none">
                    <div 
                      className="text-sm leading-relaxed" 
                      dangerouslySetInnerHTML={{ 
                        __html: summaryData.fullText
                          .replace(/\*\*(.+?)\*\*/g, '<strong class="text-slate-900 text-base">$1</strong>')
                          .replace(/\n/g, '<br/>') 
                      }} 
                    />
                  </div>
                </CardContent>
              </Card>
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
                          {isActive && `In Progress (${questionCount}/15 questions)`}
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
            
            {/* Progress Bar */}
            <div className="flex items-center gap-4">
              <Progress value={progress} className="flex-1 h-3 bg-slate-200 shadow-inner" />
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border-2 border-indigo-200 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div>
                  <p className="text-xs font-bold text-slate-700">
                    {questionCount}/15 <span className="text-slate-500 font-normal">questions</span>
                  </p>
                </div>
                {questionCount >= 5 && (
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-full border-2 border-green-200 shadow-sm animate-pulse">
                    ✓ Ready to Proceed
                  </span>
                )}
              </div>
            </div>
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
          {questionCount >= 5 && (
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
