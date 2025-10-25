'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSession } from '@/lib/supabase/sessions';
import { ArrowLeft, Calendar, CheckCircle, User, Users, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface StageResponse {
  id: string;
  session_id: string;
  stage_number: number;
  stage_name: string;
  responses: { messages: Message[] };
  completed_at: string | null;
  created_at: string;
}

interface SessionData {
  id: string;
  session_type: 'coach_led' | 'self_coaching';
  current_stage: number;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

const STAGE_NAMES = [
  'Assess the Situation',
  'Creative Brainstorming',
  'Formulate the Goal',
  'Initiate the Action Plan',
  'Nourish Accountability',
];

export default function SessionViewPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [stages, setStages] = useState<StageResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<number>(1);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const data = await getSession(sessionId);
      setSession(data.session as SessionData);
      setStages(data.stages as StageResponse[]);
      
      // Select the first available stage
      if (data.stages.length > 0) {
        setSelectedStage(data.stages[0].stage_number);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      toast.error('Failed to load session');
      router.push('/sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const currentStageData = stages.find((s) => s.stage_number === selectedStage);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-10 text-center">
            <p className="text-slate-600 mb-4">Session not found</p>
            <Button onClick={() => router.push('/sessions')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sessions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="border-b border-indigo-200 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.push('/sessions')}
              className="hover:bg-indigo-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sessions
            </Button>
            <div className="flex items-center gap-3">
              {session.session_type === 'coach_led' ? (
                <>
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Coach-Led Session</p>
                    <p className="text-xs text-slate-500">
                      {format(new Date(session.created_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Self-Coaching Session</p>
                    <p className="text-xs text-slate-500">
                      {format(new Date(session.created_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Session Overview */}
        <Card className="mb-6 border-2 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
            <CardTitle className="flex items-center justify-between">
              <span>Session Overview</span>
              {session.is_complete && (
                <span className="flex items-center gap-2 text-sm font-normal text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  Completed
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-5 gap-3">
              {STAGE_NAMES.map((name, idx) => {
                const stageNum = idx + 1;
                const stageData = stages.find((s) => s.stage_number === stageNum);
                const isCompleted = stageData && stageData.completed_at;
                const isSelected = selectedStage === stageNum;

                return (
                  <button
                    key={stageNum}
                    onClick={() => stageData && setSelectedStage(stageNum)}
                    disabled={!stageData}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 shadow-md'
                        : isCompleted
                        ? 'border-green-200 bg-green-50 hover:border-green-400'
                        : stageData
                        ? 'border-slate-200 bg-white hover:border-slate-400'
                        : 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-300 flex items-center justify-center text-xs font-bold text-slate-600">
                          {stageNum}
                        </div>
                      )}
                      <span className="text-xs font-bold text-slate-600">Stage {stageNum}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{name}</p>
                    {stageData && (
                      <p className="text-xs text-slate-500 mt-1">
                        {stageData.responses.messages?.length || 0} messages
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Stage Conversation */}
        {currentStageData ? (
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
              <CardTitle className="flex items-center justify-between">
                <span>
                  Stage {currentStageData.stage_number}: {currentStageData.stage_name}
                </span>
                {currentStageData.completed_at && (
                  <span className="text-sm font-normal text-slate-500">
                    Completed {format(new Date(currentStageData.completed_at), 'MMM dd, yyyy h:mm a')}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {currentStageData.responses.messages?.map((message, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-4 ${
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center shadow-md ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                          : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User className="h-5 w-5 text-white" />
                      ) : (
                        <Sparkles className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1 max-w-[80%]">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-bold uppercase tracking-wider ${
                            message.role === 'user' ? 'text-blue-600' : 'text-indigo-600'
                          }`}
                        >
                          {message.role === 'user' ? 'You' : 'AI Coach'}
                        </span>
                      </div>
                      <div
                        className={`rounded-xl px-5 py-3 shadow-sm ${
                          message.role === 'user'
                            ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200'
                            : 'bg-white border border-slate-200'
                        }`}
                      >
                        <p
                          className={`text-base leading-relaxed whitespace-pre-wrap ${
                            message.role === 'user' ? 'text-slate-800' : 'text-slate-700'
                          }`}
                        >
                          {message.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2 border-dashed border-slate-300">
            <CardContent className="py-20 text-center">
              <Calendar className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No data for this stage</h3>
              <p className="text-slate-500">This stage hasn't been started yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
