'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, ArrowRight, CheckCircle, History, Target, AlertTriangle, Clock, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getActionPlanStats, getOverdueActionPlans, getActionsPlansDueSoon, ActionPlanExtended } from '@/lib/supabase/action-plans';

export default function Home() {
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);
  const [overdueActions, setOverdueActions] = useState<ActionPlanExtended[]>([]);
  const [dueSoonActions, setDueSoonActions] = useState<ActionPlanExtended[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadActionPlanData();
  }, []);

  const loadActionPlanData = async () => {
    try {
      const [stats, overdue, dueSoon] = await Promise.all([
        getActionPlanStats(),
        getOverdueActionPlans(),
        getActionsPlansDueSoon(3),
      ]);
      setPendingCount(stats.pending);
      setOverdueActions(overdue);
      setDueSoonActions(dueSoon);
    } catch (error) {
      console.error('Failed to load action plan data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 border border-blue-200 dark:border-blue-800">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Professional AI Coaching Platform</span>
          </div>
          <h1 className="text-6xl font-extrabold mb-6 text-slate-900 dark:text-slate-100">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
              ACF Coaching Flow
            </span>
          </h1>
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            A structured <span className="font-semibold text-blue-600 dark:text-blue-400">5-stage coaching framework</span> designed to transform insights into <span className="font-semibold text-indigo-600 dark:text-indigo-400">actionable outcomes</span>
          </p>
        </div>

        {/* Action Plan Alerts */}
        {!isLoading && (overdueActions.length > 0 || dueSoonActions.length > 0) && (
          <div className="max-w-4xl mx-auto mb-10 space-y-3">
            {/* Overdue Actions Alert */}
            {overdueActions.length > 0 && (
              <Card className="border-l-4 border-l-red-500 bg-gradient-to-r from-red-50 to-white dark:from-red-950/20 dark:to-slate-900 shadow-lg">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-red-900 dark:text-red-100 mb-1">
                        {overdueActions.length} Overdue Action{overdueActions.length > 1 ? 's' : ''}
                      </h3>
                      <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                        Action plans past their due date. Review and update to stay on track.
                      </p>
                      <div className="space-y-2">
                        {overdueActions.slice(0, 2).map((action) => (
                          <div key={action.id} className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg p-3 text-sm shadow-sm">
                            <span className="font-medium text-slate-900 dark:text-slate-100">{action.title}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/action-plans/${action.id}`)}
                              className="ml-2"
                            >
                              Review
                            </Button>
                          </div>
                        ))}
                      </div>
                      {overdueActions.length > 2 && (
                        <Button
                          variant="link"
                          onClick={() => router.push('/action-plans')}
                          className="mt-2 text-red-700 dark:text-red-400 p-0 h-auto"
                        >
                          View all {overdueActions.length} overdue actions →
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Due Soon Actions Alert */}
            {dueSoonActions.length > 0 && (
              <Card className="border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50 to-white dark:from-amber-950/20 dark:to-slate-900 shadow-lg">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                      <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-amber-900 dark:text-amber-100 mb-1">
                        {dueSoonActions.length} Action{dueSoonActions.length > 1 ? 's' : ''} Due Soon
                      </h3>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                        Action plans due within 3 days. Stay proactive!
                      </p>
                      <div className="space-y-2">
                        {dueSoonActions.slice(0, 2).map((action) => (
                          <div key={action.id} className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg p-3 text-sm shadow-sm">
                            <div>
                              <span className="font-medium text-slate-900 dark:text-slate-100">{action.title}</span>
                              {action.due_date && (
                                <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                                  Due: {new Date(action.due_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/action-plans/${action.id}`)}
                              className="ml-2"
                            >
                              View
                            </Button>
                          </div>
                        ))}
                      </div>
                      {dueSoonActions.length > 2 && (
                        <Button
                          variant="link"
                          onClick={() => router.push('/action-plans')}
                          className="mt-2 text-amber-700 dark:text-amber-400 p-0 h-auto"
                        >
                          View all {dueSoonActions.length} upcoming actions →
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Professional AI Coach - Main CTA */}
        <div className="max-w-4xl mx-auto mb-12">
          <Card className="relative overflow-hidden border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300 group shadow-xl hover:shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 opacity-50"></div>
            <CardHeader className="relative pb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                  <Brain className="w-12 h-12 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                    Professional AI Coach
                  </CardTitle>
                  <CardDescription className="text-base mt-1 text-slate-600 dark:text-slate-400">
                    Transform your goals with AI-powered guidance through structured coaching
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative space-y-6 pb-8">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex flex-col items-center text-center p-4 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">AI-Powered Insights</span>
                </div>
                <div className="flex flex-col items-center text-center p-4 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mb-2" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">5-Stage Framework</span>
                </div>
                <div className="flex flex-col items-center text-center p-4 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Actionable Plans</span>
                </div>
              </div>
              <Button 
                size="lg"
                onClick={() => router.push('/session/self-coaching')}
                className="w-full text-lg py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg group-hover:scale-[1.02] transition-all"
              >
                Start Coaching Session
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Action Hub - Prominent Action Buttons */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="grid md:grid-cols-2 gap-6">
            <Card 
              className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 group"
              onClick={() => router.push('/action-plans')}
            >
              <CardContent className="pt-8 pb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl group-hover:scale-110 transition-transform">
                    <Target className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-1">Action Plans</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Track and manage your coaching action plans</p>
                  </div>
                  {pendingCount > 0 && (
                    <Badge className="bg-green-600 hover:bg-green-600 text-white px-3 py-1">
                      {pendingCount}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600 group"
              onClick={() => router.push('/sessions')}
            >
              <CardContent className="pt-8 pb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl group-hover:scale-110 transition-transform">
                    <History className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-1">Coaching History</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Review past sessions and insights</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 5-Stage Process Overview */}
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10 text-slate-800 dark:text-slate-200">The 5-Stage ACF Process</h2>
          <div className="grid sm:grid-cols-5 gap-6">
            {[
              { num: 1, name: 'Check In', desc: 'Establish presence & connection', color: 'from-blue-500 to-blue-600' },
              { num: 2, name: 'Starting Point', desc: 'Define current reality', color: 'from-indigo-500 to-indigo-600' },
              { num: 3, name: 'Connect', desc: 'Explore possibilities', color: 'from-purple-500 to-purple-600' },
              { num: 4, name: 'Finish', desc: 'Set SMART goals', color: 'from-green-500 to-green-600' },
              { num: 5, name: 'Check Out', desc: 'Capture learnings', color: 'from-emerald-500 to-emerald-600' },
            ].map((stage) => (
              <div key={stage.num} className="text-center group cursor-default">
                <div className={`w-14 h-14 bg-gradient-to-br ${stage.color} rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                  {stage.num}
                </div>
                <h3 className="font-semibold mb-1.5 text-slate-800 dark:text-slate-200">{stage.name}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{stage.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
