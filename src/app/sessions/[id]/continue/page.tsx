'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import InteractiveCoachingSession from '@/components/InteractiveCoachingSession';
import { getSession } from '@/lib/supabase/sessions';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface SessionState {
  sessionId: string;
  sessionType: 'coach_led' | 'self_coaching';
  currentStage: number;
  existingMessages: Message[];
  questionCount: number;
}

export default function ContinueSessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSessionState();
  }, [sessionId]);

  const loadSessionState = async () => {
    try {
      const { session, stages } = await getSession(sessionId);

      // Check if session is already complete
      if (session.is_complete) {
        toast.error('This session is already completed');
        router.push(`/sessions/${sessionId}`);
        return;
      }

      // Find the last incomplete stage
      const currentStageNumber = session.current_stage;
      const currentStageData = stages.find((s: any) => s.stage_number === currentStageNumber);

      // Extract existing messages from current stage
      let existingMessages: Message[] = [];
      let questionCount = 0;

      if (currentStageData && currentStageData.responses?.messages) {
        existingMessages = currentStageData.responses.messages;
        // Count questions (AI assistant messages)
        questionCount = existingMessages.filter((m: Message) => m.role === 'assistant').length;
      }

      setSessionState({
        sessionId: session.id,
        sessionType: session.session_type,
        currentStage: currentStageNumber,
        existingMessages,
        questionCount,
      });

      toast.success(`Resuming from Stage ${currentStageNumber}`, {
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to load session state:', error);
      setError('Failed to load session. It may have been deleted.');
      toast.error('Could not load session');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-20 text-center">
            <Loader2 className="h-16 w-16 animate-spin text-indigo-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Loading Session...</h2>
            <p className="text-slate-600">Preparing to continue your coaching session</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !sessionState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-20 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Session Not Found</h2>
            <p className="text-slate-600 mb-6">{error || 'Unable to load session data'}</p>
            <button
              onClick={() => router.push('/sessions')}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Back to Sessions
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <InteractiveCoachingSession
      sessionType={sessionState.sessionType}
      existingSessionId={sessionState.sessionId}
      resumeFromStage={sessionState.currentStage}
      existingMessages={sessionState.existingMessages}
      existingQuestionCount={sessionState.questionCount}
    />
  );
}
