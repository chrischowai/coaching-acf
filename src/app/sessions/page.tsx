'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSessions, deleteSession } from '@/lib/supabase/sessions';
import { ArrowLeft, Calendar, CheckCircle, Clock, Trash2, Eye, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Session {
  id: string;
  session_type: 'coach_led' | 'self_coaching';
  current_stage: number;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await getSessions();
      setSessions(data as Session[]);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;

    setDeletingId(sessionId);
    try {
      await deleteSession(sessionId);
      setSessions(sessions.filter((s) => s.id !== sessionId));
      toast.success('Session deleted');
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast.error('Failed to delete session');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="border-b border-indigo-200 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="hover:bg-indigo-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            <div className="text-right">
              <h1 className="text-2xl font-bold text-slate-900">Session History</h1>
              <p className="text-sm text-slate-500">View and manage your coaching sessions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Clock className="h-12 w-12 text-indigo-600 animate-spin mx-auto mb-4" />
              <p className="text-slate-600">Loading sessions...</p>
            </div>
          </div>
        ) : sessions.length === 0 ? (
          <Card className="border-2 border-dashed border-slate-300">
            <CardContent className="py-20 text-center">
              <Calendar className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No sessions yet</h3>
              <p className="text-slate-500 mb-6">Start your first coaching session to see it here</p>
              <Button
                onClick={() => router.push('/')}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                Start New Session
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <Card
                key={session.id}
                className={`border-2 shadow-lg hover:shadow-xl transition-shadow ${
                  session.is_complete
                    ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50'
                    : 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50'
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {session.is_complete ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-amber-600" />
                        )}
                        <span className={`text-xs font-bold uppercase tracking-wide ${
                          session.is_complete ? 'text-green-700' : 'text-amber-700'
                        }`}>
                          {session.is_complete ? 'Completed' : 'In Progress'}
                        </span>
                      </div>
                      <CardTitle className="text-lg">
                        {session.session_type === 'coach_led' ? 'Coach-Led' : 'Self-Coaching'}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(session.created_at), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Stage {session.current_stage} of 5</span>
                    </div>

                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden mt-3">
                      <div
                        className={`h-full ${
                          session.is_complete
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                            : 'bg-gradient-to-r from-amber-500 to-orange-500'
                        }`}
                        style={{ width: `${(session.current_stage / 5) * 100}%` }}
                      />
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => router.push(`/sessions/${session.id}`)}
                        size="sm"
                        variant="outline"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        onClick={() => router.push(`/sessions/${session.id}/summary`)}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        Summary
                      </Button>
                      <Button
                        onClick={() => handleDelete(session.id)}
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                        disabled={deletingId === session.id}
                      >
                        {deletingId === session.id ? (
                          <Clock className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
