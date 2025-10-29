'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getSessions, deleteSession, getSession } from '@/lib/supabase/sessions';
import { ArrowLeft, Calendar, CheckCircle, Clock, Trash2, Eye, FileText, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Session {
  id: string;
  session_type: 'coach_led' | 'self_coaching';
  current_stage: number;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
  executive_summary?: string;
  coaching_theme?: string;  // Coaching theme from session summary
  key_heading?: string;
}

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await getSessions();
      
      // For completed sessions, fetch and parse summaries
      const sessionsWithSummaries = await Promise.all(
        (data as Session[]).map(async (session) => {
          if (session.is_complete) {
            try {
              const { stages } = await getSession(session.id);
              const allStageConversations = stages.map((stage: any) => ({
                stageName: stage.stage_name,
                messages: stage.responses?.messages || []
              }));
              
              // Generate summary for this session
              const summaryResponse = await fetch('/api/summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  allStageConversations,
                  sessionType: session.session_type
                })
              });
              
              if (summaryResponse.ok) {
                const { summary } = await summaryResponse.json();
                const execMatch = summary.match(/\*\*Executive Summary\*\*[:\s]*\n*([\s\S]*?)(?=\n\*\*|$)/i);
                
                return {
                  ...session,
                  executive_summary: execMatch ? execMatch[1].trim().substring(0, 200) + '...' : 'Summary not available',
                  // coaching_theme should already be set from database
                };
              }
            } catch (error) {
              console.error('Failed to generate summary for session:', session.id, error);
            }
          }
          return session;
        })
      );
      
      setSessions(sessionsWithSummaries);
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

  // Pagination calculations
  const totalPages = Math.ceil(sessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSessions = sessions.slice(startIndex, endIndex);
  const totalSessions = sessions.length;

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(Math.max(1, currentPage - 1));
  const goToNextPage = () => setCurrentPage(Math.min(totalPages, currentPage + 1));

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
              <h1 className="text-2xl font-bold text-slate-900">Coaching History</h1>
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
          <Card className="shadow-lg">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-indigo-100">
                    <tr>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-slate-700 w-16">#</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Coaching Theme</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Progress</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Executive Summary</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentSessions.map((session, index) => (
                      <tr
                        key={session.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        {/* Number */}
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-sm">
                              {startIndex + index + 1}
                            </span>
                          </div>
                        </td>

                        {/* Coaching Theme */}
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              {session.is_complete ? (
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Completed
                                </Badge>
                              ) : (
                                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                                  <Clock className="h-3 w-3 mr-1" />
                                  In Progress
                                </Badge>
                              )}
                              <Badge variant="outline">
                                {session.session_type === 'coach_led' ? 'Coach-Led' : 'Self-Coaching'}
                              </Badge>
                            </div>
                            <h3 className="font-semibold text-slate-900 text-base">
                              {session.coaching_theme || 'Coaching Session'}
                            </h3>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              {format(new Date(session.created_at), 'MMM dd, yyyy')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {format(new Date(session.created_at), 'h:mm a')}
                          </p>
                        </td>

                        {/* Progress - 5 ACF Stage Pills */}
                        <td className="px-6 py-4">
                          <div className="space-y-2 min-w-[280px]">
                            {/* Stage Labels */}
                            <div className="text-xs text-slate-600 mb-1">
                              Stage {session.current_stage} of 5 • {(session.current_stage / 5 * 100).toFixed(0)}%
                            </div>
                            {/* 5 ACF Stage Pills */}
                            <div className="flex items-center gap-1.5">
                              {[
                                { name: 'Check In', stage: 1 },
                                { name: 'Starting Point', stage: 2 },
                                { name: 'Connect', stage: 3 },
                                { name: 'Finish', stage: 4 },
                                { name: 'Check Out', stage: 5 }
                              ].map((item) => {
                                const isCompleted = session.current_stage > item.stage;
                                const isCurrent = session.current_stage === item.stage;
                                const isPending = session.current_stage < item.stage;
                                
                                return (
                                  <div
                                    key={item.stage}
                                    className="group relative flex-1"
                                    title={item.name}
                                  >
                                    <div
                                      className={`
                                        h-7 rounded-md flex items-center justify-center text-[10px] font-semibold
                                        transition-all duration-200
                                        ${
                                          isCompleted
                                            ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-sm'
                                            : isCurrent
                                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md animate-pulse'
                                            : 'bg-slate-200 text-slate-400 border border-slate-300'
                                        }
                                      `}
                                    >
                                      {isCompleted ? (
                                        <CheckCircle className="h-3.5 w-3.5" />
                                      ) : (
                                        item.stage
                                      )}
                                    </div>
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                      {item.name}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </td>

                        {/* Executive Summary */}
                        <td className="px-6 py-4 max-w-md">
                          {session.executive_summary ? (
                            <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                              {session.executive_summary}
                            </p>
                          ) : session.is_complete ? (
                            <p className="text-sm text-slate-400 italic">Loading summary...</p>
                          ) : (
                            <p className="text-sm text-slate-400 italic">Complete session to view summary</p>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {!session.is_complete && (
                              <Button
                                onClick={() => router.push(`/sessions/${session.id}/continue`)}
                                size="sm"
                                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Continue
                              </Button>
                            )}
                            <Button
                              onClick={() => router.push(`/sessions/${session.id}`)}
                              size="sm"
                              variant="outline"
                              className="hover:bg-indigo-50"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            {session.is_complete && (
                              <Button
                                onClick={() => router.push(`/sessions/${session.id}/summary`)}
                                size="sm"
                                variant="outline"
                                className="hover:bg-purple-50"
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                Summary
                              </Button>
                            )}
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="border-t border-slate-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    {/* Page Info */}
                    <div className="text-sm text-slate-600">
                      Showing <span className="font-semibold text-slate-900">{startIndex + 1}</span> to{' '}
                      <span className="font-semibold text-slate-900">{Math.min(endIndex, totalSessions)}</span> of{' '}
                      <span className="font-semibold text-slate-900">{totalSessions}</span> sessions
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center gap-2">
                      {/* First Page */}
                      <Button
                        onClick={goToFirstPage}
                        disabled={currentPage === 1}
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>

                      {/* Previous Page */}
                      <Button
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      {/* Page Numbers */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter((page) => {
                            // Show first page, last page, current page, and adjacent pages
                            return (
                              page === 1 ||
                              page === totalPages ||
                              (page >= currentPage - 1 && page <= currentPage + 1)
                            );
                          })
                          .map((page, index, array) => {
                            // Add ellipsis when there's a gap
                            const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
                            return (
                              <div key={page} className="flex items-center gap-1">
                                {showEllipsisBefore && (
                                  <span className="px-2 text-slate-400">...</span>
                                )}
                                <Button
                                  onClick={() => setCurrentPage(page)}
                                  size="sm"
                                  variant={currentPage === page ? "default" : "outline"}
                                  className="h-8 w-8 p-0"
                                >
                                  {page}
                                </Button>
                              </div>
                            );
                          })}
                      </div>

                      {/* Next Page */}
                      <Button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>

                      {/* Last Page */}
                      <Button
                        onClick={goToLastPage}
                        disabled={currentPage === totalPages}
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
