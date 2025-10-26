'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserCircle, Users, ArrowRight, CheckCircle, History, Target, AlertTriangle, Clock } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-end gap-3 mb-4">
            <Button
              variant="outline"
              onClick={() => router.push('/action-plans')}
              className="border-2 border-green-200 hover:bg-green-50 relative"
            >
              <Target className="mr-2 h-4 w-4" />
              Action Plans
              {pendingCount > 0 && (
                <Badge className="ml-2 bg-green-600 hover:bg-green-600 text-white px-2 py-0.5 text-xs">
                  {pendingCount}
                </Badge>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/sessions')}
              className="border-2 border-indigo-200 hover:bg-indigo-50"
            >
              <History className="mr-2 h-4 w-4" />
              View Session History
            </Button>
          </div>
          <Badge className="mb-4 bg-primary text-primary-foreground">
            Professional Coaching Platform
          </Badge>
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            ACF Coaching Flow
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A structured 5-stage coaching framework designed to transform insights into actionable outcomes
          </p>
        </div>

        {/* Action Plan Alerts */}
        {!isLoading && (overdueActions.length > 0 || dueSoonActions.length > 0) && (
          <div className="max-w-5xl mx-auto mb-8 space-y-4">
            {/* Overdue Actions Alert */}
            {overdueActions.length > 0 && (
              <Card className="border-2 border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-red-900 mb-2">
                        {overdueActions.length} Overdue Action{overdueActions.length > 1 ? 's' : ''}
                      </h3>
                      <p className="text-sm text-red-700 mb-3">
                        You have action plans that are past their due date. Review and update them to stay on track.
                      </p>
                      <div className="space-y-2">
                        {overdueActions.slice(0, 3).map((action) => (
                          <div key={action.id} className="flex items-center justify-between bg-white rounded p-2 text-sm">
                            <span className="font-medium text-slate-900">{action.title}</span>
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
                      {overdueActions.length > 3 && (
                        <Button
                          variant="link"
                          onClick={() => router.push('/action-plans')}
                          className="mt-2 text-red-700 p-0"
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
              <Card className="border-2 border-amber-200 bg-amber-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Clock className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-amber-900 mb-2">
                        {dueSoonActions.length} Action{dueSoonActions.length > 1 ? 's' : ''} Due Soon
                      </h3>
                      <p className="text-sm text-amber-700 mb-3">
                        These action plans are due within the next 3 days. Stay proactive!
                      </p>
                      <div className="space-y-2">
                        {dueSoonActions.slice(0, 3).map((action) => (
                          <div key={action.id} className="flex items-center justify-between bg-white rounded p-2 text-sm">
                            <div>
                              <span className="font-medium text-slate-900">{action.title}</span>
                              {action.due_date && (
                                <span className="text-xs text-slate-500 ml-2">
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
                      {dueSoonActions.length > 3 && (
                        <Button
                          variant="link"
                          onClick={() => router.push('/action-plans')}
                          className="mt-2 text-amber-700 p-0"
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

        {/* Mode Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {/* Self-Coaching Mode */}
          <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-primary cursor-pointer group">
            <CardHeader>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <UserCircle className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-2xl">Self-Coaching</CardTitle>
              <CardDescription className="text-base">
                Guide yourself through personal development with structured reflection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Personal goal setting & reflection</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Self-paced progress through 5 stages</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Actionable plans with timeline visualization</span>
                </div>
              </div>
              <Link href="/session/new?type=self_coaching">
                <Button className="w-full mt-6 group-hover:scale-105 transition-transform">
                  Start Self-Coaching Session
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Coach-Led Mode */}
          <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-secondary cursor-pointer group">
            <CardHeader>
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-10 h-10 text-secondary" />
              </div>
              <CardTitle className="text-2xl">Coach-Led Session</CardTitle>
              <CardDescription className="text-base">
                Facilitate powerful coaching conversations with clients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Guided question framework for coaches</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Client progress tracking & insights</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Professional session documentation</span>
                </div>
              </div>
              <Link href="/session/new?type=coach_led">
                <Button className="w-full mt-6 group-hover:scale-105 transition-transform bg-secondary hover:bg-secondary/90">
                  Start Coach-Led Session
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* 5-Stage Process Overview */}
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">The 5-Stage ACF Process</h2>
          <div className="grid sm:grid-cols-5 gap-4">
            {[
              { num: 1, name: 'Check In', desc: 'Establish presence & connection', color: 'bg-blue-500' },
              { num: 2, name: 'Starting Point', desc: 'Define current reality', color: 'bg-indigo-500' },
              { num: 3, name: 'Connect', desc: 'Explore possibilities', color: 'bg-purple-500' },
              { num: 4, name: 'Finish', desc: 'Set SMART goals', color: 'bg-green-500' },
              { num: 5, name: 'Check Out', desc: 'Capture learnings', color: 'bg-emerald-500' },
            ].map((stage) => (
              <div key={stage.num} className="text-center">
                <div className={`w-12 h-12 ${stage.color} rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-2`}>
                  {stage.num}
                </div>
                <h3 className="font-semibold mb-1">{stage.name}</h3>
                <p className="text-xs text-muted-foreground">{stage.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
