'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Clock, Download, CheckCircle, Target, ListChecks, TrendingUp, Users, Calendar, Printer } from 'lucide-react';
import { getSession } from '@/lib/supabase/sessions';
import toast from 'react-hot-toast';

interface SessionData {
  id: string;
  session_type: string;
  current_stage: number;
  is_complete: boolean;
  created_at: string;
}

interface StageResponse {
  stage_number: number;
  stage_name: string;
  responses: any;
}

export default function SessionSummaryPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [summary, setSummary] = useState<string>('');
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sessionId) {
      fetchSummary();
    }
  }, [sessionId]);

  const fetchSummary = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch session data and stage responses
      const { session, stages } = await getSession(sessionId);
      setSessionData(session);

      // Convert stage responses to conversation format
      const allStageConversations = stages.map((stage: StageResponse) => ({
        stageName: stage.stage_name,
        messages: stage.responses?.messages || []
      }));

      // Generate summary
      const summaryResponse = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allStageConversations,
          sessionType: session.session_type
        })
      });

      if (!summaryResponse.ok) {
        throw new Error('Failed to generate summary');
      }

      const { summary: summaryText } = await summaryResponse.json();
      setSummary(summaryText);
    } catch (err) {
      console.error('Error fetching summary:', err);
      setError(err instanceof Error ? err.message : 'Failed to load summary');
      toast.error('Failed to generate summary');
    } finally {
      setIsLoading(false);
    }
  };

  const getStageName = (stage: number): string => {
    const stages = [
      'Assess the Situation',
      'Creative Brainstorming',
      'Formulate the Goal',
      'Initiate the Action Plan',
      'Nourish Accountability'
    ];
    return stages[stage - 1] || `Stage ${stage}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
    
    // Debug log
    console.log('Parsed sections:', {
      executiveSummary: sections.executiveSummary.substring(0, 100),
      keyInsights: sections.keyInsights.substring(0, 100),
      goal: sections.goal.substring(0, 100),
      actions: sections.actions.substring(0, 100),
    });
    
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

  const handleDownload = () => {
    try {
      // Update document title for PDF filename
      const originalTitle = document.title;
      const date = sessionData ? new Date(sessionData.created_at).toISOString().split('T')[0] : 'unknown';
      document.title = `Coaching-Session-Summary-${date}`;
      
      // Show toast
      toast.success('Opening print dialog... Select "Save as PDF" to download', {
        duration: 4000,
      });
      
      // Trigger print
      window.print();
      
      // Restore original title after a brief delay
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to open print dialog');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm no-print">
        <div className="max-w-[1400px] mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => router.push('/sessions')}
              variant="ghost"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sessions
            </Button>
            <div className="text-right">
              <h1 className="text-2xl font-bold text-slate-900">Session Summary</h1>
              <p className="text-sm text-slate-500">
                {sessionData?.session_type === 'coach_led' ? 'Coach-Led Session' : 'Self-Coaching Session'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1000px] mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Clock className="h-12 w-12 text-indigo-600 animate-spin mx-auto mb-4" />
              <p className="text-slate-600">Generating summary...</p>
            </div>
          </div>
        ) : error ? (
          <Card className="border-2 border-red-200 bg-red-50">
            <CardContent className="py-10 text-center">
              <FileText className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-red-700 mb-2">Error</h3>
              <p className="text-red-600">{error}</p>
              <Button
                onClick={fetchSummary}
                className="mt-4"
                variant="outline"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Download/Print Button - Fixed Position */}
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
                onClick={handleDownload}
                size="lg"
                className="gap-2 shadow-lg"
              >
                <Download className="h-4 w-4" />
                Save as PDF
              </Button>
            </div>

            {/* PDF Content Area */}
            <div ref={contentRef} className="bg-white print:p-8">
              {/* Professional Header */}
              <Card className="border-none shadow-none mb-8">
                <CardHeader className="space-y-6 pb-8">
                  {/* Title & Date */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-sm font-medium">
                        <Calendar className="h-3 w-3 mr-1.5" />
                        {sessionData && formatDate(sessionData.created_at)}
                      </Badge>
                      <Badge className="bg-indigo-600">
                        {sessionData?.session_type === 'coach_led' ? 'Coach-Led' : 'Self-Coaching'}
                      </Badge>
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
                      Coaching Session Summary
                    </h1>
                    <p className="text-xl text-indigo-600 font-semibold">
                      {extractKeyHeading(parseSummary(summary).executiveSummary || parseSummary(summary).goal || summary)}
                    </p>
                  </div>

                  <Separator />

                  {/* 5 Stages Indicator */}
                  <div className="grid grid-cols-5 gap-3">
                    {[
                      { name: 'Assess', icon: Target },
                      { name: 'Creative', icon: Target },
                      { name: 'Formulate', icon: Target },
                      { name: 'Initiate', icon: ListChecks },
                      { name: 'Nourish', icon: TrendingUp }
                    ].map(({ name, icon: Icon }, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="p-2 bg-indigo-100 rounded-full">
                          <Icon className="h-4 w-4 text-indigo-600" />
                        </div>
                        <p className="text-xs font-medium text-slate-700">{name}</p>
                      </div>
                    ))}
                  </div>
                </CardHeader>
              </Card>

              {/* Executive Summary */}
              {parseSummary(summary).executiveSummary && (
                <Card className="mb-6 border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardTitle className="text-lg font-semibold text-slate-900">Executive Summary</CardTitle>
                    <CardDescription>Overview of the coaching session</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="text-slate-700 leading-relaxed text-base">
                      {parseSummary(summary).executiveSummary}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Key Insights */}
              {parseSummary(summary).keyInsights && (
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
                    <div 
                      className="text-slate-700 leading-relaxed prose prose-slate max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: parseSummary(summary).keyInsights
                          .replace(/•/g, '<li class="ml-4">')
                          .replace(/\n\n/g, '</li>')
                          .replace(/^/, '<ul class="space-y-2">')
                          .replace(/$/, '</ul>')
                      }}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Goal Statement */}
              {parseSummary(summary).goal && (
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
                        {parseSummary(summary).goal}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Plan */}
              {parseSummary(summary).actions && (
                <Card className="mb-6 border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
                    <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      <div className="p-1.5 bg-amber-100 rounded-lg">
                        <ListChecks className="h-4 w-4 text-amber-600" />
                      </div>
                      Action Plan
                    </CardTitle>
                    <CardDescription>Specific actions with timelines</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div 
                      className="text-slate-700 leading-relaxed prose prose-slate max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: parseSummary(summary).actions
                          .replace(/\n\n/g, '</p><p class="mt-4">')
                          .replace(/\d+\./g, '<span class="inline-flex items-center justify-center w-6 h-6 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold mr-2">$&</span>')
                          .replace(/^/, '<p>')
                          .replace(/$/, '</p>')
                      }}
                    />
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Success Metrics */}
                {parseSummary(summary).metrics && (
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
                        className="text-sm text-slate-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ 
                          __html: parseSummary(summary).metrics
                            .replace(/•/g, '<li class="ml-4">')
                            .replace(/\n\n/g, '</li>')
                            .replace(/^/, '<ul class="space-y-2">')
                            .replace(/$/, '</ul>')
                        }}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Support & Accountability */}
                {parseSummary(summary).support && (
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
                        className="text-sm text-slate-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ 
                          __html: parseSummary(summary).support
                            .replace(/•/g, '<li class="ml-4">')
                            .replace(/\n\n/g, '</li>')
                            .replace(/^/, '<ul class="space-y-2">')
                            .replace(/$/, '</ul>')
                        }}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-slate-200">
                <p className="text-sm text-slate-500 text-center">
                  Generated on {sessionData && new Date(sessionData.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })} • ACF Coaching Framework
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
